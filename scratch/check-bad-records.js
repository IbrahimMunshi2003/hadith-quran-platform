require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const badRecords = await db.collection('hadiths').find({
    tamilTranslation: { $regex: /ஹதீஸ் தரம்/ }
  }).limit(5).toArray();
  
  console.log("Found", badRecords.length, "bad records in hadiths collection.");
  for(const f of badRecords) {
    console.log(`Hadith: ${f.collectionSlug} ${f.hadithNumber}`);
    console.log(`Translation: ${f.tamilTranslation.substring(0, 100)}...`);
  }
  
  const countBad = await db.collection('hadiths').countDocuments({
     tamilTranslation: { $regex: /ஹதீஸ் தரம்/ }
  });
  console.log("Total count of bad records:", countBad);
  
  await mongoose.disconnect();
}
check();
