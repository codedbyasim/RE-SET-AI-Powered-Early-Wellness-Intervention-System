import React, { useState, useEffect } from 'react';
import { CalendarCheck, RotateCcw, BarChart3, Building2, Shield, Sparkles } from 'lucide-react';
import { UserProfile, Intervention, WeeklyInsights, WhatChangedData, SafetyResponse } from './types';
import { fetchCurrentUser, fetchTodayIntervention, fetchWeeklyInsights, fetchWhatChanged, clearAuthToken, getAuthToken } from './api';

import { AuthPage }    from './components/AuthPage';
import { Navbar }      from './components/Navbar';
import { CheckIn }     from './components/CheckIn';
import { ResetPlan }   from './components/ResetPlan';
import { Insights }    from './components/Insights';
import { CampusMode }  from './components/CampusMode';
import { Privacy }     from './components/Privacy';
import { WhatChanged } from './components/WhatChanged';
import { CrisisModal } from './components/CrisisModal';

type Tab = 'checkin' | 'reset' | 'insights' | 'campus' | 'privacy';

export function App() {
  const [user,           setUser]           = useState<UserProfile | null>(null);
  const [authChecked,    setAuthChecked]    = useState(false);
  const [tab,            setTab]            = useState<Tab>('checkin');
  const [intervention,   setIntervention]   = useState<Intervention | null>(null);
  const [insights,       setInsights]       = useState<WeeklyInsights | null>(null);
  const [whatChanged,    setWhatChanged]    = useState<WhatChangedData | null>(null);
  const [crisisAlert,    setCrisisAlert]    = useState<SafetyResponse | null>(null);
  const [whatChangedOpen,setWhatChangedOpen]= useState(false);
  const [loading,        setLoading]        = useState(true);

  // ── Initial auth check ────────────────────────────────────────
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(u => {
        setUser(u);
        return loadAppData();
      })
      .catch(() => {
        clearAuthToken();
      })
      .finally(() => {
        setAuthChecked(true);
        setLoading(false);
      });
  }, []);

  const loadAppData = async () => {
    const [plan, ins, wc] = await Promise.allSettled([
      fetchTodayIntervention(),
      fetchWeeklyInsights(),
      fetchWhatChanged(),
    ]);
    if (plan.status === 'fulfilled') setIntervention(plan.value);
    if (ins.status  === 'fulfilled') setInsights(ins.value);
    if (wc.status   === 'fulfilled') setWhatChanged(wc.value);
  };

  const handleAuthSuccess = async (authUser: UserProfile) => {
    setUser(authUser);
    setLoading(true);
    try { await loadAppData(); } catch (_) {}
    setLoading(false);
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    setIntervention(null);
    setInsights(null);
    setWhatChanged(null);
    setTab('checkin');
  };

  const handleCheckinSuccess = async (res: any) => {
    if (res.intervention) setIntervention(res.intervention);
    try {
      const [ins, wc] = await Promise.all([fetchWeeklyInsights(), fetchWhatChanged()]);
      setInsights(ins);
      setWhatChanged(wc);
    } catch (_) {}
  };

  // ── Not auth-checked yet → loading splash ────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <p className="text-sm font-semibold text-slate-400">Loading RE:SET…</p>
        </div>
      </div>
    );
  }

  // ── Not logged in → show full auth page ──────────────────────
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // ── Logged in → main app ─────────────────────────────────────
  const navItems: { id: Tab; label: string; Icon: any }[] = [
    { id: 'checkin',  label: 'Daily Check-In',   Icon: CalendarCheck },
    { id: 'reset',    label: "Today's RESET",     Icon: RotateCcw     },
    { id: 'insights', label: 'Weekly Insights',   Icon: BarChart3     },
    { id: 'campus',   label: 'Campus Mode',       Icon: Building2     },
    { id: 'privacy',  label: 'Data & Privacy',    Icon: Shield        },
  ];

  return (
    <div className="min-h-screen app-bg flex flex-col">

      {/* ── Top Nav ── */}
      <Navbar
        currentTab={tab}
        onSelectTab={t => setTab(t as Tab)}
        user={user}
        onLogout={handleLogout}
      />

      {/* ── Main ── */}
      <main className="flex-1 w-full pb-20 lg:pb-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center animate-pulse"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <p className="text-sm text-slate-400">Loading your wellness data…</p>
            </div>
          </div>
        ) : (
          <>
            {tab === 'checkin' && (
              <CheckIn
                onCheckinSuccess={handleCheckinSuccess}
                onGoToReset={() => setTab('reset')}
                onCrisisTrigger={safety => setCrisisAlert(safety)}
                userName={user.full_name}
              />
            )}
            {tab === 'reset' && (
              <ResetPlan
                intervention={intervention}
                onPlanUpdated={updated => setIntervention(updated)}
                onGoToCheckin={() => setTab('checkin')}
              />
            )}
            {tab === 'insights' && (
              <Insights
                insights={insights}
                onOpenWhatChanged={() => setWhatChangedOpen(true)}
              />
            )}
            {tab === 'campus'  && <CampusMode />}
            {tab === 'privacy' && (
              <Privacy
                user={user}
                onAccountDeleted={() => { handleLogout(); }}
              />
            )}
          </>
        )}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-2 flex justify-around"
        style={{ background: 'rgba(9,15,32,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {navItems.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors"
            style={{ color: tab === id ? '#10b981' : '#64748b' }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* ── Modals ── */}
      <WhatChanged
        data={whatChanged}
        isOpen={whatChangedOpen}
        onClose={() => setWhatChangedOpen(false)}
      />
      <CrisisModal
        safety={crisisAlert}
        onClose={() => setCrisisAlert(null)}
      />

    </div>
  );
}

export default App;
