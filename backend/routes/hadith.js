const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');
const mongoose = require('mongoose');

// GET single hadith
router.get('/:collection/:number', async (req, res) => {
  try {
    const { collection, number } = req.params;

    const hadith = await Hadith.findOne({
      collectionSlug: collection,
      hadithNumber: number
    });

    if (!hadith) {
      return res.status(404).json({ error: 'Hadith not found' });
    }

    // Find previous and next hadith in the same collection based on wpPostId
    const prevHadith = await Hadith.findOne({
      collectionSlug: collection,
      wpPostId: { $lt: hadith.wpPostId }
    })
      .sort({ wpPostId: -1 })
      .select('hadithNumber collectionSlug collectionName');

    const nextHadith = await Hadith.findOne({
      collectionSlug: collection,
      wpPostId: { $gt: hadith.wpPostId }
    })
      .sort({ wpPostId: 1 })
      .select('hadithNumber collectionSlug collectionName');

    res.json({
      hadith,
      prev: prevHadith ? { number: prevHadith.hadithNumber, collection: prevHadith.collectionSlug } : null,
      next: nextHadith ? { number: nextHadith.hadithNumber, collection: nextHadith.collectionSlug } : null
    });
  } catch (error) {
    console.error('Error fetching hadith:', error);
    res.status(500).json({ error: 'Server error fetching hadith' });
  }
});

// GET related hadiths (based on chapter or book, or same narrator)
router.get('/related/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Hadith ID' });
    }

    const currentHadith = await Hadith.findById(id);
    if (!currentHadith) {
      return res.status(404).json({ error: 'Hadith not found' });
    }

    // Find related hadiths from the same collection and book/chapter (excluding the current one)
    let query = {
      _id: { $ne: currentHadith._id },
      collectionSlug: currentHadith.collectionSlug
    };

    if (currentHadith.chapterName) {
      query.chapterName = currentHadith.chapterName;
    } else if (currentHadith.bookName) {
      query.bookName = currentHadith.bookName;
    } else if (currentHadith.narrator) {
      query.narrator = currentHadith.narrator;
    }

    const related = await Hadith.find(query)
      .limit(5)
      .select('hadithNumber collectionSlug collectionName narrator grade gradeSlug bookName chapterName tamilTranslation');

    // If we didn't find enough, grab from same collection generally
    if (related.length < 5) {
      const fallbackQuery = {
        _id: { $ne: currentHadith._id, $nin: related.map(r => r._id) },
        collectionSlug: currentHadith.collectionSlug
      };
      const fallback = await Hadith.find(fallbackQuery)
        .limit(5 - related.length)
        .select('hadithNumber collectionSlug collectionName narrator grade gradeSlug bookName chapterName tamilTranslation');
      related.push(...fallback);
    }

    res.json(related);
  } catch (error) {
    console.error('Error fetching related hadiths:', error);
    res.status(500).json({ error: 'Server error fetching related hadiths' });
  }
});

module.exports = router;
