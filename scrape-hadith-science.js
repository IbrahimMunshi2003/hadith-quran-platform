require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const WP_API_URL = process.env.WP_API_URL || 'https://tamil.quranandhadis.com/wp-json';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hadith_db';

async function fetchWithRetry(url, retries = 3) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, retries - 1);
        }
        throw error;
    }
}

async function runScraper() {
    console.log('Resolving category ID for "hadis-kalai"...');
    try {
        // Find category ID
        const catRes = await fetchWithRetry(`${WP_API_URL}/wp/v2/categories?slug=hadis-kalai`);
        const cats = await catRes.json();
        if (!cats || cats.length === 0) {
            console.error('Category "hadis-kalai" not found on WP API.');
            process.exit(1);
        }
        
        const catId = cats[0].id;
        console.log(`Found category ID: ${catId}`);

        let page = 1;
        let hasMore = true;
        let articles = [];

        while (hasMore) {
            const apiPageUrl = `${WP_API_URL}/wp/v2/posts?categories=${catId}&per_page=100&page=${page}`;
            console.log(`Fetching page ${page}...`);
            
            const response = await fetchWithRetry(apiPageUrl);
            const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);
            
            const posts = await response.json();
            
            for (const post of posts) {
                // Fetch the plain view for the content to be clean
                const plainUrl = `${post.link}?view=plain`;
                console.log(` -> Fetching HTML for [${post.id}] ${post.slug}...`);
                const htmlRes = await fetchWithRetry(plainUrl);
                const html = await htmlRes.text();
                
                // Very basic extraction for the content
                const cheerio = require('cheerio');
                const $ = cheerio.load(html);
                let content = $('#tamil-text').html();
                
                if (!content) {
                    content = post.content.rendered;
                }
                
                // Clean tags from content if needed or keep html
                
                articles.push({
                    title: post.title.rendered,
                    slug: post.slug,
                    url: post.link,
                    content: content,
                    tags: [],
                    category: 'hadis-kalai'
                });
            }

            if (page >= totalPages) {
                hasMore = false;
            } else {
                page++;
            }
        }
        
        console.log(`Scraped ${articles.length} articles. Saving to DB...`);
        
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db();
        const collection = db.collection('hadithScienceArticles');
        
        for (const article of articles) {
            await collection.updateOne(
                { slug: article.slug },
                { $set: article },
                { upsert: true }
            );
        }
        
        await client.close();
        console.log('Saved Hadith Science Articles successfully.');
        
    } catch (e) {
        console.error('Scraper failed:', e.message);
    }
}

runScraper();
