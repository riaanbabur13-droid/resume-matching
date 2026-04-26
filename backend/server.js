require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const analyzeRoutes = require('./routes/analyze');
const resultsRoutes = require('./routes/results');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://resume-matching-six.vercel.app"
  ],
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later.' },
});

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// ─── Static Files (uploads) ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/results', resultsRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JobMatch AI Backend',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 JobMatch AI Backend running on port ${PORT}`);
  console.log(`📡 NLP Service expected at: ${process.env.NLP_SERVICE_URL}`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
