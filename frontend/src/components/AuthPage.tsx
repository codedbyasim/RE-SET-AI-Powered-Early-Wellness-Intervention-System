import React, { useState } from 'react';
import {
  Sparkles, Mail, Lock, User, Building2, Eye, EyeOff,
  ArrowRight, HeartPulse, Shield, Zap, Brain, CheckCircle2
} from 'lucide-react';
import { loginUser, registerUser } from '../api';

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!fullName.trim()) { setError('Please enter your full name.'); return; }
      if (!university.trim()) { setError('Please enter your university name.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await loginUser(email, password);
        onAuthSuccess(data.user);
      } else {
        const data = await registerUser(email, password, fullName.trim(), university.trim());
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, label: 'AI-Powered Insights', desc: '6 cooperating AI agents analyze your daily signals' },
    { icon: HeartPulse, label: 'Daily Wellness Tracking', desc: 'Under 30 seconds — stress, sleep, mood & energy' },
    { icon: Shield, label: 'Privacy First', desc: 'No sensors, no selling data — you own everything' },
    { icon: Zap, label: 'Micro-Recovery Plans', desc: 'Personalized 15-min RESET routines, every day' },
  ];

  return (
    <div className="min-h-screen auth-bg flex">

      {/* ─── LEFT PANEL: Branding (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[58%] flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        
        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">RE:SET</span>
            <span className="ml-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-400 uppercase tracking-wider">
              Student Wellness AI
            </span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="z-10 space-y-6">
          <div className="space-y-3">
            <div className="section-label">
              <Sparkles className="w-4 h-4" />
              Early Wellness Intervention System
            </div>
            <h1 className="text-5xl xl:text-6xl font-black leading-tight">
              <span className="text-white">Your daily</span>
              <br />
              <span className="gradient-text">recovery engine</span>
              <br />
              <span className="text-white">starts here.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-lg">
              RE:SET uses 6 cooperating AI agents to detect burnout early and deliver 
              personalized micro-recovery routines — before small stressors become big problems.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-card p-4 rounded-2xl space-y-1.5"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-white">{f.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { stat: '< 30s', label: 'Daily check-in time' },
              { stat: '6 AI', label: 'Cooperating agents' },
              { stat: '100%', label: 'Privacy protected' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-black text-emerald-400">{s.stat}</p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom disclaimer */}
        <p className="text-xs text-slate-600 z-10">
          Not a clinical tool. RE:SET observes lifestyle patterns to support student wellbeing.
        </p>
      </div>

      {/* ─── RIGHT PANEL: Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-[420px] animate-slide-up">
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <Sparkles className="w-4.5 h-4.5 text-slate-950" />
            </div>
            <span className="text-lg font-black text-white">RE:SET</span>
          </div>

          {/* Form Card */}
          <div className="glass rounded-3xl p-8 space-y-6 border border-white/8"
            style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)' }}>
            
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">
                {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
              </h2>
              <p className="text-sm text-slate-400">
                {mode === 'login'
                  ? 'Sign in to continue your wellness journey'
                  : 'Join RE:SET and start your recovery routine today'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 rounded-2xl gap-1"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    mode === m
                      ? 'text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={mode === m
                    ? { background: 'linear-gradient(135deg, #10b981, #06b6d4)' }
                    : {}}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl text-xs text-rose-300 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <>
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Ali Hassan"
                        className="form-input pl-10"
                      />
                    </div>
                  </div>

                  {/* University */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">University / Institution *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={university}
                        onChange={e => setUniversity(e.target.value)}
                        placeholder="e.g. FAST National University"
                        className="form-input pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password * {mode === 'register' && <span className="text-slate-500 font-normal">(min. 6 characters)</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="form-input pl-10"
                    />
                    {confirmPassword && password === confirmPassword && (
                      <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              )}

              {/* Privacy note for register */}
              {mode === 'register' && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  By creating an account, you agree that RE:SET stores only the data you voluntarily provide. 
                  No sensors, no tracking, no selling. You can delete all data anytime.
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'login' ? 'Sign In to RE:SET' : 'Start My Wellness Journey'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600 mt-6">
            RE:SET is a behavioral wellness tool, not a medical or clinical service.
          </p>

        </div>
      </div>

    </div>
  );
};
