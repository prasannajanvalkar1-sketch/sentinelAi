import React, { useState, useEffect, useRef } from 'react';
import SOCSidebar from './soc/layout/SOCSidebar';
import SOCHeader from './soc/layout/SOCHeader';
import OverviewDashboard from './soc/views/OverviewDashboard';

export default function SentinelSOCDashboard({ session, onLogout }) {
  const adminUser = session?.user || {
    name: localStorage.getItem('sentinel_user_name') || 'SOC Lead Analyst',
    email: localStorage.getItem('sentinel_user_email') || 'admin.soc@sentinel.ai',
    role: 'admin',
    department: 'Security Operations (SOC)'
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [metrics, setMetrics] = useState({});
  const [incidents, setIncidents] = useState([]);
  
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
      }
    } catch (e) {}
  };

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/telemetry/feed/');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            
            if (data.data.incidents && data.data.incidents.length > 0) {
              const latestInc = data.data.incidents[0];
              if (latestInc.id !== incidents[0]?.id) {
                if (latestInc.severity === 'CRITICAL' || latestInc.severity === 'HIGH') {
                  playSound(latestInc.severity.toLowerCase());
                }
              }
            }

            setIncidents(data.data.incidents || []);
            setMetrics(data.data.metrics || {});
          }
        }
      } catch (error) {
        console.error('Failed to fetch telemetry', error);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, [soundEnabled, incidents]);

  // Routing Map
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OverviewDashboard metrics={metrics} incidents={incidents} playSound={playSound} handleInspect={(inc) => console.log(inc)} />;
      case 'users':
      case 'sessions':
      case 'threats':
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm">
            Module [{activeTab.toUpperCase()}] is scheduled for a future deployment phase.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      <SOCHeader 
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
        adminUser={adminUser} onLogout={onLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <SOCSidebar isOpen={sidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
        {renderView()}
      </div>
    </div>
  );
}
