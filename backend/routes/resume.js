const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Multer Storage Config ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, // 5MB
});

// ─── Helper: Extract Text From File ──────────────────────────────────────────
const extractText = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  throw new Error('Unsupported file type');
};

// ─── POST /api/resume/upload ─────────────────────────────────────────────────
router.post('/upload', protect, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, path: filePath, size, mimetype } = req.file;

    // Extract text content
    let extractedText;
    try {
      extractedText = await extractText(filePath, mimetype);
    } catch (extractErr) {
      // Clean up uploaded file on extraction error
      fs.unlinkSync(filePath);
      return res.status(422).json({ error: `Failed to extract text: ${extractErr.message}` });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      fs.unlinkSync(filePath);
      return res.status(422).json({ error: 'Resume appears to be empty or unreadable' });
    }

    // Save to DB
    const resume = await Resume.create({
      userId: req.user._id,
      filename,
      originalName: originalname,
      filePath,
      fileSize: size,
      mimeType: mimetype,
      extractedText: extractedText.trim(),
      wordCount: extractedText.trim().split(/\s+/).length,
    });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        originalName: resume.originalName,
        fileSize: resume.fileSize,
        wordCount: resume.wordCount,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// ─── GET /api/resume ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id, isActive: true })
      .select('-extractedText -filePath')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ resumes });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/resume/:id ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    }).select('-filePath');

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/resume/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Soft delete
    resume.isActive = false;
    await resume.save();

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── Multer Error Handling ────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
