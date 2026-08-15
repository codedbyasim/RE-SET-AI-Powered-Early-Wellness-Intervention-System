import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DailyCheckin, WellnessSignal, Pattern, Intervention, InterventionResult
from app.routers.auth import get_current_user

router = APIRouter(prefix="/privacy", tags=["Privacy & Data Controls"])

@router.get("/export")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports all personal wellness signals, check-ins, patterns, and interventions in JSON (FR-1002).
    """
    checkins = db.query(DailyCheckin).filter(DailyCheckin.user_id == current_user.id).all()
    signals = db.query(WellnessSignal).filter(WellnessSignal.user_id == current_user.id).all()
    patterns = db.query(Pattern).filter(Pattern.user_id == current_user.id).all()
    interventions = db.query(Intervention).filter(Intervention.user_id == current_user.id).all()
    results = db.query(InterventionResult).filter(InterventionResult.user_id == current_user.id).all()

    export_payload = {
        "export_metadata": {
            "system": "RE:SET Wellness Engine",
            "version": "1.0",
            "user_id": current_user.id,
            "email": current_user.email,
            "export_timestamp": str(current_user.updated_at),
            "privacy_notice": "RE:SET does not sell user data and does not provide medical diagnoses."
        },
        "account_profile": {
            "full_name": current_user.full_name,
            "university_name": current_user.university_name,
            "campus_opt_in": current_user.campus_opt_in
        },
        "daily_checkins": [
            {
                "id": c.id,
                "date": str(c.checkin_date),
                "mood": c.mood,
                "stress": c.stress,
                "sleep_hours": c.sleep_hours,
                "energy": c.energy,
                "screen_time_hours": c.screen_time_hours,
                "day_tag": c.day_tag,
                "free_text_note": c.free_text_note,
                "created_at": str(c.created_at)
            }
            for c in checkins
        ],
        "wellness_signals": [
            {
                "date": str(s.date),
                "sleep_score": s.sleep_score,
                "stress_score": s.stress_score,
                "energy_score": s.energy_score,
                "readiness_score": s.readiness_score
            }
            for s in signals
        ],
        "patterns": [
            {
                "wellness_state": p.wellness_state,
                "summary": p.summary_text,
                "sleep_delta_pct": p.sleep_delta_pct,
                "stress_delta_pct": p.stress_delta_pct,
                "dominant_signals": json.loads(p.dominant_signals) if p.dominant_signals else []
            }
            for p in patterns
        ],
        "interventions": [
            {
                "category": i.category,
                "title": i.title,
                "is_completed": i.is_completed,
                "actions": json.loads(i.actions) if i.actions else [],
                "reflection_prompt": i.reflection_prompt
            }
            for i in interventions
        ]
    }

    return JSONResponse(
        content=export_payload,
        headers={"Content-Disposition": f"attachment; filename=reset_wellness_export_{current_user.id}.json"}
    )

@router.delete("/delete-account")
def delete_account_and_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes the student's account and cascades hard-delete
    across all personal check-ins, signals, patterns, and interventions (FR-1003).
    """
    user_id = current_user.id
    
    # Delete cascaded child records
    db.query(InterventionResult).filter(InterventionResult.user_id == user_id).delete()
    db.query(Intervention).filter(Intervention.user_id == user_id).delete()
    db.query(Pattern).filter(Pattern.user_id == user_id).delete()
    db.query(WellnessSignal).filter(WellnessSignal.user_id == user_id).delete()
    db.query(DailyCheckin).filter(DailyCheckin.user_id == user_id).delete()
    db.query(User).filter(User.id == user_id).delete()
    db.commit()

    return {
        "status": "success",
        "message": "Your account and all associated wellness data have been permanently wiped from the system."
    }
