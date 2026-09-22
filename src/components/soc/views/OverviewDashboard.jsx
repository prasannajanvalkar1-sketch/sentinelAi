import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, ShieldAlert, ShieldCheck, 
  AlertTriangle, Lock, TrendingUp, Cpu, Terminal, 
  Search, Download, X, SearchCode
} from 'lucide-react';

const KPICard = ({ title, value, subValue, icon: Icon, colorClass, highlightClass }) => (
  <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-${colorClass}-500/30 transition-colors`}>
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${colorClass}-500/10 rounded-full blur-xl group-hover:bg-${colorClass}-500/20 transition-all`} />
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      <Icon className={`w-5 h-5 text-${colorClass}-400`} />
    </div>
    <div className="flex items-end justify-between">
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      {subValue && (
        <span className={`text-[10px] font-medium ${highlightClass} flex items-center px-1.5 py-0.5 rounded`}>
          {subValue}
        </span>
      )}
    </div>
  </div>
);

export default function OverviewDashboard({ metrics, incidents, handleInspect, playSound }) {
  const getSeverityStyle = (sev) => {
    switch(sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse';
      case 'HIGH': return 'bg-amber-500/10 text-amber-400 border-amber-500/50';
      case 'MEDIUM': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50';
      case 'LOW': return 'bg-slate-500/10 text-slate-400 border-slate-600/50';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-600/50';
    }
  };

  const getThreatsBlockedPercent = () => {
    if (!metrics.totalThreats) return "100%";
    return Math.round((metrics.threatsNeutralized / metrics.totalThreats) * 100) + "%";
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 relative custom-scrollbar">
      {/* 1. KPI METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Users" value={metrics.totalUsers?.toLocaleString() || '0'} 
          subValue={<><TrendingUp className="w-3 h-3 mr-1"/> +12 this month</>}
          icon={Users} colorClass="indigo" highlightClass="text-indigo-400 bg-indigo-500/10"
        />
        <KPICard 
          title="Active Sessions" value={metrics.activeSessions || '0'} 
          subValue={<><Activity className="w-3 h-3 mr-1"/> Live</>}
          icon={Activity} colorClass="cyan" highlightClass="text-cyan-400 bg-cyan-500/10"
        />
        <KPICard 
          title="Threats Detected" value={metrics.totalThreats || '0'} 
          subValue="Today"
          icon={ShieldAlert} colorClass="rose" highlightClass="text-rose-400 bg-rose-500/10"
        />
        <KPICard 
          title="Threats Blocked" value={metrics.threatsNeutralized?.toLocaleString() || '0'} 
          subValue={`${getThreatsBlockedPercent()} success`}
          icon={ShieldCheck} colorClass="emerald" highlightClass="text-emerald-400 bg-emerald-500/10"
        />
        <KPICard 
          title="Critical Alerts" value={metrics.criticalAlerts || '0'} 
          subValue="Requires Action"
          icon={AlertTriangle} colorClass="red" highlightClass="text-red-400 bg-red-500/10 font-bold"
        />
        <KPICard 
          title="Failed Authentications" value={metrics.failedAuths || '0'} 
          subValue="MFA/Passwords"
          icon={Lock} colorClass="amber" highlightClass="text-amber-400 bg-amber-500/10"
        />
        <KPICard 
          title="Risk Score" value={`${metrics.riskScore || '0'}%`} 
          subValue="Environment Risk"
          icon={TrendingUp} colorClass="orange" highlightClass="text-orange-400 bg-orange-500/10"
        />
        <KPICard 
          title="System Health" value={`${metrics.systemHealth || '0'}%`} 
          subValue="All Engines Online"
          icon={Cpu} colorClass="emerald" highlightClass="text-emerald-400 bg-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 2. CENTRAL REAL-TIME THREAT STREAM */}
        <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[500px] overflow-hidden relative shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-slate-200 tracking-tight flex items-center">Live Threat Monitor</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-[10px] font-mono px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 hover:bg-slate-700 transition-colors flex items-center"><Search className="w-3 h-3 mr-1"/> Filter</button>
              <button className="text-[10px] font-mono px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 hover:bg-slate-700 transition-colors flex items-center"><Download className="w-3 h-3 mr-1"/> Export Log</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-12 gap-2 p-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/50 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
                <div className="col-span-2">Timestamp & ID</div>
                <div className="col-span-2">Severity & Status</div>
                <div className="col-span-3">User & Target</div>
                <div className="col-span-2">Vector & IP</div>
                <div className="col-span-3 text-right">Response Action</div>
              </div>
              
              <AnimatePresence initial={false}>
                {incidents.map((inc) => (
                  <motion.div 
                    key={inc.id}
                    initial={{ opacity: 0, y: -20, backgroundColor: 'rgba(99,102,241,0.1)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-12 gap-2 p-3 text-sm items-center border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="col-span-2 text-xs font-mono text-slate-400">
                      {inc.timestamp}<br/>
                      <span className="text-[9px] text-slate-600">{inc.id}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${getSeverityStyle(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <br/>
                      <span className="text-[9px] font-mono text-emerald-400 mt-1 inline-block">BLOCKED</span>
                    </div>
                    <div className="col-span-3 text-xs">
                      <p className="font-medium text-indigo-300 truncate">{inc.target}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Role: EMPLOYEE</p>
                    </div>
                    <div className="col-span-2 text-xs font-mono text-slate-400 truncate">
                      <span className="text-rose-400 block truncate">{inc.vector}</span>
                      {inc.sourceIp}
                    </div>
                    <div className="col-span-3 flex items-center justify-end space-x-2">
                      <span className="text-[9px] text-slate-500 font-mono text-right mr-2 truncate max-w-[120px] hidden sm:block">
                        {inc.action || "Sandbox Terminated"}
                      </span>
                      <button onClick={() => handleInspect(inc)} className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded hover:bg-indigo-500/20 transition-colors tooltip" title="Investigate Event">
                        <SearchCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {incidents.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">No live threats detected in the current session.</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 3. THREAT ANALYTICS CHARTS */}
        <div className="flex flex-col space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl h-[240px] flex flex-col">
            <h3 className="font-bold text-slate-200 tracking-tight text-sm mb-4">Attack Distribution</h3>
            <div className="flex-1 relative w-full h-full flex items-center justify-center">
               <div className="w-32 h-32 rounded-full border-[16px] border-slate-800 relative">
                  {/* Mock Donut Segments */}
                  <div className="absolute inset-[-16px] rounded-full border-[16px] border-indigo-500/80" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 80%)' }}></div>
                  <div className="absolute inset-[-16px] rounded-full border-[16px] border-rose-500/80" style={{ clipPath: 'polygon(50% 50%, 0 80%, 0 0, 30% 0)' }}></div>
                  <div className="absolute inset-[-16px] rounded-full border-[16px] border-amber-500/80" style={{ clipPath: 'polygon(50% 50%, 30% 0, 100% 0)' }}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">{metrics.totalThreats || 0}</span>
                    <span className="text-[9px] font-mono text-slate-500">ATTACKS</span>
                  </div>
               </div>
               <div className="ml-6 space-y-2">
                 <div className="flex items-center text-[10px] font-mono text-slate-300"><div className="w-2 h-2 bg-indigo-500 rounded mr-2"></div> Phishing (65%)</div>
                 <div className="flex items-center text-[10px] font-mono text-slate-300"><div className="w-2 h-2 bg-rose-500 rounded mr-2"></div> Ransomware (20%)</div>
                 <div className="flex items-center text-[10px] font-mono text-slate-300"><div className="w-2 h-2 bg-amber-500 rounded mr-2"></div> Brute Force (15%)</div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl h-[236px] flex flex-col">
            <h3 className="font-bold text-slate-200 tracking-tight text-sm mb-4">Threat Activity (24h)</h3>
            <div className="flex-1 relative w-full h-full flex items-end">
              <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradientRose" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,90 Q40,40 80,85 T160,20 T240,80 T320,10 T400,85 L400,100 L0,100 Z" fill="url(#gradientRose)" />
                <path d="M0,90 Q40,40 80,85 T160,20 T240,80 T320,10 T400,85" fill="none" stroke="#f43f5e" strokeWidth="2.5" className="drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
                <circle cx="160" cy="20" r="4" fill="#fff" className="animate-pulse" />
                <circle cx="320" cy="10" r="4" fill="#fff" className="animate-pulse" />
              </svg>
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-slate-600 w-full"></div>
                <div className="border-t border-slate-600 w-full"></div>
                <div className="border-t border-slate-600 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
