const mongoose = require('mongoose');

const HadithScienceArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [{ type: String }],
  category: {
    type: String,
    default: 'hadis-kalai',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HadithScienceArticle', HadithScienceArticleSchema, 'hadithScienceArticles');
