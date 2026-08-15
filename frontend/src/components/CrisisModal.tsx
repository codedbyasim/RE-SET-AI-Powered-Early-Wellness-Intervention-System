import React from 'react';
import { Heart, Phone, X, AlertTriangle } from 'lucide-react';
import { SafetyResponse } from '../types';

interface CrisisModalProps {
  safety: SafetyResponse | null;
  onClose: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ safety, onClose }) => {
  if (!safety?.is_crisis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(20px)' }}>
      <div className="w-full max-w-lg rounded-3xl p-8 space-y-5 animate-slide-up"
        style={{ background: '#0f172a', border: '2px solid rgba(239,68,68,0.4)', boxShadow: '0 0 60px rgba(239,68,68,0.15), 0 40px 80px rgba(0,0,0,0.6)' }}>

        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl animate-pulse" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Heart className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">We're here with you</h2>
            <p className="text-xs text-rose-300 font-semibold">Free, confidential support — available 24/7</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl text-sm text-slate-200 leading-relaxed"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          {safety.message || "We noticed you may be experiencing severe distress. You don't have to carry this alone. Please reach out — caring professionals are ready right now."}
        </div>

        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Immediate 24/7 Helplines</p>
          {safety.resources?.map((res, i) => (
            <div key={i} className="p-4 rounded-2xl flex items-center justify-between gap-3"
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{res.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>
              </div>
              <a
                href={res.contact.includes('http') ? res.contact : `tel:${res.contact.replace(/[^0-9+]/g, '')}`}
                target={res.contact.includes('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shrink-0"
                style={{ background: '#dc2626' }}
              >
                <Phone className="w-3.5 h-3.5" />
                {res.contact.includes('http') ? 'Visit' : 'Call'}
              </a>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
          <p className="text-[11px] text-slate-500 max-w-xs">
            RE:SET is not a clinical service. If in immediate danger, call local emergency services.
          </p>
          <button onClick={onClose} className="btn-secondary shrink-0">
            Continue to App
          </button>
        </div>

      </div>
    </div>
  );
};
