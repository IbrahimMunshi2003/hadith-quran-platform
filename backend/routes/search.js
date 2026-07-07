const express = require('express');
const router = express.Router();
const Hadith = require('../models/Hadith');
const { escapeRegex } = require('../utils/hadithNumber');

router.get('/', async (req, res) => {
  try {
    const {
      q,
      collection,
      book,
      chapter,
      grade,
      narrator,
      source,
      hadithNumber: hadithNumFilter,
      reference,
      arabic,
      tamil,
      hasExplanation,
      featured,
      verified,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // ── Base filter (always applied) ──────────────────────────
    const filter = { isDeleted: { $ne: true } };

    // ── Advanced filters ──────────────────────────────────────
    if (collection)    filter.collectionSlug = collection;
    if (grade)         filter.gradeSlug = grade;
    if (book)          filter.bookName = book;
    if (chapter)       filter.chapterName = chapter;
    if (narrator)      filter.narrator = narrator;
    if (hadithNumFilter) filter.hadithNumber = hadithNumFilter;
    if (reference)     filter.referenceNumber = reference;

    if (source)        filter.source = { $regex: escapeRegex(source), $options: 'i' };
    if (arabic)        filter.arabicText = { $regex: escapeRegex(arabic), $options: 'i' };
    if (tamil)         filter.tamilTranslation = { $regex: escapeRegex(tamil), $options: 'i' };

    if (hasExplanation === 'true')  filter.hasDetailedExplanation = true;
    if (hasExplanation === 'false') filter.hasDetailedExplanation = false;
    if (featured === 'true')        filter.featured = true;
    if (verified === 'true')        filter.verified = true;

    // ── Search query handling ─────────────────────────────────
    let useTextScore = false;

    if (q && q.trim()) {
      const trimmed = q.trim();
      const isNumber = /^\d+$/.test(trimmed);

      if (isNumber) {
        // Priority 1: Numeric query — exact match on hadith/reference numbers
        const numberInt = parseInt(trimmed, 10);
        filter.$or = [
          { hadithNumber: trimmed },
          { hadithNumberInt: numberInt },
          { referenceNumber: trimmed }
        ];
      } else {
        // Priority 2: Text search using MongoDB $text (uses HadithTextIndex)
        filter.$text = { $search: trimmed };
        useTextScore = true;
      }
    }

    // ── Build query ───────────────────────────────────────────
    let projection = undefined;
    let sortObj;

    if (useTextScore) {
      // Include text score for relevance ranking
      projection = { score: { $meta: 'textScore' } };
      sortObj = { score: { $meta: 'textScore' } };
    } else {
      // Default numeric ordering
      sortObj = { collectionSlug: 1, bookNo: 1, hadithNumberInt: 1, hadithNumber: 1 };
    }

    const [totalResults, results] = await Promise.all([
      Hadith.countDocuments(filter),
      Hadith.find(filter, projection)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    // ── Fallback: if $text returned 0 results, try regex ─────
    if (useTextScore && totalResults === 0 && q.trim()) {
      // Remove the $text filter and switch to regex fallback
      delete filter.$text;
      const escaped = escapeRegex(q.trim());
      filter.$or = [
        { tamilTranslation: { $regex: escaped, $options: 'i' } },
        { narrator: { $regex: escaped, $options: 'i' } },
        { arabicText: { $regex: escaped, $options: 'i' } },
        { collectionName: { $regex: escaped, $options: 'i' } },
        { bookName: { $regex: escaped, $options: 'i' } },
        { chapterName: { $regex: escaped, $options: 'i' } }
      ];

      const fallbackSort = { collectionSlug: 1, bookNo: 1, hadithNumberInt: 1, hadithNumber: 1 };
      const [fallbackTotal, fallbackResults] = await Promise.all([
        Hadith.countDocuments(filter),
        Hadith.find(filter).sort(fallbackSort).skip(skip).limit(limitNum).lean()
      ]);

      return res.json({
        total: fallbackTotal,
        page: pageNum,
        totalPages: Math.ceil(fallbackTotal / limitNum),
        limit: limitNum,
        results: fallbackResults,
        searchMode: 'regex_fallback'
      });
    }

    res.json({
      total: totalResults,
      page: pageNum,
      totalPages: Math.ceil(totalResults / limitNum),
      limit: limitNum,
      results,
      searchMode: useTextScore ? 'text' : (q ? 'number' : 'browse')
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

module.exports = router;
