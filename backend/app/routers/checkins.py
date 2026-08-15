import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DailyCheckin, Pattern, Intervention
from app.schemas import CheckinCreate, CheckinOut, CheckinPipelineResponse, SafetyCheckResponse, PatternOut, InterventionOut, ResetAction
from app.routers.auth import get_current_user
from app.agents.orchestrator import run_wellness_pipeline

router = APIRouter(prefix="/checkins", tags=["Daily Check-Ins"])

@router.post("/", response_model=CheckinPipelineResponse)
def submit_checkin(
    checkin_in: CheckinCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.date.today()

    existing = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.checkin_date == today
    ).first()

    if existing:
        existing.mood = checkin_in.mood
        existing.stress = checkin_in.stress
        existing.sleep_hours = checkin_in.sleep_hours
        existing.energy = checkin_in.energy
        existing.screen_time_hours = checkin_in.screen_time_hours or 4.0
        existing.day_tag = checkin_in.day_tag or "Normal"
        existing.free_text_note = checkin_in.free_text_note
        db.commit()
        db.refresh(existing)
        checkin_record = existing
    else:
        checkin_record = DailyCheckin(
            user_id=current_user.id,
            checkin_date=today,
            mood=checkin_in.mood,
            stress=checkin_in.stress,
            sleep_hours=checkin_in.sleep_hours,
            energy=checkin_in.energy,
            screen_time_hours=checkin_in.screen_time_hours or 4.0,
            day_tag=checkin_in.day_tag or "Normal",
            free_text_note=checkin_in.free_text_note
        )
        db.add(checkin_record)
        db.commit()
        db.refresh(checkin_record)

    pipeline_output = run_wellness_pipeline(
        db=db,
        user=current_user,
        new_checkin=checkin_record
    )

    safety_obj = pipeline_output["safety"]
    pattern_rec = pipeline_output["pattern"]
    intervention_rec = pipeline_output["intervention"]
    reflection_msg = pipeline_output["reflection_feedback"]

    pattern_out = None
    if pattern_rec:
        dom_signals = json.loads(pattern_rec.dominant_signals) if pattern_rec.dominant_signals else []
        pattern_out = PatternOut(
            id=pattern_rec.id,
            window_days=pattern_rec.window_days,
            sleep_delta_pct=pattern_rec.sleep_delta_pct,
            stress_delta_pct=pattern_rec.stress_delta_pct,
            energy_delta_pct=pattern_rec.energy_delta_pct,
            screen_delta_pct=pattern_rec.screen_delta_pct,
            wellness_state=pattern_rec.wellness_state,
            dominant_signals=dom_signals,
            summary_text=pattern_rec.summary_text,
            created_at=pattern_rec.created_at
        )

    intervention_out = None
    if intervention_rec:
        actions_list = json.loads(intervention_rec.actions) if intervention_rec.actions else []
        parsed_actions = [
            ResetAction(
                id=a.get("id", idx + 1),
                title=a.get("title", ""),
                duration_mins=a.get("duration_mins", 5),
                icon=a.get("icon", "activity"),
                description=a.get("description", ""),
                is_done=False
            )
            for idx, a in enumerate(actions_list)
        ]
        intervention_out = InterventionOut(
            id=intervention_rec.id,
            category=intervention_rec.category,
            title=intervention_rec.title,
            description=intervention_rec.description,
            actions=parsed_actions,
            reflection_prompt=intervention_rec.reflection_prompt,
            is_completed=intervention_rec.is_completed,
            created_at=intervention_rec.created_at,
            completed_at=intervention_rec.completed_at
        )

    return CheckinPipelineResponse(
        checkin=checkin_record,
        safety=SafetyCheckResponse(
            is_crisis=safety_obj.get("is_crisis", False),
            message=safety_obj.get("message"),
            resources=safety_obj.get("resources", [])
        ),
        pattern=pattern_out,
        intervention=intervention_out,
        reflection_feedback=reflection_msg
    )

@router.get("/today", response_model=Optional[CheckinOut])
def get_today_checkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.date.today()
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.checkin_date == today
    ).first()
    return checkin

@router.get("/history", response_model=List[CheckinOut])
def get_checkin_history(
    limit: int = 14,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id
    ).order_by(DailyCheckin.checkin_date.desc()).limit(limit).all()
    return checkins
