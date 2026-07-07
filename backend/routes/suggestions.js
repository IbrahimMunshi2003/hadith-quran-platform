const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');
const { escapeRegex } = require('../utils/hadithNumber');

/**
 * GET /api/suggestions?q=...
 *
 * Returns grouped search suggestions for the autocomplete dropdown.
 * Each category is capped at 5 results for speed.
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({
        narrators: [],
        collections: [],
        chapters: [],
        hadithNumbers: []
      });
    }

    const trimmed = q.trim();
    const escaped = escapeRegex(trimmed);
    const isNumber = /^\d+$/.test(trimmed);
    const baseMatch = { isDeleted: { $ne: true } };

    // Run all suggestion queries in parallel for speed
    const [narrators, collections, chapters, hadithNumbers] = await Promise.all([
      // Narrator suggestions (top 5 matching, sorted by frequency)
      isNumber ? Promise.resolve([]) :
        Hadith.aggregate([
          { $match: { ...baseMatch, narrator: { $regex: escaped, $options: 'i', $ne: '' } } },
          { $group: { _id: '$narrator', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, name: '$_id', count: 1 } }
        ]),

      // Collection suggestions (top 5 matching)
      isNumber ? Promise.resolve([]) :
        Hadith.aggregate([
          { $match: { ...baseMatch, collectionName: { $regex: escaped, $options: 'i' } } },
          { $group: { _id: '$collectionSlug', name: { $first: '$collectionName' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, slug: '$_id', name: 1, count: 1 } }
        ]),

      // Chapter suggestions (top 5 matching)
      isNumber ? Promise.resolve([]) :
        Hadith.aggregate([
          { $match: { ...baseMatch, chapterName: { $regex: escaped, $options: 'i', $ne: '' } } },
          { $group: { _id: '$chapterName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, name: '$_id', count: 1 } }
        ]),

      // Hadith number suggestions (when query is numeric)
      isNumber ?
        Hadith.find(
          { ...baseMatch, hadithNumber: { $regex: `^${escaped}` } },
          { hadithNumber: 1, collectionSlug: 1, collectionName: 1, _id: 0 }
        ).limit(5).lean()
        : Promise.resolve([])
    ]);

    res.json({
      narrators,
      collections,
      chapters,
      hadithNumbers
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Server error fetching suggestions' });
  }
});

module.exports = router;
