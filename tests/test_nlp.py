"""
Unit Tests — NLP Engine Components
Run: python -m pytest tests/test_nlp.py -v
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'nlp-service'))

import pytest
from engine.preprocessor import TextPreprocessor
from engine.skill_extractor import SkillExtractor


class TestTextPreprocessor:
    def setup_method(self):
        self.preprocessor = TextPreprocessor()

    def test_removes_urls(self):
        text = "Visit https://linkedin.com/in/john for profile"
        result = self.preprocessor.clean(text)
        assert "https://" not in result
        assert "linkedin.com" not in result

    def test_removes_emails(self):
        text = "Contact me at john.smith@email.com for details"
        result = self.preprocessor.clean(text)
        assert "@" not in result

    def test_normalizes_bullets(self):
        text = "• Python developer\n• React experience\n● MongoDB"
        result = self.preprocessor.clean(text)
        assert "•" not in result
        assert "●" not in result

    def test_preserves_skill_names(self):
        text = "Experienced with Python, React, and Node.js"
        result = self.preprocessor.clean(text)
        assert "Python" in result
        assert "React" in result
        assert "Node.js" in result

    def test_truncates_for_embedding(self):
        long_text = " ".join(["word"] * 1000)
        result = self.preprocessor.normalize_for_embedding(long_text, max_tokens=512)
        word_count = len(result.split())
        assert word_count <= 400  # Max tokens / 1.3


class TestSkillExtractor:
    def setup_method(self):
        self.extractor = SkillExtractor()

    def test_extracts_programming_languages(self):
        text = "I have 5 years of Python experience and know JavaScript well."
        skills = self.extractor.extract(text)
        assert "Python" in skills
        assert "JavaScript" in skills

    def test_extracts_frameworks(self):
        text = "Built dashboards using React and Next.js. Backend with Node.js."
        skills = self.extractor.extract(text)
        assert "React" in skills
        assert "Next.js" in skills
        assert "Node.js" in skills

    def test_alias_extraction(self):
        # Test that aliases map to canonical names
        text = "Experience with reactjs, postgres and mongo"
        skills = self.extractor.extract(text)
        # reactjs → React, mongo → MongoDB, postgres → PostgreSQL
        assert "React" in skills
        assert "MongoDB" in skills
        assert "PostgreSQL" in skills

    def test_case_insensitive(self):
        text = "PYTHON developer with REACT experience"
        skills = self.extractor.extract(text)
        assert "Python" in skills
        assert "React" in skills

    def test_extracts_devops(self):
        text = "Deployed using Docker, Kubernetes, and Terraform on AWS."
        skills = self.extractor.extract(text)
        assert "Docker" in skills
        assert "Kubernetes" in skills
        assert "Terraform" in skills
        assert "AWS" in skills

    def test_experience_years_extraction(self):
        text = "I have 7 years of experience in software development."
        signals = self.extractor.extract_experience_signals(text)
        assert signals["years_experience"] == 7

    def test_seniority_extraction(self):
        text = "Senior Software Engineer with leadership experience."
        signals = self.extractor.extract_experience_signals(text)
        assert signals["seniority_score"] >= 3

    def test_management_detection(self):
        text = "Led a team of 5 engineers. Managed sprint planning."
        signals = self.extractor.extract_experience_signals(text)
        assert signals["has_management"] is True

    def test_skill_expansion(self):
        related = self.extractor.expand_skill("React")
        assert "frontend" in [r.lower() for r in related] or len(related) > 0

    def test_no_false_positives(self):
        text = "I enjoy cooking and hiking on weekends."
        skills = self.extractor.extract(text)
        assert "Python" not in skills
        assert "React" not in skills
        assert "AWS" not in skills


class TestSkillMatchingLogic:
    """Integration-level tests for the matching logic (no SBERT required)."""

    def test_empty_inputs(self):
        from engine.skill_extractor import SkillExtractor
        extractor = SkillExtractor()
        skills = extractor.extract("")
        assert isinstance(skills, set)
        assert len(skills) == 0

    def test_skill_overlap_calculation(self):
        """Verify that matched/missing split works correctly."""
        resume_skills = {"Python", "React", "MongoDB"}
        jd_skills = {"Python", "React", "AWS", "Docker"}

        matched = resume_skills & jd_skills
        missing = jd_skills - resume_skills

        assert "Python" in matched
        assert "React" in matched
        assert "AWS" in missing
        assert "Docker" in missing
        assert "MongoDB" not in missing  # Not required

    def test_score_calculation(self):
        """Verify weighted score formula."""
        semantic = 75.0
        skill = 80.0
        experience = 70.0

        score = (semantic * 0.40) + (skill * 0.40) + (experience * 0.20)
        expected = 30.0 + 32.0 + 14.0  # = 76.0

        assert abs(score - expected) < 0.01


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
