import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, Users, Moon, Zap, BookOpen, Activity } from 'lucide-react';
import { CampusMetrics } from '../types';
import { fetchCampusMetrics } from '../api';

export const CampusMode: React.FC = () => {
  const [metrics, setMetrics] = useState<CampusMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCampusMetrics()
      .then(data => { setMetrics(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm text-slate-400">Loading campus analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-sm">Unable to load institutional data.</p>
      </div>
    );
  }

  const kCards = [
    { label: 'Overall Wellbeing', val: `${metrics.avg_wellbeing_pct}%`, color: '#10b981', Icon: Activity, trend: '+2.4%', up: true },
    { label: 'Sleep Deficit Rate', val: `${metrics.sleep_concern_pct}%`, color: '#818cf8', Icon: Moon, trend: '< 6h avg', up: false },
    { label: 'Elevated Stress',   val: `${metrics.academic_stress_pct}%`, color: '#f59e0b', Icon: Zap, trend: 'Exam Load', up: false },
    { label: 'Early Burnout Risk', val: `${metrics.burnout_risk_pct}%`, color: '#ef4444', Icon: AlertTriangle, trend: 'Monitored', up: false },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-label mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            {metrics.institution_name} — Campus Analytics
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Campus Wellness Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">Aggregated, anonymized student wellbeing trends</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0 font-bold text-xs text-emerald-300"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          k-Anonymity Enforced · N ≥ 20
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kCards.map(k => (
          <div key={k.label} className="metric-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</span>
              <k.Icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <p className="text-3xl font-black" style={{ color: k.color }}>{k.val}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: k.val, background: k.color }} />
            </div>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              {k.up ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-slate-500" />}
              {k.trend}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly Trend */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            5-Week Wellbeing Trajectory
          </h3>
          <div className="space-y-4">
            {metrics.weekly_trend.map((w, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{w.week}</span>
                  <span className="font-black text-emerald-400">{w.wellbeing}%</span>
                </div>
                <div className="flex gap-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                  <div className="rounded-full" style={{ width: `${w.wellbeing}%`, background: '#10b981' }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {metrics.total_opted_in_students} students opted in · Post-midterm recovery phase
          </p>
        </div>

        {/* Stressors */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Top Campus Stressors
          </h3>
          <div className="space-y-2.5">
            {metrics.top_stressors.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl"
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-semibold text-slate-200">{item}</span>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-2xl text-xs text-slate-400 leading-relaxed"
            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            💡 Evening wind-down workshops before major exams reduce acute burnout signals by ~28%.
          </div>
        </div>

      </div>

      {/* Privacy guarantee */}
      <div className="flex items-start gap-3 p-5 rounded-2xl"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">{metrics.privacy_guarantee}</p>
      </div>

    </div>
  );
};
