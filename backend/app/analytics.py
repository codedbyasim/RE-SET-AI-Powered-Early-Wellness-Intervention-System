import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

def energy_to_score(energy_str: str) -> float:
    e = str(energy_str).lower().strip()
    if e == "high":
        return 90.0
    elif e == "medium" or e == "moderate":
        return 65.0
    elif e == "low":
        return 35.0
    return 60.0

def calculate_readiness_score(
    sleep_hours: float,
    stress: int,
    energy_str: str,
    screen_time: float = 4.0
) -> Dict[str, float]:
    """
    Computes weighted Recovery Readiness Score (0-100)
    Weights per SRS FR-702:
    - Sleep consistency: 25%
    - Stress trend: 25%
    - Energy: 20%
    - Activity: 15%
    - Digital balance: 15%
    """
    # Sleep score (optimal 7.5 - 9.0 hours)
    if sleep_hours <= 0:
        sleep_score = 10.0
    elif sleep_hours >= 7.5 and sleep_hours <= 9.0:
        sleep_score = 95.0
    elif sleep_hours > 9.0:
        sleep_score = max(50.0, 95.0 - (sleep_hours - 9.0) * 15.0)
    else:
        # sleep_hours < 7.5
        sleep_score = max(10.0, (sleep_hours / 7.5) * 95.0)

    # Stress score (1 is best, 10 is worst)
    stress_val = max(1, min(10, stress))
    stress_score = max(10.0, (11 - stress_val) * 10.0)

    # Energy score
    energy_score = energy_to_score(energy_str)

    # Digital balance score (optimal < 3.5 hrs screen, > 8 hrs penalty)
    if screen_time <= 3.5:
        digital_score = 90.0
    elif screen_time <= 6.0:
        digital_score = 70.0
    elif screen_time <= 8.5:
        digital_score = 45.0
    else:
        digital_score = 25.0

    # Activity score (estimated based on energy and stress balance)
    activity_score = min(95.0, max(20.0, (energy_score * 0.7) + ((11 - stress_val) * 3.0)))

    # Composite formula
    composite = (
        (0.25 * sleep_score) +
        (0.25 * stress_score) +
        (0.20 * energy_score) +
        (0.15 * activity_score) +
        (0.15 * digital_score)
    )
    composite = round(min(100.0, max(0.0, composite)), 1)

    return {
        "overall_score": composite,
        "sleep_consistency": round(sleep_score, 1),
        "stress_trend": round(stress_score, 1),
        "energy_level": round(energy_score, 1),
        "activity_balance": round(activity_score, 1),
        "digital_balance": round(digital_score, 1)
    }

def compute_rolling_deltas(checkins_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes rolling trend deltas across past check-ins using Pandas
    """
    if not checkins_data or len(checkins_data) < 2:
        return {
            "has_sufficient_history": False,
            "sleep_delta_pct": 0.0,
            "stress_delta_pct": 0.0,
            "energy_delta_pct": 0.0,
            "screen_delta_pct": 0.0,
            "dominant_signals": [],
            "state": "STABLE"
        }

    df = pd.DataFrame(checkins_data)
    df = df.sort_values(by="checkin_date", ascending=True)

    # Map energy to numeric
    df["energy_num"] = df["energy"].apply(energy_to_score)
    if "screen_time_hours" not in df.columns:
        df["screen_time_hours"] = 4.0

    n = len(df)
    if n <= 3:
        recent_df = df.tail(1)
        prior_df = df.head(n - 1)
    else:
        recent_count = min(3, n // 2)
        recent_df = df.tail(recent_count)
        prior_df = df.iloc[:n - recent_count]

    # Calculate mean differences
    def calc_delta(recent_series, prior_series):
        p_mean = prior_series.mean()
        r_mean = recent_series.mean()
        if p_mean == 0:
            return 0.0
        return round(((r_mean - p_mean) / abs(p_mean)) * 100, 1)

    sleep_delta = calc_delta(recent_df["sleep_hours"], prior_df["sleep_hours"])
    stress_delta = calc_delta(recent_df["stress"], prior_df["stress"])
    energy_delta = calc_delta(recent_df["energy_num"], prior_df["energy_num"])
    screen_delta = calc_delta(recent_df["screen_time_hours"], prior_df["screen_time_hours"])

    # Determine dominant signals
    dominant_signals = []
    if sleep_delta <= -15.0:
        dominant_signals.append(f"Sleep reduction ({sleep_delta}%)")
    if stress_delta >= 20.0:
        dominant_signals.append(f"Stress spike (+{stress_delta}%)")
    if screen_delta >= 25.0:
        dominant_signals.append(f"Elevated screen time (+{screen_delta}%)")
    if energy_delta <= -20.0:
        dominant_signals.append(f"Low energy dip ({energy_delta}%)")

    # Determine State: STABLE, NEEDS_ATTENTION, RECOVERY_NEEDED
    latest = df.iloc[-1]
    latest_stress = float(latest["stress"])
    latest_sleep = float(latest["sleep_hours"])
    latest_energy = str(latest["energy"]).lower()

    if latest_stress >= 8 or latest_sleep <= 5.0 or (stress_delta >= 30 and sleep_delta <= -20):
        state = "RECOVERY_NEEDED"
    elif latest_stress >= 6 or latest_sleep <= 6.5 or stress_delta >= 15 or sleep_delta <= -10:
        state = "NEEDS_ATTENTION"
    else:
        state = "STABLE"

    return {
        "has_sufficient_history": True,
        "sleep_delta_pct": sleep_delta,
        "stress_delta_pct": stress_delta,
        "energy_delta_pct": energy_delta,
        "screen_delta_pct": screen_delta,
        "dominant_signals": dominant_signals,
        "state": state
    }

def analyze_what_changed(all_checkins: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    On-demand comparative analysis for "What Changed?" feature (FR-801, 802)
    Compares current week (last 7 days) against baseline (preceding history).
    """
    if len(all_checkins) < 3:
        return {
            "has_sufficient_history": False,
            "comparison_period": "Past 7 days vs Baseline",
            "top_contributor": "Insufficient check-in history to isolate contributing patterns.",
            "factors": [],
            "ai_narrative": "Check in for at least 3-5 days to unlock comparative pattern insights.",
            "disclaimer": "This is a pattern, not a diagnosis."
        }

    df = pd.DataFrame(all_checkins)
    df = df.sort_values(by="checkin_date", ascending=True)
    df["energy_num"] = df["energy"].apply(energy_to_score)
    if "screen_time_hours" not in df.columns:
        df["screen_time_hours"] = 4.5

    n = len(df)
    current_week_df = df.tail(min(7, n // 2 if n < 14 else 7))
    baseline_df = df.iloc[: len(df) - len(current_week_df)]

    if len(baseline_df) == 0:
        baseline_df = current_week_df

    factors = []

    # 1. Sleep delta
    base_sleep = baseline_df["sleep_hours"].mean()
    curr_sleep = current_week_df["sleep_hours"].mean()
    sleep_diff_hrs = curr_sleep - base_sleep
    if abs(sleep_diff_hrs) >= 0.3:
        direction = "worsening" if sleep_diff_hrs < 0 else "improving"
        factors.append({
            "signal_name": "Nightly Sleep Duration",
            "delta_display": f"{sleep_diff_hrs:+.1f} hrs/night ({curr_sleep:.1f}h vs {base_sleep:.1f}h baseline)",
            "direction": direction,
            "impact_weight": abs(sleep_diff_hrs) * 1.8,
            "explanation": "Sleep deficit directly impacts memory consolidation and emotional regulation."
        })

    # 2. Stress delta
    base_stress = baseline_df["stress"].mean()
    curr_stress = current_week_df["stress"].mean()
    stress_diff = curr_stress - base_stress
    if abs(stress_diff) >= 0.5:
        direction = "worsening" if stress_diff > 0 else "improving"
        factors.append({
            "signal_name": "Perceived Stress Level",
            "delta_display": f"{stress_diff:+.1f} pts ({curr_stress:.1f} vs {base_stress:.1f} baseline on 1-10 scale)",
            "direction": direction,
            "impact_weight": abs(stress_diff) * 1.5,
            "explanation": "Elevated academic or daily friction without dedicated decompression windows."
        })

    # 3. Screen time delta
    base_screen = baseline_df["screen_time_hours"].mean()
    curr_screen = current_week_df["screen_time_hours"].mean()
    screen_diff = curr_screen - base_screen
    if abs(screen_diff) >= 0.5:
        direction = "worsening" if screen_diff > 0 else "improving"
        factors.append({
            "signal_name": "Digital Screen Time",
            "delta_display": f"{screen_diff:+.1f} hrs/day ({curr_screen:.1f}h vs {base_screen:.1f}h baseline)",
            "direction": direction,
            "impact_weight": abs(screen_diff) * 1.2,
            "explanation": "Extended evening device usage stimulates alertness and delays circadian rhythm."
        })

    # 4. Energy delta
    base_energy = baseline_df["energy_num"].mean()
    curr_energy = current_week_df["energy_num"].mean()
    energy_diff = curr_energy - base_energy
    if abs(energy_diff) >= 5.0:
        direction = "worsening" if energy_diff < 0 else "improving"
        factors.append({
            "signal_name": "Daily Physical Energy",
            "delta_display": f"{energy_diff:+.1f}% shift from personal baseline",
            "direction": direction,
            "impact_weight": abs(energy_diff) * 0.8,
            "explanation": "Fluctuations in stamina and vitality linked to recovery cycles."
        })

    # Sort factors by impact_weight descending
    factors.sort(key=lambda x: x["impact_weight"], reverse=True)

    top_name = factors[0]["signal_name"] if factors else "Routine Stability"
    top_delta = factors[0]["delta_display"] if factors else "No significant deviations"

    return {
        "has_sufficient_history": True,
        "comparison_period": "Current 7 Days vs Historical Baseline",
        "top_contributor": f"Primary shift identified in {top_name}: {top_delta}",
        "factors": factors,
        "ai_narrative": "",  # To be phrased by what_changed_agent
        "disclaimer": "This is a pattern, not a diagnosis."
    }
