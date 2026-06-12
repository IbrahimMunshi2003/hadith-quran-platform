require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  await db.collection('hadiths').updateOne({ collectionSlug: 'musnad-ahmad', hadithNumber: '1714' }, { $set: { tamilTranslation: 'Translation temporarily unavailable. (Data repair skipped this single record)' } });
  console.log('Fixed 1714');
  await mongoose.disconnect();
}
run();
