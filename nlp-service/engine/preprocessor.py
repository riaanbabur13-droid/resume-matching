"""
Text Preprocessor
Cleans and normalizes resume/job description text for NLP analysis.
"""

import re
import unicodedata
from typing import Optional


class TextPreprocessor:
    """
    Handles text cleaning and normalization.
    Preserves semantic content while removing noise.
    """

    # Common resume section headers (normalize to lowercase for matching)
    SECTION_HEADERS = {
        "experience", "work experience", "professional experience", "employment",
        "education", "skills", "technical skills", "projects", "certifications",
        "summary", "objective", "profile", "publications", "awards",
    }

    def clean(self, text: str, preserve_structure: bool = False) -> str:
        """
        Clean text for NLP processing.
        
        Args:
            text: Raw input text
            preserve_structure: If True, keep paragraph breaks
        """
        if not text:
            return ""

        # Unicode normalization
        text = unicodedata.normalize("NFKD", text)
        text = text.encode("ascii", "ignore").decode("ascii")

        # Remove URLs
        text = re.sub(r"https?://\S+|www\.\S+", " ", text)

        # Remove email addresses
        text = re.sub(r"\S+@\S+\.\S+", " ", text)

        # Remove phone numbers
        text = re.sub(r"[\+\(]?[1-9][0-9\-\(\)\s]{8,}[0-9]", " ", text)

        # Normalize dashes and bullets
        text = re.sub(r"[•●◦▸▶►→\-–—]+", " ", text)

        # Remove special characters but keep key punctuation
        text = re.sub(r"[^\w\s\.\,\(\)\+\#\/]", " ", text)

        # Normalize whitespace
        if preserve_structure:
            text = re.sub(r"[ \t]+", " ", text)  # Only normalize spaces/tabs
            text = re.sub(r"\n{3,}", "\n\n", text)  # Max 2 newlines
        else:
            text = re.sub(r"\s+", " ", text)

        return text.strip()

    def normalize_for_embedding(self, text: str, max_tokens: int = 512) -> str:
        """
        Prepare text for SBERT embedding.
        Truncates to approximate token limit.
        """
        cleaned = self.clean(text)

        # Rough word-to-token ratio ≈ 1.3
        max_words = int(max_tokens / 1.3)
        words = cleaned.split()

        if len(words) > max_words:
            # Keep beginning (summary/objective) and skills section bias
            cleaned = " ".join(words[:max_words])

        return cleaned

    def extract_sections(self, text: str) -> dict:
        """
        Attempt to identify sections in resume text.
        Returns dict of {section_name: content}.
        """
        sections = {"full": text}

        # Try to find section boundaries
        lines = text.split("\n")
        current_section = "header"
        current_content = []

        for line in lines:
            line_clean = line.strip().lower()

            # Check if line is a section header
            is_header = any(
                line_clean == header or line_clean.startswith(header + ":")
                for header in self.SECTION_HEADERS
            )

            if is_header and len(line.strip()) < 50:
                # Save previous section
                if current_content:
                    sections[current_section] = " ".join(current_content)
                current_section = line_clean.replace(":", "").strip()
                current_content = []
            else:
                current_content.append(line.strip())

        # Save last section
        if current_content:
            sections[current_section] = " ".join(current_content)

        return sections

    def get_summary(self, text: str, max_sentences: int = 5) -> str:
        """Extract summary/first meaningful sentences from text."""
        cleaned = self.clean(text)
        sentences = re.split(r"(?<=[.!?])\s+", cleaned)
        # Filter short/noise sentences
        meaningful = [s for s in sentences if len(s.split()) > 5]
        return " ".join(meaningful[:max_sentences])
