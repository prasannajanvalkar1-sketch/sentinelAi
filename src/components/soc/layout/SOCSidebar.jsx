import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, AlertTriangle, 
  Terminal, ShieldCheck, Bell, ShieldAlert
} from 'lucide-react';

export default function SOCSidebar({ isOpen, activeTab, setActiveTab, alertsCount = 0 }) {
  const menuItems = [
    { 
      id: 'dashboard', 
      icon: LayoutDashboard, 
      label: 'Training Overview',
      badge: 'Live'
    },
    { 
      id: 'learners', 
      icon: Users, 
      label: 'Learners (20 Modules)',
      badge: null 
    },
    { 
      id: 'alerts', 
      icon: Bell, 
      label: 'Alerts',
      badge: alertsCount > 0 ? `${alertsCount} New` : null,
      badgeColor: 'rose'
    },
    { 
      id: 'failed-stuck', 
      icon: AlertTriangle, 
      label: 'Failed & Stuck Trainees',
      badge: 'Action' 
    },
    { 
      id: 'live-activity', 
      icon: Terminal, 
      label: 'Live Simulation Feed',
      badge: null 
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 250, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-r border-slate-800 bg-slate-900/60 shrink-0 overflow-y-auto flex flex-col h-full custom-scrollbar"
        >
          <div className="p-4 space-y-1">
            <div className="mb-4 px-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                Training Command
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                20 Modules
              </span>
            </div>
            
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === item.id 
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[inset_0_0_12px_rgba(99,102,241,0.15)] font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                    item.badge === 'Live' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Simulation Engine</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                Prerequisite lock: Video 100% required &rarr; Quiz &rarr; AI Defense Simulation across all 20 Modules.
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
