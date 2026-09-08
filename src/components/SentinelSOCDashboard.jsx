import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search,
  Bell,
  Volume2, 
  VolumeX, 
  Lock,
  LogOut,
  Menu,
  X,
  Activity,
  Crosshair,
  Server,
  Database,
  Cpu,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Eye,
  Trash2,
  PieChart,
  BarChart2,
  TrendingUp,
  Zap,
  Globe,
  Download,
  Send,
  AlertCircle,
  Brain
} from 'lucide-react';

/**
 * SentinelAI Administrative Security Operations Center (SOC) Incident Command Center
 * Ultra-modern dark-glass cybersecurity aesthetic.
 */
export default function SentinelSOCDashboard({ session, onLogout }) {
  const adminUser = session?.user || {
    name: localStorage.getItem('sentinel_user_name') || 'SOC Lead Analyst',
    email: localStorage.getItem('sentinel_user_email') || 'admin.soc@sentinel.ai',
    role: 'admin',
    department: 'Security Operations (SOC)'
  };

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [threatLevel, setThreatLevel] = useState('DEFCON 5');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [metrics, setMetrics] = useState({
    threatsNeutralized: 1428,
    mttd: 1.8,
    highRiskEndpoints: 3,
    activeVectors: { email: 58, sms: 24, hijack: 18 }
  });

  const [incidents, setIncidents] = useState([
    {
      id: 'INC-2026-901',
      timestamp: new Date().toLocaleTimeString(),
      severity: 'CRITICAL',
      vector: 'Session Hijack',
      target: 'Finance Lead (Node A)',
      sourceIp: '198.51.100.44 (RU)',
      action: 'Blocked',
    },
    {
      id: 'INC-2026-902',
      timestamp: new Date().toLocaleTimeString(),
      severity: 'HIGH',
      vector: 'Credential Spray',
      target: 'API Gateway',
      sourceIp: '203.0.113.12 (CN)',
      action: 'Rate Limited',
    },
    {
      id: 'INC-2026-903',
      timestamp: new Date().toLocaleTimeString(),
      severity: 'MEDIUM',
      vector: 'Typosquatting',
      target: 'hr-portal-internal.net',
      sourceIp: 'Unknown (Tor)',
      action: 'Flagged',
    }
  ]);

  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Audio Context
  const audioCtxRef = useRef(null);
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'high') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'action') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Live Data Simulator
  useEffect(() => {
    const vectors = ['Phishing', 'DDoS', 'Credential Spray', 'Session Hijack', 'Malware Drop', 'SQL Injection'];
    const severities = ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const targets = ['API Gateway', 'DB Cluster 02', 'Finance Portal', 'HR Dashboard', 'Exec Mailbox', 'Node-alpha'];
    const actions = ['Blocked', 'Quarantined', 'Flagged', 'Rate Limited'];

    const interval = setInterval(() => {
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        playSound(severity.toLowerCase());
        if (severity === 'CRITICAL') setThreatLevel('DEFCON 1');
        else if (threatLevel === 'DEFCON 5') setThreatLevel('DEFCON 3');
      }

      const newIncident = {
        id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString(),
        severity,
        vector: vectors[Math.floor(Math.random() * vectors.length)],
        target: targets[Math.floor(Math.random() * targets.length)],
        sourceIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.X`,
        action: actions[Math.floor(Math.random() * actions.length)],
      };

      setIncidents(prev => [newIncident, ...prev].slice(0, 50));
      
      setMetrics(prev => ({
        ...prev,
        threatsNeutralized: prev.threatsNeutralized + (severity === 'CRITICAL' ? 0 : 1)
      }));

    }, 5500);

    return () => clearInterval(interval);
  }, [threatLevel, soundEnabled]); // Rebind when sound toggle changes

  // Auto-reset Threat Level if no criticals for 15s
  useEffect(() => {
    if (threatLevel === 'DEFCON 5') return;
    const to = setTimeout(() => setThreatLevel('DEFCON 5'), 15000);
    return () => clearTimeout(to);
  }, [threatLevel]);

  const handleInspect = (inc) => {
    playSound('action');
    setSelectedIncident(inc);
    setInspectModalOpen(true);
  };

  const getSeverityStyle = (sev) => {
    switch(sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse';
      case 'HIGH': return 'bg-amber-500/10 text-amber-400 border-amber-500/50';
      case 'MEDIUM': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50';
      case 'LOW': return 'bg-slate-500/10 text-slate-400 border-slate-600/50';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-600/50';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-tight text-white leading-tight">
                Sentinel<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">SOC Command v2.6</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3 ml-6 pl-6 border-l border-slate-800">
            <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-300">MESH NETWORK: ONLINE</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-300">ENGINES: 4/4</span>
            </div>
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all duration-500 ${
              threatLevel === 'DEFCON 1' ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-400' :
              threatLevel === 'DEFCON 3' ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-amber-400' :
              'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono font-bold tracking-widest">{threatLevel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden lg:flex relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search IPs, CVEs, Hashes (Ctrl+K)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg pl-9 pr-4 py-2 w-72 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600 font-mono"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Ctrl K</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
            <button 
              onClick={() => { setSoundEnabled(!soundEnabled); playSound('action'); }}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors relative"
              title={soundEnabled ? "Mute Alarms" : "Unmute Alarms"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>
            
            <button className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-400 transition-colors group">
              <Lock className="w-3.5 h-3.5 group-hover:animate-pulse" />
              <span className="text-[11px] font-mono font-bold">LOCKDOWN</span>
            </button>

            <div className="h-8 w-8 rounded-lg bg-indigo-900 border border-indigo-700 flex items-center justify-center cursor-pointer relative group">
              <span className="text-xs font-bold text-indigo-200">
                {adminUser.name.charAt(0)}
              </span>
              <div className="absolute right-0 top-10 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50">
                <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-white truncate">{adminUser.name}</p>
                  <p className="text-[10px] text-indigo-400 font-mono mt-0.5">SecOps Tier 3 Lead</p>
                </div>
                <button onClick={onLogout} className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded-lg flex items-center space-x-2">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Terminate Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. COLLAPSIBLE LEFT SIDEBAR */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-slate-800 bg-slate-900/30 shrink-0 overflow-y-auto flex flex-col"
            >
              <div className="p-4 space-y-1">
                {[
                  { id: 'overview', icon: Activity, label: 'Overview & Telemetry' },
                  { id: 'feed', icon: Terminal, label: 'Live Incident Feed', badge: incidents.filter(i => i.severity === 'CRITICAL').length || null },
                  { id: 'matrix', icon: Crosshair, label: 'Threat Matrix & MITRE' },
                  { id: 'sim', icon: Brain, label: 'AI Simulation Manager' },
                  { id: 'quarantine', icon: ShieldAlert, label: 'Quarantine & Policy' },
                  { id: 'audit', icon: Database, label: 'Audit Logs' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); playSound('action'); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 3. MAIN DASHBOARD AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 relative">
          
          {/* A. KPI METRICS STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Threats Neutralized</span>
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-white tracking-tight">{metrics.threatsNeutralized.toLocaleString()}</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><TrendingUp className="w-3 h-3 mr-1"/> +14%</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Mean Time to Detect (MTTD)</span>
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-white tracking-tight">{metrics.mttd}s</span>
                <span className="text-[10px] text-slate-500 font-mono">AI-Assisted</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">High-Risk Endpoints</span>
                <Server className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-white tracking-tight">{metrics.highRiskEndpoints}</span>
                <button className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/30 hover:bg-rose-500/30 transition-colors">Drill Down &rarr;</button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Active Attack Vectors</span>
                <Globe className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Email Spoof</span>
                  <span className="text-amber-400">58%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden"><div className="bg-amber-500 h-full w-[58%]"></div></div>
                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <span className="text-slate-300">SMSishing</span>
                  <span className="text-amber-400">24%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* B. CENTRAL REAL-TIME THREAT STREAM */}
            <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[500px] overflow-hidden relative shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <h3 className="font-bold text-slate-200 tracking-tight flex items-center">Live Telemetry & Alert Feed</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-[10px] font-mono px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 hover:bg-slate-700 transition-colors flex items-center"><Search className="w-3 h-3 mr-1"/> Filter</button>
                  <button className="text-[10px] font-mono px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 hover:bg-slate-700 transition-colors flex items-center"><Download className="w-3 h-3 mr-1"/> Export Log</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-12 gap-2 p-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/50 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-2">Severity</div>
                    <div className="col-span-3">Vector & Target</div>
                    <div className="col-span-2">Source IP</div>
                    <div className="col-span-3 text-right">Triage Actions</div>
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
                        </div>
                        <div className="col-span-3 text-xs">
                          <p className="font-semibold text-slate-300 truncate">{inc.vector}</p>
                          <p className="text-[10px] text-slate-500 truncate">{inc.target}</p>
                        </div>
                        <div className="col-span-2 text-xs font-mono text-slate-400 truncate">
                          {inc.sourceIp}
                        </div>
                        <div className="col-span-3 flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleInspect(inc)} className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded hover:bg-indigo-500/20 transition-colors tooltip" title="Inspect Payload">
                            <Search className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => playSound('action')} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-colors" title="Isolate Node">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded hover:bg-slate-700 transition-colors" title="Dismiss / False Positive">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* C. THREAT ANALYTICS HUB */}
            <div className="flex flex-col space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl h-[240px] flex flex-col">
                <h3 className="font-bold text-slate-200 tracking-tight text-sm mb-4">Traffic Anomalies vs Baseline (24h)</h3>
                <div className="flex-1 relative w-full h-full flex items-end">
                  {/* Bespoke SVG Chart Simulation */}
                  <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradientCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="gradientIndigo" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Baseline */}
                    <path d="M0,80 Q50,70 100,75 T200,60 T300,70 T400,65 L400,100 L0,100 Z" fill="url(#gradientCyan)" />
                    <path d="M0,80 Q50,70 100,75 T200,60 T300,70 T400,65" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 4" />
                    {/* Anomalies */}
                    <path d="M0,90 Q40,40 80,85 T160,20 T240,80 T320,10 T400,85 L400,100 L0,100 Z" fill="url(#gradientIndigo)" />
                    <path d="M0,90 Q40,40 80,85 T160,20 T240,80 T320,10 T400,85" fill="none" stroke="#6366f1" strokeWidth="2.5" className="drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
                    {/* Data Points */}
                    <circle cx="160" cy="20" r="4" fill="#fff" className="animate-pulse" />
                    <circle cx="320" cy="10" r="4" fill="#fff" className="animate-pulse" />
                  </svg>
                  {/* Chart Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-t border-slate-600 w-full"></div>
                    <div className="border-t border-slate-600 w-full"></div>
                    <div className="border-t border-slate-600 w-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl h-[236px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-200 tracking-tight text-sm">MITRE ATT&CK Matrix</h3>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300">View Full &rarr;</button>
                </div>
                <div className="grid grid-cols-4 gap-2 flex-1">
                  {['Recon', 'Initial', 'Execute', 'Exfil'].map((col) => (
                    <div key={col} className="flex flex-col space-y-2">
                      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest text-center border-b border-slate-700 pb-1">{col}</div>
                      <div className={`h-8 rounded border flex items-center justify-center text-[10px] font-mono ${Math.random() > 0.5 ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>T1566</div>
                      <div className={`h-8 rounded border flex items-center justify-center text-[10px] font-mono ${Math.random() > 0.7 ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>T1059</div>
                      <div className={`h-8 rounded border flex items-center justify-center text-[10px] font-mono ${Math.random() > 0.5 ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>T1048</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* D. QUICK-ACTION DEFENSE CONSOLE (Bottom Drawer) */}
      <div className="h-14 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-6">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center"><Terminal className="w-3.5 h-3.5 mr-2"/> Defense Console</span>
          <div className="h-4 w-px bg-slate-800"></div>
          
          <div className="flex items-center space-x-2">
            <input type="text" placeholder="Inject IP/Domain to Global Blacklist..." className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded pl-3 pr-2 py-1 w-64 focus:outline-none focus:border-rose-500 font-mono" />
            <button onClick={() => playSound('action')} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-[0_0_10px_rgba(225,29,72,0.3)]">BAN</button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1 rounded border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors">
            <Brain className="w-3.5 h-3.5" />
            <span>Trigger AI Phishing Drill</span>
          </button>
        </div>
      </div>

      {/* INSPECT MODAL */}
      <AnimatePresence>
        {inspectModalOpen && selectedIncident && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-mono text-sm font-bold text-white">Payload Inspector: {selectedIncident.id}</h3>
                </div>
                <button onClick={() => setInspectModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border border-slate-800 rounded-lg p-3 bg-slate-950">
                  <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Vector</p>
                    <p className="text-sm font-bold text-indigo-300">{selectedIncident.vector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Severity</p>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border inline-block mt-0.5 ${getSeverityStyle(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1.5">Raw Telemetry Headers</p>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                    <pre>{JSON.stringify({
                      source_ip: selectedIncident.sourceIp,
                      target_entity: selectedIncident.target,
                      action_taken: selectedIncident.action,
                      ai_confidence: "98.4%",
                      mitre_tactic: "T1566: Phishing"
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end space-x-3">
                <button onClick={() => setInspectModalOpen(false)} className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors">Close</button>
                <button onClick={() => { playSound('action'); setInspectModalOpen(false); }} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/20 transition-all flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Isolate & Quarantine
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
