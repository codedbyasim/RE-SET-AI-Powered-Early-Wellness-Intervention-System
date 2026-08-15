import logging
import json
from typing import Dict, Any, List
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "want to die", "self harm", "cutting myself",
    "no reason to live", "better off dead"
]

CRISIS_RESOURCES = [
    {
        "name": "Umang Pakistan (24/7 Mental Health Helpline)",
        "contact": "0311-7786264 (0311-77UMANG) / 0317-4288665",
        "description": "Free, confidential 24/7 tele-counseling support."
    },
    {
        "name": "Rozan Helpline (Emotional & Psychological Support)",
        "contact": "0800-22444 / 0303-4442288",
        "description": "Toll-free psychological first aid and active listening support."
    },
    {
        "name": "Talk2Me Youth Crisis Support",
        "contact": "+92 333 1234567 / support@talk2me.pk",
        "description": "Student-focused emotional resilience and counseling service."
    },
    {
        "name": "International Crisis Network (Global / 988)",
        "contact": "Dial 988 (USA/Canada) or visit https://findahelpline.com",
        "description": "Worldwide confidential crisis counseling and immediate human support."
    }
]

def get_client() -> OpenAI:
    return OpenAI(
        base_url=settings.AIML_API_BASE_URL,
        api_key=settings.AIML_API_KEY
    )

def screen_free_text_safety(text: str) -> Dict[str, Any]:
    if not text or len(text.strip()) == 0:
        return {
            "is_crisis": False,
            "message": None,
            "resources": []
        }

    lower_text = text.lower()

    for kw in CRISIS_KEYWORDS:
        if kw in lower_text:
            logger.warning(f"Safety Agent Keyword Triggered on term: {kw}")
            return {
                "is_crisis": True,
                "message": "We noticed you may be experiencing severe distress. Please know you are not alone, and there are caring professionals ready to support you right now.",
                "resources": CRISIS_RESOURCES
            }

    try:
        client = get_client()
        prompt = f"""You are a specialized Safety Classifier for a student wellness application.
Analyze the following student note and determine if it indicates acute crisis, suicide ideation, explicit self-harm risk, or severe psychological emergency.

Student Note: "{text}"

Respond STRICTLY with valid JSON in this exact format:
{{
  "is_crisis": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "short explanation"
}}
"""
        response = client.chat.completions.create(
            model=settings.AIML_MODEL,
            messages=[
                {"role": "system", "content": "You are a crisis safety classifier. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=150
        )
        content = response.choices[0].message.content.strip()
        data = json.loads(content)

        if data.get("is_crisis") is True:
            logger.warning("Safety Agent LLM flagged crisis content.")
            return {
                "is_crisis": True,
                "message": "Your wellbeing is the highest priority. If you are feeling overwhelmed, please connect with someone who can help right now.",
                "resources": CRISIS_RESOURCES
            }
    except Exception as e:
        logger.error(f"Error in Safety Agent LLM classification: {e}")

    return {
        "is_crisis": False,
        "message": None,
        "resources": []
    }
