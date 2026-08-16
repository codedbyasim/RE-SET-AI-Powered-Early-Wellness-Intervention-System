import React, { useState } from 'react';
import {
  BarChart3, TableIcon, Sparkles, Activity, Moon, Zap,
  Smartphone, ShieldCheck, Search, Flame, TrendingUp, TrendingDown,
  Minus, Heart, Target, ChevronUp, ChevronDown
} from 'lucide-react';
import { WeeklyInsights } from '../types';

interface InsightsProps {
  insights: WeeklyInsights | null;
  onOpenWhatChanged: () => void;
}

export const Insights: React.FC<InsightsProps> = ({ insights, onOpenWhatChanged }) => {
  const [activeMetric, setActiveMetric] = useState<'sleep' | 'stress' | 'mood' | 'readiness'>('readiness');

  const scoreColor = (v: number) => v >= 70 ? '#10b981' : v >= 45 ? '#f59e0b' : '#ef4444';
  const stressColor = (v: number) => v <= 4 ? '#10b981' : v <= 7 ? '#f59e0b' : '#ef4444';
  const moodColor = (v: number) => v >= 4 ? '#818cf8' : v >= 3 ? '#f59e0b' : '#ef4444';

  const stateConfig = {
    STABLE: { label: 'Stable', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', Icon: TrendingUp },
    NEEDS_ATTENTION: { label: 'Needs Attention', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', Icon: Minus },
    RECOVERY_NEEDED: { label: 'Recovery Needed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', Icon: TrendingDown },
  };

  if (!insights?.has_sufficient_data) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh] px-4">
        <div className="glass-card rounded-3xl p-10 max-w-md text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <BarChart3 className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Weekly Insights</h2>
            <p className="text-sm text-slate-400 mt-2">
              {insights?.ai_synthesized_takeaway || 'Complete at least 2 daily check-ins to see your trend data.'}
            </p>
          </div>
          <div className="p-4 rounded-2xl text-xs text-slate-400 text-left space-y-2"
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-semibold text-slate-300">What you'll unlock:</p>
            <p>📊 7-day recovery readiness chart</p>
            <p>🤖 Personalized AI wellness insight</p>
            <p>📈 Mood, sleep & stress trend analysis</p>
            <p>🔍 "Why do I feel different?" deep dive</p>
          </div>
        </div>
      </div>
    );
  }

  const r = insights.readiness;
  const pts = insights.daily_points;
  const state = insights.current_state as keyof typeof stateConfig;
  const stateInfo = stateConfig[state] || stateConfig.STABLE;
  const StateIcon = stateInfo.Icon;

  // Compute streak from consecutive dates
  const streak = (() => {
    if (!pts || pts.length === 0) return 0;
    // pts are sorted by date ascending
    let count = 1;
    for (let i = pts.length - 1; i > 0; i--) {
      const curr = new Date(pts[i].date);
      const prev = new Date(pts[i - 1].date);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1.5) count++;
      else break;
    }
    return count;
  })();

  // Trend helpers
  const getTrend = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mid = Math.floor(arr.length / 2);
    const first = arr.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const second = arr.slice(mid).reduce((a, b) => a + b, 0) / (arr.length - mid);
    return second - first;
  };

  const sleepTrend = getTrend(pts.map(p => p.sleep_hours));
  const stressTrend = getTrend(pts.map(p => p.stress));
  const moodTrend = getTrend(pts.map(p => p.mood));

  // Chart config per metric
  const metricConfigs = {
    sleep: { label: 'Sleep (hrs)', max: Math.max(...pts.map(p => p.sleep_hours), 9), color: '#818cf8', getValue: (p: typeof pts[0]) => p.sleep_hours, format: (v: number) => `${v}h` },
    stress: { label: 'Stress (1-10)', max: 10, color: '#ef4444', getValue: (p: typeof pts[0]) => p.stress, format: (v: number) => `${v}/10` },
    mood: { label: 'Mood (1-5)', max: 5, color: '#a78bfa', getValue: (p: typeof pts[0]) => p.mood, format: (v: number) => `${v}/5` },
    readiness: { label: 'Readiness (/100)', max: 100, color: '#10b981', getValue: (p: typeof pts[0]) => p.readiness_score, format: (v: number) => `${v}` },
  };
  const mc = metricConfigs[activeMetric];

  const TrendIcon = ({ val, invert = false }: { val: number; invert?: boolean }) => {
    const positive = invert ? val < 0 : val > 0;
    const negative = invert ? val > 0 : val < 0;
    if (positive) return <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (negative) return <ChevronDown className="w-3.5 h-3.5 text-rose-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-label mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Behavioral Analytics · {pts.length}-Day History
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Weekly Wellness Signals</h1>
          <p className="text-sm text-slate-400 mt-1">Recovery Readiness Composite Index · NUTECH University</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          {streak >= 2 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Flame className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-black text-amber-300">{streak}-Day Streak</p>
                <p className="text-[10px] text-slate-500">Keep going!</p>
              </div>
            </div>
          )}
          <button onClick={onOpenWhatChanged} className="btn-primary shrink-0">
            <Search className="w-4 h-4" />
            Why different?
          </button>
        </div>
      </div>

      {/* State + AI Takeaway row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current State */}
        <div className="rounded-3xl p-5 flex flex-col justify-between space-y-3"
          style={{ background: stateInfo.bg, border: `1px solid ${stateInfo.border}` }}>
          <div className="section-label" style={{ color: stateInfo.color }}>
            <StateIcon className="w-3.5 h-3.5" />
            Current Wellness State
          </div>
          <div>
            <p className="text-2xl font-black" style={{ color: stateInfo.color }}>{stateInfo.label}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insights.dominant_pattern}</p>
          </div>
        </div>

        {/* AI Takeaway — spans 2 cols */}
        <div className="sm:col-span-2 rounded-3xl p-6 space-y-2"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,23,42,0.8))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="section-label" style={{ color: '#818cf8' }}>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI Coach Insight
          </div>
          <p className="text-base sm:text-lg text-slate-100 font-semibold leading-relaxed">
            "{insights.ai_synthesized_takeaway}"
          </p>
        </div>
      </div>

      {/* Quick trend stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sleep Trend', val: `${Math.abs(sleepTrend).toFixed(1)}h`, trend: sleepTrend, invert: false, color: '#818cf8', Icon: Moon },
          { label: 'Stress Trend', val: `${Math.abs(stressTrend).toFixed(1)} pts`, trend: stressTrend, invert: true, color: '#f59e0b', Icon: Zap },
          { label: 'Mood Trend', val: `${Math.abs(moodTrend).toFixed(1)} pts`, trend: moodTrend, invert: false, color: '#a78bfa', Icon: Heart },
        ].map(s => (
          <div key={s.label} className="metric-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              <s.Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <div className="flex items-center gap-1.5">
              <TrendIcon val={s.trend} invert={s.invert} />
              <span className="text-xl font-black" style={{ color: s.color }}>{s.val}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {Math.abs(s.trend) < 0.1 ? 'No change' : s.trend > 0 !== s.invert ? 'Improving' : 'Declining'}
            </p>
          </div>
        ))}
      </div>

      {/* Recovery Readiness */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Recovery Readiness Composite Index
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sleep 25% · Stress 25% · Energy 20% · Activity 15% · Digital 15%
            </p>
          </div>
          <div className="flex items-baseline gap-1.5 shrink-0 px-5 py-2.5 rounded-2xl"
            style={{ background: `${scoreColor(r.overall_score)}12`, border: `1px solid ${scoreColor(r.overall_score)}35` }}>
            <span className="text-4xl font-black" style={{ color: scoreColor(r.overall_score) }}>
              {r.overall_score}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Sleep',    val: r.sleep_consistency, color: '#818cf8', Icon: Moon },
            { label: 'Stress',  val: r.stress_trend,      color: '#f59e0b', Icon: Zap },
            { label: 'Energy',  val: r.energy_level,      color: '#10b981', Icon: Activity },
            { label: 'Digital', val: r.digital_balance,   color: '#38bdf8', Icon: Smartphone },
            { label: 'Activity',val: r.activity_balance,  color: '#14b8a6', Icon: Target },
          ].map(s => (
            <div key={s.label} className="metric-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
                <s.Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.val}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          {(r as any).disclaimer || 'Calculated from your personal check-in data only.'}
        </p>
      </div>

      {/* Interactive Chart */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            {pts.length}-Day Trend Visualization
          </h3>

          {/* Metric selector */}
          <div className="flex p-1 rounded-xl gap-1 flex-wrap"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['readiness', 'sleep', 'stress', 'mood'] as const).map(m => (
              <button key={m} onClick={() => setActiveMetric(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={activeMetric === m
                  ? { background: 'rgba(30,41,59,0.9)', color: '#fff' }
                  : { color: '#64748b' }
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 sm:gap-3 h-48 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {pts.map((p, i) => {
            const val = mc.getValue(p);
            const pct = (val / mc.max) * 100;
            const col = activeMetric === 'readiness' ? scoreColor(val)
                      : activeMetric === 'stress' ? stressColor(val)
                      : activeMetric === 'mood' ? moodColor(val)
                      : mc.color;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-[10px] text-white font-black">{mc.format(val)}</span>
                </div>
                <div className="relative w-full flex justify-center">
                  <div
                    className="rounded-t-xl transition-all duration-700 w-4/5"
                    style={{
                      height: `${Math.max(pct * 1.6, 6)}px`,
                      background: col,
                      opacity: 0.85,
                      boxShadow: `0 0 12px ${col}40`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{p.day_name}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: mc.color }} />
            {mc.label} — hover bars for values
          </span>
          <span>Min: {Math.min(...pts.map(mc.getValue)).toFixed(1)} · Max: {Math.max(...pts.map(mc.getValue)).toFixed(1)}</span>
        </div>

        {/* Data table */}
        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b text-slate-500 uppercase text-[10px] tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Day', 'Sleep', 'Stress', 'Mood', 'Readiness'].map(h => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pts.map((p, i) => (
                <tr key={i} className="border-b hover:bg-white/3 transition" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3 font-bold text-white">{p.day_name} <span className="text-slate-500 font-normal text-[10px]">{p.date}</span></td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#818cf8' }}>{p.sleep_hours}h</td>
                  <td className="px-4 py-3 font-bold" style={{ color: stressColor(p.stress) }}>{p.stress}/10</td>
                  <td className="px-4 py-3 font-bold" style={{ color: moodColor(p.mood) }}>{p.mood}/5</td>
                  <td className="px-4 py-3 font-black" style={{ color: scoreColor(p.readiness_score) }}>
                    {p.readiness_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
