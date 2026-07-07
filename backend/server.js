const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// Middleware

const frontendOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '';
const allowedOrigins = new Set([
  frontendOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman/mobile apps/no-origin requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.log('Blocked by CORS:', origin);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(cookieParser());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('CRITICAL: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
    process.exit(1);
  });

// Debug middleware to log active collection and check model binding
mongoose.connection.once('open', async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections in database:', collections.map(c => c.name));

    const backfillResult = await mongoose.connection.db.collection('hadiths').updateMany(
      {
        $or: [
          { hadithNumberInt: { $exists: false } },
          { hadithNumberInt: null }
        ]
      },
      [
        {
          $set: {
            hadithNumberInt: {
              $convert: {
                input: '$hadithNumber',
                to: 'int',
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      ]
    );
    console.log(`Hadith numeric backfill complete. Modified: ${backfillResult.modifiedCount}`);

    // Seed default admin if none exists
    const Admin = require('./models/Admin');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('No admin users found. Seeding default superadmin...');
      const defaultAdmin = new Admin({
        username: 'superadmin',
        passwordHash: 'Admin@2026Secure!',
        role: 'superadmin'
      });
      await defaultAdmin.save();
      console.log('Default superadmin created successfully.');
    }
  } catch (e) {
    console.error('Error during startup hook:', e.message);
  }
});

// Import Routes
const statsRoutes = require('./routes/stats');
const searchRoutes = require('./routes/search');
const collectionsRoutes = require('./routes/collections');
const hadithRoutes = require('./routes/hadith');
const narratorsRoutes = require('./routes/narrators');
const hadithScienceRoutes = require('./routes/hadithScience');
const adminAuthRoutes = require('./routes/adminAuth');
const adminHadithRoutes = require('./routes/adminHadiths');

// Mount Routes
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/hadith', hadithRoutes);
app.use('/api/narrators', narratorsRoutes);
app.use('/api/hadithScience', hadithScienceRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/hadiths', adminHadithRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
