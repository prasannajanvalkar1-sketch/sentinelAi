import React, { useState, useEffect } from 'react';
import { 
  Shield, Menu, Bell, Volume2, VolumeX, LogOut 
} from 'lucide-react';

export default function SOCHeader({ 
  sidebarOpen, setSidebarOpen, 
  soundEnabled, setSoundEnabled, 
  adminUser, onLogout 
}) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold tracking-tight text-white leading-tight">
              SENTINEL<span className="text-indigo-400">AI</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">SECURITY OPERATIONS CENTER</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3 ml-6 pl-6 border-l border-slate-800">
          <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono">SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full border border-cyan-500/30 text-cyan-400">
            <span className="text-[10px] font-mono">AI ACTIVE</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full border border-indigo-500/30 text-indigo-400">
            <span className="text-[10px] font-mono">ZERO TRUST ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden lg:block text-[11px] font-mono text-slate-400">
          {currentDateTime}
        </div>

        <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
          <button 
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors relative tooltip"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-slate-900"></span>
          </button>
          
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            title={soundEnabled ? "Mute Alarms" : "Unmute Alarms"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
          </button>

          <div className="h-8 w-8 rounded-lg bg-indigo-900 border border-indigo-700 flex items-center justify-center cursor-pointer relative group ml-2">
            <span className="text-xs font-bold text-indigo-200">
              {adminUser?.name?.charAt(0) || 'A'}
            </span>
            <div className="absolute right-0 top-10 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50">
              <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{adminUser?.name || 'Admin'}</p>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{adminUser?.email || 'admin@sentinel.ai'}</p>
              </div>
              <button onClick={onLogout} className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded-lg flex items-center space-x-2">
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
