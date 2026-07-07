const mongoose = require('mongoose');

const ChangedFieldSchema = new mongoose.Schema({
  field: { type: String, required: true },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const HadithHistorySchema = new mongoose.Schema({
  hadithId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Hadith'
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'restore', 'bulk-update'],
    required: true
  },
  editor: {
    id: { type: String, required: true },
    username: { type: String, required: true }
  },
  changedFields: {
    type: [ChangedFieldSchema],
    default: []
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HadithHistory', HadithHistorySchema, 'hadith_history');
