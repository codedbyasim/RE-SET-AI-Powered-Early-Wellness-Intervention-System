import React, { useState } from 'react';
import { BarChart3, TableIcon, Sparkles, Activity, Moon, Zap, Smartphone, ShieldCheck, Search } from 'lucide-react';
import { WeeklyInsights } from '../types';

interface InsightsProps {
  insights: WeeklyInsights | null;
  onOpenWhatChanged: () => void;
}

export const Insights: React.FC<InsightsProps> = ({ insights, onOpenWhatChanged }) => {
  const [tableView, setTableView] = useState(false);

  const scoreColor = (v: number) => v >= 70 ? '#10b981' : v >= 45 ? '#f59e0b' : '#ef4444';

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
        </div>
      </div>
    );
  }

  const r = insights.readiness;
  const pts = insights.daily_points;
  const maxSleep = Math.max(...pts.map(p => p.sleep_hours), 8);
  const maxStress = 10;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-label mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Behavioral Analytics & Trend Deltas
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Weekly Wellness Signals</h1>
          <p className="text-sm text-slate-400 mt-1">
            {pts.length}-day history · Recovery Readiness Composite Index
          </p>
        </div>
        <button onClick={onOpenWhatChanged} className="btn-primary shrink-0">
          <Search className="w-4 h-4" />
          Why do I feel different?
        </button>
      </div>

      {/* AI Takeaway */}
      <div className="rounded-3xl p-6 sm:p-8 space-y-2"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,23,42,0.8))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="section-label" style={{ color: '#818cf8' }}>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          AI Synthesized Weekly Takeaway
        </div>
        <p className="text-base sm:text-lg text-slate-100 font-semibold leading-relaxed">
          "{insights.ai_synthesized_takeaway}"
        </p>
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
            { label: 'Stress',   val: r.stress_trend,      color: '#f59e0b', Icon: Zap },
            { label: 'Energy',   val: r.energy_level,      color: '#10b981', Icon: Activity },
            { label: 'Digital',  val: r.digital_balance,   color: '#38bdf8', Icon: Smartphone },
            { label: 'Activity', val: r.activity_balance,  color: '#14b8a6', Icon: Activity },
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
          {r.disclaimer}
        </p>
      </div>

      {/* 7-Day Chart */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            {pts.length}-Day Trend History
          </h3>
          <div className="flex p-1 rounded-xl gap-1"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { view: false, label: 'Chart', Icon: BarChart3 },
              { view: true,  label: 'Table', Icon: TableIcon },
            ].map(b => (
              <button key={b.label} onClick={() => setTableView(b.view)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={tableView === b.view
                  ? { background: 'rgba(30,41,59,0.9)', color: '#fff' }
                  : { color: '#64748b' }
                }
              >
                <b.Icon className="w-3.5 h-3.5" />
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {!tableView ? (
          <div>
            {/* Bar chart */}
            <div className="flex items-end gap-2 sm:gap-4 h-44 border-b border-white/5 pb-3">
              {pts.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition font-mono">
                    {p.sleep_hours}h
                  </span>
                  <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center">
                    <div
                      className="rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${(p.sleep_hours / maxSleep) * 130}px`,
                        background: 'rgba(129,140,248,0.7)',
                        width: '40%',
                        minHeight: 4,
                      }}
                      title={`Sleep: ${p.sleep_hours}h`}
                    />
                    <div
                      className="rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${(p.stress / maxStress) * 130}px`,
                        background: 'rgba(239,68,68,0.6)',
                        width: '40%',
                        minHeight: 4,
                      }}
                      title={`Stress: ${p.stress}/10`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{p.day_name}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(129,140,248,0.7)' }} />
                Sleep (hours)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.6)' }} />
                Stress (1-10)
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/6 text-slate-500 uppercase text-[10px] tracking-wider">
                  {['Date', 'Day', 'Sleep', 'Stress', 'Mood', 'Readiness'].map(h => (
                    <th key={h} className="px-4 py-3 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pts.map((p, i) => (
                  <tr key={i} className="border-b border-white/4 hover:bg-white/3 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">{p.date}</td>
                    <td className="px-4 py-3 font-bold text-white">{p.day_name}</td>
                    <td className="px-4 py-3 font-bold text-indigo-300">{p.sleep_hours}h</td>
                    <td className="px-4 py-3 font-bold text-rose-300">{p.stress}/10</td>
                    <td className="px-4 py-3">{p.mood}/5</td>
                    <td className="px-4 py-3 font-black" style={{ color: scoreColor(p.readiness_score) }}>
                      {p.readiness_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
