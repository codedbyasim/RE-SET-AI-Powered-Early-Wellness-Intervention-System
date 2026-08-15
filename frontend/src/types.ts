export type WellnessState = 'STABLE' | 'NEEDS_ATTENTION' | 'RECOVERY_NEEDED';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
  university_name: string;
  campus_opt_in: boolean;
  created_at: string;
}

export interface ResetAction {
  id: number;
  title: string;
  duration_mins: number;
  icon: string;
  description: string;
  is_done?: boolean;
}

export interface Intervention {
  id: number;
  category: string;
  title: string;
  description?: string;
  actions: ResetAction[];
  reflection_prompt: string;
  is_completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface PatternData {
  id: number;
  window_days: number;
  sleep_delta_pct: number;
  stress_delta_pct: number;
  energy_delta_pct: number;
  screen_delta_pct: number;
  wellness_state: WellnessState;
  dominant_signals: string[];
  summary_text?: string;
  created_at: string;
}

export interface SafetyResponse {
  is_crisis: boolean;
  message?: string;
  resources?: Array<{
    name: string;
    contact: string;
    description: string;
  }>;
}

export interface DailyPoint {
  date: string;
  day_name: string;
  mood: number;
  stress: number;
  sleep_hours: number;
  readiness_score: number;
}

export interface ReadinessBreakdown {
  overall_score: number;
  sleep_consistency: number;
  stress_trend: number;
  energy_level: number;
  activity_balance: number;
  digital_balance: number;
  disclaimer: string;
}

export interface WeeklyInsights {
  has_sufficient_data: boolean;
  daily_points: DailyPoint[];
  readiness: ReadinessBreakdown;
  ai_synthesized_takeaway: string;
  dominant_pattern?: string;
  current_state: WellnessState;
}

export interface ContributingFactor {
  signal_name: string;
  delta_display: string;
  direction: 'worsening' | 'improving' | 'neutral';
  impact_weight: number;
  explanation: string;
}

export interface WhatChangedData {
  has_sufficient_history: boolean;
  comparison_period: string;
  top_contributor: string;
  factors: ContributingFactor[];
  ai_narrative: string;
  disclaimer: string;
}

export interface CampusMetrics {
  institution_name: string;
  is_cohort_eligible: boolean;
  total_opted_in_students: number;
  minimum_cohort_required: number;
  avg_wellbeing_pct: number;
  sleep_concern_pct: number;
  academic_stress_pct: number;
  burnout_risk_pct: number;
  top_stressors: string[];
  weekly_trend: Array<{
    week: string;
    wellbeing: number;
    stress: number;
    sleep_concern: number;
  }>;
  privacy_guarantee: string;
}

export interface CheckinSubmission {
  mood: number;
  stress: number;
  sleep_hours: number;
  energy: string;
  screen_time_hours?: number;
  day_tag?: string;
  free_text_note?: string;
}
