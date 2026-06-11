const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const collections = [
  {
    name: "nasaayi",
    id: 3,
    maxBooks: 100
  },
  {
    name: "abudawud",
    id: 4,
    maxBooks: 100
  },
  {
    name: "tirmidhi",
    id: 5,
    maxBooks: 100
  },
  {
    name: "ibnmajah",
    id: 6,
    maxBooks: 100
  },
  {
    name: "malik",
    id: 7,
    maxBooks: 100
  },
  {
    name: "ahmad",
    id: 8,
    maxBooks: 100
  }
];

async function scrapeBook(collectionId, bookNo) {
  try {
    const url =
      `https://www.tamililquran.com/hadith.php?collection=${collectionId}&book=${bookNo}`;

    console.log("Scraping:", url);

    const { data } = await axios.get(url, {
      timeout: 30000
    });

    const $ = cheerio.load(data);

    const hadiths = [];

    $("table tr").each((i, row) => {
      const text = $(row).text().trim();

      if (!text) return;

      hadiths.push({
        rawText: text
      });
    });

    return hadiths;
  } catch (err) {
    console.log(`Book ${bookNo} not found`);
    return null;
  }
}

async function scrapeCollection(collection) {

  const results = [];

  for (let book = 1; book <= collection.maxBooks; book++) {

    const data = await scrapeBook(
      collection.id,
      book
    );

    if (!data || data.length === 0)
      continue;

    results.push({
      book,
      hadiths: data
    });

    await new Promise(r => setTimeout(r, 1000));
  }

  const savePath = path.join(
    __dirname,
    "..",
    "datasets",
    "tamililquran",
    `${collection.name}.json`
  );

  await fs.writeJson(
    savePath,
    results,
    { spaces: 2 }
  );

  console.log(
    `Saved ${collection.name}`
  );
}

(async () => {

  for (const collection of collections) {
    await scrapeCollection(collection);
  }

})();