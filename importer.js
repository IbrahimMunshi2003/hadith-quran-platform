require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hadith_db';

/**
 * Creates indexes on the hadiths collection
 */
async function setupIndexes(db) {
    console.log('Setting up MongoDB indexes for optimized searches...');
    const collection = db.collection('hadiths');

    // 1. Unique index on collection + hadithNumber to prevent duplicates
    console.log(' - Creating unique index on { collectionSlug: 1, hadithNumber: 1 }...');
    await collection.createIndex(
        { collectionSlug: 1, hadithNumber: 1 },
        { unique: true, name: 'unique_collection_hadith_idx' }
    );

    // 2. Index on wpPostId
    console.log(' - Creating index on wpPostId...');
    await collection.createIndex(
        { wpPostId: 1 },
        { name: 'wp_post_id_idx' }
    );

    // 3. Index on narrator
    console.log(' - Creating index on narrator...');
    await collection.createIndex(
        { narrator: 1 },
        { name: 'narrator_idx' }
    );

    // 4. Compound Full-Text Search Index on multiple fields
    console.log(' - Creating compound text index for full-text search...');
    await collection.createIndex(
        {
            tamilTranslation: 'text',
            narrator: 'text',
            chapterName: 'text',
            arabicText: 'text',
            bookName: 'text'
        },
        {
            weights: {
                tamilTranslation: 10,
                narrator: 5,
                chapterName: 3,
                arabicText: 2,
                bookName: 1
            },
            name: 'hadith_fulltext_search_idx',
            default_language: 'none' // Disable English stemming for Tamil/Arabic
        }
    );

    console.log('Indexes created successfully.');
}

/**
 * Imports a single cleaned collection dataset into MongoDB
 */
async function importCollection(db, collectionSlug) {
    const rawPath = path.join(__dirname, 'datasets', 'raw', `${collectionSlug}.json`);
    const cleanedPath = path.join(__dirname, 'datasets', 'cleaned', `${collectionSlug}.json`);
    
    // Fallback: If cleaned file is missing but raw scraped file exists, run cleaner automatically
    if (!fs.existsSync(cleanedPath) && fs.existsSync(rawPath)) {
        console.log(`[Import Helper] Cleaned file missing but raw data exists for "${collectionSlug}". Running cleaner...`);
        try {
            const { cleanCollectionFile } = require('./cleaner');
            cleanCollectionFile(collectionSlug);
        } catch (e) {
            console.error(`[Import Warning] Failed to clean raw file for "${collectionSlug}":`, e.message);
            return { success: false, reason: 'Cleaning failed' };
        }
    }

    if (!fs.existsSync(cleanedPath)) {
        console.warn(`[Import Warning] Cleaned dataset not found for "${collectionSlug}" at: ${cleanedPath}. Skipping.`);
        return { success: false, reason: 'File not found' };
    }

    console.log(`Reading cleaned records from: ${cleanedPath}...`);
    const records = JSON.parse(fs.readFileSync(cleanedPath, 'utf8'));

    if (records.length === 0) {
        console.log(`No records to import for "${collectionSlug}".`);
        return { success: true, count: 0 };
    }

    console.log(`Preparing bulk write operations for ${records.length} records...`);
    
    // Build bulkWrite operations with upsert to prevent duplicates
    const operations = records.map(record => ({
        updateOne: {
            filter: { 
                collectionSlug: record.collectionSlug, 
                hadithNumber: record.hadithNumber 
            },
            update: { 
                $set: {
                    wpPostId: record.wpPostId,
                    collectionName: record.collectionName,
                    bookName: record.bookName,
                    chapterName: record.chapterName,
                    arabicText: record.arabicText,
                    tamilTranslation: record.tamilTranslation,
                    narrator: record.narrator,
                    grade: record.grade,
                    gradeSlug: record.gradeSlug,
                    originalUrl: record.originalUrl,
                    detailedExplanationUrl: record.detailedExplanationUrl || '',
                    detailedExplanationTitle: record.detailedExplanationTitle || '',
                    hasDetailedExplanation: record.hasDetailedExplanation || false,
                    scrapedAt: new Date(record.scrapedAt)
                }
            },
            upsert: true
        }
    }));

    const collection = db.collection('hadiths');
    console.log(`Executing bulkWrite (upsert: true)...`);
    const result = await collection.bulkWrite(operations, { ordered: false });

    // Handle hadithExplanations
    const explanationOperations = records
        .filter(record => record.gradingExplanation || (record.narratorAnalysis && record.narratorAnalysis.length > 0))
        .map(record => ({
            updateOne: {
                filter: { 
                    collectionSlug: record.collectionSlug, 
                    hadithNumber: record.hadithNumber 
                },
                update: { 
                    $setOnInsert: {
                        collectionSlug: record.collectionSlug,
                        hadithNumber: record.hadithNumber,
                        gradingExplanation: record.gradingExplanation,
                        narratorAnalysis: record.narratorAnalysis
                    }
                },
                upsert: true
            }
        }));

    let explanationResult = null;
    if (explanationOperations.length > 0) {
        const explCollection = db.collection('hadithExplanations');
        console.log(`Executing bulkWrite for ${explanationOperations.length} explanations...`);
        explanationResult = await explCollection.bulkWrite(explanationOperations, { ordered: false });
    }

    console.log(`Import summary for ${collectionSlug}:`);
    console.log(`  - Matched count: ${result.matchedCount}`);
    console.log(`  - Modified count: ${result.modifiedCount}`);
    console.log(`  - Upserted count: ${result.upsertedCount}`);
    console.log(`  - Upserted IDs:`, Object.keys(result.upsertedIds).length);
    if (explanationResult) {
        console.log(`  - Explanations upserted: ${Object.keys(explanationResult.upsertedIds).length}`);
    }

    return {
        success: true,
        count: records.length,
        upserted: Object.keys(result.upsertedIds).length,
        modified: result.modifiedCount
    };
}

/**
 * Main importer controller
 */
async function runImporter(collectionSlugArg = null) {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db();
        console.log('Connected to MongoDB successfully.');

        // Load discovered collections list
        const collectionsPath = path.join(__dirname, 'datasets', 'collections.json');
        if (!fs.existsSync(collectionsPath)) {
            throw new Error('Collections metadata file not found. Run "npm run discover" first.');
        }
        const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));

        if (collectionSlugArg && collectionSlugArg.toLowerCase() !== 'all') {
            // Import single collection
            const col = collections.find(c => c.slug.toLowerCase() === collectionSlugArg.toLowerCase());
            if (!col) {
                console.error(`Error: Collection "${collectionSlugArg}" not found in discovered list.`);
                process.exit(1);
            }
            await importCollection(db, col.slug);
        } else {
            // Import all collections
            console.log(`Importing ALL cleaned datasets in sequence...`);
            let totalImported = 0;
            for (const col of collections) {
                const res = await importCollection(db, col.slug);
                if (res && res.success) {
                    totalImported += res.count;
                }
            }
            console.log(`\nImported a total of ${totalImported} records across all collections.`);
        }

        // Setup indexes at the end
        await setupIndexes(db);

    } catch (e) {
        console.error('Importer crash:', e);
        process.exit(1);
    } finally {
        await client.close();
        console.log('MongoDB connection closed.');
    }
}

// Support command line invocation
if (require.main === module) {
    const args = process.argv.slice(2);
    const slugArg = args[0] || 'all';
    runImporter(slugArg).catch(err => {
        console.error('Import process failed:', err);
        process.exit(1);
    });
}

module.exports = {
    importCollection,
    setupIndexes,
    runImporter
};
