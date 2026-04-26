const mongoose = require('mongoose');

const scoringResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [50, 'Job description must be at least 50 characters'],
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },

    // ─── Core Scores ──────────────────────────────────────────────────────────
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    semanticScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    skillScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    experienceScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // ─── Skill Analysis ───────────────────────────────────────────────────────
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },

    // ─── Semantic Insights ────────────────────────────────────────────────────
    semanticInsights: {
      strongMatches: { type: [String], default: [] },
      partialMatches: { type: [String], default: [] },
      gaps: { type: [String], default: [] },
    },

    // ─── Human-Readable Explanation ───────────────────────────────────────────
    analysis: {
      type: String,
      required: true,
    },

    // ─── Score Category ───────────────────────────────────────────────────────
    scoreCategory: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    },

    // ─── Processing Metadata ──────────────────────────────────────────────────
    processingTimeMs: Number,
    nlpModelVersion: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
scoringResultSchema.index({ userId: 1, createdAt: -1 });
scoringResultSchema.index({ userId: 1, similarityScore: -1 });

// Pre-save: derive score category
scoringResultSchema.pre('save', function (next) {
  const score = this.similarityScore;
  if (score >= 80) this.scoreCategory = 'Excellent';
  else if (score >= 65) this.scoreCategory = 'Good';
  else if (score >= 45) this.scoreCategory = 'Fair';
  else this.scoreCategory = 'Poor';
  next();
});

module.exports = mongoose.model('ScoringResult', scoringResultSchema);
