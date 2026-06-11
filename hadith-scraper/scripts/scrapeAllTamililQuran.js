const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const collections = require("../config/collections");

async function getBookCount(collectionId) {
  const url = `https://www.tamililquran.com/hadith.php?collection=${collectionId}&book=1`;

  const { data } = await axios.get(url);

  const match = data.match(/window\.totalBookCount\s*=\s*(\d+)/);

  if (!match) {
    throw new Error(`Could not find totalBookCount for collection ${collectionId}`);
  }

  return parseInt(match[1]);
}

async function scrapeBook(collectionId, bookNo) {
  const url =
    `https://www.tamililquran.com/hadith.php?collection=${collectionId}&book=${bookNo}`;

  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  const hadiths = [];

  $(".ayah-container").each((i, el) => {

    const hadithNumber =
      $(el).attr("data-hadith-num") || "";

    if (!hadithNumber) return;

    const reference =
      $(el)
        .find(".view-hadith-explanation-btn")
        .attr("data-reference") || "";

    const arabicText =
      $(el)
        .find(".arabic-text")
        .last()
        .text()
        .trim();

    const tamilText =
      $(el)
        .find(".translation")
        .last()
        .text()
        .trim();

    hadiths.push({
      bookNo,
      hadithNumber,
      reference,
      arabicText,
      tamilText
    });
  });

  return hadiths;
}

async function scrapeCollection(collection) {

  console.log("\n=================================");
  console.log(collection.slug);
  console.log("=================================\n");

  const totalBooks =
    await getBookCount(collection.collectionId);

  console.log("Books:", totalBooks);

  let allHadiths = [];

  for (let book = 1; book <= totalBooks; book++) {

    const hadiths =
      await scrapeBook(
        collection.collectionId,
        book
      );

    console.log(
      `Book ${book}: ${hadiths.length}`
    );

    allHadiths.push(...hadiths);
  }

  console.log(
    `TOTAL ${collection.slug}:`,
    allHadiths.length
  );

  fs.writeFileSync(
    `${collection.slug}.json`,
    JSON.stringify(allHadiths, null, 2)
  );

  console.log(
    `Saved ${collection.slug}.json`
  );

  return allHadiths.length;
}

async function run() {

  let grandTotal = 0;

  for (const collection of collections) {

    const total =
      await scrapeCollection(collection);

    grandTotal += total;
  }

  console.log("\n=================================");
  console.log("GRAND TOTAL");
  console.log("=================================");
  console.log(grandTotal);
}

run().catch(console.error);