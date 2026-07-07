const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');
const { escapeRegex } = require('../utils/hadithNumber');

router.get('/', async (req, res) => {
  try {
    const { q, collection, grade, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { isDeleted: { $ne: true } };

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
        const numberInt = parseInt(q.trim(), 10);
        query.$or = [
          { hadithNumber: q.trim() },
          { hadithNumberInt: numberInt },
          { tamilTranslation: { $regex: escapeRegex(q.trim()), $options: 'i' } },
          { narrator: { $regex: escapeRegex(q.trim()), $options: 'i' } },
          { arabicText: { $regex: escapeRegex(q.trim()), $options: 'i' } }
        ];
      } else {
        query.$or = [
          { tamilTranslation: { $regex: escapeRegex(q), $options: 'i' } },
          { narrator: { $regex: escapeRegex(q), $options: 'i' } },
          { arabicText: { $regex: escapeRegex(q), $options: 'i' } },
          { collectionName: { $regex: escapeRegex(q), $options: 'i' } },
          { bookName: { $regex: escapeRegex(q), $options: 'i' } },
          { chapterName: { $regex: escapeRegex(q), $options: 'i' } }
        ];
      }
    }

    // Always use numeric hadith ordering for consistent pagination and navigation.
    const dbQuery = Hadith.find(query).sort({ collectionSlug: 1, bookNo: 1, hadithNumberInt: 1, hadithNumber: 1 });

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
