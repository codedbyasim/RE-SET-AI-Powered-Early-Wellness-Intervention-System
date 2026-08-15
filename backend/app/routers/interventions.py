import datetime
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Intervention, InterventionResult, Pattern
from app.schemas import InterventionOut, InterventionCompleteRequest, ResetAction
from app.routers.auth import get_current_user
from app.agents.intervention_agent import generate_reset_plan

router = APIRouter(prefix="/interventions", tags=["RESET Interventions"])

def parse_intervention_to_schema(intervention: Intervention) -> InterventionOut:
    actions_list = json.loads(intervention.actions) if intervention.actions else []
    parsed_actions = [
        ResetAction(
            id=a.get("id", idx + 1),
            title=a.get("title", ""),
            duration_mins=a.get("duration_mins", 5),
            icon=a.get("icon", "activity"),
            description=a.get("description", ""),
            is_done=a.get("is_done", False)
        )
        for idx, a in enumerate(actions_list)
    ]
    return InterventionOut(
        id=intervention.id,
        category=intervention.category,
        title=intervention.title,
        description=intervention.description,
        actions=parsed_actions,
        reflection_prompt=intervention.reflection_prompt,
        is_completed=intervention.is_completed,
        created_at=intervention.created_at,
        completed_at=intervention.completed_at
    )

@router.get("/today", response_model=Optional[InterventionOut])
def get_today_intervention(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    intervention = db.query(Intervention).filter(
        Intervention.user_id == current_user.id
    ).order_by(Intervention.created_at.desc()).first()

    if not intervention:
        return None

    return parse_intervention_to_schema(intervention)

@router.post("/{intervention_id}/complete")
def complete_intervention(
    intervention_id: int,
    request_data: InterventionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    intervention = db.query(Intervention).filter(
        Intervention.id == intervention_id,
        Intervention.user_id == current_user.id
    ).first()

    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention plan not found.")

    intervention.is_completed = True
    intervention.completed_at = datetime.datetime.utcnow()

    actions_list = json.loads(intervention.actions) if intervention.actions else []
    for a in actions_list:
        a["is_done"] = True
    intervention.actions = json.dumps(actions_list)

    latest_pattern = db.query(Pattern).filter(Pattern.user_id == current_user.id).order_by(Pattern.created_at.desc()).first()
    before_state = latest_pattern.wellness_state if latest_pattern else "NEEDS_ATTENTION"

    result_record = InterventionResult(
        intervention_id=intervention.id,
        user_id=current_user.id,
        reflection_answer=request_data.reflection_answer,
        time_spent_mins=request_data.time_spent_mins or 20,
        before_state=before_state,
        after_state="STABLE",
        outcome="improved",
        notes="Completed by student"
    )
    db.add(result_record)
    db.commit()

    return {
        "status": "success",
        "message": "RESET successfully completed! Great job taking time for your wellbeing.",
        "completed_at": intervention.completed_at
    }

@router.post("/{intervention_id}/regenerate", response_model=InterventionOut)
def regenerate_intervention(
    intervention_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    old_intervention = db.query(Intervention).filter(
        Intervention.id == intervention_id,
        Intervention.user_id == current_user.id
    ).first()

    if not old_intervention:
        raise HTTPException(status_code=404, detail="Intervention not found.")

    new_cat = "digital_detox" if old_intervention.category != "digital_detox" else "somatic_reset"

    plan_data = generate_reset_plan(
        category=new_cat,
        dominant_signals=["Alternative routine request"],
        user_context={"request": "regenerate"}
    )

    old_intervention.category = new_cat
    old_intervention.title = plan_data.get("title", "Fresh RESET Routine")
    old_intervention.description = plan_data.get("description", "")
    old_intervention.actions = json.dumps(plan_data.get("actions", []))
    old_intervention.reflection_prompt = plan_data.get("reflection_prompt", "What feels different now?")
    old_intervention.is_completed = False
    old_intervention.completed_at = None
    db.commit()

    return parse_intervention_to_schema(old_intervention)
