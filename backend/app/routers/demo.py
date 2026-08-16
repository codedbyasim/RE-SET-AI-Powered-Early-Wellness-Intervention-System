import datetime
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DailyCheckin, WellnessSignal, Pattern, Intervention, InterventionResult
from app.routers.auth import get_current_user, get_password_hash
from app.analytics import calculate_readiness_score

router = APIRouter(prefix="/demo", tags=["Demo Persona Scenarios"])

@router.post("/load-sarah-scenario")
def load_sarah_scenario(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Seeds the realistic 'Sarah' 7-day Exam Burnout & Recovery Journey
    specified in Section 6.4 (R-09) and Section 3 of RE-SET_SRS.md.
    """
    # Clear existing data for this user
    user_id = current_user.id
    db.query(InterventionResult).filter(InterventionResult.user_id == user_id).delete()
    db.query(Intervention).filter(Intervention.user_id == user_id).delete()
    db.query(Pattern).filter(Pattern.user_id == user_id).delete()
    db.query(WellnessSignal).filter(WellnessSignal.user_id == user_id).delete()
    db.query(DailyCheckin).filter(DailyCheckin.user_id == user_id).delete()
    db.commit()

    today = datetime.date.today()
    
    # 7-day progression
    days_data = [
        # Day -6: Baseline Good
        {"offset": 6, "mood": 4, "stress": 3, "sleep": 8.0, "energy": "high", "screen": 3.5, "tag": "Relaxing", "note": "Finished early, spent evening reading."},
        # Day -5: Baseline Normal
        {"offset": 5, "mood": 4, "stress": 4, "sleep": 7.5, "energy": "high", "screen": 4.0, "tag": "Productive", "note": "Normal lecture day, feeling on track."},
        # Day -4: Study starts
        {"offset": 4, "mood": 3, "stress": 5, "sleep": 6.8, "energy": "medium", "screen": 5.2, "tag": "Normal", "note": "Midterm syllabus announced. Starting revision."},
        # Day -3: Deterioration Begins
        {"offset": 3, "mood": 3, "stress": 7, "sleep": 5.5, "energy": "medium", "screen": 6.5, "tag": "Overwhelming", "note": "Stayed up reviewing organic chemistry notes till 2am."},
        # Day -2: Acute Deterioration
        {"offset": 2, "mood": 2, "stress": 8, "sleep": 5.0, "energy": "low", "screen": 7.5, "tag": "Exhausting", "note": "Racing thoughts, couldn't fall asleep, eyes strained."},
        # Day -1: Recovery Needed & RESET triggered
        {"offset": 1, "mood": 2, "stress": 9, "sleep": 4.5, "energy": "low", "screen": 8.0, "tag": "Exhausting", "note": "Brain feels like mush. Too many slides to memorize."},
        # Day 0 (Today): Post-RESET Recovery
        {"offset": 0, "mood": 4, "stress": 5, "sleep": 7.2, "energy": "medium", "screen": 4.8, "tag": "Productive", "note": "Did the evening wind-down routine last night. Slept much deeper."}
    ]

    for day in days_data:
        c_date = today - datetime.timedelta(days=day["offset"])
        checkin = DailyCheckin(
            user_id=user_id,
            checkin_date=c_date,
            mood=day["mood"],
            stress=day["stress"],
            sleep_hours=day["sleep"],
            energy=day["energy"],
            screen_time_hours=day["screen"],
            day_tag=day["tag"],
            free_text_note=day["note"]
        )
        db.add(checkin)
        db.commit()
        db.refresh(checkin)

        # Add Signal
        readiness = calculate_readiness_score(day["sleep"], day["stress"], day["energy"], day["screen"])
        sig = WellnessSignal(
            checkin_id=checkin.id,
            user_id=user_id,
            date=c_date,
            sleep_score=readiness["sleep_consistency"],
            stress_score=readiness["stress_trend"],
            energy_score=readiness["energy_level"],
            digital_balance_score=readiness["digital_balance"],
            activity_score=readiness["activity_balance"],
            readiness_score=readiness["overall_score"]
        )
        db.add(sig)

    # Seed Pattern for Day -1 (Triggered Recovery)
    pattern = Pattern(
        user_id=user_id,
        window_days=7,
        sleep_delta_pct=-35.0,
        stress_delta_pct=+65.0,
        energy_delta_pct=-40.0,
        screen_delta_pct=+55.0,
        wellness_state="RECOVERY_NEEDED",
        dominant_signals=json.dumps(["Sleep duration drop (-35%)", "Late-night screen usage (+55%)"]),
        summary_text="Sharp sleep deficit coupled with heightened exam workload over the past 3 days."
    )
    db.add(pattern)
    db.commit()
    db.refresh(pattern)

    # Seed Completed Intervention for Yesterday
    int_yesterday = Intervention(
        user_id=user_id,
        pattern_id=pattern.id,
        category="sleep_winddown",
        title="18-Minute Circadian Wind-Down RESET",
        description="A gentle transition routine to disengage optic nerves and drop cortisol before sleep.",
        actions=json.dumps([
            {"id": 1, "title": "Device Curfew & Night Shift Mode", "duration_mins": 5, "icon": "moon", "description": "Docked phone across the room.", "is_done": True},
            {"id": 2, "title": "Chamomile Infusion & Window Gaze", "duration_mins": 5, "icon": "coffee", "description": "Sipped warm tea without looking at lecture PDFs.", "is_done": True},
            {"id": 3, "title": "4-7-8 Parasympathetic Breathing", "duration_mins": 8, "icon": "wind", "description": "Completed 6 deliberate breath cycles in dim light.", "is_done": True}
        ]),
        reflection_prompt="What is one study task you can comfortably delegate to tomorrow?",
        is_completed=True,
        completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
    )
    db.add(int_yesterday)
    db.commit()
    db.refresh(int_yesterday)

    # Seed Intervention Result
    res = InterventionResult(
        intervention_id=int_yesterday.id,
        user_id=user_id,
        reflection_answer="Decided to pause past-paper memorization and pick it up fresh after 8 hours of real rest.",
        time_spent_mins=18,
        before_state="RECOVERY_NEEDED",
        after_state="STABLE",
        outcome="improved",
        notes="Student reported noticeable improvement in sleep onset."
    )
    db.add(res)

    # Seed Today's Active Intervention
    int_today = Intervention(
        user_id=user_id,
        pattern_id=pattern.id,
        category="cognitive_decompression",
        title="20-Minute Focus Restoration RESET",
        description="A calming afternoon sequence to sustain positive momentum and prevent rebound fatigue.",
        actions=json.dumps([
            {"id": 1, "title": "Paper Brain-Dump & Priority Filter", "duration_mins": 6, "icon": "edit-3", "description": "Write down top 3 exam goals, hide everything else.", "is_done": False},
            {"id": 2, "title": "Cervical Spine & Shoulder Roll", "duration_mins": 6, "icon": "activity", "description": "Gently stretch traps and release jaw clenching.", "is_done": False},
            {"id": 3, "title": "Open-Air Horizon Gazing", "duration_mins": 8, "icon": "sun", "description": "Step to the balcony and take 10 slow breaths.", "is_done": False}
        ]),
        reflection_prompt="What gave you the most sense of relief today?",
        is_completed=False
    )
    db.add(int_today)
    db.commit()

    return {
        "status": "success",
        "scenario": "Sarah's Exam Burnout (7-Day Journey)",
        "message": "Loaded 7 days of realistic check-in history, pattern shifts, completed RESET, and active plan."
    }

@router.post("/reset-clean")
def reset_clean_slate(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clears check-in history for live manual testing.
    """
    user_id = current_user.id
    db.query(InterventionResult).filter(InterventionResult.user_id == user_id).delete()
    db.query(Intervention).filter(Intervention.user_id == user_id).delete()
    db.query(Pattern).filter(Pattern.user_id == user_id).delete()
    db.query(WellnessSignal).filter(WellnessSignal.user_id == user_id).delete()
    db.query(DailyCheckin).filter(DailyCheckin.user_id == user_id).delete()
    db.commit()

    return {
        "status": "success",
        "message": "Account reset to clean slate. You can now perform a fresh live check-in."
    }
