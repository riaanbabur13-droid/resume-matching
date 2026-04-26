/**
 * JobMatch AI — MongoDB Schema Reference & Seed Script
 *
 * Run: node seed.js
 * (Requires MONGODB_URI in .env or environment)
 */

require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmatch';

// ─── Inline Schema Definitions (mirrors backend models) ──────────────────────

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: String,
  originalName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  extractedText: String,
  wordCount: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const scoringResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  jobDescription: String,
  jobTitle: String,
  company: String,
  similarityScore: Number,
  semanticScore: Number,
  skillScore: Number,
  experienceScore: Number,
  matchedSkills: [String],
  missingSkills: [String],
  semanticInsights: {
    strongMatches: [String],
    partialMatches: [String],
    gaps: [String],
  },
  analysis: String,
  scoreCategory: String,
  processingTimeMs: Number,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Resume = mongoose.model('Resume', resumeSchema);
const ScoringResult = mongoose.model('ScoringResult', scoringResultSchema);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const DEMO_RESUME_TEXT = `
John Smith
Senior Software Engineer
john.smith@email.com | linkedin.com/in/johnsmith

SUMMARY
Experienced full-stack developer with 6 years building scalable web applications.
Strong background in Python, React, and cloud infrastructure. Led a team of 4 engineers.

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frontend: React, Next.js, Redux, Tailwind CSS, HTML, CSS
Backend: Node.js, Express, FastAPI, Django
Databases: MongoDB, PostgreSQL, Redis
Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD, GitHub Actions
Other: REST API, GraphQL, Microservices, Agile, Git, Testing, Jest, Pytest

EXPERIENCE
Senior Software Engineer — TechCorp (2021–Present)
- Led development of React-based SaaS dashboard used by 10,000+ users
- Architected microservices backend using Python/FastAPI and MongoDB
- Deployed to AWS using Docker and Kubernetes; reduced costs 30%
- Managed a team of 4 junior developers

Software Engineer — StartupXYZ (2019–2021)
- Built REST APIs with Node.js and Express
- Implemented PostgreSQL databases with complex query optimization
- Integrated CI/CD pipeline with GitHub Actions

EDUCATION
B.Sc. Computer Science — University of Manchester (2019)
`;

const DEMO_JD = `
We are looking for a Senior Full-Stack Engineer to join our growing team.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in React and TypeScript for frontend development
- Backend experience with Python (FastAPI or Django) or Node.js
- Database experience with PostgreSQL and MongoDB
- Experience with cloud platforms (AWS preferred)
- Familiarity with Docker and containerisation
- Understanding of CI/CD pipelines
- Experience with REST APIs and microservices architecture
- Strong communication skills and ability to work in Agile teams
- Leadership experience or mentoring junior developers is a plus

Nice to have:
- Kubernetes experience
- GraphQL knowledge
- Redis experience
`;

async function seed() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.');

  // Clear existing demo data
  await User.deleteMany({ email: 'demo@jobmatch.ai' });

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@jobmatch.ai',
    password: hashedPassword,
    role: 'user',
  });
  console.log(`👤 Created demo user: ${user.email}`);

  // Create demo resume
  const resume = await Resume.create({
    userId: user._id,
    filename: 'demo-resume.txt',
    originalName: 'John_Smith_Resume.txt',
    filePath: './uploads/demo-resume.txt',
    fileSize: Buffer.byteLength(DEMO_RESUME_TEXT),
    mimeType: 'text/plain',
    extractedText: DEMO_RESUME_TEXT.trim(),
    wordCount: DEMO_RESUME_TEXT.trim().split(/\s+/).length,
    isActive: true,
  });
  console.log(`📄 Created demo resume: ${resume.originalName}`);

  // Create demo scoring result
  const result = await ScoringResult.create({
    userId: user._id,
    resumeId: resume._id,
    jobDescription: DEMO_JD.trim(),
    jobTitle: 'Senior Full-Stack Engineer',
    company: 'Demo Company Ltd',
    similarityScore: 84,
    semanticScore: 81,
    skillScore: 87,
    experienceScore: 82,
    matchedSkills: ['Python', 'React', 'TypeScript', 'Node.js', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'REST API', 'Microservices', 'GraphQL', 'Redux', 'Next.js'],
    missingSkills: ['Redis'],
    semanticInsights: {
      strongMatches: [
        'Python — directly relevant to role requirements',
        'React — directly relevant to role requirements',
        'AWS — directly relevant to role requirements',
        'Docker — directly relevant to role requirements',
        'Microservices — directly relevant to role requirements',
      ],
      partialMatches: ['Redis'],
      gaps: ['Redis — required by role, not evidenced in resume'],
    },
    analysis: 'This candidate is an excellent match for the role, achieving a compatibility score of 84/100. The resume demonstrates strong alignment with 15 of the key requirements. Key strengths include proficiency in Python, React, TypeScript, Node.js and 11 other skills. These directly address the core technical requirements of the role. Semantic analysis indicates very high contextual alignment — the candidate\'s background description closely mirrors the job\'s language and domain. The candidate\'s experience profile aligns well with what the role demands. The resume indicates approximately 6 years of experience at a senior level. The primary gaps are in: Redis. These are not dealbreakers but developing these areas would further strengthen the candidacy. Recommendation: Strongly consider for interview — this profile is a compelling match.',
    scoreCategory: 'Excellent',
    processingTimeMs: 1847,
    nlpModelVersion: '2.0-hybrid',
  });
  console.log(`📊 Created demo result: score=${result.similarityScore}`);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────');
  console.log('Demo credentials:');
  console.log('  Email:    demo@jobmatch.ai');
  console.log('  Password: demo1234');
  console.log('─────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
