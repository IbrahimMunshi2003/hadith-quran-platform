const mongoose = require('mongoose');

const HadithSchema = new mongoose.Schema({
  hadithNumber: {
    type: String,
    required: true,
    index: true
  },
  hadithNumberInt: {
    type: Number,
    index: true
  },
  collectionSlug: {
    type: String,
    required: true,
    index: true
  },
  collectionName: {
    type: String,
    required: true
  },
  arabicText: {
    type: String,
    default: ''
  },
  tamilTranslation: {
    type: String,
    default: ''
  },
  bookName: {
    type: String,
    default: ''
  },
  chapterName: {
    type: String,
    default: ''
  },
  grade: {
    type: String,
    default: ''
  },
  gradeSlug: {
    type: String,
    index: true,
    default: 'other'
  },
  narrator: {
    type: String,
    index: true,
    default: ''
  },
  originalUrl: {
    type: String,
    default: ''
  },
  detailedExplanationUrl: {
    type: String,
    default: ''
  },
  detailedExplanationTitle: {
    type: String,
    default: ''
  },
  hasDetailedExplanation: {
    type: Boolean,
    default: false,
    index: true
  },
  wpPostId: {
    type: Number,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for unique hadith in collection
HadithSchema.index({ collectionSlug: 1, hadithNumber: 1 });
HadithSchema.index({ collectionSlug: 1, hadithNumberInt: 1 });

// Text search index
HadithSchema.index({
  arabicText: 'text',
  tamilTranslation: 'text',
  narrator: 'text'
}, {
  weights: {
    tamilTranslation: 10,
    narrator: 5,
    arabicText: 2
  },
  name: 'HadithTextIndex',
  default_language: 'none' // Disable stemming language rules to avoid breaking Tamil search
});

module.exports = mongoose.model('Hadith', HadithSchema, 'hadiths');
