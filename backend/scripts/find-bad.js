require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const doc = await db.collection('hadiths').findOne({ collectionSlug: 'musnad-ahmad', tamilTranslation: { $regex: /^ஹதீஸ் தரம்/ } });
  console.log(doc);
  await mongoose.disconnect();
}
run();
