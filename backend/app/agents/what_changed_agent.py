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

def synthesize_what_changed_narrative(analysis_data: Dict[str, Any]) -> str:
    if not analysis_data.get("has_sufficient_history"):
        return analysis_data.get("ai_narrative", "Insufficient history.")

    factors = analysis_data.get("factors", [])
    top_contributor = analysis_data.get("top_contributor", "")

    factors_summary = "\n".join([
        f"- {f['signal_name']}: {f['delta_display']} ({f['direction']})"
        for f in factors[:3]
    ])

    prompt = f"""You are the RE:SET 'What Changed?' Agent.
Synthesize the following comparative shifts between the current week and the student's historical baseline:

Top Contributor: {top_contributor}
Observed Shifts:
{factors_summary}

CRITICAL RULES:
1. Explain WHY the top 1-2 factors are the most likely drivers of how they feel right now.
2. DO NOT make any clinical diagnosis (no 'depression', 'insomnia disorder', etc.).
3. End with a gentle, actionable suggestion.
4. Respond in fluent English in 2-3 concise sentences (max 50 words).
"""
    try:
        client = get_client()
        res = client.chat.completions.create(
            model=settings.AIML_MODEL,
            messages=[
                {"role": "system", "content": "You explain wellness pattern shifts clearly and compassionately in English."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.3
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"What Changed Agent LLM error: {e}")
        return f"The primary shift this week was {top_contributor}. Restoring baseline rest will help stabilize your daily rhythm."
