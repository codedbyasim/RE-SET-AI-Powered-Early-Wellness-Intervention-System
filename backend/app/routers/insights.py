import datetime
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DailyCheckin, Pattern
from app.schemas import WeeklyInsightsResponse, WhatChangedResponse, DailySparklinePoint, RecoveryReadinessBreakdown, ContributingFactor
from app.routers.auth import get_current_user
from app.analytics import calculate_readiness_score, analyze_what_changed
from app.agents.what_changed_agent import synthesize_what_changed_narrative
from app.config import settings
from openai import OpenAI

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["Insights & Analytics"])

def get_client() -> OpenAI:
    return OpenAI(
        base_url=settings.AIML_API_BASE_URL,
        api_key=settings.AIML_API_KEY
    )

@router.get("/weekly", response_model=WeeklyInsightsResponse)
def get_weekly_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id
    ).order_by(DailyCheckin.checkin_date.desc()).limit(7).all()

    if not checkins or len(checkins) < 2:
        return WeeklyInsightsResponse(
            has_sufficient_data=False,
            daily_points=[],
            readiness=RecoveryReadinessBreakdown(
                overall_score=70.0,
                sleep_consistency=70.0,
                stress_trend=70.0,
                energy_level=70.0,
                activity_balance=70.0,
                digital_balance=70.0
            ),
            ai_synthesized_takeaway="Complete at least 2 daily check-ins to reveal your weekly wellness trend lines.",
            dominant_pattern="Collecting baseline data",
            current_state="STABLE"
        )

    checkins = sorted(checkins, key=lambda x: x.checkin_date)

    daily_points = []
    total_sleep = 0
    total_stress = 0

    for c in checkins:
        day_name = c.checkin_date.strftime("%a")
        readiness = calculate_readiness_score(c.sleep_hours, c.stress, c.energy, c.screen_time_hours or 4.0)
        daily_points.append(DailySparklinePoint(
            date=str(c.checkin_date),
            day_name=day_name,
            mood=c.mood,
            stress=c.stress,
            sleep_hours=c.sleep_hours,
            readiness_score=readiness["overall_score"]
        ))
        total_sleep += c.sleep_hours
        total_stress += c.stress

    latest = checkins[-1]
    latest_readiness = calculate_readiness_score(latest.sleep_hours, latest.stress, latest.energy, latest.screen_time_hours or 4.0)

    latest_pattern = db.query(Pattern).filter(Pattern.user_id == current_user.id).order_by(Pattern.created_at.desc()).first()
    state = latest_pattern.wellness_state if latest_pattern else "STABLE"
    summary_text = latest_pattern.summary_text if latest_pattern else "Patterns steady."

    avg_sleep = round(total_sleep / len(checkins), 1)
    avg_stress = round(total_stress / len(checkins), 1)
    
    ai_takeaway = f"Over the past {len(checkins)} days, your average sleep was {avg_sleep}h with a mean stress score of {avg_stress}/10."
    
    try:
        client = get_client()
        prompt = f"""Generate a single, insightful weekly synthesis sentence in English for a student's wellness dashboard.
Stats:
- Average Sleep: {avg_sleep} hours/night
- Average Stress: {avg_stress}/10
- Total Check-ins: {len(checkins)}
- State: {state}

Example style: "Your lowest stress days consistently followed nights with more than 7.5 hours of sleep."
Respond in 1 sentence only in English. No medical terms."""
        res = client.chat.completions.create(
            model=settings.AIML_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0.3
        )
        ai_takeaway = res.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Weekly Takeaway LLM error: {e}")

    return WeeklyInsightsResponse(
        has_sufficient_data=True,
        daily_points=daily_points,
        readiness=RecoveryReadinessBreakdown(**latest_readiness),
        ai_synthesized_takeaway=ai_takeaway,
        dominant_pattern=summary_text,
        current_state=state
    )

@router.get("/what-changed", response_model=WhatChangedResponse)
def get_what_changed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id
    ).order_by(DailyCheckin.checkin_date.asc()).all()

    checkins_data = [
        {
            "checkin_date": str(c.checkin_date),
            "mood": c.mood,
            "stress": c.stress,
            "sleep_hours": c.sleep_hours,
            "energy": c.energy,
            "screen_time_hours": c.screen_time_hours or 4.0
        }
        for c in all_checkins
    ]

    analysis = analyze_what_changed(checkins_data)

    if analysis["has_sufficient_history"]:
        narrative = synthesize_what_changed_narrative(analysis)
        analysis["ai_narrative"] = narrative

    return WhatChangedResponse(
        has_sufficient_history=analysis["has_sufficient_history"],
        comparison_period=analysis["comparison_period"],
        top_contributor=analysis["top_contributor"],
        factors=[
            ContributingFactor(
                signal_name=f["signal_name"],
                delta_display=f["delta_display"],
                direction=f["direction"],
                impact_weight=f["impact_weight"],
                explanation=f["explanation"]
            )
            for f in analysis.get("factors", [])
        ],
        ai_narrative=analysis.get("ai_narrative", ""),
        disclaimer="This is a pattern, not a diagnosis."
    )
