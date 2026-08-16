import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "Student"
    role: Optional[str] = "student"
    university_name: Optional[str] = "NUTECH University"
    campus_opt_in: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Checkin Schemas
class CheckinCreate(BaseModel):
    mood: int = Field(..., ge=1, le=5, description="1 (Very Bad) to 5 (Great)")
    stress: int = Field(..., ge=1, le=10, description="1 (Low) to 10 (Extreme)")
    sleep_hours: float = Field(..., ge=0.0, le=24.0, description="Hours of sleep last night")
    energy: str = Field(..., description="low, medium, or high")
    screen_time_hours: Optional[float] = 4.0
    day_tag: Optional[str] = "Normal"
    free_text_note: Optional[str] = None

class CheckinOut(BaseModel):
    id: int
    user_id: int
    checkin_date: datetime.date
    mood: int
    stress: int
    sleep_hours: float
    energy: str
    screen_time_hours: float
    day_tag: str
    free_text_note: Optional[str]
    safety_flag: bool
    safety_details: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Action step inside a RESET plan
class ResetAction(BaseModel):
    id: int
    title: str
    duration_mins: int
    icon: str
    description: str
    is_done: Optional[bool] = False

# RESET Plan Intervention Schemas
class InterventionOut(BaseModel):
    id: int
    category: str
    title: str
    description: Optional[str]
    actions: List[ResetAction]
    reflection_prompt: str
    is_completed: bool
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class InterventionCompleteRequest(BaseModel):
    reflection_answer: str
    time_spent_mins: Optional[int] = 20

# Pattern Schemas
class PatternOut(BaseModel):
    id: int
    window_days: int
    sleep_delta_pct: float
    stress_delta_pct: float
    energy_delta_pct: float
    screen_delta_pct: float
    wellness_state: str  # STABLE, NEEDS_ATTENTION, RECOVERY_NEEDED
    dominant_signals: List[str]
    summary_text: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Safety Screening Response
class SafetyCheckResponse(BaseModel):
    is_crisis: bool
    message: Optional[str] = None
    resources: Optional[List[Dict[str, str]]] = None

# Pipeline Execution Response (Returned immediately after check-in)
class CheckinPipelineResponse(BaseModel):
    checkin: CheckinOut
    safety: SafetyCheckResponse
    pattern: Optional[PatternOut] = None
    intervention: Optional[InterventionOut] = None
    reflection_feedback: Optional[str] = None

# Insights Dashboard Schema
class DailySparklinePoint(BaseModel):
    date: str
    day_name: str
    mood: int
    stress: int
    sleep_hours: float
    readiness_score: float

class RecoveryReadinessBreakdown(BaseModel):
    overall_score: float  # 0 - 100
    sleep_consistency: float
    stress_trend: float
    energy_level: float
    activity_balance: float
    digital_balance: float
    disclaimer: str = "This score is a behavioral reflection index, not a clinical or medical diagnosis."

class WeeklyInsightsResponse(BaseModel):
    has_sufficient_data: bool
    daily_points: List[DailySparklinePoint]
    readiness: RecoveryReadinessBreakdown
    ai_synthesized_takeaway: str
    dominant_pattern: Optional[str] = None
    current_state: str = "STABLE"

# "What Changed?" Diagnostic Schema
class ContributingFactor(BaseModel):
    signal_name: str
    delta_display: str
    direction: str  # worsening, improving, neutral
    impact_weight: float
    explanation: str

class WhatChangedResponse(BaseModel):
    has_sufficient_history: bool
    comparison_period: str
    top_contributor: str
    factors: List[ContributingFactor]
    ai_narrative: str
    disclaimer: str = "This is a pattern, not a diagnosis."

# Campus Mode Schema
class CampusMetricsResponse(BaseModel):
    institution_name: str
    is_cohort_eligible: bool
    total_opted_in_students: int
    minimum_cohort_required: int = 20
    avg_wellbeing_pct: float
    sleep_concern_pct: float
    academic_stress_pct: float
    burnout_risk_pct: float
    top_stressors: List[str]
    weekly_trend: List[Dict[str, Any]]
    privacy_guarantee: str = "Strict k-anonymity enforced. No individual student data or IDs are accessible."
