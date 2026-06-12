const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.tamililquran.com/hadith.php?collection=4&book=1';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  $('.ayah-container').slice(0, 3).each((idx, el) => {
    console.log(`\nHadith ${idx+1}:`);
    $(el).find('.translation').each((i, tran) => {
      console.log(`[${i}]`, $(tran).text().trim());
    });
  });
}
test();
