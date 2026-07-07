const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

/* -------------------- CORS -------------------- */

const allowedOrigins = [
  "https://hadith-quran-platform.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

console.log("Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* -------------------- Security -------------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(mongoSanitize());

/* -------------------- Parsers -------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* -------------------- Logger -------------------- */

app.use(morgan("dev"));

/* -------------------- Static -------------------- */

app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "./uploads"))
);

/* -------------------- MongoDB -------------------- */

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

mongoose.connection.once("open", async () => {
  try {
    console.log("Database Ready");

    const Admin = require("./models/Admin");

    if ((await Admin.countDocuments()) === 0) {
      console.log("Creating default admin...");

      await Admin.create({
        username: "superadmin",
        passwordHash: "Admin@2026Secure!",
        role: "superadmin",
      });

      console.log("Default admin created.");
    }
  } catch (err) {
    console.error(err);
  }
});

/* -------------------- Routes -------------------- */

app.use("/api/stats", require("./routes/stats"));
app.use("/api/search", require("./routes/search"));
app.use("/api/collections", require("./routes/collections"));
app.use("/api/hadith", require("./routes/hadith"));
app.use("/api/narrators", require("./routes/narrators"));
app.use("/api/hadithScience", require("./routes/hadithScience"));

app.use("/api/admin/auth", require("./routes/adminAuth"));
app.use("/api/admin/hadiths", require("./routes/adminHadiths"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    dbState:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    timestamp: new Date(),
  });
});

/* -------------------- Error Handler -------------------- */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});