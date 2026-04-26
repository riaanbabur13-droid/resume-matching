const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Resume = require('../models/Resume');
const ScoringResult = require('../models/ScoringResult');
const { protect } = require('../middleware/auth');

const router = express.Router();

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';
const NLP_TIMEOUT = 30000; // 30 seconds
console.log("NLP URL:", NLP_SERVICE_URL);

// ─── POST /api/analyze ───────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('resumeId').notEmpty().withMessage('Resume ID is required'),
    body('jobDescription')
      .trim()
      .isLength({ min: 50 })
      .withMessage('Job description must be at least 50 characters'),
    body('jobTitle').optional().trim(),
    body('company').optional().trim(),
  ],
  async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Validate
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { resumeId, jobDescription, jobTitle, company } = req.body;

      // Fetch resume (verify ownership)
      const resume = await Resume.findOne({
        _id: resumeId,
        userId: req.user._id,
        isActive: true,
      });

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found or access denied' });
      }

      // ─── Call NLP Microservice ─────────────────────────────────────────────
      let nlpResult;
      try {
        const nlpResponse = await axios.post(
          `${NLP_SERVICE_URL}/analyze`,
          {
            resume_text: resume.extractedText,
            job_description: jobDescription,
            job_title: jobTitle || '',
          },
          {
            timeout: NLP_TIMEOUT,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        nlpResult = nlpResponse.data;
      } catch (nlpError) {
        if (nlpError.code === 'ECONNREFUSED') {
          return res.status(503).json({
            error: 'NLP service is unavailable. Please ensure the Python service is running.',
          });
        }
        if (nlpError.code === 'ECONNABORTED') {
          return res.status(504).json({ error: 'NLP analysis timed out. Please try again.' });
        }
        throw nlpError;
      }

      const processingTime = Date.now() - startTime;

      // ─── Save Result to DB ─────────────────────────────────────────────────
      const scoringResult = await ScoringResult.create({
        userId: req.user._id,
        resumeId: resume._id,
        jobDescription,
        jobTitle,
        company,
        similarityScore: Math.round(nlpResult.score),
        semanticScore: Math.round(nlpResult.component_scores?.semantic ?? 0),
        skillScore: Math.round(nlpResult.component_scores?.skill ?? 0),
        experienceScore: Math.round(nlpResult.component_scores?.experience ?? 0),
        matchedSkills: nlpResult.matchedSkills || [],
        missingSkills: nlpResult.missingSkills || [],
        semanticInsights: nlpResult.semanticInsights || {
          strongMatches: [],
          partialMatches: [],
          gaps: [],
        },
        analysis: nlpResult.analysis || '',
        processingTimeMs: processingTime,
        nlpModelVersion: nlpResult.model_version || '1.0',
      });

      res.status(201).json({
        message: 'Analysis complete',
        result: {
          id: scoringResult._id,
          score: scoringResult.similarityScore,
          scoreCategory: scoringResult.scoreCategory,
          matchedSkills: scoringResult.matchedSkills,
          missingSkills: scoringResult.missingSkills,
          semanticInsights: scoringResult.semanticInsights,
          analysis: scoringResult.analysis,
          componentScores: {
            semantic: scoringResult.semanticScore,
            skill: scoringResult.skillScore,
            experience: scoringResult.experienceScore,
          },
          jobTitle: scoringResult.jobTitle,
          company: scoringResult.company,
          processingTimeMs: processingTime,
          createdAt: scoringResult.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
