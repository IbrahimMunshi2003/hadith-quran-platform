const fs = require("fs");
const axios = require("axios");

const BASE_URL =
  "https://tamil.quranandhadis.com/wp-json/wp/v2/posts?categories=60&per_page=100&page=";

async function run() {
  let page = 1;
  let allData = [];

  while (true) {
    console.log("Fetching page:", page);

    const res = await axios.get(BASE_URL + page);

    if (res.data.length === 0) break;

    allData.push(...res.data);
    page++;
  }

  console.log("Total raavi posts:", allData.length);

  fs.writeFileSync(
    "./datasets/raw/raavi.json",
    JSON.stringify(allData, null, 2)
  );

  console.log("Saved raavi.json");
}

run();