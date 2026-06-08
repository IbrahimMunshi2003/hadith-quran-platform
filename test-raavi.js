const axios = require('axios');

async function test() {
  try {
    const res = await axios.get(
      'https://tamil.quranandhadis.com/wp-json/wp/v2/posts?categories=60&per_page=5&page=1',
      {
        headers: {
          Cookie: 'humans_21909=1',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36'
        }
      }
    );

    console.log(res.data);
  } catch (err) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}

test();