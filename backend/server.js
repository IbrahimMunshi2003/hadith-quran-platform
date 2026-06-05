const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

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
  } catch (e) {
    console.error('Error listing collections:', e.message);
  }
});

// Import Routes
const statsRoutes = require('./routes/stats');
const searchRoutes = require('./routes/search');
const collectionsRoutes = require('./routes/collections');
const hadithRoutes = require('./routes/hadith');
const narratorsRoutes = require('./routes/narrators');

// Mount Routes
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/hadith', hadithRoutes);
app.use('/api/narrators', narratorsRoutes);

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
