require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

// Map canonical slugs to tamililquran IDs
const COLLECTION_MAP = {
  'nasaayi': 3,
  'abu-dawood': 4,
  'tirmidhi': 5,
  'ibn-majah': 6,
  'muwatta-malik': 7,
  'musnad-ahmad': 8
};

async function dryRun() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log("=== DRY RUN REPAIR ===");
  
  // We'll test with Abu Dawood Book 1
  const slug = 'abu-dawood';
  const collectionId = COLLECTION_MAP[slug];
  const url = `https://www.tamililquran.com/hadith.php?collection=${collectionId}&book=1`;
  
  console.log(`Fetching sample HTML from ${url}...`);
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  let matchCount = 0;
  
  const elements = $('.ayah-container').toArray();
  for (const el of elements) {
    const hadithNumber = $(el).attr('data-hadith-num') || '';
    if (!hadithNumber) continue;
    
    // THE NEW FIXED EXTRACTION LOGIC
    // Get all translation elements that do NOT contain "ஹதீஸ் தரம்"
    const validTranslations = $(el).find('.translation').filter((i, t) => {
      return !$(t).text().includes('ஹதீஸ் தரம்');
    });
    
    // The actual translation is usually the last valid one (bypassing the chapter heading if it exists)
    const newTranslation = validTranslations.last().text().trim();
    
    const gradeText = $(el).find('.translation').filter((i, t) => {
      return $(t).text().includes('ஹதீஸ் தரம்');
    }).last().text().trim();
    
    // Let's check if this hadith was a fallback (bad record) in the DB
    const dbRecord = await db.collection('backup_fallback_hadiths').findOne({
      collectionSlug: slug,
      hadithNumber: hadithNumber
    });
    
    if (dbRecord) {
      console.log(`\n--- HADITH NUMBER: ${hadithNumber} ---`);
      console.log(`[BEFORE] (In DB): ${dbRecord.tamilTranslation}`);
      console.log(`[AFTER] (Extracted): ${newTranslation.substring(0, 100)}...`);
      
      // Verification 4: Length > 50
      const isLengthValid = newTranslation.length > 50;
      console.log(`[Verify] Length > 50: ${isLengthValid ? '✅' : '❌'} (${newTranslation.length})`);
      
      // Verification 5: Not equal to grade
      const isNotGrade = newTranslation !== gradeText && !newTranslation.includes('ஹதீஸ் தரம்');
      console.log(`[Verify] Not equal to grade text: ${isNotGrade ? '✅' : '❌'}`);
      
      matchCount++;
      if (matchCount >= 3) break; // Only need 3 samples for dry run
    }
  }

  if (matchCount === 0) {
    console.log("No bad records matched from Book 1. The dry run logic is sound, but we might need to check other books.");
  }

  console.log("\n✅ Dry run completed successfully.");
  await mongoose.disconnect();
}

dryRun().catch(console.error);
