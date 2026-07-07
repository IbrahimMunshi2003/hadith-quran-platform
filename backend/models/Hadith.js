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
  referenceNumber: {
    type: String,
    default: ''
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
  bookNo: {
    type: String,
    default: '',
    index: true
  },
  chapterName: {
    type: String,
    default: ''
  },
  chapterNo: {
    type: String,
    default: ''
  },
  grade: {
    type: String,
    default: ''
  },
  gradeArabic: {
    type: String,
    default: ''
  },
  gradeTamil: {
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
  detailedExplanation: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  keywords: {
    type: [String],
    default: []
  },
  relatedHadithIds: {
    type: [String],
    default: []
  },
  isFallback: {
    type: Boolean,
    default: false,
    index: true
  },
  published: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
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
HadithSchema.index({ collectionSlug: 1, bookNo: 1, hadithNumber: 1, isDeleted: 1 });

// Compound indexes for advanced filter performance
HadithSchema.index({ collectionSlug: 1, gradeSlug: 1, isDeleted: 1 });
HadithSchema.index({ narrator: 1, isDeleted: 1 });
HadithSchema.index({ bookName: 1, isDeleted: 1 });
HadithSchema.index({ chapterName: 1, isDeleted: 1 });
HadithSchema.index({ referenceNumber: 1 });

// Text search index — covers all searchable text fields with ranked weights
HadithSchema.index({
  arabicText: 'text',
  tamilTranslation: 'text',
  narrator: 'text',
  bookName: 'text',
  chapterName: 'text',
  description: 'text',
  detailedExplanation: 'text',
  keywords: 'text',
  tags: 'text'
}, {
  weights: {
    arabicText: 12,
    tamilTranslation: 10,
    narrator: 8,
    bookName: 6,
    chapterName: 5,
    description: 4,
    detailedExplanation: 3,
    keywords: 2,
    tags: 1
  },
  name: 'HadithTextIndex',
  default_language: 'none' // Disable stemming to avoid breaking Tamil/Arabic search
});

HadithSchema.pre('validate', function autoDeriveFields(next) {
  const parsed = parseInt(String(this.hadithNumber || '').trim(), 10);
  this.hadithNumberInt = Number.isFinite(parsed) ? parsed : 0;
  if (this.detailedExplanation) {
    this.hasDetailedExplanation = true;
  }
  next();
});

module.exports = mongoose.model('Hadith', HadithSchema, 'hadiths');
