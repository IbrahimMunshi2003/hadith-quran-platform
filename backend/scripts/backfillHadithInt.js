require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const count = await db.collection('hadiths').countDocuments();
  console.log(`Starting backfill for ${count} records...`);

  const cursor = db.collection('hadiths').find({});
  let processed = 0;
  
  const bulkOps = [];
  while(await cursor.hasNext()) {
    const doc = await cursor.next();
    
    // Parse numeric part from hadithNumber (e.g. "4773a" -> 4773)
    const numInt = parseInt(doc.hadithNumber) || 0;

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { hadithNumberInt: numInt } }
      }
    });

    if (bulkOps.length >= 1000) {
      await db.collection('hadiths').bulkWrite(bulkOps);
      processed += bulkOps.length;
      bulkOps.length = 0;
      process.stdout.write(`\rProcessed ${processed}/${count}...`);
    }
  }

  if (bulkOps.length > 0) {
    await db.collection('hadiths').bulkWrite(bulkOps);
    processed += bulkOps.length;
  }

  console.log(`\n✅ BACKFILL COMPLETE. Updated ${processed} records.`);
  await mongoose.disconnect();
}
run().catch(console.error);
