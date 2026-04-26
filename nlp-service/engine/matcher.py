"""
Hybrid Intelligent Matching Engine
====================================
The core of the JobMatch AI NLP system.

Pipeline:
  Step 1: Text Preprocessing & Cleaning
  Step 2: Skill Extraction (rule-based + spaCy)
  Step 3: Semantic Expansion
  Step 4: Hybrid Scoring (SBERT + Skill Overlap + Experience)
  Step 5: LLM-Style Reasoning & Explanation
  Step 6: Structured Output Generation

Scoring Formula:
  Final Score = (Semantic × 0.40) + (Skill × 0.40) + (Experience × 0.20)
"""

import logging
import math
from typing import List, Set, Dict, Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .preprocessor import TextPreprocessor
from .skill_extractor import SkillExtractor, SKILL_TAXONOMY
from .reasoner import ReasoningEngine

logger = logging.getLogger("nlp-service.engine")


class HybridMatchingEngine:
    """
    Production-grade job matching engine combining:
    - Sentence-BERT semantic embeddings
    - Rule-based skill extraction
    - Experience-level analysis
    - Template-based reasoning
    """

    # Scoring weights (must sum to 1.0)
    WEIGHT_SEMANTIC = 0.25
    WEIGHT_SKILL = 0.55
    WEIGHT_EXPERIENCE = 0.20

    MODEL_VERSION = "2.0-hybrid"

    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.skill_extractor = SkillExtractor()
        self.reasoner = ReasoningEngine()
        self._sbert_model = None
        self._load_model()

    def _load_model(self):
        """Load SBERT model (lazy, with fallback to TF-IDF)."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SBERT model: all-MiniLM-L6-v2 ...")
            self._sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("✅ SBERT model loaded.")
        except Exception as e:
            logger.warning(f"⚠️  SBERT unavailable ({e}). Falling back to TF-IDF.")
            self._sbert_model = None

    def analyze(
        self, resume_text: str, job_description: str, job_title: str = ""
    ) -> Dict:
        """
        Run full hybrid analysis pipeline.
        
        Returns:
            {
                score, matchedSkills, missingSkills,
                semanticInsights, analysis, component_scores
            }
        """
        # ─── STEP 1: Preprocessing ────────────────────────────────────────────
        clean_resume = self.preprocessor.clean(resume_text)
        clean_jd = self.preprocessor.clean(job_description)

        # Sections for more targeted skill extraction
        resume_sections = self.preprocessor.extract_sections(resume_text)

        # ─── STEP 2: Skill Extraction ─────────────────────────────────────────
        resume_skills = self.skill_extractor.extract(clean_resume)
        jd_skills = self.skill_extractor.extract(clean_jd)

        # ─── STEP 3: Semantic Expansion ───────────────────────────────────────
        expanded_resume_skills = self._expand_skills(resume_skills)
        expanded_jd_skills = self._expand_skills(jd_skills)

        # ─── STEP 4A: Semantic Similarity Score ───────────────────────────────
        MAX_LEN = 800
        resume_focus = " ".join(list(resume_skills))[:300]
        resume_focus += " " + clean_resume[:500]

        resume_focus = resume_focus[:MAX_LEN]
        clean_jd = clean_jd[:MAX_LEN]
        if not resume_focus.strip():
            resume_focus = clean_resume[:1000]

        semantic_score = self._compute_semantic_score(
            self.preprocessor.normalize_for_embedding(resume_focus),
            self.preprocessor.normalize_for_embedding(clean_jd),
        )
        semantic_score = min(semantic_score, 75)

        # ─── STEP 4B: Skill Overlap Score ─────────────────────────────────────
        skill_score, matched_skills, missing_skills, partial_matches = self._compute_skill_score(
            resume_skills, jd_skills, expanded_resume_skills, expanded_jd_skills
        )

        # ─── STEP 4C: Experience/Context Score ────────────────────────────────
        resume_signals = self.skill_extractor.extract_experience_signals(clean_resume)
        jd_signals = self.skill_extractor.extract_experience_signals(clean_jd)
        experience_score = self._compute_experience_score(resume_signals, jd_signals)

        # ─── STEP 4D: Weighted Final Score ────────────────────────────────────
        final_score = (
            semantic_score * self.WEIGHT_SEMANTIC
            + skill_score * self.WEIGHT_SKILL
            + experience_score * self.WEIGHT_EXPERIENCE
        )
        missing_penalty = min(10, len(missing_skills) * 1.5)
        final_score -= missing_penalty
        stack = {s.lower() for s in list(jd_skills)[:5]}
        matched_lower = {s.lower() for s in matched_skills}
        stack_matches = len(stack & matched_lower)
        if stack_matches >= 3:
            final_score += 15
        elif stack_matches >= 2:
            final_score += 10

        final_score = max(0.0, min(100.0, final_score))

        component_scores = {
            "semantic": round(semantic_score, 1),
            "skill": round(skill_score, 1),
            "experience": round(experience_score, 1),
        }

        # ─── STEP 5: Reasoning & Explanation ──────────────────────────────────
        analysis = self.reasoner.generate_analysis(
            score=final_score,
            matched_skills=list(matched_skills),
            missing_skills=list(missing_skills),
            resume_signals=resume_signals,
            job_signals=jd_signals,
            component_scores=component_scores,
        )

        semantic_insights = self.reasoner.generate_semantic_insights(
            matched_skills=list(matched_skills),
            missing_skills=list(missing_skills),
            partial_matches=list(partial_matches),
        )

        # ─── STEP 6: Return Structured Output ─────────────────────────────────
        return {
            "score": round(final_score, 1),
            "matchedSkills": sorted(list(matched_skills)),
            "missingSkills": sorted(list(missing_skills)),
            "semanticInsights": semantic_insights,
            "analysis": analysis,
            "component_scores": component_scores,
        }

    # ─── Semantic Similarity ──────────────────────────────────────────────────

    def _compute_semantic_score(self, resume_text: str, jd_text: str) -> float:
        """Compute semantic similarity using SBERT or TF-IDF fallback."""
        if self._sbert_model:
            return self._sbert_similarity(resume_text, jd_text)
        return self._tfidf_similarity(resume_text, jd_text)

    def _sbert_similarity(self, text_a: str, text_b: str) -> float:
        """
        SBERT cosine similarity.
        Scores are in [-1, 1] range, we map to [0, 100].
        """
        try:
            embeddings = self._sbert_model.encode(
                [text_a, text_b],
                convert_to_numpy=True,
                normalize_embeddings=True,
            )
            sim = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
            # Map from [-1,1] to [0,100] — in practice most scores are [0,1]
            return max(0.0, min(100.0, sim * 100))
        except Exception as e:
            logger.warning(f"SBERT encoding failed: {e}. Using TF-IDF.")
            return self._tfidf_similarity(text_a, text_b)

    def _tfidf_similarity(self, text_a: str, text_b: str) -> float:
        """
        TF-IDF cosine similarity fallback.
        Used when SBERT is unavailable.
        """
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                max_features=5000,
            )
            matrix = vectorizer.fit_transform([text_a, text_b])
            sim = float(cosine_similarity(matrix[0], matrix[1])[0][0])
            return max(0.0, min(100.0, sim * 100))
        except Exception as e:
            logger.error(f"TF-IDF also failed: {e}")
            return 0.0

    # ─── Skill Scoring ────────────────────────────────────────────────────────

    def _expand_skills(self, skills: Set[str]) -> Set[str]:
        """
        Expand a skill set with related terms from taxonomy.
        E.g., "React" → {"React", "frontend", "JavaScript", "JSX", ...}
        """
        expanded = set(skills)
        for skill in skills:
            related = self.skill_extractor.expand_skill(skill)
            expanded.update([r.lower() for r in related])
        return expanded

    def _compute_skill_score(
        self,
        resume_skills: Set[str],
        jd_skills: Set[str],
        expanded_resume: Set[str],
        expanded_jd: Set[str],
    ) -> Tuple[float, Set[str], Set[str], Set[str]]:
        """
        Compute skill overlap score with:
        - Direct matches (full weight)
        - Expanded/semantic matches (partial weight)
        
        Returns: (score, matched_skills, missing_skills, partial_matches)
        """
        if not jd_skills:
            # No skills found in JD — use text-based heuristic
            return 50.0, resume_skills, set(), set()

        # Direct skill matches
        direct_matches: Set[str] = resume_skills & jd_skills

        # Expanded partial matches (resume expanded ∩ JD required)
        resume_expanded_lower = {s.lower() for s in expanded_resume}
        jd_skills_lower = {s.lower() for s in jd_skills}

        partial_candidates = set()
        for jd_skill in jd_skills:
            if jd_skill not in direct_matches:
                # Check if resume expansion covers this JD skill concept
                jd_related = set(self.skill_extractor.expand_skill(jd_skill))
                jd_related_lower = {r.lower() for r in jd_related}
                if jd_related_lower & resume_expanded_lower:
                    partial_candidates.add(jd_skill)

        # Missing skills (in JD but not in resume or partial)
        missing_skills: Set[str] = jd_skills - direct_matches - partial_candidates

        # Weighted score
        n_jd = len(jd_skills)
        direct_weight = 1.0
        partial_weight = 0.3  # Partial/semantic match counts half

        weighted_matched = len(direct_matches) * direct_weight + len(partial_candidates) * partial_weight
        base_score = (weighted_matched / n_jd) * 100
        if len(direct_matches) >= 3:
            base_score += 10
        skill_score = min(100.0, base_score)

        # Boost if candidate has more skills than required (breadth bonus)
        if len(resume_skills) > len(jd_skills) and skill_score > 60:
            breadth_bonus = min(5.0, (len(resume_skills) - len(jd_skills)) * 0.5)
            skill_score = min(100.0, skill_score + breadth_bonus)

        return skill_score, direct_matches, missing_skills, partial_candidates

    # ─── Experience Scoring ───────────────────────────────────────────────────

    def _compute_experience_score(self, resume_signals: Dict, jd_signals: Dict) -> float:
        """
        Score experience alignment between resume and JD.
        Considers years of experience and seniority level matching.
        """
        score = 40.0  # Neutral baseline

        resume_years = resume_signals.get("years_experience")
        resume_seniority = resume_signals.get("seniority_score", 1)
        jd_seniority = jd_signals.get("seniority_score", 2)

        # Seniority match
        seniority_diff = abs(resume_seniority - jd_seniority)
        if seniority_diff == 0:
            score += 25.0  # Perfect match
        elif seniority_diff == 1:
            score += 10.0  # Close match
        elif seniority_diff >= 2:
            score -= 10.0  # Significant mismatch

        # Years of experience bonus
        if resume_years is not None:
            if resume_years >= 5:
                score += 20.0
            elif resume_years >= 3:
                score += 12.0
            elif resume_years >= 1:
                score += 5.0

        # Management experience (bonus if JD seems senior)
        if resume_signals.get("has_management") and jd_seniority >= 3:
            score += 10.0

        return max(0.0, min(100.0, score))
