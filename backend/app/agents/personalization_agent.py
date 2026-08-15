from typing import List, Dict, Any, Optional

CANDIDATE_CATEGORIES = [
    {
        "category": "sleep_winddown",
        "name": "Circadian Wind-Down",
        "description": "Gradual nervous system downshift for improved sleep onset.",
        "target_signals": ["sleep", "screen"]
    },
    {
        "category": "cognitive_decompression",
        "name": "Cognitive Decompression",
        "description": "Mental unburdening for academic exam overload and racing thoughts.",
        "target_signals": ["stress", "overwhelming"]
    },
    {
        "category": "somatic_reset",
        "name": "Somatic Micro-Movement",
        "description": "Gentle physical stretching and outdoor grounding for low energy.",
        "target_signals": ["energy", "exhausting"]
    },
    {
        "category": "digital_detox",
        "name": "Digital Boundary Reset",
        "description": "Short screen hiatus to restore sensory focus and ease mental fatigue.",
        "target_signals": ["screen", "stress"]
    },
    {
        "category": "breath_focus",
        "name": "Resonant Breath & Centering",
        "description": "Vagus nerve activation to calm acute tension within minutes.",
        "target_signals": ["stress", "high"]
    }
]

def select_intervention_category(
    state_classification: Dict[str, Any],
    recent_interventions: List[Dict[str, Any]],
    dominant_signals: List[str]
) -> str:
    """
    Selects the most suitable intervention category based on multi-day signals
    and previous intervention outcome history.
    """
    dom_text = " ".join(dominant_signals).lower()

    # Base candidate scoring
    scores = {c["category"]: 1.0 for c in CANDIDATE_CATEGORIES}

    # Factor in dominant signals
    if "sleep" in dom_text:
        scores["sleep_winddown"] += 3.0
    if "stress" in dom_text or "overwhelm" in dom_text:
        scores["cognitive_decompression"] += 2.5
        scores["breath_focus"] += 2.0
    if "screen" in dom_text or "phone" in dom_text:
        scores["digital_detox"] += 2.5
        scores["sleep_winddown"] += 1.5
    if "energy" in dom_text or "exhaust" in dom_text:
        scores["somatic_reset"] += 2.5

    # Check recent completions to reward categories that worked and penalize yesterday's exact repeat
    if recent_interventions:
        last_int = recent_interventions[0]
        last_cat = last_int.get("category")
        # Slight penalty for repeating yesterday's exact category (FR-403)
        if last_cat in scores:
            scores[last_cat] -= 1.2

        # Check positive outcomes
        for past in recent_interventions[:5]:
            outcome = past.get("outcome")
            cat = past.get("category")
            if cat in scores:
                if outcome == "improved":
                    scores[cat] += 1.0
                elif outcome == "worsened":
                    scores[cat] -= 0.8

    # Pick category with highest score
    best_category = max(scores, key=scores.get)
    return best_category
