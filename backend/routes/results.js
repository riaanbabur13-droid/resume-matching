const express = require('express');
const ScoringResult = require('../models/ScoringResult');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/results ─────────────────────────────────────────────────────────
// Returns paginated list of user's analysis history
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      ScoringResult.find({ userId: req.user._id })
        .select('-jobDescription -semanticInsights') // Lighter list view
        .populate('resumeId', 'originalName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ScoringResult.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + results.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/results/:id ─────────────────────────────────────────────────────
// Returns full result with all fields
router.get('/:id', protect, async (req, res, next) => {
  try {
    const result = await ScoringResult.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('resumeId', 'originalName wordCount');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/results/:id ──────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await ScoringResult.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ message: 'Result deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/results/stats/summary ──────────────────────────────────────────
// Dashboard statistics
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const [stats] = await ScoringResult.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgScore: { $avg: '$similarityScore' },
          maxScore: { $max: '$similarityScore' },
          minScore: { $min: '$similarityScore' },
          excellentCount: {
            $sum: { $cond: [{ $gte: ['$similarityScore', 80] }, 1, 0] },
          },
          goodCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$similarityScore', 65] },
                    { $lt: ['$similarityScore', 80] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalAnalyses: 1,
          avgScore: { $round: ['$avgScore', 1] },
          maxScore: 1,
          minScore: 1,
          excellentCount: 1,
          goodCount: 1,
        },
      },
    ]);

    const recentResults = await ScoringResult.find({ userId: req.user._id })
      .select('similarityScore scoreCategory jobTitle company createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: stats || {
        totalAnalyses: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        excellentCount: 0,
        goodCount: 0,
      },
      recentResults,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
