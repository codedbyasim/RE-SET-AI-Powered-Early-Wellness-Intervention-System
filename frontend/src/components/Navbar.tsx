import React from 'react';
import {
  Sparkles, CalendarCheck, RotateCcw, BarChart3,
  Building2, Shield, LogOut, Database, User2
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

const navItems = [
  { id: 'checkin',  label: 'Daily Check-In',   Icon: CalendarCheck },
  { id: 'reset',    label: "Today's RESET",     Icon: RotateCcw     },
  { id: 'insights', label: 'Weekly Insights',   Icon: BarChart3     },
  { id: 'campus',   label: 'Campus Mode',       Icon: Building2     },
  { id: 'privacy',  label: 'Data & Privacy',    Icon: Shield        },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab, onSelectTab, user, onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <button
            onClick={() => onSelectTab('checkin')}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <Sparkles className="w-4.5 h-4.5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">RE:SET</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-500/40 text-emerald-400 uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5 hidden lg:block">
                Student Wellness Engine
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4 flex-1">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                className={`nav-tab ${currentTab === id ? 'active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5 ml-auto">

            {/* DB status pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Supabase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* User profile */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {user.full_name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-white leading-none">{user.full_name}</p>
                    <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">{user.university_name}</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
