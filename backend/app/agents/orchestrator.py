import logging
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import DailyCheckin, WellnessSignal, Pattern, Intervention, InterventionResult, User
from app.analytics import compute_rolling_deltas, calculate_readiness_score
from app.agents.safety_agent import screen_free_text_safety
from app.agents.pattern_agent import generate_pattern_summary
from app.agents.risk_trend_agent import classify_wellness_state
from app.agents.personalization_agent import select_intervention_category
from app.agents.intervention_agent import generate_reset_plan
from app.agents.reflection_agent import evaluate_reflection_feedback

logger = logging.getLogger(__name__)

def run_wellness_pipeline(
    db: Session,
    user: User,
    new_checkin: DailyCheckin
) -> Dict[str, Any]:
    """
    Coordinates the 6-agent pipeline with safety gating in English:
    Safety Agent -> Trend Analytics -> Pattern Agent -> Risk/Trend Agent ->
    Personalization Agent -> Intervention Agent -> Reflection Agent
    """
    # 1. SAFETY AGENT SCREENING
    safety_result = screen_free_text_safety(new_checkin.free_text_note or "")
    if safety_result.get("is_crisis"):
        new_checkin.safety_flag = True
        new_checkin.safety_details = json.dumps(safety_result)
        db.commit()
        
        logger.warning(f"User {user.id} triggered crisis safety flow. Suppressing recommendation pipeline.")
        return {
            "safety": safety_result,
            "pattern": None,
            "intervention": None,
            "reflection_feedback": None
        }

    # 2. DERIVE AND STORE WELLNESS SIGNALS
    readiness_breakdown = calculate_readiness_score(
        sleep_hours=new_checkin.sleep_hours,
        stress=new_checkin.stress,
        energy_str=new_checkin.energy,
        screen_time=new_checkin.screen_time_hours or 4.0
    )

    signal_record = WellnessSignal(
        checkin_id=new_checkin.id,
        user_id=user.id,
        date=new_checkin.checkin_date,
        sleep_score=readiness_breakdown["sleep_consistency"],
        stress_score=readiness_breakdown["stress_trend"],
        energy_score=readiness_breakdown["energy_level"],
        digital_balance_score=readiness_breakdown["digital_balance"],
        activity_score=readiness_breakdown["activity_balance"],
        readiness_score=readiness_breakdown["overall_score"]
    )
    db.add(signal_record)
    db.commit()

    # 3. FETCH HISTORICAL CHECK-INS FOR MULTI-DAY ANALYSIS
    past_checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == user.id
    ).order_by(DailyCheckin.checkin_date.asc()).all()

    checkins_data = [
        {
            "id": c.id,
            "checkin_date": str(c.checkin_date),
            "mood": c.mood,
            "stress": c.stress,
            "sleep_hours": c.sleep_hours,
            "energy": c.energy,
            "screen_time_hours": c.screen_time_hours or 4.0
        }
        for c in past_checkins
    ]

    # 4. COMPUTE ROLLING DELTAS (Pandas / Statistics)
    deltas = compute_rolling_deltas(checkins_data)

    # 5. PATTERN AGENT
    pattern_summary_text = generate_pattern_summary(deltas, checkins_data[-7:])

    # 6. RISK / TREND AGENT
    latest_dict = checkins_data[-1] if checkins_data else {}
    risk_classification = classify_wellness_state(deltas, latest_dict)

    # Persist Pattern Record
    pattern_record = Pattern(
        user_id=user.id,
        checkin_id=new_checkin.id,
        window_days=7,
        sleep_delta_pct=deltas.get("sleep_delta_pct", 0.0),
        stress_delta_pct=deltas.get("stress_delta_pct", 0.0),
        energy_delta_pct=deltas.get("energy_delta_pct", 0.0),
        screen_delta_pct=deltas.get("screen_delta_pct", 0.0),
        wellness_state=risk_classification["state"],
        dominant_signals=json.dumps(risk_classification["dominant_signals"]),
        summary_text=pattern_summary_text
    )
    db.add(pattern_record)
    db.commit()
    db.refresh(pattern_record)

    # 7. PERSONALIZATION AGENT
    past_interventions = db.query(Intervention).filter(
        Intervention.user_id == user.id
    ).order_by(Intervention.created_at.desc()).limit(10).all()

    past_int_dicts = [
        {"category": i.category, "is_completed": i.is_completed}
        for i in past_interventions
    ]

    selected_category = select_intervention_category(
        risk_classification,
        past_int_dicts,
        risk_classification["dominant_signals"]
    )

    # 8. INTERVENTION AGENT (Generate Today's RESET Plan)
    plan_data = generate_reset_plan(
        category=selected_category,
        dominant_signals=risk_classification["dominant_signals"],
        user_context={
            "mood": new_checkin.mood,
            "stress": new_checkin.stress,
            "sleep": new_checkin.sleep_hours,
            "energy": new_checkin.energy,
            "day_tag": new_checkin.day_tag
        }
    )

    intervention_record = Intervention(
        user_id=user.id,
        pattern_id=pattern_record.id,
        category=selected_category,
        title=plan_data.get("title", "Today's RESET Plan"),
        description=plan_data.get("description", ""),
        actions=json.dumps(plan_data.get("actions", [])),
        reflection_prompt=plan_data.get("reflection_prompt", "What was your takeaway today?"),
        is_completed=False
    )
    db.add(intervention_record)
    db.commit()
    db.refresh(intervention_record)

    # 9. REFLECTION AGENT (Check if prior completed RESET exists to evaluate correlation)
    reflection_takeaway = None
    if len(past_checkins) >= 2:
        prev_checkin = past_checkins[-2]
        prior_completed_int = db.query(Intervention).filter(
            Intervention.user_id == user.id,
            Intervention.is_completed == True,
            Intervention.id != intervention_record.id
        ).order_by(Intervention.completed_at.desc()).first()

        if prior_completed_int:
            prior_dict = {
                "stress": prev_checkin.stress,
                "sleep_hours": prev_checkin.sleep_hours,
                "mood": prev_checkin.mood
            }
            curr_dict = {
                "stress": new_checkin.stress,
                "sleep_hours": new_checkin.sleep_hours,
                "mood": new_checkin.mood
            }
            reflection_res = evaluate_reflection_feedback(
                prior_dict,
                curr_dict,
                {"title": prior_completed_int.title, "category": prior_completed_int.category}
            )
            reflection_takeaway = reflection_res.get("takeaway")

            int_res = db.query(InterventionResult).filter(
                InterventionResult.intervention_id == prior_completed_int.id
            ).first()
            if int_res:
                int_res.outcome = reflection_res.get("outcome", "improved")
                db.commit()

    return {
        "safety": safety_result,
        "pattern": pattern_record,
        "intervention": intervention_record,
        "reflection_feedback": reflection_takeaway
    }
