import React from 'react';
import { Sparkles, TrendingDown, TrendingUp, X, ShieldCheck, BarChart3 } from 'lucide-react';
import { WhatChangedData } from '../types';

interface WhatChangedProps {
  data: WhatChangedData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatChanged: React.FC<WhatChangedProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 animate-slide-up overflow-y-auto max-h-[90vh]"
        style={{ background: '#0f172a', border: '1px solid rgba(56,189,248,0.25)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <BarChart3 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">"What Changed?" Diagnostic</h2>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8' }}>
                  Signature
                </span>
              </div>
              <p className="text-xs text-slate-400">{data.comparison_period || 'Current 7 days vs personal baseline'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white transition shrink-0"
            style={{ background: 'rgba(30,41,59,0.6)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Contributor */}
        <div className="p-5 rounded-2xl space-y-2"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.06), rgba(99,102,241,0.06))', border: '1px solid rgba(56,189,248,0.2)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Primary Behavioral Driver</p>
          <h3 className="text-base font-bold text-white">{data.top_contributor}</h3>
          {data.ai_narrative && (
            <p className="text-sm text-slate-300 leading-relaxed">"{data.ai_narrative}"</p>
          )}
        </div>

        {/* Factor Breakdown */}
        {data.factors?.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Observed Deviations from Baseline</p>
            {data.factors.map((f, i) => (
              <div key={i} className="p-4 rounded-2xl flex items-center justify-between gap-3"
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{f.signal_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black"
                      style={f.direction === 'worsening'
                        ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
                        : { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                      }>
                      {f.delta_display}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{f.explanation}</p>
                </div>
                {f.direction === 'worsening'
                  ? <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
                  : <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                }
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-300">{data.disclaimer}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              RE:SET analyzes self-reported signals to highlight lifestyle correlations only.
            </p>
          </div>
        </div>

        <button onClick={onClose} className="btn-secondary w-full justify-center py-3">
          Close Analysis
        </button>
      </div>
    </div>
  );
};
