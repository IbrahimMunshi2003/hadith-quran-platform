require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Canonical Order
const CANONICAL_ORDER = [
  'bukhari', 'muslim', 'nasaayi', 'abu-dawood', 'tirmidhi', 'ibn-majah', 
  'muwatta-malik', 'musnad-ahmad'
];

async function runAudit() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB for QA Audit...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log("\n=========================================");
  console.log("       QA AUTOMATED TEST REPORT        ");
  console.log("=========================================\n");

  const collectionsAgg = await db.collection('hadiths').aggregate([
    { $group: { _id: '$collectionSlug', count: { $sum: 1 } } }
  ]).toArray();

  let globalErrors = 0;

  for (const slug of CANONICAL_ORDER) {
    const colInfo = collectionsAgg.find(c => c._id === slug);
    if (!colInfo) continue;
    
    console.log(`\nCollection: ${slug}`);
    console.log(`Actual Count: ${colInfo.count}`);

    // Fetch hadiths sorted by our new hadithNumberInt
    const hadiths = await db.collection('hadiths')
      .find({ collectionSlug: slug })
      .sort({ hadithNumberInt: 1, hadithNumber: 1 })
      .toArray();

    let missingTranslation = 0;
    let missingArabic = 0;
    let missingGrade = 0;
    let duplicateNumbers = 0;
    let outOfOrderNumbers = 0;
    
    let badTranslations = 0;

    const seenNumbers = new Set();
    let prevInt = -1;

    for (const h of hadiths) {
      // Duplicates
      if (seenNumbers.has(h.hadithNumber)) {
        duplicateNumbers++;
      }
      seenNumbers.add(h.hadithNumber);

      // Ordering
      if (h.hadithNumberInt < prevInt) {
        outOfOrderNumbers++;
      }
      prevInt = h.hadithNumberInt;

      // Missing fields
      if (!h.arabicText) missingArabic++;
      if (!h.tamilTranslation) missingTranslation++;
      if (!h.grade) missingGrade++; // Note: some fallbacks might not have a grade, but we track it
      
      if (h.tamilTranslation && h.tamilTranslation.startsWith("ஹதீஸ் தரம்")) {
         badTranslations++;
      }
    }

    // Sample Test (First, Middle, Last)
    const first = hadiths[0];
    const middle = hadiths[Math.floor(hadiths.length / 2)];
    const last = hadiths[hadiths.length - 1];
    
    console.log(`Missing Translation: ${missingTranslation}`);
    console.log(`Missing Arabic: ${missingArabic}`);
    console.log(`Bad (Grade) Translations: ${badTranslations}`);
    console.log(`Duplicate Numbers: ${duplicateNumbers}`);
    console.log(`Out-of-Order Numbers: ${outOfOrderNumbers}`);
    
    console.log(`\n  Sample: FIRST (${first.hadithNumber}) -> Translation Length: ${first.tamilTranslation?.length}`);
    console.log(`  Sample: MIDDLE (${middle.hadithNumber}) -> Translation Length: ${middle.tamilTranslation?.length}`);
    console.log(`  Sample: LAST (${last.hadithNumber}) -> Translation Length: ${last.tamilTranslation?.length}`);

    if (badTranslations > 0 || duplicateNumbers > 0 || outOfOrderNumbers > 0) {
       globalErrors++;
       console.log("❌ QA FAILED for this collection.");
    } else {
       console.log("✅ QA PASSED for this collection.");
    }
  }

  console.log("\n=========================================");
  if (globalErrors === 0) {
    console.log("🎉 ALL QA TESTS PASSED SUCCESSFULLY! No bad data or ordering issues detected.");
  } else {
    console.log(`⚠️ QA FINISHED WITH ${globalErrors} COLLECTIONS FAILING TESTS.`);
  }
  
  await mongoose.disconnect();
}

runAudit().catch(console.error);
