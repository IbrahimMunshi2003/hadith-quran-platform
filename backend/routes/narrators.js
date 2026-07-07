const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');

// GET all narrators
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let matchQuery = { narrator: { $ne: '', $exists: true }, isDeleted: { $ne: true } };
    if (search) {
      matchQuery.narrator = { $regex: search, $options: 'i' };
    }

    const narratorsAgg = await Hadith.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$narrator', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ]);

    const total = narratorsAgg[0]?.metadata[0]?.total || 0;
    const data = narratorsAgg[0]?.data || [];

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
      narrators: data.map(n => ({ name: n._id, count: n.count }))
    });
  } catch (error) {
    console.error('Error fetching narrators list:', error);
    res.status(500).json({ error: 'Server error fetching narrators' });
  }
});

// GET narrator details and hadiths narrated by them
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { narrator: name, isDeleted: { $ne: true } };

    const totalHadiths = await Hadith.countDocuments(query);
    if (totalHadiths === 0) {
      return res.status(404).json({ error: 'Narrator not found or has no recorded hadiths' });
    }

    const hadiths = await Hadith.find(query)
      .sort({ collectionSlug: 1, bookNo: 1, hadithNumberInt: 1, hadithNumber: 1 })
      .skip(skip)
      .limit(limit);

    // Get collections this narrator appears in
    const collectionsAgg = await Hadith.aggregate([
      { $match: query },
      { $group: { _id: '$collectionSlug', name: { $first: '$collectionName' }, count: { $sum: 1 } } },
      { $project: { _id: 0, slug: '$_id', name: 1, count: 1 } }
    ]);

    res.json({
      narrator: name,
      totalHadiths,
      hadiths,
      collections: collectionsAgg,
      page,
      totalPages: Math.ceil(totalHadiths / limit),
      limit
    });
  } catch (error) {
    console.error('Error fetching narrator details:', error);
    res.status(500).json({ error: 'Server error fetching narrator details' });
  }
});

module.exports = router;
