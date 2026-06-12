require('dotenv').config({ path: '../.env' }); // Load from backend root if needed
const mongoose = require('mongoose');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hadith_db';

// Primary Model
const Hadith = require('../models/Hadith');

// Secondary Model (Dynamic schema since we just need to read from it)
const secondarySchema = new mongoose.Schema({}, { strict: false, collection: 'tamililquran_hadiths' });
const SecondaryModel = mongoose.model('TamililQuranHadith', secondarySchema);

/**
 * Custom sort function for hadith numbers that might be strings like "1", "2a", "10"
 */
function sortHadiths(a, b) {
  const numA = parseInt(a.hadithNumber) || 0;
  const numB = parseInt(b.hadithNumber) || 0;
  if (numA !== numB) {
    return numA - numB;
  }
  // Fallback to string comparison for things like "2a" vs "2b"
  return String(a.hadithNumber).localeCompare(String(b.hadithNumber));
}

async function runMerge() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.\n');

    // Get all distinct collection slugs from both databases
    const primaryCollections = await Hadith.distinct('collectionSlug');
    const secondaryCollections = await SecondaryModel.distinct('collectionSlug');
    
    // Combine and unique the collection slugs
    const allCollections = [...new Set([...primaryCollections, ...secondaryCollections])].sort();

    let totalPrimary = 0;
    let totalFilled = 0;
    let totalFinal = 0;

    const reportLines = [];

    for (const slug of allCollections) {
      // 1. Fetch all primary records for this collection to a Set
      const primaryRecords = await Hadith.find({ collectionSlug: slug }, { hadithNumber: 1 }).lean();
      const primaryCount = primaryRecords.length;
      totalPrimary += primaryCount;

      const primarySet = new Set();
      for (const rec of primaryRecords) {
        primarySet.add(String(rec.hadithNumber));
      }

      // 2. Fetch all secondary records for this collection
      const secondaryRecords = await SecondaryModel.find({ collectionSlug: slug }).lean();
      const secondaryCount = secondaryRecords.length;

      // 3. Find missing ones and normalize
      const missingRecords = [];
      for (const sRec of secondaryRecords) {
        if (!sRec.hadithNumber) continue;
        const hNum = String(sRec.hadithNumber);

        // Rule 2 & 4: Duplicate detection and filling missing only
        if (!primarySet.has(hNum)) {
          // Rule 6: Normalize schema
          const normalized = {
            collectionSlug: sRec.collectionSlug || slug,
            collectionName: sRec.collectionName || slug, // fallback if empty
            hadithNumber: hNum,
            arabicText: sRec.arabicText || '',
            tamilTranslation: sRec.tamilText || sRec.tamilTranslation || '',
            reference: sRec.reference || '',
            source: 'tamililquran',
            isFallback: true,
          };
          missingRecords.push(normalized);
          // Add to set to prevent duplicate insertions from within the secondary collection itself
          primarySet.add(hNum); 
        }
      }

      // Sort missing records before insertion (Rule 7 partial: insert in order)
      missingRecords.sort(sortHadiths);

      // 4. Batch Insert (Rule 4 & 5 - missing records are inserted, primary are completely untouched)
      const filledCount = missingRecords.length;
      if (filledCount > 0) {
        const BATCH_SIZE = 500;
        for (let i = 0; i < missingRecords.length; i += BATCH_SIZE) {
          const batch = missingRecords.slice(i, i + BATCH_SIZE);
          await Hadith.insertMany(batch, { ordered: false });
        }
      }

      const finalCount = primaryCount + filledCount;
      totalFilled += filledCount;
      totalFinal += finalCount;

      reportLines.push(`Collection: ${slug}`);
      reportLines.push(`Primary Count: ${primaryCount}`);
      reportLines.push(`TamililQuran Count: ${secondaryCount}`);
      reportLines.push(`Missing Filled: ${filledCount}`);
      reportLines.push(`Final Count: ${finalCount}`);
      reportLines.push('');
      
      console.log(`Processed ${slug}: inserted ${filledCount} new hadiths.`);
    }

    // Output Report (Rule 8)
    reportLines.push('TOTAL PRIMARY: ' + totalPrimary);
    reportLines.push('TOTAL FILLED: ' + totalFilled);
    reportLines.push('TOTAL FINAL: ' + totalFinal);

    console.log('\n--- MERGE REPORT ---\n');
    console.log(reportLines.join('\n'));

  } catch (error) {
    console.error('Error during merge:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

runMerge();
