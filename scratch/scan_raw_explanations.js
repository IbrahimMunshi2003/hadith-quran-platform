const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const rawDir = path.join(__dirname, '../datasets/raw');
const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));

let foundCount = 0;

console.log(`Scanning raw files in ${rawDir}...`);
for (const file of files) {
  const filePath = path.join(rawDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const record of content) {
    if (record.rawHtml) {
      const $ = cheerio.load(record.rawHtml);
      let found = false;
      $('a').each((i, el) => {
        const text = $(el).text();
        const href = $(el).attr('href') || '';
        if (text.includes('விரிவான விவரம்') || text.includes('மேலும் விவரம்') || href.includes('grade-analysis')) {
          console.log(`Found match in collection: ${file}, post ID: ${record.wpPostId}, slug: ${record.slug}`);
          console.log(`  Link Text: "${text.trim()}", Href: "${href}"`);
          found = true;
          foundCount++;
        }
      });
      if (found) {
        break; // Just show one per file for now
      }
    }
  }
}

console.log(`Scan completed. Found matches in ${foundCount} items.`);
