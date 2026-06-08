const mongoose = require('mongoose');

const HadithExplanationSchema = new mongoose.Schema({
  collectionSlug: {
    type: String,
    required: true,
    index: true
  },
  hadithNumber: {
    type: String,
    required: true,
    index: true
  },
  gradingExplanation: {
    tamil: { type: String, default: '' },
    sourcesReferenced: [{ type: String }]
  },
  narratorAnalysis: [{
    name: { type: String },
    opinions: [{ type: String }]
  }]
}, {
  timestamps: true
});

// Compound index for finding the explanation for a specific hadith
HadithExplanationSchema.index({ collectionSlug: 1, hadithNumber: 1 }, { unique: true });

module.exports = mongoose.model('HadithExplanation', HadithExplanationSchema, 'hadithExplanations');
