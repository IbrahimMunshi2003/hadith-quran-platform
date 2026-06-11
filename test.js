const axios = require("axios");
const cheerio = require("cheerio");

(async () => {

const url =
"https://www.tamililquran.com/hadith.php?collection=3&book=1";

const { data } = await axios.get(url);

console.log(data);

})();