const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");

const COLLECTIONS = require("./collections");

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function getBookLinks(indexUrl) {
  console.log(`Reading ${indexUrl}`);

  const { data } = await axios.get(indexUrl);

  const $ = cheerio.load(data);

  const books = [];

  $("a").each((i, el) => {
    const href = $(el).attr("href");

    if (
      href &&
      href.includes("hadith.php") &&
      href.includes("book=")
    ) {
      books.push(
        new URL(href, indexUrl).href
      );
    }
  });

  return [...new Set(books)];
}

async function scrapeCollection(collection) {
  console.log(
    `\n========== ${collection.slug} ==========\n`
  );

  const bookLinks = await getBookLinks(
    collection.indexUrl
  );

  console.log(
    `${bookLinks.length} books found`
  );

  const pages = [];

  for (let i = 0; i < bookLinks.length; i++) {
    const url = bookLinks[i];

    console.log(
      `[${i + 1}/${bookLinks.length}] ${url}`
    );

    try {
      const { data } = await axios.get(url);

      pages.push({
        url,
        html: data
      });

      await sleep(1000);
    } catch (err) {
      console.log(
        `Failed: ${url}`
      );
    }
  }

  await fs.ensureDir(
    "datasets/tamililquran/raw"
  );

  await fs.writeJson(
    `datasets/tamililquran/raw/${collection.slug}.json`,
    pages,
    { spaces: 2 }
  );

  console.log(
    `Saved ${collection.slug}.json`
  );
}

async function main() {
  for (const collection of COLLECTIONS) {
    await scrapeCollection(collection);
  }

  console.log("\nDONE");
}

main();