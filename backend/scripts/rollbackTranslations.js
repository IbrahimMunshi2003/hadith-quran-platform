require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const backupCount = await db.collection('backup_fallback_hadiths').countDocuments();
  if (backupCount === 0) {
    console.error("No records in backup_fallback_hadiths. Cannot rollback.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Starting rollback for ${backupCount} records...`);

  const cursor = db.collection('backup_fallback_hadiths').find({});
  let rolledBack = 0;
  
  const bulkOps = [];
  while(await cursor.hasNext()) {
    const doc = await cursor.next();
    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { tamilTranslation: doc.tamilTranslation } }
      }
    });

    if (bulkOps.length >= 500) {
      await db.collection('hadiths').bulkWrite(bulkOps);
      rolledBack += bulkOps.length;
      bulkOps.length = 0;
      console.log(`Rolled back ${rolledBack}/${backupCount}...`);
    }
  }

  if (bulkOps.length > 0) {
    await db.collection('hadiths').bulkWrite(bulkOps);
    rolledBack += bulkOps.length;
  }

  console.log(`✅ ROLLBACK COMPLETE. Restored ${rolledBack} records to their original bad translation state.`);
  await mongoose.disconnect();
}
run().catch(console.error);
