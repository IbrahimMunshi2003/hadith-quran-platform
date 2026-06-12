require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const COLLECTION_MAP = {
  'nasaayi': 3,
  'abu-dawood': 4,
  'tirmidhi': 5,
  'ibn-majah': 6,
  'muwatta-malik': 7,
  'musnad-ahmad': 8
};

async function getBookCount(collectionId) {
  const url = `https://www.tamililquran.com/hadith.php?collection=${collectionId}&book=1`;
  try {
    const { data } = await axios.get(url);
    const match = data.match(/window\.totalBookCount\s*=\s*(\d+)/);
    if (match) return parseInt(match[1]);
  } catch (e) {
    console.error(`Failed to get book count for ${collectionId}:`, e.message);
  }
  return 100; // Fallback max
}

async function scrapeBook(collectionId, bookNo) {
  const url = `https://www.tamililquran.com/hadith.php?collection=${collectionId}&book=${bookNo}`;
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);
    const results = {};
    $('.ayah-container').each((i, el) => {
      const hadithNumber = $(el).attr('data-hadith-num') || '';
      if (!hadithNumber) return;
      
      const validTranslations = $(el).find('.translation').filter((idx, t) => {
        return !$(t).text().includes('ஹதீஸ் தரம்');
      });
      const newTranslation = validTranslations.last().text().trim();
      
      if (newTranslation && newTranslation.length > 5) {
        results[hadithNumber] = newTranslation;
      }
    });
    return Object.keys(results).length > 0 ? results : null;
  } catch (e) {
    return null;
  }
}

async function runRepair() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const slugs = await db.collection('backup_fallback_hadiths').distinct('collectionSlug');
  console.log(`Starting repair for collections: ${slugs.join(', ')}`);

  let totalUpdated = 0;

  for (const slug of slugs) {
    const collectionId = COLLECTION_MAP[slug];
    if (!collectionId) {
      console.log(`Skipping unknown collection: ${slug}`);
      continue;
    }

    const bookCount = await getBookCount(collectionId);
    console.log(`\n--- Repairing ${slug} (${bookCount} books) ---`);

    for (let book = 1; book <= bookCount; book++) {
      const scrapedData = await scrapeBook(collectionId, book);
      if (!scrapedData) continue; // Book empty or failed

      // For every scraped hadith in this book, see if it exists in our backup
      const hadithNumbersInBook = Object.keys(scrapedData);
      
      // Get the bad records from backup that are in this book
      const badRecords = await db.collection('backup_fallback_hadiths').find({
        collectionSlug: slug,
        hadithNumber: { $in: hadithNumbersInBook }
      }).toArray();

      if (badRecords.length > 0) {
        const bulkOps = badRecords.map(doc => {
          return {
            updateOne: {
              // Ensure we only update if it still has the bad translation to avoid overwriting manually fixed ones
              filter: { _id: doc._id, tamilTranslation: { $regex: /^ஹதீஸ் தரம்/ } },
              update: { $set: { tamilTranslation: scrapedData[doc.hadithNumber] } }
            }
          };
        });

        const result = await db.collection('hadiths').bulkWrite(bulkOps);
        totalUpdated += result.modifiedCount;
        process.stdout.write(`\rUpdated ${totalUpdated} records...`);
      }
    }
  }

  console.log(`\n\n✅ REPAIR COMPLETE. Successfully repaired ${totalUpdated} translations.`);
  await mongoose.disconnect();
}

runRepair().catch(console.error);
