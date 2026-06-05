const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');

router.get('/', async (req, res) => {
  try {
    const totalHadiths = await Hadith.countDocuments();
    
    // Aggregation to get distinct collections and count of hadiths in each
    const collectionsAgg = await Hadith.aggregate([
      {
        $group: {
          _id: '$collectionSlug',
          name: { $first: '$collectionName' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          slug: '$_id',
          name: 1,
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Count of distinct narrators
    const narratorsCountAgg = await Hadith.aggregate([
      { $match: { narrator: { $ne: '', $exists: true } } },
      { $group: { _id: '$narrator' } },
      { $count: 'count' }
    ]);
    const totalNarrators = narratorsCountAgg[0]?.count || 0;

    res.json({
      totalHadiths,
      totalCollections: collectionsAgg.length,
      totalNarrators,
      collections: collectionsAgg
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error fetching database stats' });
  }
});

module.exports = router;
