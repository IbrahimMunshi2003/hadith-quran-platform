const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');

// Categories for Islamic Hadith Collections
const COLLECTION_CATEGORIES = {
  kutub_al_sittah: ['bukhari', 'muslim', 'abu-dawood', 'tirmidhi', 'nasaayi', 'ibn-majah'],
  others: ['musnad-ahmad', 'ibn-hibban', 'akhbar-asbahan', 'riyad-us-salihin', 'bulugh-al-maram', 'mishkat']
};

// GET all collections grouped or listed
router.get('/', async (req, res) => {
  try {
    const collections = await Hadith.aggregate([
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
      { $sort: { name: 1 } }
    ]);

    // Map categories
    const categorized = {
      kutub_al_sittah: [],
      others: []
    };

    collections.forEach(col => {
      const slug = col.slug.toLowerCase();
      if (COLLECTION_CATEGORIES.kutub_al_sittah.includes(slug)) {
        categorized.kutub_al_sittah.push(col);
      } else {
        categorized.others.push(col);
      }
    });

    res.json({
      all: collections,
      categorized
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Server error fetching collections' });
  }
});

// GET collection by slug (returns meta info, distinct books, distinct chapters, and paginated hadiths list)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { book, chapter, grade, narrator, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Check if collection exists by counting documents
    const totalCount = await Hadith.countDocuments({ collectionSlug: slug });
    if (totalCount === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Get collection metadata (using first document found)
    const metaDoc = await Hadith.findOne({ collectionSlug: slug });
    const collectionName = metaDoc.collectionName;

    // Build filter query
    let filterQuery = { collectionSlug: slug };
    if (book) filterQuery.bookName = book;
    if (chapter) filterQuery.chapterName = chapter;
    if (grade) filterQuery.gradeSlug = grade;
    if (narrator) filterQuery.narrator = narrator;

    // Get paginated hadith results
    const hadiths = await Hadith.find(filterQuery)
      .sort({ wpPostId: 1 })
      .skip(skip)
      .limit(limitNum);

    const filteredCount = await Hadith.countDocuments(filterQuery);

    // Get distinct books and chapters for filters (run efficiently)
    const books = await Hadith.distinct('bookName', { collectionSlug: slug, bookName: { $ne: '' } });
    const chapters = await Hadith.distinct('chapterName', { collectionSlug: slug, chapterName: { $ne: '' } });
    
    // Get distinct grades in this collection
    const gradesAgg = await Hadith.aggregate([
      { $match: { collectionSlug: slug, grade: { $ne: '' } } },
      { $group: { _id: { name: '$grade', slug: '$gradeSlug' }, count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id.name', slug: '$_id.slug', count: 1 } }
    ]);

    // Get distinct narrators in this collection (top 30 for filtering)
    const narratorsAgg = await Hadith.aggregate([
      { $match: { collectionSlug: slug, narrator: { $ne: '', $exists: true } } },
      { $group: { _id: '$narrator', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);

    res.json({
      collectionName,
      collectionSlug: slug,
      totalHadiths: totalCount,
      filteredHadithsCount: filteredCount,
      books,
      chapters,
      grades: gradesAgg,
      narrators: narratorsAgg,
      hadiths,
      page: pageNum,
      totalPages: Math.ceil(filteredCount / limitNum),
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching collection detail:', error);
    res.status(500).json({ error: 'Server error fetching collection detail' });
  }
});

module.exports = router;
