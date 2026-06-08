const express = require('express');
const router = express.Router();
const HadithScienceArticle = require('../models/HadithScienceArticle');

// GET all articles
router.get('/', async (req, res) => {
  try {
    const articles = await HadithScienceArticle.find().select('title slug tags category createdAt').sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Server error fetching articles' });
  }
});

// GET single article by slug
router.get('/:slug', async (req, res) => {
  try {
    const article = await HadithScienceArticle.findOne({ slug: req.params.slug });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Server error fetching article' });
  }
});

module.exports = router;
