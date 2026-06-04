require('dotenv').config();
const fs = require('fs');
const path = require('path');

const WP_API_URL = process.env.WP_API_URL || 'https://tamil.quranandhadis.com/wp-json';
const WP_SITE_URL = process.env.WP_SITE_URL || 'https://tamil.quranandhadis.com';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);
const DELAY_MS = parseInt(process.env.DELAY_MS || '200', 10);
const RETRY_ATTEMPTS = parseInt(process.env.RETRY_ATTEMPTS || '5', 10);
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS || '1000', 10);

/**
 * Fetch helper with retries and exponential backoff.
 */
async function fetchWithRetry(url, retries = RETRY_ATTEMPTS, delay = RETRY_DELAY_MS) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 429) {
                console.warn(`[Rate Limited] 429 received for ${url}. Waiting ${delay * 2}ms and retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay * 2));
                return fetchWithRetry(url, retries, delay * 2);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`[Fetch Warning] Failed to fetch ${url}: ${error.message}. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retries - 1, delay * 2);
        }
        throw error;
    }
}

/**
 * Limit-based promise pool for throttling concurrency.
 */
async function promisePool(items, limit, taskFn) {
    const results = [];
    const executing = new Set();
    for (const item of items) {
        const p = Promise.resolve().then(() => taskFn(item));
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean, clean);
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
}

/**
 * Loads collections file.
 */
function loadCollections() {
    const collectionsPath = path.join(__dirname, 'datasets', 'collections.json');
    if (!fs.existsSync(collectionsPath)) {
        throw new Error('Collections file not found. Please run: npm run discover');
    }
    return JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));
}

/**
 * Scrapes a single collection category.
 */
async function scrapeCollection(collection, dryRun = false) {
    const { id: catId, slug: collectionSlug, name: collectionName, count: totalExpected } = collection;
    console.log(`\n==================================================`);
    console.log(`Starting scrape for collection: ${collectionName} (${collectionSlug})`);
    console.log(`Expected Posts: ${totalExpected} | Category ID: ${catId}`);
    console.log(`==================================================`);

    // Setup folder paths
    const progressDir = path.join(__dirname, 'progress');
    const rawDir = path.join(__dirname, 'datasets', 'raw');
    const backupDir = path.join(__dirname, 'datasets', 'backups');
    const errorsDir = path.join(__dirname, 'datasets', 'errors');
    
    [progressDir, rawDir, backupDir, errorsDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const progressPath = path.join(progressDir, `${collectionSlug}.json`);
    const rawPath = path.join(rawDir, `${collectionSlug}.json`);
    const errorsPath = path.join(errorsDir, `${collectionSlug}_errors.json`);

    // Load progress state
    let progress = {
        collectionSlug,
        currentPage: 1,
        totalPages: 1,
        completedPostIds: [],
        lastBackupMilestone: 0,
        finished: false
    };

    if (fs.existsSync(progressPath)) {
        progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        console.log(`Resuming progress from page ${progress.currentPage}. Already scraped ${progress.completedPostIds.length} posts.`);
    }

    // Load existing raw records
    let rawRecords = [];
    if (fs.existsSync(rawPath)) {
        rawRecords = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    }

    // Load existing errors
    let errorsList = [];
    if (fs.existsSync(errorsPath)) {
        try {
            errorsList = JSON.parse(fs.readFileSync(errorsPath, 'utf8'));
        } catch (e) {
            errorsList = [];
        }
    }

    if (progress.finished && !dryRun) {
        console.log(`Collection "${collectionSlug}" is already marked as finished.`);
        return {
            expected: totalExpected,
            scraped: rawRecords.length,
            failed: errorsList.length
        };
    }

    let hasMore = true;
    let page = progress.currentPage;
    let scrapedThisSession = 0;

    while (hasMore) {
        // WordPress REST API URL for current page of this category
        const apiPageUrl = `${WP_API_URL}/wp/v2/posts?categories=${catId}&per_page=100&page=${page}&orderby=id&order=asc`;
        console.log(`\n[API Page ${page}] Fetching post list...`);
        
        let response;
        try {
            response = await fetchWithRetry(apiPageUrl);
        } catch (e) {
            console.error(`Failed to fetch post list for page ${page}:`, e.message);
            // Record this page fetch error
            errorsList.push({
                wpPostId: null,
                slug: `page-${page}-index`,
                link: apiPageUrl,
                error: `Failed to fetch post index list: ${e.message}`,
                timestamp: new Date().toISOString()
            });
            fs.writeFileSync(errorsPath, JSON.stringify(errorsList, null, 2), 'utf8');
            break;
        }

        // Get pagination headers
        const wpTotal = parseInt(response.headers.get('x-wp-total') || '0', 10);
        const wpTotalPages = parseInt(response.headers.get('x-wp-totalpages') || '0', 10);
        progress.totalPages = wpTotalPages;

        const posts = await response.json();

        if (!Array.isArray(posts) || posts.length === 0) {
            console.log(`No more posts found on page ${page}. Finished.`);
            progress.finished = true;
            hasMore = false;
            break;
        }

        console.log(`Found ${posts.length} posts on page ${page}. (Total matching posts in WP: ${wpTotal}, Total Pages: ${wpTotalPages})`);

        // Filter out posts already scraped
        const pendingPosts = posts.filter(post => !progress.completedPostIds.includes(post.id));
        console.log(`${pendingPosts.length} of ${posts.length} posts need scraping on this page.`);

        if (pendingPosts.length > 0) {
            console.log(`Scraping plain HTML pages in batches with concurrency=${CONCURRENCY}...`);

            // Execute concurrent batch fetching
            const scrapedResults = await promisePool(pendingPosts, CONCURRENCY, async (post) => {
                // Apply a small rate limit delay
                if (DELAY_MS > 0) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }

                const postUrl = `${post.link}?view=plain`;
                console.log(` -> Fetching HTML for [${post.id}] ${post.slug}...`);
                
                try {
                    const htmlResponse = await fetchWithRetry(postUrl);
                    const html = await htmlResponse.text();
                    
                    scrapedThisSession++;
                    return {
                        success: true,
                        record: {
                            wpPostId: post.id,
                            slug: post.slug,
                            originalUrl: post.link,
                            title: post.title.rendered,
                            rawHtml: html
                        }
                    };
                } catch (e) {
                    console.error(` !!! Error fetching post ${post.id} (${post.slug}):`, e.message);
                    return { 
                        success: false, 
                        wpPostId: post.id,
                        slug: post.slug,
                        link: post.link,
                        error: e.message 
                    };
                }
            });

            // Process results and write to memory
            scrapedResults.forEach(res => {
                if (res.success) {
                    rawRecords.push(res.record);
                    progress.completedPostIds.push(res.record.wpPostId);
                } else {
                    errorsList.push({
                        wpPostId: res.wpPostId,
                        slug: res.slug,
                        link: res.link,
                        error: res.error,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Write raw data file (datasets/raw/{collection}.json)
            fs.writeFileSync(rawPath, JSON.stringify(rawRecords, null, 2), 'utf8');
            console.log(`Updated raw data file. Total records in raw dataset: ${rawRecords.length}`);

            // Write errors file if any new errors occurred
            if (errorsList.length > 0) {
                fs.writeFileSync(errorsPath, JSON.stringify(errorsList, null, 2), 'utf8');
            }

            // Create backups every 500 records
            const currentBackupMilestone = Math.floor(rawRecords.length / 500);
            if (currentBackupMilestone > 0) {
                const lastBackupMilestone = progress.lastBackupMilestone || 0;
                if (currentBackupMilestone > lastBackupMilestone) {
                    const backupFilename = `${collectionSlug}_backup_${currentBackupMilestone * 500}.json`;
                    const backupPath = path.join(backupDir, backupFilename);
                    fs.writeFileSync(backupPath, JSON.stringify(rawRecords, null, 2), 'utf8');
                    console.log(`[Backup Created] Saved backup of ${rawRecords.length} records to ${backupPath}`);
                    progress.lastBackupMilestone = currentBackupMilestone;
                }
            }
        }

        // Save progress details
        if (dryRun && (rawRecords.length >= 10 || scrapedThisSession >= 10)) {
            console.log(`Dry-run limit of 10 reached. Stopping.`);
            progress.finished = false;
            hasMore = false;
            break;
        }

        if (page >= wpTotalPages) {
            console.log(`Reached last page of collection (${wpTotalPages}).`);
            progress.finished = true;
            hasMore = false;
        } else {
            page++;
            progress.currentPage = page;
        }

        // Write state file
        fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');
    }

    console.log(`\nFinished session for "${collectionSlug}". Total Scraped: ${rawRecords.length} / ${totalExpected}`);
    return {
        expected: totalExpected,
        scraped: rawRecords.length,
        failed: errorsList.length
    };
}

/**
 * Main scraper controller.
 */
async function runScraper(collectionSlugArg = null, dryRun = false) {
    const collections = loadCollections();

    if (dryRun) {
        console.log(`[DRY-RUN MODE] Scraping 10 sample records for validation...`);
        // Find a small collection like 'akhbar-asbahan' (ID 43) or fall back to first one
        const sampleCol = collections.find(c => c.slug === 'akhbar-asbahan') || collections[0];
        await scrapeCollection(sampleCol, true);
        
        // Read raw records from disk
        const rawPath = path.join(__dirname, 'datasets', 'raw', `${sampleCol.slug}.json`);
        const rawRecords = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

        // Clean records to write sample_hadiths.json
        const { cleanRecord } = require('./cleaner');
        const sampleCleaned = [];
        rawRecords.slice(0, 10).forEach(rec => {
            try {
                const cleaned = cleanRecord(rec, sampleCol.slug);
                sampleCleaned.push(cleaned);
            } catch (err) {
                console.error(`Failed parsing dry-run record ${rec.wpPostId}:`, err.message);
            }
        });

        const samplePath = path.join(__dirname, 'sample_hadiths.json');
        fs.writeFileSync(samplePath, JSON.stringify(sampleCleaned, null, 2), 'utf8');
        console.log(`Dry-run sample completed. Saved 10 cleaned records to: ${samplePath}`);
        return;
    }

    if (collectionSlugArg && collectionSlugArg.toLowerCase() !== 'all') {
        // Scrape single collection
        const col = collections.find(c => c.slug.toLowerCase() === collectionSlugArg.toLowerCase());
        if (!col) {
            console.error(`Error: Collection "${collectionSlugArg}" not found in discovered list.`);
            process.exit(1);
        }
        await scrapeCollection(col, false);
    } else {
        // Scrape all collections
        console.log(`Scraping ALL ${collections.length} collections in sequence...`);
        for (const col of collections) {
            try {
                await scrapeCollection(col, false);
            } catch (err) {
                console.error(`Failed to scrape collection "${col.slug}":`, err.message);
                console.log(`Proceeding to next collection...`);
            }
        }
    }
}

// Support command-line calls directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const slugArg = args.find(arg => !arg.startsWith('--'));

    runScraper(slugArg, dryRun).catch(err => {
        console.error('Scraper crash:', err);
        process.exit(1);
    });
}

module.exports = {
    scrapeCollection,
    runScraper
};
