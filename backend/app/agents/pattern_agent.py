import logging
from typing import Dict, Any, List
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

def get_client() -> OpenAI:
    return OpenAI(
        base_url=settings.AIML_API_BASE_URL,
        api_key=settings.AIML_API_KEY
    )

def generate_pattern_summary(
    deltas: Dict[str, Any],
    recent_signals: List[Dict[str, Any]]
) -> str:
    """
    Generates a concise, non-clinical pattern summary in English.
    """
    if not deltas.get("has_sufficient_history"):
        return "Initial check-in logged. Multi-day patterns will become clearer after 2-3 daily logs."

    sleep_d = deltas.get("sleep_delta_pct", 0.0)
    stress_d = deltas.get("stress_delta_pct", 0.0)
    screen_d = deltas.get("screen_delta_pct", 0.0)
    state = deltas.get("state", "STABLE")

    prompt = f"""You are the RE:SET Pattern Agent.
Summarize the student's recent multi-day behavioral trend in 1-2 concise, empathetic sentences in English.

Data Signals:
- Sleep Delta: {sleep_d}%
- Stress Delta: {stress_d}%
- Screen Time Delta: {screen_d}%
- Current State: {state}

CRITICAL RULES:
1. NEVER use medical or psychiatric diagnostic terms (do NOT say depression, anxiety disorder, insomnia, pathology).
2. Frame as observational lifestyle patterns (e.g. "We noticed your sleep dipped recently while study stress climbed").
3. Respond in fluent English in under 35 words.
"""
    try:
        client = get_client()
        res = client.chat.completions.create(
            model=settings.AIML_MODEL,
            messages=[
                {"role": "system", "content": "You are a student wellness pattern agent. Respond with non-clinical, empathetic observations in English."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.3
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Pattern Agent LLM error: {e}")
        if sleep_d < -10 and stress_d > 10:
            return f"Sleep has decreased by {abs(sleep_d):.0f}% while stress has climbed over the last few days."
        return "Your daily routine signals are currently relatively stable."
