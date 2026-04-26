"""
JobMatch AI — NLP Microservice
Flask API exposing the Hybrid Intelligent Matching Engine.
"""

import time
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

from engine.matcher import HybridMatchingEngine

load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("nlp-service")

# ─── Flask App ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins="*")

# ─── Initialize Engine (once at startup) ──────────────────────────────────────
logger.info("🚀 Initializing Hybrid Matching Engine...")
engine = HybridMatchingEngine()
logger.info("✅ Engine ready.")

MODEL_VERSION = "2.0-hybrid"


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "JobMatch AI NLP Service",
        "model_version": MODEL_VERSION,
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    POST /analyze
    Body: { resume_text, job_description, job_title? }
    Returns full analysis result.
    """
    start = time.time()

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    resume_text = data.get("resume_text", "").strip()
    job_description = data.get("job_description", "").strip()
    job_title = data.get("job_title", "").strip()

    # Basic validation
    if not resume_text or len(resume_text) < 30:
        return jsonify({"error": "resume_text is required and must be meaningful"}), 400
    if not job_description or len(job_description) < 30:
        return jsonify({"error": "job_description is required and must be meaningful"}), 400

    try:
        result = engine.analyze(
            resume_text=resume_text,
            job_description=job_description,
            job_title=job_title,
        )

        elapsed_ms = int((time.time() - start) * 1000)
        logger.info(
            f"Analysis complete — score={result['score']} "
            f"matched={len(result['matchedSkills'])} "
            f"missing={len(result['missingSkills'])} "
            f"time={elapsed_ms}ms"
        )

        result["model_version"] = MODEL_VERSION
        result["processing_time_ms"] = elapsed_ms
        return jsonify(result), 200

    except Exception as e:
        logger.exception("Analysis failed")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    logger.info(f"🌐 NLP Service listening on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
