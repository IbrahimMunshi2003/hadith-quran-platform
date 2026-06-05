const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');

router.get('/', async (req, res) => {
  try {
    const { q, collection, grade, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // Apply collection filter
    if (collection) {
      query.collectionSlug = collection;
    }

    // Apply grade filter
    if (grade) {
      query.gradeSlug = grade;
    }

    // Apply search query
    if (q) {
      const isNumber = /^\d+$/.test(q.trim());
      if (isNumber) {
        // Search by exact hadith number or part of text
        query.$or = [
          { hadithNumber: q.trim() },
          { tamilTranslation: { $regex: q.trim(), $options: 'i' } }
        ];
      } else {
        // Check for text index search or regex search
        // We use $or with text search score and regex fallback to allow substring match
        query.$or = [
          { $text: { $search: q } },
          { tamilTranslation: { $regex: q, $options: 'i' } },
          { narrator: { $regex: q, $options: 'i' } },
          { arabicText: { $regex: q, $options: 'i' } }
        ];
      }
    }

    // Execute query with score sorting if text search is used
    let dbQuery = Hadith.find(query);
    if (q && !/^\d+$/.test(q.trim())) {
      // Add text score projection
      dbQuery = dbQuery.select({ score: { $meta: 'textScore' } });
      // Sort by score if text index matches, or by hadith number if not
      dbQuery = dbQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      // Sort by collection and hadith number numerically
      dbQuery = dbQuery.sort({ collectionSlug: 1, wpPostId: 1 });
    }

    const totalResults = await Hadith.countDocuments(query);
    const results = await dbQuery.skip(skip).limit(limitNum);

    res.json({
      total: totalResults,
      page: pageNum,
      totalPages: Math.ceil(totalResults / limitNum),
      limit: limitNum,
      results
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

module.exports = router;
