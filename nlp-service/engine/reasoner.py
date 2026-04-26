"""
Reasoning Engine
Generates human-readable, LLM-style explanations for match results.
Uses rule-based templates + contextual logic for coherent reasoning.
"""

from typing import List, Dict, Set


class ReasoningEngine:
    """
    Produces structured reasoning and natural-language explanations
    for job match results. Modeled on ATS/recruiter reasoning patterns.
    """

    SCORE_TIERS = {
        "excellent": (80, 100),
        "good": (65, 79),
        "fair": (45, 64),
        "poor": (0, 44),
    }

    def generate_analysis(
        self,
        score: float,
        matched_skills: List[str],
        missing_skills: List[str],
        resume_signals: Dict,
        job_signals: Dict,
        component_scores: Dict,
    ) -> str:
        """
        Generate a coherent human-readable analysis paragraph.
        """
        tier = self._get_tier(score)
        parts = []

        # ─── Opening Statement ────────────────────────────────────────────────
        opening = self._opening(score, tier, matched_skills, missing_skills)
        parts.append(opening)

        # ─── Skill Commentary ─────────────────────────────────────────────────
        if matched_skills:
            skill_comment = self._skill_commentary(matched_skills, missing_skills, tier)
            parts.append(skill_comment)

        # ─── Semantic Commentary ──────────────────────────────────────────────
        semantic_comment = self._semantic_commentary(component_scores.get("semantic", 0))
        parts.append(semantic_comment)

        # ─── Experience Commentary ────────────────────────────────────────────
        exp_comment = self._experience_commentary(
            resume_signals, job_signals, component_scores.get("experience", 0)
        )
        if exp_comment:
            parts.append(exp_comment)

        # ─── Gap Commentary ───────────────────────────────────────────────────
        if missing_skills:
            gap_comment = self._gap_commentary(missing_skills, score)
            parts.append(gap_comment)

        # ─── Recommendation ───────────────────────────────────────────────────
        recommendation = self._recommendation(tier, score)
        parts.append(recommendation)

        return " ".join(parts)

    def generate_semantic_insights(
        self,
        matched_skills: List[str],
        missing_skills: List[str],
        partial_matches: List[str],
    ) -> Dict:
        """
        Generate structured semantic insights object.
        """
        strong_matches = self._classify_strong_matches(matched_skills)
        gaps = self._classify_gaps(missing_skills)

        return {
            "strongMatches": strong_matches,
            "partialMatches": partial_matches[:5],
            "gaps": gaps,
        }

    # ─── Private Methods ──────────────────────────────────────────────────────

    def _get_tier(self, score: float) -> str:
        for tier, (low, high) in self.SCORE_TIERS.items():
            if low <= score <= high:
                return tier
        return "poor"

    def _opening(self, score: float, tier: str, matched: List, missing: List) -> str:
        score_int = int(score)
        total_checked = len(matched) + len(missing)

        if tier == "excellent":
            return (
                f"This candidate is an excellent match for the role, achieving a compatibility score "
                f"of {score_int}/100. "
                f"The resume demonstrates strong alignment with {len(matched)} of the key requirements."
            )
        elif tier == "good":
            return (
                f"This candidate shows a good level of fit for the position, with a score of {score_int}/100. "
                f"The profile aligns well with most of the core requirements, "
                f"meeting {len(matched)} out of {total_checked} identified skill areas."
            )
        elif tier == "fair":
            return (
                f"This candidate demonstrates partial compatibility with the role (score: {score_int}/100). "
                f"While {len(matched)} relevant skills were identified, "
                f"there are notable gaps that may require attention."
            )
        else:
            return (
                f"Based on the analysis, this candidate shows limited alignment with the job requirements "
                f"(score: {score_int}/100). "
                f"Only {len(matched)} of the expected skill areas were found in the resume."
            )

    def _skill_commentary(self, matched: List, missing: List, tier: str) -> str:
        if not matched:
            return "No direct skill matches were detected."

        top_matches = matched[:4]
        match_str = ", ".join(top_matches)

        if len(matched) > 4:
            match_str += f" and {len(matched) - 4} other skills"

        if tier in ("excellent", "good"):
            return (
                f"Key strengths include proficiency in {match_str}. "
                f"These directly address the core technical requirements of the role."
            )
        else:
            return (
                f"The candidate does demonstrate relevant experience in {match_str}, "
                f"which partially meets the role's requirements."
            )

    def _semantic_commentary(self, semantic_score: float) -> str:
        if semantic_score >= 75:
            return (
                "Semantic analysis indicates very high contextual alignment — "
                "the candidate's background description closely mirrors the job's language and domain."
            )
        elif semantic_score >= 55:
            return (
                "The semantic similarity analysis reveals moderate contextual overlap, "
                "suggesting the candidate works in a related domain and would need some adaptation."
            )
        elif semantic_score >= 35:
            return (
                "Semantic analysis shows limited contextual alignment between the resume and the job description, "
                "indicating different domain contexts or experience levels."
            )
        else:
            return (
                "The semantic analysis detects low overlap between the resume's described experience "
                "and the role's requirements, suggesting a significant domain or experience gap."
            )

    def _experience_commentary(self, resume_signals: Dict, job_signals: Dict, exp_score: float) -> str:
        resume_years = resume_signals.get("years_experience")
        resume_seniority = resume_signals.get("seniority_level")

        if exp_score >= 70:
            base = "The candidate's experience profile aligns well with what the role demands."
        elif exp_score >= 40:
            base = "Experience relevance is moderate — the candidate has related but not directly matching background."
        else:
            base = "Experience alignment is limited relative to the role's requirements."

        if resume_years and resume_seniority:
            return f"{base} The resume indicates approximately {resume_years} years of experience at a {resume_seniority} level."
        elif resume_years:
            return f"{base} The resume references approximately {resume_years} years of relevant experience."
        elif resume_seniority:
            return f"{base} The candidate appears to be at a {resume_seniority} level."

        return base if exp_score < 50 else ""

    def _gap_commentary(self, missing: List, score: float) -> str:
        top_missing = missing[:4]
        missing_str = ", ".join(top_missing)

        if len(missing) > 4:
            missing_str += f" and {len(missing) - 4} others"

        if score >= 65:
            return (
                f"The primary gaps are in: {missing_str}. "
                f"These are not dealbreakers but developing these areas would further strengthen the candidacy."
            )
        else:
            return (
                f"Notable skill gaps include: {missing_str}. "
                f"Addressing these through training or projects would be essential to becoming a strong candidate for this role."
            )

    def _recommendation(self, tier: str, score: float) -> str:
        if tier == "excellent":
            return "Recommendation: Strongly consider for interview — this profile is a compelling match."
        elif tier == "good":
            return "Recommendation: Suitable for further screening; likely to perform well if gaps are addressed."
        elif tier == "fair":
            return (
                "Recommendation: May be considered if the candidate can demonstrate relevant project experience "
                "in the identified gap areas during an interview."
            )
        else:
            return (
                "Recommendation: Significant upskilling or reorientation needed before this role becomes a strong fit. "
                "Consider roles that better align with current skills."
            )

    def _classify_strong_matches(self, matched: List[str]) -> List[str]:
        """Return descriptions of strong skill areas."""
        result = []
        for skill in matched[:6]:
            result.append(f"{skill} — directly relevant to role requirements")
        return result

    def _classify_gaps(self, missing: List[str]) -> List[str]:
        """Return descriptions of identified gaps."""
        result = []
        for skill in missing[:5]:
            result.append(f"{skill} — required by role, not evidenced in resume")
        return result
