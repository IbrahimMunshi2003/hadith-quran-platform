require('dotenv').config();
const fs = require('fs');
const path = require('path');

const WP_API_URL = process.env.WP_API_URL || 'https://tamil.quranandhadis.com/wp-json';

// Categories that are NOT hadith collections (narrators list, terminology, site lists)
const EXCLUDED_SLUGS = [
    'raavi', 
    'hadis-kalai', 
    'imams', 
    'style-followed-in-hadith-classification', 
    'hadis-research-softwares'
];

async function fetchWithRetry(url, retries = 3, delay = 1000) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying fetch for ${url} in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retries - 1, delay * 2);
        }
        throw error;
    }
}

async function discoverCollections() {
    console.log(`Discovering Hadith collections from: ${WP_API_URL}`);
    
    let page = 1;
    let allCategories = [];
    let hasMore = true;

    while (hasMore) {
        try {
            const url = `${WP_API_URL}/wp/v2/categories?per_page=100&page=${page}`;
            console.log(`Fetching categories page ${page}...`);
            const categories = await fetchWithRetry(url);
            
            if (Array.isArray(categories) && categories.length > 0) {
                allCategories.push(...categories);
                page++;
            } else {
                hasMore = false;
            }
        } catch (e) {
            // Out of bounds or errors mean end of list
            hasMore = false;
        }
    }

    console.log(`Total raw categories fetched: ${allCategories.length}`);

    // Filter and map to collections
    const collections = allCategories
        .filter(cat => {
            // Exclude non-hadith categories and empty categories
            return !EXCLUDED_SLUGS.includes(cat.slug) && cat.count > 0;
        })
        .map(cat => ({
            id: cat.id,
            slug: cat.slug,
            name: cat.name,
            count: cat.count,
            description: cat.description || ''
        }));

    // Ensure output directories exist
    const datasetsDir = path.join(__dirname, 'datasets');
    if (!fs.existsSync(datasetsDir)) {
        fs.mkdirSync(datasetsDir, { recursive: true });
    }

    const outputPath = path.join(datasetsDir, 'collections.json');
    fs.writeFileSync(outputPath, JSON.stringify(collections, null, 2), 'utf8');
    
    console.log('\n--- Discovered Collections ---');
    collections.forEach(col => {
        console.log(`Name: ${col.name.padEnd(30)} | Slug: ${col.slug.padEnd(25)} | Count: ${col.count}`);
    });
    console.log(`-----------------------------`);
    console.log(`Saved ${collections.length} collections to ${outputPath}`);
}

discoverCollections().catch(err => {
    console.error('Discovery failed:', err);
    process.exit(1);
});
