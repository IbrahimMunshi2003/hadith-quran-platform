require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { scrapeCollection } = require('./scraper');
const { cleanCollectionFile } = require('./cleaner');
const { runImporter } = require('./importer');
const runVerification = require('./verify');

async function main() {
    console.log('==================================================');
    console.log('Hadith Platform Master Pipeline Orchestrator');
    console.log('==================================================\n');

    // 1. Discover collections if not already done
    const collectionsPath = path.join(__dirname, 'datasets', 'collections.json');
    if (!fs.existsSync(collectionsPath)) {
        console.log('Collections list not found. Running discover step first...');
        const execSync = require('child_process').execSync;
        execSync('node discover.js', { stdio: 'inherit' });
    }

    const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));
    console.log(`Loaded ${collections.length} collections for processing.\n`);

    const collectionReports = [];

    // 2. Scrape sequentially
    console.log('--- PHASE 1: SEQUENTIAL SCRAPING ---');
    for (const col of collections) {
        try {
            console.log(`\nProcessing: ${col.name} (${col.slug})`);
            const metrics = await scrapeCollection(col, false);
            collectionReports.push({
                name: col.name,
                slug: col.slug,
                expected: metrics.expected,
                scraped: metrics.scraped,
                scrapeFailed: metrics.failed
            });
        } catch (err) {
            console.error(`Scrape failed for collection "${col.slug}":`, err.message);
            collectionReports.push({
                name: col.name,
                slug: col.slug,
                expected: col.count,
                scraped: 0,
                scrapeFailed: col.count,
                error: err.message
            });
        }
    }

    // 3. Clean and Validate
    console.log('\n--- PHASE 2: DATA CLEANING & VALIDATION ---');
    for (const report of collectionReports) {
        const rawPath = path.join(__dirname, 'datasets', 'raw', `${report.slug}.json`);
        if (fs.existsSync(rawPath)) {
            try {
                const cleanMetrics = cleanCollectionFile(report.slug);
                report.valid = cleanMetrics.cleaned;
                report.validationFailed = cleanMetrics.invalid;
            } catch (err) {
                console.error(`Cleaning failed for collection "${report.slug}":`, err.message);
                report.valid = 0;
                report.validationFailed = report.scraped;
            }
        } else {
            report.valid = 0;
            report.validationFailed = 0;
        }
        
        // Total failures = HTTP Scrape failures + cleaning validation failures
        report.failed = report.scrapeFailed + report.validationFailed;
        report.successPercentage = report.expected > 0 
            ? ((report.valid / report.expected) * 100).toFixed(2) 
            : '100.00';
    }

    // 4. Verification Report
    console.log('\n--- PHASE 3: VERIFICATION STAGE ---');
    try {
        runVerification();
    } catch (err) {
        console.error('Verification script execution failed:', err.message);
    }

    // 5. Database Import
    console.log('\n--- PHASE 4: MONGODB DATABASE IMPORT ---');
    try {
        await runImporter('all');
    } catch (err) {
        console.error('MongoDB Import stage failed:', err.message);
    }

    // 6. Generate Master Summary Reports (JSON & Markdown)
    generateMasterReports(collectionReports);
}

function generateMasterReports(reports) {
    console.log('\n--- PHASE 5: SUMMARY REPORT GENERATION ---');
    
    let totalExpected = 0;
    let totalScraped = 0;
    let totalValid = 0;
    let totalFailed = 0;

    reports.forEach(r => {
        totalExpected += r.expected;
        totalScraped += r.scraped;
        totalValid += r.valid || 0;
        totalFailed += r.failed || 0;
    });

    const totalSuccessPercentage = totalExpected > 0 
        ? ((totalValid / totalExpected) * 100).toFixed(2) 
        : '100.00';

    const summaryData = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalExpected,
            totalScraped,
            totalValid,
            totalFailed,
            successPercentage: totalSuccessPercentage
        },
        collections: reports
    };

    // Save JSON Report
    const summaryJsonPath = path.join(__dirname, 'datasets', 'scrape_summary.json');
    fs.writeFileSync(summaryJsonPath, JSON.stringify(summaryData, null, 2), 'utf8');
    console.log(`Saved master JSON summary to: ${summaryJsonPath}`);

    // Generate Markdown Report
    let md = `# Hadith Scraper Master Executive Summary\n\n`;
    md += `**Report Generated At**: ${new Date().toLocaleString()}\n\n`;
    
    md += `## Overall Metrics\n\n`;
    md += `| Metric | Count | Percentage |\n`;
    md += `| :--- | :---: | :---: |\n`;
    md += `| **Expected Records (WordPress)** | ${totalExpected} | 100% |\n`;
    md += `| **Raw Scraped Records** | ${totalScraped} | ${((totalScraped / totalExpected) * 100).toFixed(2)}% |\n`;
    md += `| **Cleaned & Validated Records** | ${totalValid} | **${totalSuccessPercentage}%** |\n`;
    md += `| **Failed Records (Fetch/Validate)** | ${totalFailed} | ${((totalFailed / totalExpected) * 100).toFixed(2)}% |\n\n`;

    md += `## Detailed Collections Performance\n\n`;
    md += `| Collection Name | Slug | Expected | Scraped | Validated | Total Failed | Success % |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    reports.forEach(r => {
        md += `| ${r.name} | ${r.slug} | ${r.expected} | ${r.scraped} | ${r.valid || 0} | ${r.failed || 0} | ${r.successPercentage}% |\n`;
    });

    const summaryMdPath = path.join(__dirname, 'datasets', 'scrape_summary.md');
    fs.writeFileSync(summaryMdPath, md, 'utf8');
    console.log(`Saved master Markdown summary report to: ${summaryMdPath}`);

    console.log('\n==================================================');
    console.log('MASTER PIPELINE EXECUTION COMPLETED SUCCESSFULLY');
    console.log(`Overall Success Rate: ${totalSuccessPercentage}%`);
    console.log('==================================================');
}

main().catch(err => {
    console.error('Master script failed:', err);
    process.exit(1);
});
