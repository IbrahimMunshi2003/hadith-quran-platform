require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const query = { tamilTranslation: { $regex: /^ஹதீஸ் தரம்/ } };
  
  // 1. Count affected fallback records
  const count = await db.collection('hadiths').countDocuments(query);
  console.log(`\n[1] Total affected fallback records to be repaired: ${count}`);
  
  if (count === 0) {
    console.log("No records to back up. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // 2. Produce sample records before repair
  console.log("\n[2] Sample records BEFORE repair (first 2):");
  const samples = await db.collection('hadiths').find(query).limit(2).toArray();
  for(const sample of samples) {
    console.log(` - ID: ${sample._id}`);
    console.log(` - Collection/Number: ${sample.collectionSlug} / ${sample.hadithNumber}`);
    console.log(` - Tamil Translation: ${sample.tamilTranslation}`);
  }

  // 3. Backup all fallback records before update
  console.log("\n[8] Backing up affected records to 'backup_fallback_hadiths'...");
  
  try { await db.collection('backup_fallback_hadiths').drop(); } catch(e) { /* Ignore if doesn't exist */ }
  
  await db.collection('hadiths').aggregate([
    { $match: query },
    { $out: 'backup_fallback_hadiths' }
  ]).toArray();

  const backupCount = await db.collection('backup_fallback_hadiths').countDocuments();
  console.log(`Backup completed. Records in backup_fallback_hadiths: ${backupCount}`);
  
  if (backupCount !== count) {
    console.error("❌ BACKUP FAILED: Counts do not match!");
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log("✅ BACKUP SUCCESSFUL. Safe to proceed with dry run.");
  
  await mongoose.disconnect();
}
run().catch(console.error);
