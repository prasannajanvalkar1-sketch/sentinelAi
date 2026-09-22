import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, Terminal, ShieldAlert, Crosshair, 
  Database, Brain, Lock, Server, HardDrive, FileText, 
  Settings, PieChart, Shield
} from 'lucide-react';

export default function SOCSidebar({ isOpen, activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'live-activity', icon: Terminal, label: 'Live Activity' },
    { id: 'threats', icon: ShieldAlert, label: 'Threats' },
    { id: 'attack-analysis', icon: Crosshair, label: 'Attack Analysis' },
    { id: 'sessions', icon: Database, label: 'Sessions' },
    { id: 'authentication', icon: Lock, label: 'Authentication' },
    { id: 'network-security', icon: Server, label: 'Network Security' },
    { id: 'device-security', icon: HardDrive, label: 'Device Security' },
    { id: 'data-security', icon: FileText, label: 'Data Security' },
    { id: 'ai-defense', icon: Brain, label: 'AI Defense' },
    { id: 'audit-logs', icon: Database, label: 'Audit Logs' },
    { id: 'reports', icon: PieChart, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'System Settings' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-r border-slate-800 bg-slate-900/50 shrink-0 overflow-y-auto flex flex-col h-full custom-scrollbar"
        >
          <div className="p-4 space-y-1">
            <div className="mb-4 px-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Menu</span>
            </div>
            
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
