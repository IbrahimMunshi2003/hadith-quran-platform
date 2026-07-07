const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');
const Hadith = require('../models/Hadith');
const HadithHistory = require('../models/HadithHistory');
const { requireAdmin } = require('../middleware/adminAuth');
const { parseHadithNumberInt, normalizeString, normalizeStringArray, escapeRegex } = require('../utils/hadithNumber');

const router = express.Router();

router.use(requireAdmin);

const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const baseName = path.basename(file.originalname || 'image', ext).replace(/[^a-zA-Z0-9_-]/g, '-');
    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    return cb(null, true);
  }
});

const HTML_SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'img', 'br', 'hr', 'span', 'div'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    span: ['dir'],
    div: ['dir']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'data'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' })
  }
};

function sanitizeDescription(value) {
  return sanitizeHtml(String(value || ''), HTML_SANITIZE_OPTIONS);
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function validatePayload(payload, isCreate = false) {
  const required = {
    arabicText: normalizeString(payload.arabicText),
    tamilTranslation: normalizeString(payload.tamilTranslation),
    hadithNumber: normalizeString(payload.hadithNumber),
    collectionSlug: normalizeString(payload.collectionSlug),
    bookName: normalizeString(payload.bookName)
  };

  const errors = [];
  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      errors.push(`${key} is required.`);
    }
  });

  if (isCreate && !normalizeString(payload.collectionName)) {
    errors.push('collectionName is required.');
  }

  return errors;
}

function buildUpdateObject(payload, existing = {}) {
  return {
    hadithNumber: normalizeString(payload.hadithNumber || existing.hadithNumber),
    hadithNumberInt: parseHadithNumberInt(payload.hadithNumber || existing.hadithNumber),
    referenceNumber: normalizeString(payload.referenceNumber ?? existing.referenceNumber),
    collectionSlug: normalizeString(payload.collectionSlug || existing.collectionSlug),
    collectionName: normalizeString(payload.collectionName || existing.collectionName),
    bookNo: normalizeString(payload.bookNo ?? existing.bookNo),
    bookName: normalizeString(payload.bookName || existing.bookName),
    chapterNo: normalizeString(payload.chapterNo ?? existing.chapterNo),
    chapterName: normalizeString(payload.chapterName ?? existing.chapterName),
    arabicText: normalizeString(payload.arabicText || existing.arabicText),
    tamilTranslation: normalizeString(payload.tamilTranslation || existing.tamilTranslation),
    grade: normalizeString(payload.grade ?? existing.grade),
    gradeArabic: normalizeString(payload.gradeArabic ?? existing.gradeArabic),
    gradeTamil: normalizeString(payload.gradeTamil ?? existing.gradeTamil),
    gradeSlug: normalizeString(payload.gradeSlug ?? existing.gradeSlug ?? 'other'),
    narrator: normalizeString(payload.narrator ?? existing.narrator),
    originalUrl: normalizeString(payload.originalUrl ?? existing.originalUrl),
    detailedExplanationUrl: normalizeString(payload.explanationUrl ?? payload.detailedExplanationUrl ?? existing.detailedExplanationUrl),
    detailedExplanation: normalizeString(payload.detailedExplanation ?? existing.detailedExplanation),
    description: sanitizeDescription(payload.description ?? existing.description),
    source: normalizeString(payload.source ?? existing.source),
    tags: normalizeStringArray(payload.tags ?? existing.tags),
    keywords: normalizeStringArray(payload.keywords ?? existing.keywords),
    relatedHadithIds: normalizeStringArray(payload.relatedHadithIds ?? existing.relatedHadithIds),
    isFallback: toBoolean(payload.isFallback, existing.isFallback),
    published: toBoolean(payload.published, existing.published ?? true),
    featured: toBoolean(payload.featured, existing.featured),
    verified: toBoolean(payload.verified, existing.verified),
    isDeleted: toBoolean(payload.isDeleted, existing.isDeleted)
  };
}

function getChangedFields(previousData, newData) {
  const changedFields = [];
  Object.keys(newData).forEach((field) => {
    const oldValue = previousData[field];
    const nextValue = newData[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(nextValue)) {
      changedFields.push({ field, previousValue: oldValue, newValue: nextValue });
    }
  });
  return changedFields;
}

async function assertNoDuplicate(doc, ignoreId = null) {
  const query = {
    collectionSlug: doc.collectionSlug,
    bookNo: doc.bookNo || '',
    hadithNumber: doc.hadithNumber,
    isDeleted: false
  };

  if (ignoreId) {
    query._id = { $ne: ignoreId };
  }

  const duplicate = await Hadith.findOne(query).select('_id hadithNumber collectionSlug bookNo');
  if (duplicate) {
    const error = new Error('Duplicate hadith detected for collectionSlug + bookNo + hadithNumber.');
    error.statusCode = 409;
    throw error;
  }
}

function baseListQuery(reqQuery) {
  const query = {};

  if (toBoolean(reqQuery.includeDeleted)) {
  if (reqQuery.isDeleted !== undefined) {
    query.isDeleted = toBoolean(reqQuery.isDeleted);
  }
} else {
  query.$or = [
    { isDeleted: false },
    { isDeleted: { $exists: false } }
  ];
}

  const eqFields = ['collectionSlug', 'bookNo', 'gradeSlug', 'source'];
  eqFields.forEach((field) => {
    const value = normalizeString(reqQuery[field]);
    if (value) {
      query[field] = value;
    }
  });

  const regexFields = {
    arabic: 'arabicText',
    tamil: 'tamilTranslation',
    narrator: 'narrator',
    reference: 'referenceNumber',
    hadithNumber: 'hadithNumber',
    book: 'bookName'
  };

  Object.entries(regexFields).forEach(([filterKey, field]) => {
    const value = normalizeString(reqQuery[filterKey]);
    if (value) {
      query[field] = { $regex: escapeRegex(value), $options: 'i' };
    }
  });

  if (reqQuery.published !== undefined) {
    query.published = toBoolean(reqQuery.published);
  }
  if (reqQuery.verified !== undefined) {
    query.verified = toBoolean(reqQuery.verified);
  }

  const q = normalizeString(reqQuery.q);
  if (q) {
    const exactNumber = /^\d+$/.test(q);
    query.$or = [
      { collectionName: { $regex: escapeRegex(q), $options: 'i' } },
      { bookName: { $regex: escapeRegex(q), $options: 'i' } },
      { chapterName: { $regex: escapeRegex(q), $options: 'i' } },
      { narrator: { $regex: escapeRegex(q), $options: 'i' } },
      { source: { $regex: escapeRegex(q), $options: 'i' } },
      { referenceNumber: { $regex: escapeRegex(q), $options: 'i' } },
      { arabicText: { $regex: escapeRegex(q), $options: 'i' } },
      { tamilTranslation: { $regex: escapeRegex(q), $options: 'i' } }
    ];
    if (exactNumber) {
      query.$or.unshift({ hadithNumber: q });
      query.$or.unshift({ hadithNumberInt: parseInt(q, 10) });
    } else {
      query.$or.push({ hadithNumber: { $regex: escapeRegex(q), $options: 'i' } });
    }
  }

  return query;
}

router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
    const skip = (page - 1) * limit;

    const query = baseListQuery(req.query);

    const sortBy = normalizeString(req.query.sortBy) || 'hadithNumber';
    const order = normalizeString(req.query.sortOrder).toLowerCase() === 'desc' ? -1 : 1;

    const sortMap = {
      collection: { collectionSlug: order, bookNo: order, hadithNumberInt: order, hadithNumber: order },
      book: { bookNo: order, hadithNumberInt: order, hadithNumber: order },
      hadithNumber: { hadithNumberInt: order, hadithNumber: order },
      grade: { gradeSlug: order, hadithNumberInt: 1 },
      source: { source: order, hadithNumberInt: 1 },
      updatedAt: { updatedAt: order, hadithNumberInt: 1 }
    };

    const sort = sortMap[sortBy] || sortMap.hadithNumber;

    const [items, total] = await Promise.all([
      Hadith.find(query).sort(sort).skip(skip).limit(limit),
      Hadith.countDocuments(query)
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Admin hadith list error:', error);
    return res.status(500).json({ error: 'Failed to fetch hadith list.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hadith = await Hadith.findById(req.params.id);
    if (!hadith) {
      return res.status(404).json({ error: 'Hadith not found.' });
    }

    const currentInt = parseHadithNumberInt(hadith.hadithNumberInt ?? hadith.hadithNumber);

    const baseNav = {
      collectionSlug: hadith.collectionSlug,
      bookNo: hadith.bookNo,
      isDeleted: false
    };

    const [prev, next] = await Promise.all([
      Hadith.findOne({
        ...baseNav,
        $or: [
          { hadithNumberInt: { $lt: currentInt } },
          { hadithNumberInt: currentInt, hadithNumber: { $lt: hadith.hadithNumber } }
        ]
      })
        .sort({ hadithNumberInt: -1, hadithNumber: -1 })
        .select('_id collectionSlug hadithNumber'),
      Hadith.findOne({
        ...baseNav,
        $or: [
          { hadithNumberInt: { $gt: currentInt } },
          { hadithNumberInt: currentInt, hadithNumber: { $gt: hadith.hadithNumber } }
        ]
      })
        .sort({ hadithNumberInt: 1, hadithNumber: 1 })
        .select('_id collectionSlug hadithNumber')
    ]);

    return res.json({ hadith, prev, next });
  } catch (error) {
    console.error('Admin hadith detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch hadith detail.' });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const history = await HadithHistory.find({ hadithId: req.params.id }).sort({ createdAt: -1 });
    return res.json({ history });
  } catch (error) {
    console.error('Admin hadith history error:', error);
    return res.status(500).json({ error: 'Failed to fetch hadith history.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const validationErrors = validatePayload(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(' ') });
    }

    const data = buildUpdateObject(req.body);
    await assertNoDuplicate(data);

    const created = await Hadith.create(data);

    await HadithHistory.create({
      hadithId: created._id,
      action: 'create',
      editor: {
        id: req.admin.id,
        username: req.admin.username
      },
      changedFields: Object.keys(data).map((field) => ({ field, previousValue: null, newValue: data[field] })),
      previousData: null,
      newData: created.toObject()
    });

    return res.status(201).json({ hadith: created });
  } catch (error) {
    console.error('Admin create hadith error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create hadith.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await Hadith.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Hadith not found.' });
    }

    const validationErrors = validatePayload({ ...existing.toObject(), ...req.body });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(' ') });
    }

    const updateData = buildUpdateObject(req.body, existing.toObject());
    await assertNoDuplicate(updateData, existing._id);

    const previousData = existing.toObject();
    Object.assign(existing, updateData);
    await existing.save();

    const changedFields = getChangedFields(previousData, updateData);
    if (changedFields.length > 0) {
      await HadithHistory.create({
        hadithId: existing._id,
        action: 'update',
        editor: {
          id: req.admin.id,
          username: req.admin.username
        },
        changedFields,
        previousData,
        newData: existing.toObject()
      });
    }

    return res.json({ hadith: existing });
  } catch (error) {
    console.error('Admin update hadith error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update hadith.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const hadith = await Hadith.findById(req.params.id);
    if (!hadith) {
      return res.status(404).json({ error: 'Hadith not found.' });
    }

    if (hadith.isDeleted) {
      return res.status(400).json({ error: 'Hadith is already deleted.' });
    }

    const previousData = hadith.toObject();
    hadith.isDeleted = true;
    hadith.deletedAt = new Date();
    hadith.deletedBy = req.admin.username;
    await hadith.save();

    await HadithHistory.create({
      hadithId: hadith._id,
      action: 'delete',
      editor: {
        id: req.admin.id,
        username: req.admin.username
      },
      changedFields: [
        { field: 'isDeleted', previousValue: false, newValue: true },
        { field: 'deletedAt', previousValue: null, newValue: hadith.deletedAt },
        { field: 'deletedBy', previousValue: '', newValue: hadith.deletedBy }
      ],
      previousData,
      newData: hadith.toObject()
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Admin delete hadith error:', error);
    return res.status(500).json({ error: 'Failed to delete hadith.' });
  }
});

router.post('/:id/history/:historyId/restore', async (req, res) => {
  try {
    const [hadith, historyEntry] = await Promise.all([
      Hadith.findById(req.params.id),
      HadithHistory.findOne({ _id: req.params.historyId, hadithId: req.params.id })
    ]);

    if (!hadith) {
      return res.status(404).json({ error: 'Hadith not found.' });
    }

    if (!historyEntry || !historyEntry.newData) {
      return res.status(404).json({ error: 'History version not found.' });
    }

    const restoreData = buildUpdateObject(historyEntry.newData, hadith.toObject());
    await assertNoDuplicate(restoreData, hadith._id);

    const previousData = hadith.toObject();
    Object.assign(hadith, restoreData, { isDeleted: false, deletedAt: null, deletedBy: '' });
    await hadith.save();

    await HadithHistory.create({
      hadithId: hadith._id,
      action: 'restore',
      editor: {
        id: req.admin.id,
        username: req.admin.username
      },
      changedFields: getChangedFields(previousData, hadith.toObject()),
      previousData,
      newData: hadith.toObject()
    });

    return res.json({ hadith });
  } catch (error) {
    console.error('Admin restore hadith error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to restore hadith version.' });
  }
});

router.post('/bulk/action', async (req, res) => {
  try {
    const action = normalizeString(req.body.action);
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [];
    const value = req.body.value;

    if (ids.length === 0 && action !== 'import') {
      return res.status(400).json({ error: 'At least one valid hadith id is required.' });
    }

    let update = null;
    if (action === 'delete') {
      update = { isDeleted: true, deletedAt: new Date(), deletedBy: req.admin.username };
    } else if (action === 'publish') {
      update = { published: toBoolean(value, true) };
    } else if (action === 'verify') {
      update = { verified: toBoolean(value, true) };
    } else if (action === 'gradeUpdate') {
      update = {
        grade: normalizeString(value?.grade),
        gradeSlug: normalizeString(value?.gradeSlug || 'other')
      };
    } else if (action === 'changeSource') {
      update = { source: normalizeString(value) };
    } else if (action === 'export') {
      const docs = await Hadith.find({ _id: { $in: ids } }).lean();
      return res.json({ exported: docs, count: docs.length });
    } else if (action === 'import') {
      const records = Array.isArray(req.body.records) ? req.body.records : [];
      if (records.length === 0) {
        return res.status(400).json({ error: 'records array is required for import.' });
      }

      const operations = records.map((record) => {
        const normalized = buildUpdateObject(record);
        return {
          updateOne: {
            filter: {
              collectionSlug: normalized.collectionSlug,
              bookNo: normalized.bookNo,
              hadithNumber: normalized.hadithNumber
            },
            update: { $set: normalized },
            upsert: true
          }
        };
      });

      const result = await Hadith.bulkWrite(operations, { ordered: false });
      return res.json({
        imported: records.length,
        inserted: result.upsertedCount || 0,
        modified: result.modifiedCount || 0
      });
    }

    if (!update) {
      return res.status(400).json({ error: 'Unsupported bulk action.' });
    }

    const result = await Hadith.updateMany({ _id: { $in: ids } }, { $set: update });
    return res.json({ matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) {
    console.error('Admin bulk action error:', error);
    return res.status(500).json({ error: 'Failed to execute bulk action.' });
  }
});

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }
    const url = `/uploads/${req.file.filename}`;
    return res.status(201).json({ url });
  } catch (error) {
    console.error('Admin upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image.' });
  }
});

module.exports = router;
