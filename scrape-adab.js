const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const COLLECTION_ID = 10;
const MAX_BOOKS = 159;

async function scrapeBook(bookNo) {
  const url = `https://www.tamililquran.com/hadith.php?collection=${COLLECTION_ID}&book=${bookNo}`;

  try {
    console.log(`Scraping Book ${bookNo}...`);

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(html);

    const hadiths = [];

    $(".ayah-container").each((_, el) => {
      const container = $(el);

      const referenceId = (container.attr("id") || "").replace("ayah-", "");
      const hadithNumber = container.attr("data-hadith-num") || "";

      const arabic = container
        .find(".arabic-text.hadith-arabic-font")
        .first()
        .text()
        .trim();

      const tamil = container
        .find(".translation.tamil-custom-font")
        .first()
        .text()
        .trim();

      if (arabic || tamil) {
        hadiths.push({
          collection: "al-adabul-mufrad",
          book: bookNo,
          hadithNumber,
          referenceId,
          arabic,
          tamil,
          source: "tamililquran"
        });
      }
    });

    return hadiths;
  } catch (err) {
    console.error(`Failed Book ${bookNo}`, err.message);
    return [];
  }
}

(async () => {
  const allHadiths = [];

  for (let book = 1; book <= MAX_BOOKS; book++) {
    const data = await scrapeBook(book);
    allHadiths.push(...data);
  }

  fs.writeFileSync(
    "al-adabul-mufrad.json",
    JSON.stringify(allHadiths, null, 2),
    "utf8"
  );

  console.log("Finished");
  console.log("Total Hadiths:", allHadiths.length);
})();