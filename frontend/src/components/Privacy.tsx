import React, { useState } from 'react';
import { Shield, Download, Trash2, EyeOff, Lock, CheckCircle2, FileText, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { UserProfile } from '../types';
import { getAuthToken, deleteAccount } from '../api';

const API_BASE = '/api/v1';

interface PrivacyProps {
  user: UserProfile | null;
  onAccountDeleted: () => void;
}

export const Privacy: React.FC<PrivacyProps> = ({ user, onAccountDeleted }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [campusOptIn, setCampusOptIn] = useState(user?.campus_opt_in ?? false);
  const [optInLoading, setOptInLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ── Export: fetch with auth header, trigger blob download ──────
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/privacy/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reset_my_data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // ── Campus opt-in toggle ────────────────────────────────────────
  const handleCampusToggle = async () => {
    setOptInLoading(true);
    try {
      const token = getAuthToken();
      const newValue = !campusOptIn;
      const res = await fetch(`${API_BASE}/campus/opt-in?opt_in=${newValue}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toggle failed');
      setCampusOptIn(newValue);
    } catch (_) {
      alert('Could not update campus preference.');
    } finally {
      setOptInLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      onAccountDeleted();
    } catch (_) {
      alert('Error deleting account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const commitments = [
    { Icon: EyeOff,       color: '#38bdf8', title: 'No Data Selling',      desc: 'Your check-in responses are never monetized or shared with advertisers.' },
    { Icon: Lock,          color: '#10b981', title: 'Zero Hardware Access', desc: 'RE:SET never requests camera, microphone, location, or biometrics.' },
    { Icon: CheckCircle2,  color: '#14b8a6', title: 'Non-Diagnostic',      desc: 'AI observes lifestyle patterns only — no clinical diagnosis is made.' },
    { Icon: FileText,      color: '#818cf8', title: 'k-Anonymity',         desc: 'Campus Mode only shows data when ≥ 20 students participate.' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <div className="section-label mb-1.5">
          <Shield className="w-3.5 h-3.5" />
          Your Data & Privacy Controls
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy & Data Ownership</h1>
        <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
          You are in full control of your wellness data. We collect only what is strictly needed to detect patterns and generate your recovery plans.
        </p>
      </div>

      {/* User info card */}
      {user && (
        <div className="glass-card rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{user.full_name}</p>
            <p className="text-xs text-slate-400">{user.email} · {user.university_name}</p>
          </div>
        </div>
      )}

      {/* Commitments Grid */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-white">Our Privacy Commitments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {commitments.map(c => (
            <div key={c.title} className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-2 rounded-xl shrink-0"
                style={{ background: `${c.color}12`, border: `1px solid ${c.color}25` }}>
                <c.Icon className="w-4 h-4" style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{c.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Mode Opt-In */}
      <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Campus Wellness Analytics</h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Contribute your anonymized aggregated signals to your university's wellness dashboard. 
            Your individual data is never exposed — only cohort-level averages (k ≥ 20 students).
          </p>
          <p className="text-[11px] font-semibold mt-1" style={{ color: campusOptIn ? '#10b981' : '#64748b' }}>
            {campusOptIn ? '✓ You are opted in to Campus Mode' : 'You are opted out of Campus Mode'}
          </p>
        </div>
        <button
          onClick={handleCampusToggle}
          disabled={optInLoading}
          aria-label={campusOptIn ? 'Opt out of campus analytics' : 'Opt in to campus analytics'}
          aria-pressed={campusOptIn}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 disabled:opacity-50"
          style={campusOptIn
            ? { background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.4)', color: '#10b981' }
            : { background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8' }
          }
        >
          {campusOptIn ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {optInLoading ? 'Saving…' : campusOptIn ? 'Opted In' : 'Opt In'}
        </button>
      </div>

      {/* Export Data */}
      <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Export Your Data Archive</h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Download a complete JSON export of all your check-ins, patterns, and RESET results from Supabase.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          aria-label="Download your data as a JSON file"
          className="btn-secondary shrink-0 disabled:opacity-50"
        >
          <Download className={`w-4 h-4 text-emerald-400 ${exportLoading ? 'animate-bounce' : ''}`} />
          {exportLoading ? 'Preparing…' : 'Download JSON'}
        </button>
      </div>

      {/* Delete Account */}
      <div className="rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-rose-300">Permanently Delete Account</h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Erase your profile and cascade-delete all data from Supabase. This is immediate and irreversible.
          </p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          aria-label="Delete your account and all data permanently"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-rose-300 transition-all shrink-0"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="w-full max-w-md rounded-3xl p-8 space-y-5 animate-slide-up"
            style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-black text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you absolutely sure? This will permanently delete your account, all check-ins, patterns, and RESET records from Supabase. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: '#dc2626' }}
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting…' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
