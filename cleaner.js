const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

/**
 * Cleans HTML entities and normalizes whitespace
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Parses raw HTML page content and returns a cleaned, structured Hadith object.
 */
function cleanRecord(rawRecord, collectionSlug) {
    const { wpPostId, slug, originalUrl, rawHtml } = rawRecord;
    
    if (!rawHtml) {
        throw new Error('Record has no rawHtml content');
    }

    const $ = cheerio.load(rawHtml);

    // 1. Hadith Number and Collection Name
    const titleText = cleanText($('#title-text').text());
    let collectionName = '';
    let hadithNumber = '';
    
    if (titleText) {
        const parts = titleText.split(':');
        if (parts.length >= 2) {
            collectionName = parts[0].trim();
            hadithNumber = parts.slice(1).join(':').trim();
        } else {
            collectionName = collectionSlug;
            // Fallback: extract last number from slug (e.g. "ibn-majah-280" -> "280")
            const slugParts = slug.split('-');
            hadithNumber = slugParts[slugParts.length - 1];
        }
    } else {
        collectionName = collectionSlug;
        const slugParts = slug.split('-');
        hadithNumber = slugParts[slugParts.length - 1];
    }

    // Clean up Hadith number (e.g. remove trailing dots, etc.)
    hadithNumber = hadithNumber.replace(/\.$/, '').trim();

    // 2. Grade / Authenticity
    const qualityEl = $('.content-list-quality');
    let grade = '';
    let gradeSlug = '';
    if (qualityEl.length > 0) {
        grade = cleanText(qualityEl.text().replace(/ஹதீஸின் தரம்:\s*/, ''));
        // Strip emoji and checks
        grade = grade.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
        
        // Detect grade slug based on class name
        const classes = qualityEl.attr('class') || '';
        const classList = classes.split(/\s+/);
        // Find the second class which usually holds the slug (e.g., sahih, daeef)
        gradeSlug = classList.find(c => c !== 'content-list-quality') || '';
    }

    // 3. Arabic Text
    let arabicText = '';
    const arabicParagraphs = $('#arabic-text p').map((i, el) => $(el).text().trim()).get();
    if (arabicParagraphs.length > 0) {
        arabicText = arabicParagraphs.join('\n').trim();
    } else {
        // Fallback to div text if no paragraphs are present
        arabicText = cleanText($('#arabic-text').text());
    }

    // 4. Tamil Translation, Narrator, Chapter, and Book
    let bookName = '';
    let chapterName = '';
    let narrator = '';
    let translationParagraphs = [];

    const tamilTextDiv = $('#tamil-text');
    if (tamilTextDiv.length > 0) {
        // Get all paragraph texts inside the div
        const paragraphs = tamilTextDiv.find('p').map((i, el) => {
            return $(el).text().trim();
        }).get().filter(p => p.length > 0);

        for (let i = 0; i < paragraphs.length; i++) {
            const pText = cleanText(paragraphs[i]);

            // Skip empty/divider elements or very short lines of junk
            if (pText === '-----------------------------------------' || pText === '---') {
                continue;
            }

            // Skip detailed explanation link text from translation body
            if (pText.includes('விரிவான விவரம்') || pText.includes('மேலும் விவரம்') || pText.includes('விளக்கம்')) {
                if (pText.length < 50) {
                    continue;
                }
            }

            // Check for Book Name (அத்தியாயம்)
            if (pText.includes('அத்தியாயம்:')) {
                bookName = pText;
                continue;
            }

            // Check for Chapter Name (பாடம்)
            if (pText.startsWith('பாடம்:')) {
                // If it is just "பாடம்:" or very short, combine it with the next paragraph as the name
                if (pText.length <= 8 && i + 1 < paragraphs.length) {
                    const nextP = cleanText(paragraphs[i + 1]);
                    chapterName = `${pText} ${nextP}`;
                    i++; // skip next paragraph since we merged it
                } else {
                    chapterName = pText;
                }
                continue;
            }

            // Check for Narrator
            // Pattern 1: "அறிவிப்பவர்: [name]"
            if (pText.includes('அறிவிப்பவர்:')) {
                const match = pText.match(/அறிவிப்பவர்:\s*(.*)/);
                if (match) {
                    narrator = match[1].trim();
                }
                continue;
            }
            // Pattern 2: "[name] (ரலி) அவர்கள் கூறியதாவது:" or "[name] (ரலி) அறிவிக்கிறார்:"
            if (pText.includes('அவர்கள் கூறியதாவது:') || pText.includes('அறிவிக்கிறார்:') || pText.includes('கூறியதாவது:')) {
                const match = pText.match(/(.*?)\s*(?:அவர்கள் கூறியதாவது:|கூறியதாவது:|அறிவிக்கிறார்:)/);
                if (match) {
                    narrator = match[1].trim();
                }
                // Keep this paragraph in the translation too as it often introduces the Hadith
                translationParagraphs.push(pText);
                continue;
            }

            // Otherwise, it is part of the Hadith translation content
            translationParagraphs.push(pText);
        }
    }

    // Join translation paragraphs with newlines
    let tamilTranslation = translationParagraphs.join('\n').trim();

    // Final fallback checks if fields are empty
    if (!narrator) {
        // Look for narrator footnotes or strings like (ரலி) inside translation
        const lines = tamilTranslation.split('\n');
        for (const line of lines) {
            if (line.includes('(ரலி)')) {
                // Check if this line looks like a narrator line (usually short, near the top or bottom)
                if (line.length < 80 && (line.includes('கூறினார்') || line.includes('கூறினார்கள்') || line.includes('அறிவித்தார்'))) {
                    narrator = line.replace(/அவர்கள்|கூறினார்|கூறினார்கள்|அறிவித்தார்/g, '').trim();
                    break;
                }
            }
        }
    }

    // Remove WordPress/scraped footnote numbers from Hadith number
    hadithNumber = hadithNumber.replace(/^Hadith\s+/i, '').trim();

    // 5. Detailed Explanation / Criticism links extraction
    let detailedExplanationUrl = '';
    let detailedExplanationTitle = '';
    let hasDetailedExplanation = false;

    if (rawHtml) {
        $('a').each((i, el) => {
            const linkText = cleanText($(el).text());
            const href = $(el).attr('href');
            if (!href) return;

            const isMatchText = linkText.includes('விரிவான விவரம்') || 
                                linkText.includes('விளக்கம்') || 
                                linkText.includes('மேலும் விவரம்');
            
            const isMatchHref = href.includes('grade-analysis') || 
                                href.includes('criticism') || 
                                href.includes('hadith-grade') ||
                                href.includes('hadis-explanation');

            if (isMatchText || isMatchHref) {
                let absoluteUrl = href;
                if (href.startsWith('/')) {
                    absoluteUrl = `https://tamil.quranandhadis.com${href}`;
                }
                detailedExplanationUrl = absoluteUrl;
                detailedExplanationTitle = linkText || 'விரிவான விவரம்';
                hasDetailedExplanation = true;
                return false; // Break loop
            }
        });
    }

    return {
        wpPostId: Number(wpPostId),
        hadithNumber,
        collectionSlug,
        collectionName,
        bookName,
        chapterName,
        arabicText,
        tamilTranslation,
        narrator,
        grade,
        gradeSlug,
        originalUrl,
        detailedExplanationUrl,
        detailedExplanationTitle,
        hasDetailedExplanation,
        scrapedAt: new Date()
    };
}

/**
 * Validates the structure of a cleaned Hadith record.
 */
function validateRecord(record) {
    const required = ['wpPostId', 'hadithNumber', 'collectionSlug', 'tamilTranslation'];
    for (const field of required) {
        if (!record[field]) {
            return { valid: false, reason: `Missing required field: ${field}` };
        }
    }
    return { valid: true };
}

/**
 * Processes a raw collection file into a cleaned collection file.
 */
function cleanCollectionFile(collectionSlug) {
    const rawPath = path.join(__dirname, 'datasets', 'raw', `${collectionSlug}.json`);
    const cleanedPath = path.join(__dirname, 'datasets', 'cleaned', `${collectionSlug}.json`);

    if (!fs.existsSync(rawPath)) {
        throw new Error(`Raw dataset for collection "${collectionSlug}" not found at: ${rawPath}`);
    }

    // Ensure output directories exist
    const cleanedDir = path.dirname(cleanedPath);
    if (!fs.existsSync(cleanedDir)) {
        fs.mkdirSync(cleanedDir, { recursive: true });
    }

    console.log(`Cleaning raw dataset for: ${collectionSlug}...`);
    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    const cleanedRecords = [];
    let invalidCount = 0;

    rawData.forEach(record => {
        try {
            const cleaned = cleanRecord(record, collectionSlug);
            const validation = validateRecord(cleaned);
            if (validation.valid) {
                cleanedRecords.push(cleaned);
            } else {
                invalidCount++;
                console.warn(`[Validation Warning] Post ${record.wpPostId} (${record.slug}) skipped: ${validation.reason}`);
            }
        } catch (err) {
            invalidCount++;
            console.error(`[Parsing Error] Failed to parse post ${record.wpPostId} (${record.slug}):`, err.message);
        }
    });

    fs.writeFileSync(cleanedPath, JSON.stringify(cleanedRecords, null, 2), 'utf8');
    console.log(`Finished cleaning ${collectionSlug}:`);
    console.log(`  - Total raw records: ${rawData.length}`);
    console.log(`  - Cleaned & validated records: ${cleanedRecords.length}`);
    console.log(`  - Skipped/invalid records: ${invalidCount}`);
    
    return {
        total: rawData.length,
        cleaned: cleanedRecords.length,
        invalid: invalidCount
    };
}

module.exports = {
    cleanRecord,
    validateRecord,
    cleanCollectionFile
};
