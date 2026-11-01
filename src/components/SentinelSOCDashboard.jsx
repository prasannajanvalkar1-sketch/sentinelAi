import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, AlertTriangle, CheckCircle2, 
  XCircle, Clock, Video, BookOpen, ShieldCheck, 
  TrendingUp, ArrowUpRight, Search, Play, Pause,
  Download, Filter, ChevronRight, AlertCircle, FileText,
  Terminal, Settings, X, SearchCode, Volume2, VolumeX,
  ExternalLink, Sparkles, Check,
  ShieldAlert, Usb, Camera, Ban, Lock, Unlock, Bell
} from 'lucide-react';
import SOCSidebar from './soc/layout/SOCSidebar';
import SOCHeader from './soc/layout/SOCHeader';
import OverviewDashboard from './soc/views/OverviewDashboard';

// Pure Live Training State (Populated solely from incoming software telemetry)
const INITIAL_TRAINEES = [];
const INITIAL_INCIDENTS = [];

export default function SentinelSOCDashboard({ session, onLogout, onSwitchToPIS, onSwitchToAuth }) {
  const adminUser = session?.user || {
    name: localStorage.getItem('sentinel_user_name') || 'Course Evaluator',
    email: localStorage.getItem('sentinel_user_email') || 'instructor.soc@sentinel.ai',
    role: 'instructor',
    department: 'Cyber Defense Academy'
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Trainees and Live Incidents
  const [trainees, setTrainees] = useState(INITIAL_TRAINEES);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [toastMessage, setToastMessage] = useState(null);

  // Audio Context Ref
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

      if (type === 'critical' || type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'pass') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const showToast = (title, message) => {
    setToastMessage({ title, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute Live Training Metrics directly from real software data
  const computeTrainingMetrics = () => {
    const totalTrainees = trainees.length;
    const completed = trainees.filter(t => t.status === 'COMPLETED' || t.status === 'CERTIFIED' || t.currentModule === 20).length;
    const failed = trainees.filter(t => t.status === 'FAILED').length;
    const stuck = trainees.filter(t => t.status === 'STUCK_VIDEO' || t.status === 'STUCK_INCOMPLETE').length;
    const blocked = trainees.filter(t => t.status === 'BLOCKED' || t.isBlocked).length;
    const inProgress = Math.max(0, totalTrainees - (completed + failed + stuck + blocked));
    const avgScore = totalTrainees > 0 
      ? (trainees.reduce((acc, t) => acc + (t.avgScore || 0), 0) / totalTrainees).toFixed(1)
      : 0.0;

    return {
      traineesToday: totalTrainees,
      avgScoreToday: parseFloat(avgScore),
      completedToday: completed,
      failedToday: failed,
      stuckToday: stuck,
      blockedToday: blocked,
      inProgressToday: inProgress,
      passRate: totalTrainees > 0 ? `${Math.round((completed / totalTrainees) * 100)}%` : "0%",
      totalModules: 20
    };
  };

  const trainingMetrics = computeTrainingMetrics();

  // Filter Security Alerts (USB Insertions, Screenshots, Quarantine blocks)
  const securityAlertsList = incidents.filter(i => 
    i.alert_type === 'USB_DETECTED' || 
    i.alert_type === 'SCREENSHOT_DETECTED' || 
    i.alert_type === 'SECURITY_ALERT' ||
    i.alert_type === 'USER_BLOCKED' ||
    i.vector?.toLowerCase().includes('usb') ||
    i.vector?.toLowerCase().includes('screenshot') ||
    i.vector?.toLowerCase().includes('block')
  );
  const alertsCount = securityAlertsList.length;

  // 1. Fetch Real Telemetry / Training Feed from Backend every 3s
  useEffect(() => {
    let isSubscribed = true;

    const fetchTelemetry = async () => {
      try {
        const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendBase}/api/telemetry/feed/`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data && isSubscribed) {
            if (Array.isArray(data.data.incidents)) {
              if (data.data.incidents.length > 0) {
                const latestInc = data.data.incidents[0];
                if (latestInc.id !== incidents[0]?.id) {
                  if (latestInc.severity === 'CRITICAL' || latestInc.severity === 'HIGH' || latestInc.alert_type === 'USB_DETECTED') {
                    playSound('fail');
                  } else {
                    playSound('action');
                  }
                }
              }
              setIncidents(data.data.incidents);
            }
            if (Array.isArray(data.data.trainees)) {
              setTrainees(data.data.trainees);
            }
          }
        }
      } catch (error) {
        // Backend offline fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [soundEnabled, incidents]);

  // Handle Admin Block / Unblock Trainee Action
  const handleToggleBlockUser = async (rawUsername, currentStatus) => {
    const isBlocked = currentStatus === 'BLOCKED';
    const action = isBlocked ? 'UNBLOCK' : 'BLOCK';
    const reason = isBlocked 
      ? 'Access restored by SOC Admin' 
      : 'Security policy violation: Unauthorized physical USB or Screen capture detected';
    
    // Clean username
    const username = String(rawUsername).replace(/\s*\(.*?\)\s*/g, '').trim();

    try {
      const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendBase}/api/telemetry/block/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action, reason })
      });

      if (res.ok) {
        if (action === 'BLOCK') {
          playSound('fail');
          showToast('User Blocked & Quarantined', `🚨 Trainee '${username}' has been BLOCKED. Client access terminated!`);
        } else {
          playSound('pass');
          showToast('User Unblocked', `✅ Trainee '${username}' access has been restored.`);
        }

        // Immediately update local trainees state
        setTrainees(prev => {
          const exists = prev.some(t => t.name.toLowerCase() === username.toLowerCase() || t.email.toLowerCase() === username.toLowerCase());
          if (!exists && action === 'BLOCK') {
            return [
              {
                id: `LRN-2026-${Math.floor(100 + Math.random() * 900)}`,
                name: username,
                email: `${username.toLowerCase().replace(' ', '')}@platform.live`,
                currentModule: 1,
                totalModules: 20,
                videoWatched: false,
                avgScore: 0.0,
                status: 'BLOCKED',
                isBlocked: true,
                stuckReason: `BLOCKED BY ADMIN: ${reason}`,
                lastActive: 'Just now'
              },
              ...prev
            ];
          }
          return prev.map(t => {
            if (t.name.toLowerCase() === username.toLowerCase() || t.email.toLowerCase() === username.toLowerCase()) {
              return {
                ...t,
                status: action === 'BLOCK' ? 'BLOCKED' : 'IN_PROGRESS',
                isBlocked: action === 'BLOCK',
                stuckReason: action === 'BLOCK' ? `BLOCKED BY ADMIN: ${reason}` : null
              };
            }
            return t;
          });
        });
      }
    } catch (err) {
      console.error('Error toggling block status:', err);
      showToast('Action Notice', `Executed ${action} locally for '${username}'.`);
      setTrainees(prev => prev.map(t => {
        if (t.name.toLowerCase() === username.toLowerCase()) {
          return {
            ...t,
            status: action === 'BLOCK' ? 'BLOCKED' : 'IN_PROGRESS',
            isBlocked: action === 'BLOCK',
            stuckReason: action === 'BLOCK' ? `BLOCKED BY ADMIN: ${reason}` : null
          };
        }
        return t;
      }));
    }
  };

  // Simulate Security Alert for testing (USB or Screenshot)
  const handleSimulateSecurityAlert = async (type) => {
    const studentName = trainees.length > 0 ? trainees[0].name : "Rakesh";
    try {
      const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      await fetch(`${backendBase}/api/telemetry/ingest/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Sentinel-API-Key': 'sk_sentinel_live_938aB'
        },
        body: JSON.stringify({
          username: studentName,
          student_name: studentName,
          event: "SECURITY_ALERT",
          alert_type: type === 'USB' ? "USB_DETECTED" : "SCREENSHOT_DETECTED",
          details: type === 'USB' ? "SanDisk 64GB USB Flash Drive Inserted" : "PrintScreen Screen Capture Attempted",
          severity: type === 'USB' ? "CRITICAL" : "HIGH"
        })
      });
      playSound('fail');
      showToast(
        type === 'USB' ? '🚨 USB Inserted' : '📸 Screenshot Taken',
        `Simulated ${type === 'USB' ? 'USB detection' : 'Screenshot capture'} for '${studentName}'.`
      );
    } catch (e) {
      console.warn('Simulation error:', e);
    }
  };

  // Handle Dynamic Simulation Events triggered from Dashboard
  const handleSimulateEvent = (type) => {
    const timestamp = new Date().toLocaleTimeString();
    let newEvent = null;

    if (type === 'PASS_MODULE') {
      const names = ["Tarun Kapoor", "Shreya Iyer", "Manish Joshi", "Kavita Reddy"];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      const randMod = Math.floor(Math.random() * 18) + 2;
      const score = Math.floor(Math.random() * 21) + 80;

      newEvent = {
        id: `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp,
        severity: "LOW",
        vector: `Module ${randMod} Video & Quiz Passed (${score}%)`,
        target: `${chosenName} (Unlocked M-${randMod + 1})`,
        sourceIp: "192.168.1.55",
        action: "Gate Cleared"
      };

      setTrainees(prev => [
        {
          id: `LRN-2026-${Math.floor(100 + Math.random() * 900)}`,
          name: chosenName,
          email: `${chosenName.toLowerCase().replace(' ', '.')}@techcorp.in`,
          currentModule: randMod + 1,
          totalModules: 20,
          videoWatched: true,
          avgScore: score,
          status: "IN_PROGRESS",
          stuckReason: null,
          lastActive: "Just now"
        },
        ...prev.slice(0, 19)
      ]);

      playSound('pass');
      showToast('Module Cleared', `${chosenName} completed Module ${randMod} (Score: ${score}%). Module ${randMod + 1} unlocked!`);
    } else if (type === 'FAIL_QUIZ') {
      const names = ["Gaurav Singhal", "Nikhil Verma", "Pooja Hegde"];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      const randMod = Math.floor(Math.random() * 15) + 3;
      const score = Math.floor(Math.random() * 15) + 40; // <60%

      newEvent = {
        id: `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp,
        severity: "HIGH",
        vector: `Module ${randMod} Quiz Failed (${score}% < 60%)`,
        target: `${chosenName} (Module ${randMod + 1} Locked)`,
        sourceIp: "192.168.1.62",
        action: "Retake Required"
      };

      setTrainees(prev => [
        {
          id: `LRN-2026-${Math.floor(100 + Math.random() * 900)}`,
          name: chosenName,
          email: `${chosenName.toLowerCase().replace(' ', '.')}@corp.org`,
          currentModule: randMod,
          totalModules: 20,
          videoWatched: true,
          avgScore: score,
          status: "FAILED",
          stuckReason: `Failed Module ${randMod} Quiz (Score ${score}% < 60% Passing Mark)`,
          lastActive: "Just now"
        },
        ...prev.slice(0, 19)
      ]);

      playSound('fail');
      showToast('Quiz Failed', `${chosenName} scored ${score}% on Module ${randMod}. Retake required.`);
    } else if (type === 'STUCK_VIDEO') {
      const names = ["Ritu Sen", "Mohit Chawla", "Bhavna Patel"];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      const randMod = Math.floor(Math.random() * 14) + 2;
      const watchPct = Math.floor(Math.random() * 40) + 15;

      newEvent = {
        id: `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp,
        severity: "MEDIUM",
        vector: `Video Gate Locked: Module ${randMod} (Watched ${watchPct}% < 100%)`,
        target: `${chosenName} (Prerequisite Unmet)`,
        sourceIp: "192.168.1.77",
        action: "Gate Enforced"
      };

      setTrainees(prev => [
        {
          id: `LRN-2026-${Math.floor(100 + Math.random() * 900)}`,
          name: chosenName,
          email: `${chosenName.toLowerCase().replace(' ', '.')}@enterprise.co`,
          currentModule: randMod,
          totalModules: 20,
          videoWatched: false,
          avgScore: 0.0,
          status: "STUCK_VIDEO",
          stuckReason: `Video incomplete (${watchPct}% watched) on Module ${randMod}. Next module locked until 100% finished.`,
          lastActive: "Just now"
        },
        ...prev.slice(0, 19)
      ]);

      playSound('fail');
      showToast('Video Gate Enforced', `${chosenName} has not completed 100% of Module ${randMod} video.`);
    }

    if (newEvent) {
      setIncidents(prev => [newEvent, ...prev.slice(0, 29)]);
    }
  };

  // Render Sub-Views based on activeTab
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <OverviewDashboard 
            trainingMetrics={trainingMetrics}
            trainees={trainees}
            incidents={incidents}
            onSimulateEvent={handleSimulateEvent}
            playSound={playSound}
          />
        );

      case 'learners':
        return (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  All Enrolled Learners (20-Module Tracking)
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Full roster of employees undergoing video instruction, quiz assessments, and defense simulations
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg">
                Total Enrolled: {trainees.length}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">LEARNER NAME</th>
                      <th className="p-3">EMAIL</th>
                      <th className="p-3">PROGRESS (MODULES)</th>
                      <th className="p-3">VIDEO GATE</th>
                      <th className="p-3">AVERAGE SCORE</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {trainees.map((t) => {
                      const isComplete = t.status === 'COMPLETED' || t.status === 'CERTIFIED' || t.currentModule === 20;
                      const isBlocked = t.status === 'BLOCKED' || t.isBlocked;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-bold text-white">{t.name}</td>
                          <td className="p-3 text-slate-400">{t.email}</td>
                          <td className="p-3">
                            <span className="font-bold text-indigo-300">{t.currentModule}/20 Modules</span>
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-full rounded-full ${isBlocked ? 'bg-rose-500' : isComplete ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                                style={{ width: `${(t.currentModule / 20) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            {t.videoWatched ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> 100% Watched
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center">
                                <Video className="w-3 h-3 mr-1" /> Incomplete
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`font-bold ${t.avgScore >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.avgScore}%
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isBlocked ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' :
                              isComplete ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              t.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                              t.status.startsWith('STUCK') ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            }`}>
                              {isBlocked ? '🚫 BLOCKED' : isComplete ? '20/20 COMPLETED' : t.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {isBlocked ? (
                              <button
                                onClick={() => handleToggleBlockUser(t.name, 'BLOCKED')}
                                className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Unlock className="w-3 h-3" /> Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleBlockUser(t.name, 'ACTIVE')}
                                className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" /> Block
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {trainees.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-500 font-mono text-xs">
                          No enrolled learners recorded yet. Waiting for friend's software to send progress events...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'alerts':
        const usbCount = incidents.filter(i => i.alert_type === 'USB_DETECTED' || i.vector?.toLowerCase().includes('usb')).length;
        const ssCount = incidents.filter(i => i.alert_type === 'SCREENSHOT_DETECTED' || i.vector?.toLowerCase().includes('screenshot')).length;
        const blockedCount = trainees.filter(t => t.status === 'BLOCKED' || t.isBlocked).length;

        return (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
            {/* Header with Title and Quick Test Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                      Security Alerts & Intrusion Center (Alart)
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Live notifications: USB Hardware insertions, Screenshot captures, and 1-Click User Lockdown
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Quick Buttons for User Testing */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSimulateSecurityAlert('USB')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5" />
                  Simulate USB Alert
                </button>
                <button
                  onClick={() => handleSimulateSecurityAlert('SCREENSHOT')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Simulate Screenshot Alert
                </button>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-white">{securityAlertsList.length}</div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Total Security Alerts</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Usb className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-rose-400">{usbCount}</div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">USB Storage Detected</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-amber-400">{ssCount}</div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Screenshots Captured</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-rose-400">{blockedCount}</div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Quarantined / Blocked</div>
                </div>
              </div>
            </div>

            {/* Alert Stream Feed & Quick Block Actions */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Live Intrusion & Violation Stream
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  SURVEILLANCE ACTIVE
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">TIME</th>
                      <th className="p-3">TARGET USER</th>
                      <th className="p-3">ALERT TYPE / VIOLATION</th>
                      <th className="p-3">SEVERITY</th>
                      <th className="p-3">CLIENT STATUS</th>
                      <th className="p-3 text-right">ADMIN ENFORCEMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {securityAlertsList.map((alert, idx) => {
                      const isUsb = alert.alert_type === 'USB_DETECTED' || alert.vector?.toLowerCase().includes('usb');
                      const isSs = alert.alert_type === 'SCREENSHOT_DETECTED' || alert.vector?.toLowerCase().includes('screenshot');
                      const username = alert.username || alert.target?.split(' ')[0] || 'Trainee';
                      const traineeObj = trainees.find(t => t.name.toLowerCase() === username.toLowerCase() || t.email.toLowerCase() === username.toLowerCase());
                      const isBlocked = traineeObj?.status === 'BLOCKED' || traineeObj?.isBlocked || alert.action?.includes('BLOCKED');

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {alert.timestamp}
                          </td>
                          <td className="p-3 font-bold text-white">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                                {username.charAt(0)}
                              </div>
                              <span>{username}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              {isUsb ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  <Usb className="w-3.5 h-3.5 text-rose-400" />
                                  USB DETECTED
                                </span>
                              ) : isSs ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  SCREENSHOT DETECTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                                  SECURITY VIOLATION
                                </span>
                              )}
                              <span className="text-slate-300 text-[11px] hidden md:inline">
                                {alert.action || alert.vector}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              alert.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse' :
                              alert.severity === 'HIGH' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                              'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="p-3">
                            {isBlocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-600/80 px-2 py-0.5 rounded animate-pulse">
                                <Lock className="w-3 h-3 text-rose-400" /> BLOCKED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isBlocked ? (
                              <button
                                onClick={() => handleToggleBlockUser(username, 'BLOCKED')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Unblock User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleBlockUser(username, 'ACTIVE')}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-rose-950/50 inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Block User
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {securityAlertsList.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-12 text-center text-slate-500 font-mono">
                          <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                          <p className="text-slate-400 font-semibold">No Security Violations Detected Yet.</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            When your friend's software detects a USB flash drive or Screenshot capture, it will alert here instantly!
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'failed-stuck':
        const failedOrStuck = trainees.filter(t => t.status === 'FAILED' || t.status.startsWith('STUCK') || t.status === 'BLOCKED');

        return (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Failed & Stuck Trainees Triage Center
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Active intervention panel: learners stuck on 100% video gates, failed quizzes, or administrative blocks
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg">
                Action Required: {failedOrStuck.length}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">TRAINEE NAME</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">STOPPED AT</th>
                    <th className="p-3">DIAGNOSTIC REASON</th>
                    <th className="p-3">SCORE</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {failedOrStuck.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-white">{t.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          t.status === 'BLOCKED' ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' :
                          t.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-indigo-300 font-semibold">
                          Module {t.currentModule} / 20
                        </span>
                      </td>
                      <td className="p-3 text-rose-300">
                        {t.stuckReason || `Failed quiz assessment on Module ${t.currentModule}`}
                      </td>
                      <td className="p-3 font-bold text-rose-400">
                        {t.avgScore}%
                      </td>
                      <td className="p-3 text-right">
                        {t.status === 'BLOCKED' ? (
                          <button 
                            onClick={() => handleToggleBlockUser(t.name, 'BLOCKED')}
                            className="px-3 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold"
                          >
                            Unblock User
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              playSound('action');
                              alert(`Sent automated re-engagement reminder & unlock token to ${t.email}`);
                            }}
                            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold"
                          >
                            Send Retake Link
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {failedOrStuck.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 font-mono">
                        No failed, stuck, or blocked trainees found. All active learners have passed their modules!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'live-activity':
        return (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  Live Simulation Activity & Ingress Telemetry Socket
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Raw event packets streamed in real-time from your friend's laptop (video completions, quiz submissions, security violations)
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 space-y-2 h-[550px] overflow-y-auto shadow-2xl custom-scrollbar">
              <div className="text-slate-500 border-b border-slate-900 pb-2">
                # SentinelAI Training Socket Daemon [LISTENING ON 0.0.0.0:8000/api/telemetry/ingest/]
              </div>
              {incidents.map((inc, i) => (
                <div key={i} className="hover:bg-slate-900/40 p-1.5 rounded flex items-start gap-2 border-b border-slate-900/60">
                  <span className="text-slate-600 shrink-0">[{inc.timestamp}]</span>
                  <span className="text-cyan-400 shrink-0">[{inc.id}]</span>
                  <span className={`${inc.severity === 'CRITICAL' ? 'text-rose-400 font-bold' : inc.severity === 'HIGH' ? 'text-amber-400 font-bold' : 'text-emerald-400'} shrink-0`}>
                    {inc.severity}
                  </span>
                  <span className="text-slate-200">{inc.vector}</span>
                  <span className="text-indigo-400 font-bold">&rarr; {inc.target}</span>
                  <span className="text-emerald-400 ml-auto font-bold">[{inc.action}]</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <OverviewDashboard 
            trainingMetrics={trainingMetrics}
            trainees={trainees}
            incidents={incidents}
            onSimulateEvent={handleSimulateEvent}
            playSound={playSound}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      {/* 1. TOP HEADER */}
      <SOCHeader 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        soundEnabled={soundEnabled} 
        setSoundEnabled={setSoundEnabled} 
        adminUser={adminUser} 
        onLogout={onLogout}
        onSwitchToPIS={onSwitchToPIS}
        onSwitchToAuth={onSwitchToAuth}
      />

      {/* 2. BODY LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        <SOCSidebar 
          isOpen={sidebarOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          alertsCount={alertsCount}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderView()}
        </main>
      </div>

      {/* 3. TOAST ALERTS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl max-w-sm flex items-start space-x-3"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-mono text-white">{toastMessage.title}</h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">{toastMessage.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
