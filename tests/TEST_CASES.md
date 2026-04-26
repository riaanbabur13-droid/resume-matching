# Test Cases — JobMatch AI NLP Engine

## Sample Test Inputs & Expected Outputs

---

### Test Case 1: Strong Full-Stack Match

**Resume Snippet:**
```
5+ years Python developer. Built React dashboards, REST APIs with Node.js.
Deployed to AWS using Docker and Kubernetes. Used MongoDB, PostgreSQL.
Led a team of 3 engineers. CI/CD with GitHub Actions.
```

**Job Description:**
```
Looking for a Full-Stack Engineer with Python, React, and cloud experience.
Must know Docker, REST APIs, and MongoDB. AWS experience preferred.
Team leadership experience a plus.
```

**Expected Output:**
```json
{
  "score": 82,
  "matchedSkills": ["Python", "React", "Node.js", "AWS", "Docker", "Kubernetes", "MongoDB", "PostgreSQL", "CI/CD", "REST API"],
  "missingSkills": [],
  "semanticInsights": {
    "strongMatches": ["Python", "React", "AWS", "Docker", "MongoDB"],
    "partialMatches": [],
    "gaps": []
  },
  "analysis": "This candidate is an excellent match..."
}
```

---

### Test Case 2: Partial Match (Different Domain)

**Resume Snippet:**
```
Data Scientist with 3 years experience in Python, pandas, scikit-learn.
Built machine learning models using TensorFlow. Familiar with SQL.
Worked with Tableau for data visualisation.
```

**Job Description:**
```
Senior Frontend Developer needed with React, TypeScript, and CSS expertise.
Must know Node.js backend development, GraphQL, and Git.
Experience with CI/CD pipelines and Agile methodology.
```

**Expected Output:**
```json
{
  "score": 28,
  "matchedSkills": ["Python", "Git"],
  "missingSkills": ["React", "TypeScript", "CSS", "Node.js", "GraphQL", "CI/CD"],
  "semanticInsights": {
    "strongMatches": [],
    "partialMatches": ["Python"],
    "gaps": ["React", "TypeScript", "Node.js", "GraphQL"]
  },
  "analysis": "Based on the analysis, this candidate shows limited alignment..."
}
```

---

### Test Case 3: Junior vs Senior Role

**Resume Snippet:**
```
Junior developer, 1 year experience. Learned React and basic JavaScript.
Built a portfolio website using HTML and CSS. Familiar with Git.
Computer Science student.
```

**Job Description:**
```
We need a Principal Engineer with 10+ years experience architecting
distributed systems at scale. Deep expertise in system design,
Kubernetes, Terraform, and multiple cloud platforms required.
Must have proven leadership experience.
```

**Expected Output:**
```json
{
  "score": 15,
  "matchedSkills": ["JavaScript", "React", "HTML", "CSS", "Git"],
  "missingSkills": ["Kubernetes", "Terraform", "AWS", "GCP", "System Design", "Microservices"],
  "analysis": "Based on the analysis, this candidate shows limited alignment... Significant upskilling needed..."
}
```

---

### Test Case 4: Near-Perfect Match

**Resume Snippet:**
```
Senior ML Engineer with 7 years building production AI systems.
Python expert — TensorFlow, PyTorch, scikit-learn, pandas, NumPy.
Deployed models to AWS SageMaker. Experience with NLP, LLMs, transformers.
Docker, Kubernetes, CI/CD. Team lead managing 5 data scientists.
```

**Job Description:**
```
ML Engineer needed for AI products team. Requirements:
5+ years Python, TensorFlow or PyTorch, NLP experience, cloud ML deployment.
Knowledge of transformers and LLMs a strong plus.
Kubernetes and Docker for MLOps. Leadership experience preferred.
```

**Expected Output:**
```json
{
  "score": 94,
  "matchedSkills": ["Python", "TensorFlow", "PyTorch", "scikit-learn", "NLP", "LLM", "AWS", "Docker", "Kubernetes", "CI/CD"],
  "missingSkills": [],
  "analysis": "This candidate is an excellent match... score of 94/100..."
}
```

---

## API Test — cURL Examples

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test1234"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
# Save the token from response
```

### Upload Resume
```bash
curl -X POST http://localhost:5000/api/resume/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

### Run Analysis
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "RESUME_ID_FROM_UPLOAD",
    "jobDescription": "We need a Python developer with React and AWS experience...",
    "jobTitle": "Full-Stack Engineer",
    "company": "Test Corp"
  }'
```

### Test NLP Service Directly
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "5 years Python developer. React, Node.js, AWS, Docker.",
    "job_description": "Looking for Python developer with React and cloud experience.",
    "job_title": "Software Engineer"
  }'
```

### Health Checks
```bash
curl http://localhost:5000/health
curl http://localhost:8000/health
```
