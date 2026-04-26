"""
Skill Extractor Module
Extracts skills, tools, roles, and technologies from text using:
1. Rule-based matching against a curated skill taxonomy
2. spaCy NLP for entity recognition
3. Semantic expansion for related concepts
"""

import re
from typing import Set, List, Dict, Tuple

# ─── Comprehensive Skill Taxonomy ─────────────────────────────────────────────
SKILL_TAXONOMY: Dict[str, Dict] = {
    # ─── Programming Languages ────────────────────────────────────────────────
    "Python": {"category": "language", "aliases": ["py", "python3"], "related": ["data science", "ML", "automation"]},
    "JavaScript": {"category": "language", "aliases": ["js", "es6", "es2015", "ecmascript"], "related": ["frontend", "web", "node"]},
    "TypeScript": {"category": "language", "aliases": ["ts"], "related": ["javascript", "frontend"]},
    "Java": {"category": "language", "aliases": [], "related": ["spring", "backend", "enterprise"]},
    "C++": {"category": "language", "aliases": ["cpp", "c plus plus"], "related": ["systems", "performance"]},
    "C#": {"category": "language", "aliases": ["csharp", "c sharp", "dotnet"], "related": [".NET", "microsoft"]},
    "Go": {"category": "language", "aliases": ["golang"], "related": ["backend", "microservices"]},
    "Rust": {"category": "language", "aliases": [], "related": ["systems", "performance", "memory-safe"]},
    "Ruby": {"category": "language", "aliases": ["rb"], "related": ["rails", "web"]},
    "PHP": {"category": "language", "aliases": [], "related": ["web", "laravel"]},
    "Swift": {"category": "language", "aliases": [], "related": ["iOS", "mobile", "apple"]},
    "Kotlin": {"category": "language", "aliases": [], "related": ["android", "mobile", "JVM"]},
    "R": {"category": "language", "aliases": ["r-lang", "r programming"], "related": ["statistics", "data analysis"]},
    "Scala": {"category": "language", "aliases": [], "related": ["spark", "functional", "JVM"]},

    # ─── Frontend Frameworks ──────────────────────────────────────────────────
    "React": {"category": "frontend", "aliases": ["react.js", "reactjs", "react js"], "related": ["javascript", "JSX", "frontend", "SPA"]},
    "Angular": {"category": "frontend", "aliases": ["angularjs", "angular.js"], "related": ["typescript", "frontend"]},
    "Vue.js": {"category": "frontend", "aliases": ["vue", "vuejs", "vue js"], "related": ["javascript", "frontend"]},
    "Next.js": {"category": "frontend", "aliases": ["nextjs", "next js"], "related": ["React", "SSR", "frontend"]},
    "Svelte": {"category": "frontend", "aliases": [], "related": ["javascript", "frontend"]},
    "Redux": {"category": "frontend", "aliases": ["redux toolkit", "RTK"], "related": ["react", "state management"]},
    "Tailwind CSS": {"category": "frontend", "aliases": ["tailwind", "tailwindcss"], "related": ["CSS", "frontend"]},
    "HTML": {"category": "frontend", "aliases": ["html5"], "related": ["frontend", "web"]},
    "CSS": {"category": "frontend", "aliases": ["css3", "scss", "sass", "less"], "related": ["frontend", "styling"]},

    # ─── Backend Frameworks ───────────────────────────────────────────────────
    "Node.js": {"category": "backend", "aliases": ["node", "nodejs"], "related": ["javascript", "backend", "express"]},
    "Express": {"category": "backend", "aliases": ["express.js", "expressjs"], "related": ["node", "REST", "backend"]},
    "Django": {"category": "backend", "aliases": [], "related": ["python", "backend", "web framework"]},
    "Flask": {"category": "backend", "aliases": [], "related": ["python", "backend", "microservice"]},
    "FastAPI": {"category": "backend", "aliases": [], "related": ["python", "REST", "async"]},
    "Spring Boot": {"category": "backend", "aliases": ["spring", "springboot"], "related": ["java", "backend", "enterprise"]},
    "Laravel": {"category": "backend", "aliases": [], "related": ["php", "backend"]},
    "Rails": {"category": "backend", "aliases": ["ruby on rails"], "related": ["ruby", "backend"]},
    "NestJS": {"category": "backend", "aliases": ["nest.js"], "related": ["node", "typescript", "backend"]},
    ".NET": {"category": "backend", "aliases": ["dotnet", "asp.net", "aspnet"], "related": ["c#", "microsoft", "backend"]},

    # ─── Databases ────────────────────────────────────────────────────────────
    "MongoDB": {"category": "database", "aliases": ["mongo"], "related": ["NoSQL", "document store", "atlas"]},
    "PostgreSQL": {"category": "database", "aliases": ["postgres", "psql"], "related": ["SQL", "relational", "RDBMS"]},
    "MySQL": {"category": "database", "aliases": [], "related": ["SQL", "relational"]},
    "Redis": {"category": "database", "aliases": [], "related": ["cache", "in-memory", "pub-sub"]},
    "Elasticsearch": {"category": "database", "aliases": ["elastic", "ES"], "related": ["search", "analytics"]},
    "Cassandra": {"category": "database", "aliases": [], "related": ["NoSQL", "distributed"]},
    "SQLite": {"category": "database", "aliases": [], "related": ["SQL", "embedded"]},
    "DynamoDB": {"category": "database", "aliases": ["dynamo"], "related": ["AWS", "NoSQL", "serverless"]},
    "Firebase": {"category": "database", "aliases": [], "related": ["Google", "realtime", "NoSQL"]},
    "Supabase": {"category": "database", "aliases": [], "related": ["postgres", "BaaS"]},

    # ─── Cloud & DevOps ───────────────────────────────────────────────────────
    "AWS": {"category": "cloud", "aliases": ["amazon web services", "amazon aws"], "related": ["cloud", "EC2", "S3", "Lambda"]},
    "GCP": {"category": "cloud", "aliases": ["google cloud", "google cloud platform"], "related": ["cloud", "GKE", "BigQuery"]},
    "Azure": {"category": "cloud", "aliases": ["microsoft azure"], "related": ["cloud", "microsoft"]},
    "Docker": {"category": "devops", "aliases": ["dockerfile"], "related": ["containers", "containerization", "DevOps"]},
    "Kubernetes": {"category": "devops", "aliases": ["k8s", "kube"], "related": ["orchestration", "containers", "DevOps"]},
    "Terraform": {"category": "devops", "aliases": ["tf"], "related": ["IaC", "infrastructure", "DevOps"]},
    "CI/CD": {"category": "devops", "aliases": ["cicd", "continuous integration", "continuous deployment", "github actions", "jenkins", "gitlab ci"], "related": ["DevOps", "automation", "pipeline"]},
    "Linux": {"category": "devops", "aliases": ["unix", "ubuntu", "centos", "bash"], "related": ["server", "sysadmin"]},
    "Nginx": {"category": "devops", "aliases": [], "related": ["web server", "reverse proxy"]},

    # ─── AI/ML ────────────────────────────────────────────────────────────────
    "Machine Learning": {"category": "ml", "aliases": ["ML", "ml algorithms"], "related": ["AI", "data science", "sklearn"]},
    "Deep Learning": {"category": "ml", "aliases": ["DL", "neural networks"], "related": ["ML", "AI", "PyTorch", "TensorFlow"]},
    "TensorFlow": {"category": "ml", "aliases": ["tf"], "related": ["deep learning", "ML", "python"]},
    "PyTorch": {"category": "ml", "aliases": [], "related": ["deep learning", "ML", "python"]},
    "scikit-learn": {"category": "ml", "aliases": ["sklearn"], "related": ["ML", "python"]},
    "NLP": {"category": "ml", "aliases": ["natural language processing", "text processing"], "related": ["ML", "transformers", "BERT"]},
    "Computer Vision": {"category": "ml", "aliases": ["CV", "image processing"], "related": ["ML", "OpenCV"]},
    "LLM": {"category": "ml", "aliases": ["large language model", "GPT", "ChatGPT", "LLMs"], "related": ["NLP", "AI", "transformers"]},
    "Pandas": {"category": "ml", "aliases": [], "related": ["python", "data analysis", "dataframes"]},
    "NumPy": {"category": "ml", "aliases": ["numpy"], "related": ["python", "data science", "scientific computing"]},

    # ─── Architecture & Concepts ──────────────────────────────────────────────
    "REST API": {"category": "concept", "aliases": ["rest", "restful", "RESTful API", "rest apis"], "related": ["HTTP", "API", "web services"]},
    "GraphQL": {"category": "concept", "aliases": [], "related": ["API", "query language"]},
    "Microservices": {"category": "concept", "aliases": ["microservice", "micro-services"], "related": ["architecture", "SOA", "distributed"]},
    "Agile": {"category": "methodology", "aliases": ["scrum", "kanban", "sprint"], "related": ["project management", "teamwork"]},
    "Git": {"category": "tool", "aliases": ["github", "gitlab", "bitbucket", "version control"], "related": ["DevOps", "collaboration"]},
    "Testing": {"category": "concept", "aliases": ["unit testing", "integration testing", "TDD", "BDD", "jest", "pytest", "mocha"], "related": ["quality", "QA"]},
    "System Design": {"category": "concept", "aliases": ["software architecture", "system architecture"], "related": ["scalability", "distributed systems"]},

    # ─── Tools ────────────────────────────────────────────────────────────────
    "Jira": {"category": "tool", "aliases": [], "related": ["project management", "agile"]},
    "Figma": {"category": "tool", "aliases": [], "related": ["UI/UX", "design"]},
    "Tableau": {"category": "tool", "aliases": [], "related": ["data visualization", "BI"]},
    "Power BI": {"category": "tool", "aliases": ["powerbi"], "related": ["data visualization", "microsoft", "BI"]},
}

# ─── Experience Patterns ──────────────────────────────────────────────────────
EXPERIENCE_PATTERNS = [
    r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)",
    r"(?:senior|sr\.|lead|principal|staff|junior|jr\.)\s+(?:developer|engineer|architect|analyst|scientist)",
    r"(?:managed|led|architected|designed|built|developed|created|implemented)\s+",
    r"(?:team\s+(?:lead|leader|of)|leading\s+a\s+team)",
    r"(?:startup|enterprise|fortune\s*500|mid-size)",
]

SENIORITY_KEYWORDS = {
    "senior": 3, "lead": 3, "principal": 4, "staff": 3, "architect": 4,
    "junior": 1, "entry": 1, "mid": 2, "manager": 3, "director": 4,
}


class SkillExtractor:
    """
    Extracts skills from resume/JD text using:
    - Rule-based matching (regex + string matching)
    - spaCy NER for additional entities
    - Alias normalization
    """

    def __init__(self):
        self._nlp = None
        self._skill_patterns = self._build_patterns()

    @property
    def nlp(self):
        """Lazy-load spaCy model."""
        if self._nlp is None:
            try:
                import spacy
                self._nlp = spacy.load("en_core_web_sm")
            except Exception:
                self._nlp = False  # Mark as unavailable
        return self._nlp if self._nlp else None

    def _build_patterns(self) -> List[Tuple[str, str]]:
        """Build list of (canonical_name, regex_pattern) tuples."""
        patterns = []
        for skill_name, info in SKILL_TAXONOMY.items():
            all_names = [skill_name] + info.get("aliases", [])
            for name in all_names:
                escaped = re.escape(name)
                # Word boundary match, case-insensitive
                pattern = rf"(?<![a-zA-Z0-9]){escaped}(?![a-zA-Z0-9])"
                patterns.append((skill_name, pattern))
        return patterns

    def extract(self, text: str) -> Set[str]:
        """Extract canonical skill names from text."""
        found: Set[str] = set()
        text_lower = text.lower()

        for canonical, pattern in self._skill_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                found.add(canonical)

        # Additional NER extraction (if spaCy available)
        if self.nlp:
            doc = self.nlp(text[:10000])  # Limit for performance
            for ent in doc.ents:
                if ent.label_ in ("ORG", "PRODUCT", "WORK_OF_ART"):
                    ent_text = ent.text.strip()
                    # Check if it matches any known skill
                    for skill_name in SKILL_TAXONOMY:
                        if ent_text.lower() == skill_name.lower():
                            found.add(skill_name)

        return found

    def extract_experience_signals(self, text: str) -> Dict:
        """Extract experience-related signals from text."""
        signals = {
            "years_experience": None,
            "seniority_level": None,
            "seniority_score": 1,  # 1=junior, 2=mid, 3=senior, 4=lead
            "has_management": False,
        }

        # Years of experience
        for pattern in EXPERIENCE_PATTERNS[:1]:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                signals["years_experience"] = int(match.group(1))
                break

        # Seniority
        text_lower = text.lower()
        for keyword, score in SENIORITY_KEYWORDS.items():
            if keyword in text_lower:
                if score > signals["seniority_score"]:
                    signals["seniority_score"] = score
                    signals["seniority_level"] = keyword

        # Management
        management_terms = ["managed", "led a team", "team lead", "team of", "mentored", "supervised"]
        signals["has_management"] = any(t in text_lower for t in management_terms)

        return signals

    def get_skill_info(self, skill_name: str) -> Dict:
        """Get taxonomy info for a skill."""
        return SKILL_TAXONOMY.get(skill_name, {"category": "unknown", "aliases": [], "related": []})

    def expand_skill(self, skill_name: str) -> List[str]:
        """Return semantically related skills for a given skill."""
        info = SKILL_TAXONOMY.get(skill_name, {})
        return info.get("related", [])
