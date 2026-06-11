require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const files = [
  "nasaayi.json",
  "abu-dawood.json",
  "tirmidhi.json",
  "ibn-majah.json",
  "muwatta-malik.json",
  "musnad-ahmad.json"
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("✅ MongoDB Connected");

  const db = mongoose.connection.db;

  const collection =
    db.collection("tamililquran_hadiths");

  let totalInserted = 0;

  for (const file of files) {

    const filePath =
      path.join(__dirname, "..", file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ Missing file: ${file}`);
      continue;
    }

    const data =
      JSON.parse(
        fs.readFileSync(filePath, "utf8")
      );

    if (!Array.isArray(data)) {
      console.log(`❌ Invalid JSON: ${file}`);
      continue;
    }

    const slug =
      file.replace(".json", "");

    const docs = data.map(h => ({
      source: "tamililquran",
      collectionSlug: slug,
      ...h,
      importedAt: new Date()
    }));

    if (docs.length) {
      await collection.insertMany(docs, {
        ordered: false
      });

      totalInserted += docs.length;
    }

    console.log(
      `✅ ${slug}: ${docs.length} imported`
    );
  }

  console.log("\n==================");
  console.log("TOTAL IMPORTED:", totalInserted);
  console.log("==================");

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});