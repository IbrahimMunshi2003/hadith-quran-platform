# Hadith Quran Platform Scraper & Importer

A production-ready Node.js scraper and importer system designed to fetch the complete Hadith dataset from `https://tamil.quranandhadis.com` and load it into a MongoDB database with optimized search indexes.

---

## Technical Architecture & Discovery

### 1. WordPress REST API Endpoint Analysis
WordPress natively exposes a structured REST API. For this website, the endpoints are:
* **API Root**: `https://tamil.quranandhadis.com/wp-json/`
* **Categories (Collections)**: `https://tamil.quranandhadis.com/wp-json/wp/v2/categories`
* **Posts (Hadith list)**: `https://tamil.quranandhadis.com/wp-json/wp/v2/posts`
* **Post Types**: `https://tamil.quranandhadis.com/wp-json/wp/v2/types` (Only standard `post` and `page` types exist; no custom post types).

*Note*: The WordPress REST API post content (`content.rendered`) does **not** expose the actual Hadith text or Arabic translations because they are injected dynamically by custom plugins on the frontend. To solve this, the scraper queries the REST API to discover post slugs, IDs, and links, and then fetches the clean **Plain View** HTML pages (appended with `?view=plain`) which contain the full structured data.

### 2. Collection Structure (Taxonomy)
Hadith collections are organized as WordPress categories. Major collections discovered include:
* **Bukhari (புஹாரி)**: Category ID `5` (7,561 Hadiths)
* **Muslim (முஸ்லிம்)**: Category ID `6` (5,772 Hadiths)
* **Abu Dawood (ஸுனன் அபூதாவூத்)**: Category ID `10` (1,686 Hadiths)
* **Tirmidhi (திர்மிதீ)**: Category ID `9` (1,230 Hadiths)
* **Nasai (நஸாயி)**: Category ID `7` (1,142 Hadiths)
* **Ibn Majah (இப்னுமாஜா)**: Category ID `11` (940 Hadiths)
* *And 30+ other collections* representing a total dataset of **~30,000+ Hadith records**.

---

## MongoDB Schema & Performance Tuning

The database contains a single collection named `hadiths`. It uses a highly optimized schema for rapid queries:

### Document Schema

```json
{
  "_id": "ObjectId",
  "wpPostId": 125712,
  "hadithNumber": "280",
  "collectionSlug": "ibn-majah",
  "collectionName": "இப்னுமாஜா",
  "bookName": "அத்தியாயம்: 1",
  "chapterName": "பாடம்: உளூச் செய்வது இறைநம்பிக்கையில் பாதி.",
  "arabicText": "«إِسْبَاغُ الْوُضُوءِ شَطْرُ الْإِيمَانِ...»",
  "tamilTranslation": "உளூவை முழுமையாகச் செய்வது இறைநம்பிக்கையில் பாதியாகும்...",
  "narrator": "அபூமாலிக் அல்அஷ்அரீ (ரலி)",
  "grade": "ஸஹீஹ் - பலமான செய்தி",
  "gradeSlug": "sahih",
  "originalUrl": "https://tamil.quranandhadis.com/ibn-majah-280/",
  "scrapedAt": "2026-06-04T12:49:01.472Z"
}
```

### Search Indexes
The script automatically builds the following indexes:
1. **Prevent Duplicates**: A compound unique index on `{ collectionSlug: 1, hadithNumber: 1 }`.
2. **Post ID Lookup**: Index on `{ wpPostId: 1 }` for rapid updates.
3. **Narrator Filter**: Index on `{ narrator: 1 }`.
4. **Full-Text Compound Index**:
   ```javascript
   db.hadiths.createIndex({
     tamilTranslation: "text",
     narrator: "text",
     chapterName: "text",
     arabicText: "text",
     bookName: "text"
   }, {
     weights: { tamilTranslation: 10, narrator: 5, chapterName: 3, arabicText: 2, bookName: 1 },
     name: "hadith_fulltext_search_idx",
     default_language: "none"
   })
   ```
   *Note: `default_language: "none"` is critical to prevent the MongoDB stemmer from incorrectly parsing Tamil/Arabic text as English.*

---

## Installation & Setup

### Prerequisites
* **Node.js** (v22+)
* **MongoDB** (Running locally or via Atlas)

### Setup Instructions
1. Clone or copy this repository directory.
2. Initialize environment config file `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/hadith_db
   WP_API_URL=https://tamil.quranandhadis.com/wp-json
   WP_SITE_URL=https://tamil.quranandhadis.com
   CONCURRENCY=5
   DELAY_MS=200
   RETRY_ATTEMPTS=5
   RETRY_DELAY_MS=1000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

---

## Run Commands

### 1. Dry Run (Scrape 10 Sample Records)
Runs a test extraction of the first 10 records and outputs a `sample_hadiths.json` file in the root workspace folder for validation without connecting to MongoDB.
```bash
node scraper.js --dry-run
```

### 2. Discover Collections
Queries the site categories to map the taxonomy and counts, saving the configuration to `datasets/collections.json`.
```bash
npm run discover
```

### 3. Scrape Collections (Collection-by-Collection)
Scrapes raw HTML pages and saves them to `datasets/raw/{collection}.json` with progress recovery state.
* **Scrape single collection** (e.g. Bukhari):
  ```bash
  npm run scrape bukhari
  ```
* **Scrape all collections**:
  ```bash
  npm run scrape all
  ```

### 4. Clean Data
Parses raw HTML records, extracts metadata fields, removes HTML markup, and validates data into `datasets/cleaned/{collection}.json`.
```bash
npm run clean all
```

### 5. Import into MongoDB
Inserts/updates cleaned files into MongoDB with optimized search indexes using `bulkWrite` and `upsert` (automatically runs data cleaner if raw files are available but cleaned files are missing).
* **Import single collection** (e.g. Bukhari):
  ```bash
  npm run import bukhari
  ```
* **Import all collections**:
  ```bash
  npm run import all
  ```

### 6. Verify Progress & Counts
Runs a script that compares local raw/cleaned file record counts against discovered WordPress counts, displaying a validation table and writing a `verification_report.md` file.
```bash
npm run verify
```

---

## Sample Data Formats

### Sample Raw Record (`datasets/raw/akhbar-asbahan.json`)
```json
{
  "wpPostId": 74572,
  "slug": "akhbar-asbahan-240",
  "originalUrl": "https://tamil.quranandhadis.com/akhbar-asbahan-240/",
  "title": "akhbar-asbahan-240",
  "rawHtml": "<!--====== Plain View =====================-->\n..."
}
```

### Sample Cleaned Record (`datasets/cleaned/akhbar-asbahan.json`)
```json
{
  "wpPostId": 74572,
  "hadithNumber": "240",
  "collectionSlug": "akhbar-asbahan",
  "collectionName": "akhbar-asbahan-240",
  "bookName": "",
  "chapterName": "",
  "arabicText": "«تَزَوَّجُوا وَلَا تُطَلِّقُوا، فَإِنَّ الطَّلَاقَ يَهْتَزُّ لَهُ الْعَرْشُ»",
  "tamilTranslation": "240. திருமணம் செய்யுங்கள். ஆனால் விவாகரத்து செய்யாதீர்கள்...",
  "narrator": "அலீ (ரலி)",
  "grade": "மவ்ளூவு - பொய்யான செய்தி",
  "gradeSlug": "other",
  "originalUrl": "https://tamil.quranandhadis.com/akhbar-asbahan-240/",
  "scrapedAt": "2026-06-04T12:49:01.472Z"
}
```
