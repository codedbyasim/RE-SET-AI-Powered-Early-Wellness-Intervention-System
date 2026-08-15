import React, { useState } from 'react';
import {
  Smile, Moon, Zap, Smartphone, Tag, MessageSquare,
  Sparkles, CheckCircle2, ArrowRight, Shield, Activity,
  Clock, HeartPulse, Brain, ChevronRight
} from 'lucide-react';
import { CheckinSubmission } from '../types';
import { submitDailyCheckin } from '../api';

interface CheckInProps {
  onCheckinSuccess: (result: any) => void;
  onGoToReset: () => void;
  onCrisisTrigger: (safety: any) => void;
  userName?: string;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Drained', color: '#ef4444' },
  { value: 2, emoji: '🥱', label: 'Tired',   color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Neutral',  color: '#94a3b8' },
  { value: 4, emoji: '😌', label: 'Calm',     color: '#06b6d4' },
  { value: 5, emoji: '😊', label: 'Great',    color: '#10b981' },
];

const ENERGY_OPTIONS = [
  { value: 'low',    label: 'Low',    desc: 'Barely getting by' },
  { value: 'medium', label: 'Medium', desc: 'Functioning okay'  },
  { value: 'high',   label: 'High',   desc: 'Feeling energized' },
];

const DAY_TAGS = ['Normal', 'Productive', 'Relaxing', 'Overwhelming', 'Exhausting'];

export const CheckIn: React.FC<CheckInProps> = ({
  onCheckinSuccess, onGoToReset, onCrisisTrigger, userName
}) => {
  const [mood, setMood]           = useState(3);
  const [stress, setStress]       = useState(5);
  const [sleepHours, setSleep]    = useState(7.0);
  const [energy, setEnergy]       = useState('medium');
  const [screenTime, setScreen]   = useState(4.0);
  const [dayTag, setDayTag]       = useState('Normal');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<any>(null);

  // Live readiness score
  const liveScore = Math.round(Math.min(100, Math.max(0,
    0.25 * Math.min(100, (sleepHours / 8) * 100) +
    0.25 * ((11 - stress) * 10) +
    0.20 * (energy === 'high' ? 90 : energy === 'medium' ? 60 : 30) +
    0.15 * 70 +
    0.15 * (screenTime <= 3 ? 90 : screenTime <= 6 ? 65 : 35)
  )));

  const scoreColor = liveScore >= 70 ? '#10b981' : liveScore >= 45 ? '#f59e0b' : '#ef4444';
  const stressLabel = stress <= 3 ? 'Low' : stress <= 6 ? 'Moderate' : stress <= 8 ? 'High' : 'Extreme';
  const stressColor = stress <= 3 ? '#10b981' : stress <= 6 ? '#f59e0b' : '#ef4444';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CheckinSubmission = {
        mood, stress, sleep_hours: sleepHours,
        energy, screen_time_hours: screenTime,
        day_tag: dayTag,
        free_text_note: note.trim() || undefined,
      };
      const res = await submitDailyCheckin(payload);
      if (res.safety?.is_crisis) {
        onCrisisTrigger(res.safety);
      } else {
        setResult(res);
        onCheckinSuccess(res);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── RESULT VIEW ──────────────────────────────────────────────────
  if (result) {
    const state = result.pattern?.wellness_state || 'STABLE';
    const stateConfig = {
      STABLE: { label: 'Routine Stable', cls: 'badge-stable', emoji: '✅' },
      NEEDS_ATTENTION: { label: 'Needs Attention', cls: 'badge-attention', emoji: '⚡' },
      RECOVERY_NEEDED: { label: 'Recovery Needed', cls: 'badge-recovery', emoji: '🔴' },
    }[state] || { label: 'Stable', cls: 'badge-stable', emoji: '✅' };

    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        
        {/* Success Header */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Check-In Analyzed!</h2>
              <p className="text-sm text-slate-400">AI pipeline has processed your signals</p>
            </div>
          </div>
          <span className={stateConfig.cls}>
            {stateConfig.emoji} {stateConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pattern summary */}
          {result.pattern?.summary_text && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <div className="section-label">
                <Brain className="w-3.5 h-3.5" />
                Pattern Agent Observation
              </div>
              <p className="text-slate-100 leading-relaxed">
                "{result.pattern.summary_text}"
              </p>
            </div>
          )}

          {/* RESET plan preview */}
          {result.intervention && (
            <div className="glass-card rounded-3xl p-6 space-y-3"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(15,23,42,0.7))', borderColor: 'rgba(99,102,241,0.2)' }}>
              <div className="section-label" style={{ color: '#818cf8' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Today's RESET Plan Generated
              </div>
              <h3 className="text-base font-bold text-white">{result.intervention.title}</h3>
              <p className="text-xs text-slate-400">{result.intervention.description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button onClick={() => setResult(null)} className="btn-secondary">
            ← Edit Today's Check-In
          </button>
          <button onClick={onGoToReset} className="btn-primary px-8 py-3.5">
            Start Today's RESET
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── FORM VIEW ────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Banner (first-time UX) */}
      {!localStorage.getItem('reset_seen_welcome') && (
        <div className="mb-6 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 animate-slide-up relative"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.06))', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="p-3 rounded-2xl shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">Welcome to RE:SET 👋</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              RE:SET detects early burnout by analyzing 6 daily signals through a pipeline of AI agents. 
              Fill in today's check-in below — it takes under 30 seconds. Based on your responses, 
              6 cooperating AI agents will generate a personalized 15-minute micro-recovery routine called your <strong className="text-emerald-400">RESET Plan</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {[
                { emoji: '🧠', text: '6 AI Agents' },
                { emoji: '⏱️', text: '30-second check-in' },
                { emoji: '🔒', text: 'No sensors, no tracking' },
              ].map(b => (
                <span key={b.text} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 px-2.5 py-1.5 rounded-xl"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {b.emoji} {b.text}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { localStorage.setItem('reset_seen_welcome', '1'); }}
            className="text-slate-500 hover:text-slate-300 text-xs font-semibold shrink-0 transition mt-1"
            aria-label="Dismiss welcome message"
          >
            Got it ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="section-label mb-2">
          <HeartPulse className="w-3.5 h-3.5" />
          Daily Biological & Lifestyle Check-In
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          {userName ? `Hey ${userName.split(' ')[0]}, how are you feeling?` : 'How are you feeling today?'}
        </h1>
        <p className="text-slate-400 mt-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Takes under 30 seconds · Analyzed by 6 AI agents
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Mood */}
          <div className="glass-card rounded-3xl p-6">
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-4">
              <Smile className="w-4 h-4 text-emerald-400" />
              1. Overall mood right now
            </label>
            <div className="grid grid-cols-5 gap-3">
              {MOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(opt.value)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
                    mood === opt.value
                      ? 'scale-[1.06] shadow-lg'
                      : 'opacity-70 hover:opacity-90'
                  }`}
                  style={mood === opt.value
                    ? { background: `${opt.color}18`, border: `1.5px solid ${opt.color}50`, boxShadow: `0 4px 20px ${opt.color}25` }
                    : { background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)' }
                  }
                >
                  <span className="text-3xl sm:text-4xl">{opt.emoji}</span>
                  <span className="text-xs font-semibold text-slate-200">{opt.label}</span>
                  {mood === opt.value && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: opt.color }}>
                      <span className="text-white text-[8px] font-black">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Stress + 3. Sleep (2-col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Stress */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                  2. Stress Level
                </label>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black"
                  style={{ background: `${stressColor}18`, color: stressColor, border: `1px solid ${stressColor}40` }}>
                  {stress}/10 · {stressLabel}
                </span>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                value={stress}
                onChange={e => setStress(+e.target.value)}
                className="slider w-full"
                aria-label={`Stress level: ${stress} out of 10 — ${stressLabel}`}
                aria-valuemin={1} aria-valuemax={10} aria-valuenow={stress}
                style={{ accentColor: stressColor }}
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 — Very Calm</span>
                <span>10 — Overwhelmed</span>
              </div>
            </div>

            {/* Sleep */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-white">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  3. Sleep Last Night
                </label>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black text-indigo-300"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  {sleepHours.toFixed(1)} hrs
                </span>
              </div>
              <input
                type="range" min="0" max="14" step="0.5"
                value={sleepHours}
                onChange={e => setSleep(+e.target.value)}
                className="slider w-full"
                aria-label={`Sleep hours last night: ${sleepHours} hours`}
                aria-valuemin={0} aria-valuemax={14} aria-valuenow={sleepHours}
                style={{ accentColor: '#818cf8' }}
              />
              <p className="text-[10px] text-slate-500">Target for recovery: 7.5–9.0 hours</p>
            </div>
          </div>

          {/* 4. Energy + 5. Screen Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Energy */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white">
                <Activity className="w-4 h-4 text-emerald-400" />
                4. Physical Energy Level
              </label>
              <div className="space-y-2">
                {ENERGY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEnergy(opt.value)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left"
                    style={energy === opt.value
                      ? { background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.4)', color: '#10b981' }
                      : { background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }
                    }
                  >
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.desc}</p>
                    </div>
                    {energy === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen + Day Tag */}
            <div className="space-y-4">
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-white">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    5. Screen Time
                  </label>
                  <span className="text-xs font-black text-sky-300">{screenTime.toFixed(1)} hrs</span>
                </div>
                <input
                  type="range" min="0" max="14" step="0.5"
                  value={screenTime}
                  onChange={e => setScreen(+e.target.value)}
                  className="slider w-full"
                  style={{ accentColor: '#38bdf8' }}
                />
              </div>

              <div className="glass-card rounded-3xl p-5 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-white">
                  <Tag className="w-4 h-4 text-teal-400" />
                  6. Describe Today
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAY_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setDayTag(tag)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
                      style={dayTag === tag
                        ? { background: 'rgba(20,184,166,0.15)', border: '1.5px solid rgba(20,184,166,0.4)', color: '#2dd4bf' }
                        : { background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }
                      }
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Note */}
          <div className="glass-card rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-white">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                7. Optional note or context
              </label>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <Shield className="w-3 h-3" />
                Safety Agent Active
              </span>
            </div>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any assignments due, sleep disruptions, or thoughts on your mind? (optional)"
              className="form-input resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                AI Agents Analyzing Your Signals...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Submit Check-In & Generate RESET Plan
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* ── Right: Live Readiness Card ── */}
        <div className="space-y-5">
          
          {/* Live Score Gauge */}
          <div className="glass-card rounded-3xl p-6 space-y-4 sticky top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Live Readiness Estimate
            </p>

            {/* Circular gauge */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${liveScore * 3.14} 314`}
                    style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{liveScore}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                </div>
              </div>
            </div>

            {/* Signal breakdown */}
            <div className="space-y-2.5">
              {[
                { label: 'Sleep Quality',    val: Math.min(100, (sleepHours/8)*100),     color: '#818cf8' },
                { label: 'Stress Control',   val: (11-stress)*10,                        color: '#f59e0b' },
                { label: 'Energy Level',     val: energy==='high'?90:energy==='medium'?60:30, color: '#10b981' },
                { label: 'Digital Balance',  val: screenTime<=3?90:screenTime<=6?65:35,  color: '#38bdf8' },
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{s.label}</span>
                    <span className="font-bold" style={{ color: s.color }}>{Math.round(s.val)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${s.val}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Updates live as you adjust sliders. This is a behavioral estimate — not a clinical measurement.
            </p>
          </div>

          {/* AI agents list */}
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <p className="text-xs font-bold text-white">6 AI Agents Activate on Submit:</p>
            <div className="space-y-1.5">
              {[
                { name: 'Safety Agent',          color: '#ef4444' },
                { name: 'Pattern Agent',          color: '#10b981' },
                { name: 'Risk/Trend Agent',       color: '#f59e0b' },
                { name: 'Personalization Agent',  color: '#6366f1' },
                { name: 'Intervention Agent',     color: '#06b6d4' },
                { name: 'Reflection Agent',       color: '#8b5cf6' },
              ].map(a => (
                <div key={a.name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                  <span className="text-[11px] text-slate-400">{a.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
