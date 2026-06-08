require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hadith_db';

async function generateReport() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db();
        
        const hadithsCol = db.collection('hadiths');
        const explanationsCol = db.collection('hadithExplanations');
        const articlesCol = db.collection('hadithScienceArticles');

        const totalHadithsChecked = await hadithsCol.countDocuments();
        const explanationsFound = await explanationsCol.countDocuments({ "gradingExplanation.tamil": { $exists: true, $ne: "" } });
        const narratorAnalysesFound = await explanationsCol.countDocuments({ "narratorAnalysis": { $not: { $size: 0 } } });
        const hadithScienceArticlesFound = await articlesCol.countDocuments();

        const missingExplanations = totalHadithsChecked - explanationsFound;

        const report = {
            totalHadithsChecked,
            explanationsFound,
            narratorAnalysesFound,
            hadithScienceArticlesFound,
            missingExplanations
        };

        console.log("=== DB Verification Report ===");
        console.log(JSON.stringify(report, null, 2));

    } catch (e) {
        console.error("Error generating report:", e);
    } finally {
        await client.close();
    }
}

generateReport();
