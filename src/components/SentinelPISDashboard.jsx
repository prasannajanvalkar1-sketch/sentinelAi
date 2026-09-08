import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Trash2, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  Zap, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ExternalLink, 
  Terminal, 
  Code2, 
  X, 
  HelpCircle, 
  Sparkles, 
  User, 
  Lock, 
  FileText, 
  Clock, 
  Eye, 
  AlertCircle,
  BarChart2
} from 'lucide-react';

/**
 * SentinelAI Psychological Immune System (PIS) - Cyber Defense Arena & Dashboard
 * Built with React, Framer Motion, Tailwind CSS v4, Lucide React, and Web Audio API haptics.
 */
export default function SentinelPISDashboard({ onBackToAuth }) {
  // 1. Core State
  const [cpisScore, setCpisScore] = useState(75);
  const [cpisHistory, setCpisHistory] = useState([65, 70, 68, 72, 75]);
  const [activeChannel, setActiveChannel] = useState('email'); // 'email' | 'slack' | 'sms'
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [interceptModalOpen, setInterceptModalOpen] = useState(false);
  const [drfPayloadModalOpen, setDrfPayloadModalOpen] = useState(false);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [drfApiPayload, setDrfApiPayload] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Vector Counters
  const [stats, setStats] = useState({
    emailNeutralized: 4,
    chatNeutralized: 2,
    smsNeutralized: 3,
    trapsTriggered: 1,
    headersInspected: 5
  });

  // Audio Synthesizer Haptics Ref
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

  const playCyberSound = (type) => {
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

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'neutralize') {
        // Ascending 3-note harmonic chime
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const toneOsc = ctx.createOscillator();
          const toneGain = ctx.createGain();
          toneOsc.type = 'sine';
          toneOsc.frequency.setValueAtTime(freq, now + idx * 0.06);
          toneGain.gain.setValueAtTime(0.12, now + idx * 0.06);
          toneGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
          toneOsc.connect(toneGain);
          toneGain.connect(ctx.destination);
          toneOsc.start(now + idx * 0.06);
          toneOsc.stop(now + idx * 0.06 + 0.12);
        });
      } else if (type === 'trap') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'inspect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      console.warn('Web Audio synthesis error:', e);
    }
  };

  // Simulated AI Attacks Data Repository
  const attackScenarios = [
    {
      id: 'SIM-2026-081',
      channel: 'email',
      sender: 'HR Operations <hr-rev-update@sentinel-payroll-sec.ai>',
      senderRaw: 'hr-rev-update@sentinel-payroll-sec.ai',
      realSenderDomain: 'sentinel-payroll-sec.ai',
      companyLegitDomain: 'sentinel.ai',
      subject: 'URGENT: Q3 Executive Salary Adjustment & Compensation Audit',
      time: '10:42 AM',
      body: `Dear Sarah,

Please review the attached Q3 Confidential Executive Compensation Adjustment sheet immediately. All employees must re-verify their direct deposit routing details before 5:00 PM today to avoid payroll disbursement holds.

Click below to verify via Sentinel SSO:
https://auth.sentinel-payroll-sec.ai/verify-sso?token=8942abc

Best Regards,
HR Compensation Committee`,
      tactics: ['Urgency Trigger (5:00 PM Deadline)', 'Authority Impersonation (HR Operations)', 'Typosquatting Domain (sentinel-payroll-sec.ai vs sentinel.ai)'],
      headers: {
        returnPath: 'bounce-handler@external-phish-server.net',
        receivedSpf: 'FAIL (IP 192.0.2.14 not authorized for sentinel.ai)',
        dkimSignature: 'INVALID / FAILED VALIDATION',
        dmarcStatus: 'FAIL - QUARANTINE',
        linkDestination: 'http://192.0.2.14/login.php?redirect=sentinel'
      },
      quiz: {
        question: 'What was the primary red flag in this HR Salary email scenario?',
        options: [
          'The email was sent at 10:42 AM',
          'Typosquatted domain (sentinel-payroll-sec.ai) combined with artificial urgency',
          'HR emails are never sent in written format',
          'The word "Compensation" was capitalized'
        ],
        correctIndex: 1,
        explanation: 'Attackers create lookalike domains (typosquatting) like "sentinel-payroll-sec.ai" and impose artificial time limits to bypass critical thinking.'
      }
    },
    {
      id: 'SIM-2026-082',
      channel: 'slack',
      sender: 'IT Operations Bot [Slack App]',
      senderRaw: 'it-sec-support@sentinel-slack-apps.org',
      subject: 'Mandatory 2FA Authenticator Token Reset',
      time: '11:15 AM',
      body: `⚠️ [ACTION REQUIRED] Security Alert: Unusual login attempt detected from Frankfurt, DE.

Your 2FA Duo/Authenticator token has been temporarily suspended. Please re-authenticate your mobile device within 15 minutes to prevent workstation lockout.

Tap to approve authentication:
https://sentinel-slack-auth.org/rebind-token?user=sarah.connor`,
      tactics: ['Fear & Panic Trigger', 'Pretexting IT Security Alert', 'Fake Slack App Webhook Spoofing'],
      headers: {
        returnPath: 'bot-dispatch@slack-app-spoof.io',
        receivedSpf: 'FAIL',
        dkimSignature: 'UNVERIFIED',
        dmarcStatus: 'FAIL',
        linkDestination: 'https://sentinel-slack-auth.org/harvest'
      },
      quiz: {
        question: 'How should you verify an IT 2FA reset prompt received via Slack?',
        options: [
          'Immediately click the link to avoid workstation lockout',
          'Forward the link to your personal email',
          'Verify via an independent official IT helpdesk channel before clicking',
          'Ignore all Slack bot messages forever'
        ],
        correctIndex: 2,
        explanation: 'Always out-of-band verify urgent security requests through your company’s official IT portal or helpdesk phone line.'
      }
    },
    {
      id: 'SIM-2026-083',
      channel: 'sms',
      sender: '+1 (800) 555-0199 [SMS Emergency]',
      senderRaw: '+1 (800) 555-0199',
      subject: 'CEO Wire Transfer Urgent Prompt',
      time: '11:58 AM',
      body: `[SENTINEL EXECUTIVE ALERT] Sarah, this is CEO Marcus Vance. I am in a closed-door board meeting with zero cell coverage. 

I need you to acquire 5x $200 Apple Gift Cards for vendor emergency retainers right now. Text back receipt codes as soon as purchased. DO NOT CALL.`,
      tactics: ['Executive Impersonation (CEO)', 'Gift Card Retainer Scam', 'Isolation Pretext ("DO NOT CALL")'],
      headers: {
        returnPath: 'SMS Gateway +1-800-555-0199 (Spoofed caller ID)',
        receivedSpf: 'N/A (SMS Protocol)',
        dkimSignature: 'N/A',
        dmarcStatus: 'N/A',
        linkDestination: 'SMS Direct Reply Code'
      },
      quiz: {
        question: 'Why do attackers state "DO NOT CALL" in executive SMS scams?',
        options: [
          'Because executive cell phones produce interference',
          'To prevent the victim from verbally confirming the request with the real executive',
          'Because SMS text messages are legally binding',
          'To save battery life on corporate phones'
        ],
        correctIndex: 1,
        explanation: 'Attackers explicitly instruct victims not to call so you won’t verbally verify and expose the impersonation.'
      }
    },
    {
      id: 'SIM-2026-084',
      channel: 'email',
      sender: 'OneDrive Cloud Share <no-reply@sharepoint-cloud-docs.net>',
      senderRaw: 'no-reply@sharepoint-cloud-docs.net',
      realSenderDomain: 'sharepoint-cloud-docs.net',
      companyLegitDomain: 'sentinel.ai',
      subject: 'Marcus Vance shared "SentinelAI_Q4_Financial_Strategy.pdf" with you',
      time: '12:30 PM',
      body: `Marcus Vance (marcus.vance@sentinel.ai) shared a secure file with you on Microsoft OneDrive Cloud.

File: SentinelAI_Q4_Financial_Strategy.pdf
Size: 14.2 MB
Access Level: Confidential / Restricted

[ Open Document in Cloud Reader ]
https://sharepoint-cloud-docs.net/view?doc=99281`,
      tactics: ['Curiosity & FOMO Trigger', 'Brand Hijacking (OneDrive/SharePoint)', 'Domain Misdirection'],
      headers: {
        returnPath: 'phish-dispatch@sharepoint-cloud-docs.net',
        receivedSpf: 'FAIL',
        dkimSignature: 'NONE',
        dmarcStatus: 'FAIL',
        linkDestination: 'https://sharepoint-cloud-docs.net/credential-stealer'
      },
      quiz: {
        question: 'What is the key indicator of SharePoint/OneDrive phishing?',
        options: [
          'The document file format (.pdf)',
          'The link domain does not match official office.com or sharepoint.com domains',
          'The file size being 14.2 MB',
          'Receiving files during lunch hour'
        ],
        correctIndex: 1,
        explanation: 'Legitimate Microsoft SharePoint links originate from *.sharepoint.com or *.office.com, not third-party lookalike domains like sharepoint-cloud-docs.net.'
      }
    }
  ];

  const currentScenario = attackScenarios[currentScenarioIndex];

  // Helper to switch active channel tab
  const handleChannelTab = (channel) => {
    playCyberSound('click');
    setActiveChannel(channel);
    const nextIdx = attackScenarios.findIndex(s => s.channel === channel);
    if (nextIdx !== -1) {
      setCurrentScenarioIndex(nextIdx);
    }
  };

  // Action 1: Neutralize & Report to SOC (Correct Action)
  const handleNeutralize = () => {
    playCyberSound('neutralize');
    const newScore = Math.min(100, cpisScore + 5);
    setCpisScore(newScore);
    setCpisHistory(prev => [...prev.slice(-4), newScore]);

    setStats(prev => ({
      ...prev,
      [currentScenario.channel === 'email' ? 'emailNeutralized' : currentScenario.channel === 'slack' ? 'chatNeutralized' : 'smsNeutralized']: prev[currentScenario.channel === 'email' ? 'emailNeutralized' : currentScenario.channel === 'slack' ? 'chatNeutralized' : 'smsNeutralized'] + 1
    }));

    setActionFeedback({
      type: 'success',
      title: 'Threat Neutralized & Reported to SOC!',
      message: '+5 CPIS Gained. Social engineering vector blocked across organization.'
    });

    // Prepare Django REST API Payload
    const drfData = {
      user: 'sarah.connor@sentinel.ai',
      simulation_id: currentScenario.id,
      vector: currentScenario.channel,
      user_action: 'NEUTRALIZE_AND_REPORT',
      is_correct: true,
      cpis_delta: +5,
      updated_cpis_score: newScore,
      timestamp: new Date().toISOString()
    };
    setDrfApiPayload(drfData);

    setTimeout(() => {
      setActionFeedback(null);
      // Advance to next scenario
      setCurrentScenarioIndex((prev) => (prev + 1) % attackScenarios.length);
    }, 2200);
  };

  // Action 2: Deep Inspect Headers
  const handleInspectHeaders = () => {
    playCyberSound('inspect');
    setStats(prev => ({ ...prev, headersInspected: prev.headersInspected + 1 }));
    setInspectModalOpen(true);
  };

  // Action 3: Fall for Trap / Click Link (Failure Action)
  const handleFallForTrap = () => {
    playCyberSound('trap');
    const newScore = Math.max(0, cpisScore - 15);
    setCpisScore(newScore);
    setCpisHistory(prev => [...prev.slice(-4), newScore]);

    setStats(prev => ({ ...prev, trapsTriggered: prev.trapsTriggered + 1 }));

    // Prepare DRF Payload for Intercept
    const drfData = {
      user: 'sarah.connor@sentinel.ai',
      simulation_id: currentScenario.id,
      vector: currentScenario.channel,
      user_action: 'FALL_FOR_TRAP_CLICK_LINK',
      is_correct: false,
      cpis_delta: -15,
      updated_cpis_score: newScore,
      tactics_failed: currentScenario.tactics,
      timestamp: new Date().toISOString()
    };
    setDrfApiPayload(drfData);

    setQuizAnswerSelected(null);
    setQuizResult(null);
    setInterceptModalOpen(true);
  };

  // Action 4: Mark as Spam
  const handleMarkSpam = () => {
    playCyberSound('click');
    setActionFeedback({
      type: 'info',
      title: 'Marked as Spam',
      message: 'Moved to junk folder. Recommendation: Always Report to SOC for org-wide protection.'
    });
    setTimeout(() => {
      setActionFeedback(null);
      setCurrentScenarioIndex((prev) => (prev + 1) % attackScenarios.length);
    }, 1800);
  };

  // Quiz Answer Submit inside Intercept Modal
  const handleQuizSubmit = (optionIndex) => {
    playCyberSound('click');
    setQuizAnswerSelected(optionIndex);
    const isCorrect = optionIndex === currentScenario.quiz.correctIndex;
    setQuizResult(isCorrect);

    if (isCorrect) {
      playCyberSound('neutralize');
      const recoveredScore = Math.min(100, cpisScore + 10);
      setCpisScore(recoveredScore);
      setCpisHistory(prev => [...prev.slice(-4), recoveredScore]);
    } else {
      playCyberSound('trap');
    }
  };

  // Resilience Badges Calculation
  const badges = [
    {
      id: 'b1',
      title: 'Phish Hunter Lv. 2',
      description: 'Neutralized 5+ Email Social Engineering attacks',
      icon: ShieldCheck,
      unlocked: stats.emailNeutralized >= 4,
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60'
    },
    {
      id: 'b2',
      title: 'Header Analyst',
      description: 'Inspected 5+ SMTP headers & SPF records',
      icon: Search,
      unlocked: stats.headersInspected >= 5,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60'
    },
    {
      id: 'b3',
      title: 'Zero-Trust Guardian',
      description: 'Maintained CPIS score above 80%',
      icon: Award,
      unlocked: cpisScore >= 80,
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/60'
    },
    {
      id: 'b4',
      title: 'SOC Sentinel',
      description: 'Neutralized multi-vector SMS & Slack threats',
      icon: Zap,
      unlocked: stats.chatNeutralized + stats.smsNeutralized >= 4,
      color: 'text-purple-400 border-purple-500/40 bg-purple-950/60'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0b1120] text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Bar */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
        {/* Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
              Sentinel<span className="text-cyan-400">AI</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                PIS ARENA v2.5
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Psychological Immune System • Live Threat Simulation</p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center space-x-3 text-xs">
          {/* User Identity Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-200 font-medium">Sarah Connor</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
              TIER 2 VERIFIED
            </span>
          </div>

          {/* Sound Synthesizer Haptic Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playCyberSound('click');
            }}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
            title={soundEnabled ? 'Mute Haptic Audio' : 'Enable Haptic Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Inspect DRF Payload Button */}
          {drfApiPayload && (
            <button
              onClick={() => {
                playCyberSound('click');
                setDrfPayloadModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-[11px] hover:bg-emerald-900 transition-all flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              DRF API Logs
            </button>
          )}

          {/* Back to Auth Toggle */}
          {onBackToAuth && (
            <button
              onClick={() => {
                playCyberSound('click');
                onBackToAuth();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Auth Console
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        {/* LEFT COLUMN: CPIS Immunity Score & Resilience Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* CPIS Immunity Score Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h2 className="font-mono text-sm font-bold text-white tracking-wide">
                  PSYCHOLOGICAL IMMUNITY SCORE
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                CPIS METER
              </span>
            </div>

            {/* Circular Gauge Meter Visual */}
            <div className="flex items-center justify-center my-4 relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={408}
                  strokeDashoffset={408 - (408 * cpisScore) / 100}
                  strokeLinecap="round"
                  className={`transition-all duration-700 ease-out ${
                    cpisScore >= 80 ? 'text-emerald-400' : cpisScore >= 60 ? 'text-cyan-400' : 'text-rose-500'
                  }`}
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                  {cpisScore}%
                </span>
                <span className={`text-[11px] font-mono font-semibold uppercase mt-0.5 ${
                  cpisScore >= 80 ? 'text-emerald-400' : cpisScore >= 60 ? 'text-cyan-400' : 'text-rose-400'
                }`}>
                  {cpisScore >= 80 ? 'HIGH VIGILANCE' : cpisScore >= 60 ? 'MODERATE DEFENSE' : 'VULNERABLE'}
                </span>
              </div>
            </div>

            {/* CPIS Sparkline History Trend Graph */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Recent Rounds Trend:</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +10% This Session
                </span>
              </div>
              <div className="h-8 w-full flex items-end justify-between gap-1 pt-1">
                {cpisHistory.map((val, idx) => (
                  <div key={idx} className="flex-1 bg-slate-950 rounded-t overflow-hidden relative group">
                    <div 
                      className="bg-cyan-500 group-hover:bg-cyan-400 transition-all rounded-t"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resilience Badges Drawer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-mono text-sm font-bold text-white tracking-wide">
                  RESILIENCE BADGES
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {badges.filter(b => b.unlocked).length} / {badges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border transition-all ${
                      badge.unlocked ? badge.color : 'border-slate-800 bg-slate-950/40 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-mono text-xs font-bold truncate text-white">{badge.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Attack Vectors Neutralized Breakdown Counters */}
            <div className="pt-3 border-t border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-slate-400 text-[11px]">Vector Neutralization Counters:</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">EMAIL</span>
                  <span className="text-sm font-bold text-cyan-400">{stats.emailNeutralized}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">SLACK</span>
                  <span className="text-sm font-bold text-purple-400">{stats.chatNeutralized}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">SMS</span>
                  <span className="text-sm font-bold text-emerald-400">{stats.smsNeutralized}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Threat Simulation Arena (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Channel Workplace Tabs (Outlook Email, Slack/Teams, SMS) */}
          <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-lg">
            <button
              onClick={() => handleChannelTab('email')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                activeChannel === 'email'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Outlook Mail Inbox</span>
            </button>

            <button
              onClick={() => handleChannelTab('slack')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                activeChannel === 'slack'
                  ? 'bg-purple-950/90 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Teams / Slack Chat</span>
            </button>

            <button
              onClick={() => handleChannelTab('sms')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                activeChannel === 'sms'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>SMS / OTP Prompt</span>
            </button>
          </div>

          {/* Action Feedback Banner */}
          <AnimatePresence>
            {actionFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-700 text-emerald-300'
                    : 'bg-amber-950/90 border-amber-700 text-amber-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionFeedback.title}</span>
                </div>
                <p>{actionFeedback.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Scenario Workplace Card View */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative"
            >
              {/* Simulation Header Tag */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    SIMULATED ATTACK INCOMING
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {currentScenario.id}</span>
                </div>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentScenario.time}
                </span>
              </div>

              {/* Scenario Message Payload */}
              <div className="space-y-4 mb-6">
                {/* Sender Metadata */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>FROM: <strong className="text-white">{currentScenario.sender}</strong></span>
                    <span className="text-slate-500 text-[10px]">{currentScenario.senderRaw}</span>
                  </div>
                  <div className="text-slate-300">
                    SUBJECT: <strong className="text-cyan-400">{currentScenario.subject}</strong>
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {currentScenario.body}
                </div>

                {/* Psychological Manipulation Tactics Detected Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400">AI Attack Tactic Indicators:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentScenario.tactics.map((tactic, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-300">
                        • {tactic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Defense Action Controls Grid */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase block">
                  Select Active Defense Response:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Action 1: Neutralize & Report */}
                  <button
                    onClick={handleNeutralize}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>🛡️ Neutralize & Report to SOC</span>
                  </button>

                  {/* Action 2: Inspect Headers */}
                  <button
                    onClick={handleInspectHeaders}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>🔍 Deep Inspect Headers & Links</span>
                  </button>

                  {/* Action 3: Fall for Trap */}
                  <button
                    onClick={handleFallForTrap}
                    className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:border-rose-600 font-mono text-xs font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>❌ Click Link / Follow Prompt</span>
                  </button>

                  {/* Action 4: Ignore / Mark Spam */}
                  <button
                    onClick={handleMarkSpam}
                    className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>🗑️ Ignore / Mark as Spam</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL 1: Technical Header Inspector Drawer */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  SMTP & URL Technical Header Inspector
                </h3>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Return-Path:</span>
                  <span className="text-rose-400">{currentScenario.headers.returnPath}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SPF Validation:</span>
                  <span className="text-rose-400 font-bold">{currentScenario.headers.receivedSpf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DKIM Signature:</span>
                  <span className="text-rose-400 font-bold">{currentScenario.headers.dkimSignature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DMARC Policy:</span>
                  <span className="text-rose-400 font-bold">{currentScenario.headers.dmarcStatus}</span>
                </div>
              </div>

              {/* URL Destination Analysis */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Hover Target Link Destination:</span>
                <span className="text-amber-300 break-all">{currentScenario.headers.linkDestination}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Close Inspector
              </button>
              <button
                onClick={() => {
                  setInspectModalOpen(false);
                  handleNeutralize();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
              >
                Report & Neutralize Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Instant Micro-Lesson Intercept Modal */}
      {interceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 mb-1">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold font-mono text-white">
                ⚠️ Security Simulation Intercept
              </h3>
              <p className="text-xs text-rose-300 font-mono">
                You clicked a simulated phishing vector! (-15 CPIS)
              </p>
            </div>

            {/* Micro-Lesson Explanation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="font-mono text-cyan-400 font-bold block">
                Psychological Manipulation Tactic Analysis:
              </span>
              <p className="text-slate-300 leading-relaxed">
                This attack leveraged <strong>{currentScenario.tactics.join(', ')}</strong>. Attackers exploit psychological triggers like fear, urgency, and executive authority to bypass your rational verification filters.
              </p>
            </div>

            {/* 30-Second Recovery Quiz */}
            <div className="space-y-3">
              <span className="font-mono text-xs font-bold text-amber-300 block">
                30-Second Recovery Quiz (+10 CPIS Recovery):
              </span>
              <p className="text-xs text-slate-200 font-mono">
                {currentScenario.quiz.question}
              </p>

              <div className="space-y-2">
                {currentScenario.quiz.options.map((opt, idx) => (
                  <button
                    key={idx}
                    disabled={quizAnswerSelected !== null}
                    onClick={() => handleQuizSubmit(idx)}
                    className={`w-full p-3 rounded-xl text-xs font-mono text-left transition-all border ${
                      quizAnswerSelected === idx
                        ? idx === currentScenario.quiz.correctIndex
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-rose-950 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizResult !== null && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${
                  quizResult ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : 'bg-rose-950 border-rose-700 text-rose-300'
                }`}>
                  <p className="font-bold mb-1">{quizResult ? '✓ Correct! +10 CPIS Recovered.' : '❌ Incorrect.'}</p>
                  <p className="text-slate-300 text-[11px]">{currentScenario.quiz.explanation}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setInterceptModalOpen(false);
                  setCurrentScenarioIndex((prev) => (prev + 1) % attackScenarios.length);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg"
              >
                Return to Defense Arena
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Django REST Framework API Payload Logger */}
      {drfPayloadModalOpen && drfApiPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Django REST Framework PIS Telemetry Payload
                </h3>
              </div>
              <button
                onClick={() => setDrfPayloadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>API Endpoint:</span>
                <span className="text-emerald-400">POST /api/v1/pis/cpis/update/</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-60">
                <pre>{JSON.stringify(drfApiPayload, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDrfPayloadModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
