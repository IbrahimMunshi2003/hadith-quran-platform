const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL =
  "https://tamil.quranandhadis.com/wp-json/wp/v2/posts";

const CATEGORY_ID = 60; // Raavi

async function scrapeRaavi() {
  try {
    console.log("Starting Raavi scrape...\n");

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "datasets", "raw");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // First page request
    const firstResponse = await axios.get(
      `${BASE_URL}?categories=${CATEGORY_ID}&per_page=100&page=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36",
          Accept: "application/json",
        },
      }
    );

    const totalPages = Number(
      firstResponse.headers["x-wp-totalpages"] || 1
    );

    const totalRecords = Number(
      firstResponse.headers["x-wp-total"] || 0
    );

    console.log(`Total Pages: ${totalPages}`);
    console.log(`Expected Records: ${totalRecords}\n`);

    let allPosts = [...firstResponse.data];

    console.log(
      `Page 1/${totalPages} -> ${firstResponse.data.length} records`
    );

    // Remaining pages
    for (let page = 2; page <= totalPages; page++) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, 1500)
        );

        const response = await axios.get(
          `${BASE_URL}?categories=${CATEGORY_ID}&per_page=100&page=${page}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/53736",
              Accept: "application/json",
            },
          }
        );

        allPosts.push(...response.data);

        console.log(
          `Page ${page}/${totalPages} -> ${response.data.length} records`
        );
      } catch (err) {
        console.error(
          `Failed page ${page}:`,
          err.response?.data || err.message
        );
      }
    }

    // Save raw data
    const outputFile = path.join(
      outputDir,
      "raavi.json"
    );

    fs.writeFileSync(
      outputFile,
      JSON.stringify(allPosts, null, 2),
      "utf8"
    );

    console.log("\n==================================");
    console.log(`Saved File: ${outputFile}`);
    console.log(`Total Records Saved: ${allPosts.length}`);
    console.log("==================================");

    // Quick report
    const report = {
      category: "Raavi",
      categoryId: CATEGORY_ID,
      expectedRecords: totalRecords,
      scrapedRecords: allPosts.length,
      totalPages,
      scrapedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(outputDir, "raavi-report.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );

    console.log("\nReport saved.");
  } catch (err) {
    console.error("\nFatal Error:");
    console.error(
      err.response?.data || err.message
    );
  }
}

scrapeRaavi();