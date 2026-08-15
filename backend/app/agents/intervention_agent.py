import json
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

DEFAULT_TEMPLATES = {
    "sleep_winddown": {
        "title": "18-Minute Circadian Wind-Down RESET",
        "description": "A soothing evening routine to shift your nervous system out of high-alert mode before bed.",
        "actions": [
            {
                "id": 1,
                "title": "Device Curfew & Warm Lighting",
                "duration_mins": 5,
                "icon": "moon",
                "description": "Dock your phone across the room, switch to night mode, and dim your ambient room lighting."
            },
            {
                "id": 2,
                "title": "Chamomile Infusion / Hydration",
                "duration_mins": 5,
                "icon": "coffee",
                "description": "Sip warm water or herbal caffeine-free tea slowly without looking at notifications or lecture slides."
            },
            {
                "id": 3,
                "title": "4-7-8 Parasympathetic Breathing",
                "duration_mins": 8,
                "icon": "wind",
                "description": "Inhale through your nose for 4 seconds, hold for 7, exhale smoothly for 8. Repeat 4-6 deliberate cycles."
            }
        ],
        "reflection_prompt": "What is one small task you can comfortably let go of until tomorrow morning?"
    },
    "cognitive_decompression": {
        "title": "20-Minute Cognitive Decompression RESET",
        "description": "A targeted break to clear mental fog, release exam pressure, and reset focus.",
        "actions": [
            {
                "id": 1,
                "title": "Paper Brain-Dump & Priority Filter",
                "duration_mins": 6,
                "icon": "edit-3",
                "description": "Jot down every unfinished thought or deadline on paper to immediately free working memory."
            },
            {
                "id": 2,
                "title": "Trapezius & Cervical Spine Stretch",
                "duration_mins": 6,
                "icon": "activity",
                "description": "Roll shoulders backward, tilt ear to shoulder gently, and unclench your jaw tension."
            },
            {
                "id": 3,
                "title": "Open-Air Horizon Gazing",
                "duration_mins": 8,
                "icon": "sun",
                "description": "Step to a window or balcony, gaze into the distance to relieve optic nerve strain."
            }
        ],
        "reflection_prompt": "What took the most cognitive energy from you today?"
    },
    "somatic_reset": {
        "title": "15-Minute Somatic Mobility RESET",
        "description": "Gentle full-body movement to restore circulation after prolonged sitting.",
        "actions": [
            {
                "id": 1,
                "title": "Standing Spine & Hamstring Roll",
                "duration_mins": 5,
                "icon": "activity",
                "description": "Stand tall, bend knees slightly, and slowly roll down vertebrae by vertebrae."
            },
            {
                "id": 2,
                "title": "Electrolyte Hydration & Fresh Air",
                "duration_mins": 4,
                "icon": "zap",
                "description": "Drink a tall glass of cool water and take 5 deep diaphragm breaths in open air."
            },
            {
                "id": 3,
                "title": "Pacing & Sensory Grounding (5-4-3-2-1)",
                "duration_mins": 6,
                "icon": "wind",
                "description": "Walk at a relaxed pace and identify 5 physical objects around you to reset spatial awareness."
            }
        ],
        "reflection_prompt": "How does your physical body feel right now compared to earlier today?"
    }
}

def generate_reset_plan(
    category: str,
    dominant_signals: List[str],
    user_context: Dict[str, Any]
) -> Dict[str, Any]:
    prompt = f"""You are the RE:SET Intervention Agent for students.
Create a personalized 15-20 minute micro-recovery plan ("Today's RESET").

Category: {category}
Signals Observed: {', '.join(dominant_signals)}
User Context: {json.dumps(user_context)}

CRITICAL REQUIREMENTS:
1. Provide exactly 3 micro-actions, each taking between 4 to 8 minutes (total <= 20 mins).
2. For each action, pick an icon from: 'moon', 'wind', 'coffee', 'activity', 'edit-3', 'sun', 'zap', 'headphones'.
3. Always include 1 thoughtful reflection prompt at the end.
4. Respond in fluent English.
5. Do NOT make any medical or diagnostic claims.
6. Return STRICT valid JSON format:
{{
  "title": "Short title",
  "description": "1-sentence overview",
  "actions": [
    {{
      "id": 1,
      "title": "Action Title",
      "duration_mins": 5,
      "icon": "moon",
      "description": "Concrete step instruction."
    }},
    {{
      "id": 2,
      "title": "Action Title",
      "duration_mins": 7,
      "icon": "activity",
      "description": "Concrete step instruction."
    }},
    {{
      "id": 3,
      "title": "Action Title",
      "duration_mins": 6,
      "icon": "wind",
      "description": "Concrete step instruction."
    }}
  ],
  "reflection_prompt": "Question prompt here"
}}
"""
    try:
        client = get_client()
        res = client.chat.completions.create(
            model=settings.AIML_MODEL,
            messages=[
                {"role": "system", "content": "You generate structured micro-recovery action plans for students in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=600
        )
        content = res.choices[0].message.content.strip()
        data = json.loads(content)
        if "actions" in data and len(data["actions"]) >= 2 and "reflection_prompt" in data:
            return data
    except Exception as e:
        logger.error(f"Intervention Agent LLM generation error: {e}")

    cat_key = category if category in DEFAULT_TEMPLATES else "cognitive_decompression"
    return DEFAULT_TEMPLATES[cat_key]
