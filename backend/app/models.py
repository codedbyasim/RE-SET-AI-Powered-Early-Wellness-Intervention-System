import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="Student")
    role = Column(String, default="student")  # student, university_admin, system_admin
    university_name = Column(String, default="NUTECH University")
    campus_opt_in = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    checkins = relationship("DailyCheckin", back_populates="user", cascade="all, delete-orphan")
    patterns = relationship("Pattern", back_populates="user", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="user", cascade="all, delete-orphan")

class DailyCheckin(Base):
    __tablename__ = "daily_checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    checkin_date = Column(Date, default=datetime.date.today, index=True, nullable=False)
    mood = Column(Integer, nullable=False)  # 1 (very bad) to 5 (great)
    stress = Column(Integer, nullable=False)  # 1 (low) to 10 (extreme)
    sleep_hours = Column(Float, nullable=False)  # 0.0 to 16.0
    energy = Column(String, nullable=False)  # low, medium, high
    screen_time_hours = Column(Float, default=4.0)
    day_tag = Column(String, default="Normal")  # Overwhelming, Normal, Productive, Relaxing, Exhausting
    free_text_note = Column(Text, nullable=True)
    safety_flag = Column(Boolean, default=False)
    safety_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="checkins")
    signals = relationship("WellnessSignal", back_populates="checkin", cascade="all, delete-orphan")
    patterns = relationship("Pattern", back_populates="checkin", cascade="all, delete-orphan")

class WellnessSignal(Base):
    __tablename__ = "wellness_signals"

    id = Column(Integer, primary_key=True, index=True)
    checkin_id = Column(Integer, ForeignKey("daily_checkins.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=datetime.date.today, nullable=False)
    sleep_score = Column(Float, default=50.0)  # 0-100 normalized
    stress_score = Column(Float, default=50.0)  # 0-100 normalized
    energy_score = Column(Float, default=50.0)  # 0-100 normalized
    digital_balance_score = Column(Float, default=50.0)  # 0-100
    activity_score = Column(Float, default=50.0)  # 0-100
    readiness_score = Column(Float, default=50.0)  # Composite Recovery Readiness Score
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)

    checkin = relationship("DailyCheckin", back_populates="signals")

class Pattern(Base):
    __tablename__ = "patterns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    checkin_id = Column(Integer, ForeignKey("daily_checkins.id", ondelete="CASCADE"), nullable=True)
    window_days = Column(Integer, default=7)
    sleep_delta_pct = Column(Float, default=0.0)
    stress_delta_pct = Column(Float, default=0.0)
    energy_delta_pct = Column(Float, default=0.0)
    screen_delta_pct = Column(Float, default=0.0)
    wellness_state = Column(String, default="STABLE")  # STABLE, NEEDS_ATTENTION, RECOVERY_NEEDED
    dominant_signals = Column(Text, default="[]")  # JSON encoded list of strings
    summary_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="patterns")
    checkin = relationship("DailyCheckin", back_populates="patterns")
    interventions = relationship("Intervention", back_populates="pattern", cascade="all, delete-orphan")

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pattern_id = Column(Integer, ForeignKey("patterns.id", ondelete="CASCADE"), nullable=True)
    category = Column(String, default="general_recovery")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    actions = Column(Text, nullable=False)  # JSON string of actions
    reflection_prompt = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interventions")
    pattern = relationship("Pattern", back_populates="interventions")
    results = relationship("InterventionResult", back_populates="intervention", cascade="all, delete-orphan")

class InterventionResult(Base):
    __tablename__ = "intervention_results"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reflection_answer = Column(Text, nullable=True)
    time_spent_mins = Column(Integer, default=20)
    before_state = Column(String, default="NEEDS_ATTENTION")
    after_state = Column(String, default="STABLE")
    outcome = Column(String, default="improved")  # improved, no_change, worsened
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    intervention = relationship("Intervention", back_populates="results")

class CampusAggregate(Base):
    __tablename__ = "campus_aggregates"

    id = Column(Integer, primary_key=True, index=True)
    institution_name = Column(String, default="NUTECH University", index=True)
    date_window = Column(String, default="Current Term")
    total_students = Column(Integer, default=45)
    avg_wellbeing_pct = Column(Float, default=72.0)
    sleep_concern_pct = Column(Float, default=28.0)
    academic_stress_pct = Column(Float, default=35.0)
    burnout_risk_pct = Column(Float, default=14.0)
    top_stressors = Column(Text, default='["Late Night Studying", "Exam Load", "Digital Screen Overuse"]')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
