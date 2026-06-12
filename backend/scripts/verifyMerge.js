require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hadith_db';

const Hadith = require('../models/Hadith');
const secondarySchema = new mongoose.Schema({}, { strict: false, collection: 'tamililquran_hadiths' });
const SecondaryModel = mongoose.model('TamililQuranHadith', secondarySchema);

async function verifyMerge() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.\n');

    let errorsFound = 0;

    // 1. Check for duplicates in final collection (Rule 2)
    console.log('Checking for duplicates in the primary collection...');
    const duplicateAggregation = await Hadith.aggregate([
      {
        $group: {
          _id: { collectionSlug: "$collectionSlug", hadithNumber: "$hadithNumber" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicateAggregation.length > 0) {
      console.error(`\n❌ FOUND ${duplicateAggregation.length} DUPLICATES!`);
      // Print first 5 duplicates as examples
      for (const dup of duplicateAggregation.slice(0, 5)) {
        console.error(`  Duplicate: Collection '${dup._id.collectionSlug}', Hadith Number '${dup._id.hadithNumber}' - Count: ${dup.count}`);
      }
      errorsFound++;
    } else {
      console.log('✅ No duplicates found.');
    }

    // 2. Verify all secondary hadiths exist in primary (Rule 4)
    console.log('\nVerifying all TamililQuran hadiths exist in the primary collection...');
    const secondaryCollections = await SecondaryModel.distinct('collectionSlug');
    
    for (const slug of secondaryCollections) {
      const secondaryRecords = await SecondaryModel.find({ collectionSlug: slug }, { hadithNumber: 1 }).lean();
      const primaryRecords = await Hadith.find({ collectionSlug: slug }, { hadithNumber: 1 }).lean();
      
      const primarySet = new Set(primaryRecords.map(r => String(r.hadithNumber)));
      
      let missingFromPrimary = 0;
      for (const sRec of secondaryRecords) {
        if (!sRec.hadithNumber) continue;
        const hNum = String(sRec.hadithNumber);
        
        if (!primarySet.has(hNum)) {
          missingFromPrimary++;
          if (missingFromPrimary <= 5) {
             console.error(`  ❌ Missing in primary: Collection '${slug}', Hadith Number '${hNum}'`);
          }
        }
      }

      if (missingFromPrimary > 0) {
        console.error(`❌ Collection ${slug}: ${missingFromPrimary} records failed to merge!`);
        errorsFound++;
      }
    }

    if (errorsFound === 0) {
       console.log('✅ All TamililQuran hadiths are successfully present in the primary collection.');
    }

    // 3. Print final counts
    const finalTotal = await Hadith.countDocuments();
    console.log(`\nFinal total documents in primary collection: ${finalTotal}`);

    if (errorsFound === 0) {
      console.log('\n🎉 VERIFICATION PASSED! The merge was successful with no duplicates and no missing items.');
    } else {
      console.log('\n⚠️ VERIFICATION FAILED! Please check the errors above.');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyMerge();
