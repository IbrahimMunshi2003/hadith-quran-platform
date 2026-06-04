const fs = require('fs');
const path = require('path');

function runVerification() {
    console.log('==================================================');
    console.log('Hadith Dataset Scrape and Clean Verification Report');
    console.log('==================================================\n');

    // Load collections metadata
    const collectionsPath = path.join(__dirname, 'datasets', 'collections.json');
    if (!fs.existsSync(collectionsPath)) {
        console.error('Error: Collections metadata file not found. Run "npm run discover" first.');
        process.exit(1);
    }
    const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));

    const rawDir = path.join(__dirname, 'datasets', 'raw');
    const cleanedDir = path.join(__dirname, 'datasets', 'cleaned');

    let totalExpected = 0;
    let totalRawScraped = 0;
    let totalCleaned = 0;
    let totalIssues = 0;

    const reportRows = [];

    collections.forEach(col => {
        const { slug, name, count: expected } = col;
        totalExpected += expected;

        const rawPath = path.join(rawDir, `${slug}.json`);
        const cleanedPath = path.join(cleanedDir, `${slug}.json`);

        let rawCount = 0;
        let cleanedCount = 0;
        let rawExists = false;
        let cleanedExists = false;

        if (fs.existsSync(rawPath)) {
            rawExists = true;
            try {
                const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
                rawCount = rawData.length;
                totalRawScraped += rawCount;
            } catch (e) {
                console.error(`Error reading raw file for ${slug}:`, e.message);
            }
        }

        if (fs.existsSync(cleanedPath)) {
            cleanedExists = true;
            try {
                const cleanedData = JSON.parse(fs.readFileSync(cleanedPath, 'utf8'));
                cleanedCount = cleanedData.length;
                totalCleaned += cleanedCount;
            } catch (e) {
                console.error(`Error reading cleaned file for ${slug}:`, e.message);
            }
        }

        const scrapedDiff = rawCount - expected;
        const invalidCount = rawCount - cleanedCount;

        // Status check
        let status = '⏳ Pending';
        if (rawExists) {
            if (rawCount === expected) {
                status = '✅ Complete';
            } else if (rawCount > expected) {
                status = '⚠️ Over-Scraped';
            } else {
                status = '🔄 In Progress';
            }
        }

        if (invalidCount > 0) {
            totalIssues += invalidCount;
        }

        reportRows.push({
            name,
            slug,
            expected,
            rawCount,
            cleanedCount,
            invalidCount,
            status,
            rawExists,
            cleanedExists
        });
    });

    // Output formatted report
    console.log(`| Collection Name | Slug | Expected (WP) | Raw Scraped | Cleaned & Valid | Validation Skipped | Status |`);
    console.log(`| :--- | :--- | :---: | :---: | :---: | :---: | :--- |`);
    reportRows.forEach(row => {
        console.log(`| ${row.name} | ${row.slug} | ${row.expected} | ${row.rawCount} | ${row.cleanedCount} | ${row.invalidCount} | ${row.status} |`);
    });

    console.log('\n==================================================');
    console.log('SUMMARY METRICS:');
    console.log(`  - Total Discovered collections: ${collections.length}`);
    console.log(`  - Total Expected Hadiths (WordPress): ${totalExpected}`);
    console.log(`  - Total Raw Hadiths Scraped: ${totalRawScraped} (${((totalRawScraped/totalExpected)*100).toFixed(2)}% complete)`);
    console.log(`  - Total Cleaned & Validated Hadiths: ${totalCleaned}`);
    console.log(`  - Total Validation Issues Found: ${totalIssues}`);
    console.log('==================================================');

    // Create a markdown report inside datasets directory too
    const reportPath = path.join(__dirname, 'datasets', 'verification_report.md');
    let mdContent = `# Scrape Verification Report\n\n`;
    mdContent += `Generated at: ${new Date().toISOString()}\n\n`;
    mdContent += `## Collection Progress Table\n\n`;
    mdContent += `| Collection Name | Slug | Expected (WP) | Raw Scraped | Cleaned & Valid | Validation Skipped | Status |\n`;
    mdContent += `| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n`;
    reportRows.forEach(row => {
        mdContent += `| ${row.name} | ${row.slug} | ${row.expected} | ${row.rawCount} | ${row.cleanedCount} | ${row.invalidCount} | ${row.status} |\n`;
    });
    mdContent += `\n## Summary\n\n`;
    mdContent += `- **Total Expected Hadiths (WP)**: ${totalExpected}\n`;
    mdContent += `- **Total Raw Scraped**: ${totalRawScraped} (${((totalRawScraped/totalExpected)*100).toFixed(2)}%)\n`;
    mdContent += `- **Total Cleaned & Validated**: ${totalCleaned}\n`;
    mdContent += `- **Skipped due to validation issues**: ${totalIssues}\n`;

    fs.writeFileSync(reportPath, mdContent, 'utf8');
    console.log(`Saved markdown verification report to: ${reportPath}`);
}

if (require.main === module) {
    runVerification();
}

module.exports = runVerification;
