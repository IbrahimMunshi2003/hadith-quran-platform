# deployment-guide
# Deployment Guide — Tamil Hadith & Quran Platform

This guide outlines steps to configure and deploy the Node.js + Express backend API and the React + Vite frontend to production environments.

---

## 1. Backend Deployment

The backend can be deployed to any cloud provider supporting Node.js (e.g., **Render**, **Railway**, or **Fly.io**).

### Required Environment Variables
Configure these variables in your host dashboard:
- `NODE_ENV` = `production`
- `PORT` = `5000` (or dynamically assigned by host)
- `MONGODB_URI` = `mongodb+srv://...` (your Atlas connection string)
- `CORS_ORIGIN` = `https://your-frontend-domain.com` (for security, restrict to your frontend)

### Deployment Steps (e.g. Render)
1. Sign in to [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Set the following options:
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (in the `backend/` subdirectory)
   - **Start Command**: `node server.js`
4. Add the environment variables under **Environment**.
5. Click **Deploy Web Service**.

---

## 2. Frontend Deployment

The frontend compiles to static assets (HTML/CSS/JS) and can be hosted on **Vercel**, **Netlify**, or **GitHub Pages**.

### Required Environment Variables
- `VITE_API_URL` = `https://your-backend-domain.render.com` (your deployed backend API URL)

### Deployment Steps (e.g. Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Connect your GitHub repository.
3. Configure the directory settings:
   - **Root Directory**: `frontend`
4. Set the following build options:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-domain.render.com`
6. Click **Deploy**.

---

## 3. MongoDB Production Setup & Indexes

Before launch, verify that MongoDB indexes are built to ensure fast queries on large datasets (100,000+ records).

Run the following indexes in MongoDB Atlas shell or check that the Mongoose model has created them:
```javascript
// Query Indexes
db.hadiths.createIndex({ "collectionSlug": 1 })
db.hadiths.createIndex({ "narrator": 1 })
db.hadiths.createIndex({ "gradeSlug": 1 })
db.hadiths.createIndex({ "hadithNumber": 1 })
db.hadiths.createIndex({ "collectionSlug": 1, "hadithNumber": 1 })

// Text Index for Search
db.hadiths.createIndex(
  {
    "arabicText": "text",
    "tamilTranslation": "text",
    "narrator": "text"
  },
  {
    "weights": {
      "tamilTranslation": 10,
      "narrator": 5,
      "arabicText": 2
    },
    "name": "HadithTextIndex",
    "default_language": "none"
  }
)
```
These indexes guarantee fast execution of text search and paging.
