import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Play, Pause, RotateCcw, CheckCircle2, Circle,
  Sparkles, RefreshCw, Award, Moon, Sun, Wind, Coffee,
  Activity, Edit3, Zap, Headphones, ChevronRight, Compass
} from 'lucide-react';
import { Intervention, ResetAction } from '../types';
import { completeIntervention, regenerateIntervention } from '../api';

interface ResetPlanProps {
  intervention: Intervention | null;
  onPlanUpdated: (i: Intervention) => void;
  onGoToCheckin: () => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  moon: Moon, sun: Sun, wind: Wind, coffee: Coffee,
  activity: Activity, 'edit-3': Edit3, zap: Zap,
  headphones: Headphones, sparkles: Sparkles,
};

const ActionIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const Icon = ICON_MAP[name] || Sparkles;
  return <Icon className={className || 'w-5 h-5'} />;
};

export const ResetPlan: React.FC<ResetPlanProps> = ({
  intervention, onPlanUpdated, onGoToCheckin,
}) => {
  const [doneIds, setDoneIds]           = useState<number[]>([]);
  const [reflection, setReflection]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Timer
  const [activeId, setActiveId]         = useState<number | null>(null);
  const [seconds, setSeconds]           = useState(0);
  const [totalSecs, setTotalSecs]       = useState(0);
  const [running, setRunning]           = useState(false);
  const intervalRef                     = useRef<any>(null);

  useEffect(() => {
    if (intervention?.actions) {
      setDoneIds(intervention.actions.filter(a => a.is_done).map(a => a.id));
    }
  }, [intervention]);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds(s => s - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      if (running && seconds === 0 && activeId !== null) {
        setRunning(false);
        playChime();
        setDoneIds(p => p.includes(activeId) ? p : [...p, activeId]);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds, activeId]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (_) {}
  };

  const startTimer = (action: ResetAction) => {
    const secs = (action.duration_mins || 5) * 60;
    setActiveId(action.id);
    setTotalSecs(secs);
    setSeconds(secs);
    setRunning(true);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const pct = totalSecs > 0 ? (seconds / totalSecs) * 100 : 0;
  const circumference = 2 * Math.PI * 50;

  const handleComplete = async () => {
    if (!intervention) return;
    setSubmitting(true);
    try {
      const res = await completeIntervention(intervention.id, reflection || 'Completed.', 20);
      // confetti
      try {
        const { default: confetti } = await import('canvas-confetti');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}
      onPlanUpdated({ ...intervention, is_completed: true, completed_at: res.completed_at || new Date().toISOString() });
    } catch (_) {
      alert('Error completing plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!intervention) return;
    setRegenerating(true);
    try {
      const updated = await regenerateIntervention(intervention.id);
      onPlanUpdated(updated);
      setDoneIds([]);
      setRunning(false);
      setActiveId(null);
    } catch (_) {
      alert('Could not regenerate.');
    } finally {
      setRegenerating(false);
    }
  };

  // ── EMPTY STATE ──────────────────────────────────────────────────
  if (!intervention) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh] px-4">
        <div className="glass-card rounded-3xl p-10 max-w-md text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Compass className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">No RESET Plan Yet</h2>
            <p className="text-sm text-slate-400 mt-2">
              Complete your daily check-in and the AI will generate a personalized micro-recovery routine.
            </p>
          </div>
          <button onClick={onGoToCheckin} className="btn-primary mx-auto">
            Go to Daily Check-In <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const allDone = intervention.actions?.every(a => doneIds.includes(a.id) || intervention.is_completed);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
              style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.3)', color: '#2dd4bf' }}>
              {intervention.category.replace(/_/g, ' ')}
            </span>
            {intervention.is_completed && (
              <span className="badge-stable">✓ Completed</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{intervention.title}</h1>
          <p className="text-sm text-slate-400 max-w-2xl">{intervention.description}</p>
        </div>

        {!intervention.is_completed && (
          <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        )}
      </div>

      {/* ── Active Timer Banner ── */}
      {activeId !== null && (
        <div className="rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 animate-fade-in"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))', border: '1px solid rgba(16,185,129,0.25)' }}>
          
          {/* SVG circular timer */}
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="#10b981" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white font-mono">{fmt(seconds)}</span>
              <span className="text-[9px] text-slate-400">remaining</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Active Step Timer</p>
            <h3 className="text-lg font-black text-white mt-0.5">
              {intervention.actions.find(a => a.id === activeId)?.title}
            </h3>
            <p className="text-xs text-slate-400">Focus on completing this single recovery action.</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setRunning(r => !r)}
              className="btn-primary px-5 py-2.5"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => { setSeconds(totalSecs); setRunning(false); }}
              className="btn-secondary p-2.5"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Action Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {intervention.actions?.map((action, idx) => {
          const isDone    = doneIds.includes(action.id) || intervention.is_completed;
          const isActive  = activeId === action.id;

          return (
            <div key={action.id ?? idx}
              className={`rounded-3xl p-5 space-y-4 transition-all duration-300 ${isDone ? 'opacity-70' : ''}`}
              style={isActive
                ? { background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.35)', boxShadow: '0 0 30px rgba(16,185,129,0.1)' }
                : { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              {/* Card header */}
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <ActionIcon name={action.icon} className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-semibold">{action.duration_mins} min</span>
                </div>
              </div>

              {/* Title + description */}
              <div>
                <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                  {action.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{action.description}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <button
                  onClick={() => setDoneIds(p => p.includes(action.id) ? p.filter(x => x !== action.id) : [...p, action.id])}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                  style={{ color: isDone ? '#10b981' : '#64748b' }}
                >
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <Circle className="w-4 h-4" />
                  }
                  {isDone ? 'Done' : 'Mark done'}
                </button>

                {!isDone && !intervention.is_completed && (
                  <button
                    onClick={() => startTimer(action)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={isActive && running
                      ? { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }
                      : { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
                    }
                  >
                    <Play className="w-3 h-3" />
                    {isActive && running ? 'Running…' : 'Start'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Reflection ── */}
      <div className="glass-card rounded-3xl p-6 space-y-3">
        <div className="section-label">
          <Sparkles className="w-3.5 h-3.5" />
          Closing Reflection
        </div>
        <p className="text-slate-100 font-semibold">"{intervention.reflection_prompt}"</p>
        <textarea
          rows={2}
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          disabled={intervention.is_completed}
          placeholder="Write a quick reflection before completing…"
          className="form-input resize-none"
        />
      </div>

      {/* ── Complete CTA ── */}
      {!intervention.is_completed ? (
        <button
          onClick={handleComplete}
          disabled={submitting}
          className="btn-primary w-full py-4 text-base"
        >
          <Award className="w-5 h-5" />
          {submitting ? 'Saving Completion…' : 'Complete Today\'s RESET 🎉'}
        </button>
      ) : (
        <div className="rounded-3xl p-6 text-center space-y-2"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-black text-white">RESET Completed! Great work.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tomorrow's check-in will analyze whether this routine correlated with better sleep and reduced stress.
          </p>
        </div>
      )}

    </div>
  );
};
