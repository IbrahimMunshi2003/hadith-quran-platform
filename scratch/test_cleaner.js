const { cleanRecord } = require('../cleaner');

const mockRawRecord = {
  wpPostId: 99999,
  slug: "test-hadith-1",
  originalUrl: "https://tamil.quranandhadis.com/test-hadith-1/",
  title: "Test Hadith 1",
  rawHtml: `
    <div id="content-to-copy">
      <h2 id="title-text">test-hadith-1: 1</h2>
      <div id="quality-text">
        <span class="content-list-quality layeef">ஹதீஸின் தரம்: ளயீஃப்</span>
      </div>
      <div id="arabic-text" class="arabic"><p>«العلم نور»</p></div>
      <div id="tamil-text">
        <p>1. கல்வி என்பது ஒளியாகும்.</p>
        <p>அறிவிப்பவர்: அனஸ் (ரலி)</p>
        <p><a href="https://tamil.quranandhadis.com/hadith-grade-analysis-123/">விரிவான விவரம் &rarr;</a></p>
      </div>
    </div>
  `
};

try {
  const result = cleanRecord(mockRawRecord, 'test-collection');
  console.log('Cleaned Record Output:', JSON.stringify(result, null, 2));
  if (result.hasDetailedExplanation && result.detailedExplanationUrl === 'https://tamil.quranandhadis.com/hadith-grade-analysis-123/') {
    console.log('SUCCESS: Detailed explanation scraped correctly!');
  } else {
    console.error('FAILURE: Scraper did not extract detailed explanation!');
  }
} catch (e) {
  console.error('CRASH:', e);
}
