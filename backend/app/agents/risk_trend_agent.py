from typing import Dict, Any, List

def classify_wellness_state(deltas: Dict[str, Any], latest_checkin: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classifies the user's state into Stable, Needs Attention, or Recovery Needed,
    and isolates the 1-2 dominant signals.
    """
    state = deltas.get("state", "STABLE")
    dominant_signals = list(deltas.get("dominant_signals", []))

    stress = latest_checkin.get("stress", 5)
    sleep = latest_checkin.get("sleep_hours", 7.0)
    energy = str(latest_checkin.get("energy", "medium")).lower()

    if not dominant_signals:
        if stress >= 8:
            dominant_signals.append("High acute stress (Level 8+)")
        if sleep <= 5.0:
            dominant_signals.append(f"Short sleep duration ({sleep}h)")
        if energy == "low":
            dominant_signals.append("Depleted physical energy")

    if not dominant_signals:
        dominant_signals = ["Stable daily balance"]

    # Keep top 2 dominant signals
    top_dominant = dominant_signals[:2]

    return {
        "state": state,
        "dominant_signals": top_dominant,
        "is_recovery_needed": (state == "RECOVERY_NEEDED")
    }
