const { cleanCollectionFile } = require('./cleaner');
const fs = require('fs');
const path = require('path');

function runClean(collectionSlugArg = 'all') {
    console.log('==================================================');
    console.log('Hadith Dataset Cleaning & Validation Step');
    console.log('==================================================\n');

    // Load collections metadata
    const collectionsPath = path.join(__dirname, 'datasets', 'collections.json');
    if (!fs.existsSync(collectionsPath)) {
        console.error('Error: Collections metadata file not found. Run "npm run discover" first.');
        process.exit(1);
    }
    const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));

    if (collectionSlugArg && collectionSlugArg.toLowerCase() !== 'all') {
        const col = collections.find(c => c.slug.toLowerCase() === collectionSlugArg.toLowerCase());
        if (!col) {
            console.error(`Error: Collection "${collectionSlugArg}" not found in discovered list.`);
            process.exit(1);
        }
        try {
            cleanCollectionFile(col.slug);
        } catch (err) {
            console.error(`Failed to clean collection "${col.slug}":`, err.message);
        }
    } else {
        console.log('Cleaning all scraped collections...');
        let cleanedCollectionsCount = 0;
        
        collections.forEach(col => {
            const rawPath = path.join(__dirname, 'datasets', 'raw', `${col.slug}.json`);
            if (fs.existsSync(rawPath)) {
                try {
                    cleanCollectionFile(col.slug);
                    cleanedCollectionsCount++;
                } catch (err) {
                    console.error(`Failed to clean collection "${col.slug}":`, err.message);
                }
            }
        });
        console.log(`\nSuccessfully cleaned ${cleanedCollectionsCount} collections.`);
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const slugArg = args[0] || 'all';
    runClean(slugArg);
}

module.exports = runClean;
