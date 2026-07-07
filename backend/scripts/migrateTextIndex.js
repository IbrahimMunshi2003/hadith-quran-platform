/**
 * migrateTextIndex.js
 * 
 * One-time migration script to drop the old HadithTextIndex and recreate it
 * with expanded fields and updated weights.
 *
 * Usage:  node backend/scripts/migrateTextIndex.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

async function migrate() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('hadiths');

    // --- Step 1: List current indexes ---
    const existingIndexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    existingIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // --- Step 2: Drop the old text index if it exists ---
    const textIndex = existingIndexes.find(idx => idx.name === 'HadithTextIndex');
    if (textIndex) {
      console.log('\nDropping old HadithTextIndex...');
      await collection.dropIndex('HadithTextIndex');
      console.log('Old text index dropped.');
    } else {
      console.log('\nNo existing HadithTextIndex found — will create fresh.');
    }

    // --- Step 3: Create the new text index ---
    console.log('\nCreating new HadithTextIndex with expanded fields...');
    await collection.createIndex(
      {
        arabicText: 'text',
        tamilTranslation: 'text',
        narrator: 'text',
        bookName: 'text',
        chapterName: 'text',
        description: 'text',
        detailedExplanation: 'text',
        keywords: 'text',
        tags: 'text'
      },
      {
        weights: {
          arabicText: 12,
          tamilTranslation: 10,
          narrator: 8,
          bookName: 6,
          chapterName: 5,
          description: 4,
          detailedExplanation: 3,
          keywords: 2,
          tags: 1
        },
        name: 'HadithTextIndex',
        default_language: 'none'
      }
    );
    console.log('New HadithTextIndex created successfully!\n');

    // --- Step 4: Verify ---
    const newIndexes = await collection.indexes();
    const newTextIdx = newIndexes.find(idx => idx.name === 'HadithTextIndex');
    if (newTextIdx) {
      console.log('Verification — new index key:', JSON.stringify(newTextIdx.key));
      console.log('Verification — new index weights:', JSON.stringify(newTextIdx.weights));
    }

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
