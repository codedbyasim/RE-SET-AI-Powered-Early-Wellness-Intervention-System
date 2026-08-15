import logging
from typing import Dict, Any
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

def get_client() -> OpenAI:
    return OpenAI(
        base_url=settings.AIML_API_BASE_URL,
        api_key=settings.AIML_API_KEY
    )

def evaluate_reflection_feedback(
    prior_checkin: Dict[str, Any],
    current_checkin: Dict[str, Any],
    completed_intervention: Dict[str, Any]
) -> Dict[str, Any]:
    prior_stress = prior_checkin.get("stress", 6)
    curr_stress = current_checkin.get("stress", 5)
    prior_sleep = prior_checkin.get("sleep_hours", 6.0)
    curr_sleep = current_checkin.get("sleep_hours", 7.0)
    prior_mood = prior_checkin.get("mood", 3)
    curr_mood = current_checkin.get("mood", 4)

    stress_delta = curr_stress - prior_stress
    sleep_delta = curr_sleep - prior_sleep
    mood_delta = curr_mood - prior_mood

    score = 0
    if stress_delta < 0:
        score += 1
    elif stress_delta > 0:
        score -= 1

    if sleep_delta > 0.5:
        score += 1
    elif sleep_delta < -0.5:
        score -= 1

    if mood_delta > 0:
        score += 1
    elif mood_delta < 0:
        score -= 1

    if score >= 1:
        outcome = "improved"
    elif score <= -1:
        outcome = "worsened"
    else:
        outcome = "no_change"

    prompt = f"""You are the RE:SET Reflection Agent.
Compare the student's wellness signals before and after completing a RESET intervention:
- Completed Action: "{completed_intervention.get('title', 'RESET Routine')}"
- Stress Change: from {prior_stress}/10 to {curr_stress}/10
- Sleep Change: from {prior_sleep}h to {curr_sleep}h
- Mood Change: from {prior_mood}/5 to {curr_mood}/5
- Outcome: {outcome}

Generate 1-2 supportive sentences observing how this routine correlated with their numbers.
IMPORTANT: State this as an observation of correlation, NOT an absolute medical cause or guarantee.
Respond in fluent English in under 30 words.
"""
    try:
        client = get_client()
        res = client.chat.completions.create(
            model=settings.AIML_MODEL,
            messages=[
                {"role": "system", "content": "You provide calm, observational reflection feedback in English."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=80,
            temperature=0.3
        )
        takeaway = res.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Reflection Agent LLM error: {e}")
        if outcome == "improved":
            takeaway = "Your recent RESET session correlated with lower stress and improved rest."
        else:
            takeaway = "Your recovery signals are steady. Consistent micro-habits help sustain daily balance."

    return {
        "outcome": outcome,
        "takeaway": takeaway,
        "stress_delta": stress_delta,
        "sleep_delta": sleep_delta
    }
