# 🧠 JobMatch AI — Intelligent Resume–Job Matching System

A full-stack, microservices-based intelligent job matching system using semantic analysis, skill extraction, and LLM-style reasoning.

> **Final Year Dissertation Project** — AI-Powered Job Fit Evaluator

---

## 🏗️ Architecture Overview

```
User Browser
    │
    ▼
┌─────────────────────┐
│  Frontend (Next.js) │  :3000
│  React + Tailwind   │
└────────┬────────────┘
         │ REST API
         ▼
┌─────────────────────┐
│  Backend (Express)  │  :5000
│  Node.js + JWT      │
└──────┬──────────────┘
       │              │
       ▼              ▼
┌──────────┐  ┌──────────────────┐
│ MongoDB  │  │ NLP Microservice │  :8000
│ Database │  │  Python + Flask  │
└──────────┘  └──────────────────┘
```

---

## 📁 Project Structure

```
job-match-ai/
├── frontend/          # Next.js 14 App Router
├── backend/           # Node.js + Express API
├── nlp-service/       # Python Flask NLP Engine
├── database/          # MongoDB schemas & seed data
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

---

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd job-match-ai
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm install
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 3. NLP Microservice Setup

```bash
cd nlp-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm

python app.py
```

NLP service runs at: `http://localhost:8000`

---

### 4. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with backend URL

npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🌐 API Reference

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/resume/upload` | Upload resume (PDF/TXT) |
| POST | `/api/analyze` | Run job match analysis |
| GET | `/api/results` | Get user's result history |
| GET | `/api/results/:id` | Get specific result |

### NLP Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Run full NLP analysis |
| GET | `/health` | Health check |

---

## 🧠 NLP Hybrid Scoring Model

```
Final Score = (Semantic Score × 0.25) + (Skill Score × 0.55) + (Experience Score × 0.20)
```

Components:
- **Semantic Score**: SBERT sentence embeddings (cosine similarity)
- **Skill Score**: Extracted skill overlap with semantic expansion
- **Experience Score**: Context/role relevance scoring

---

## 🧪 Sample Test

**Resume snippet:**
> "5 years Python developer. Built React dashboards. Used MongoDB, Docker, REST APIs."

**Job Description:**
> "Looking for a full-stack engineer with Python, React, and cloud experience."

**Expected Output:**
```json
{
  "score": 78,
  "matchedSkills": ["Python", "React", "MongoDB", "REST APIs"],
  "missingSkills": ["Cloud (AWS/GCP/Azure)", "Docker Orchestration"],
  "analysis": "Strong match on core technical stack..."
}
```

---

## 📄 Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jobmatch
JWT_SECRET=your_super_secret_key
NLP_SERVICE_URL=http://localhost:8000
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
