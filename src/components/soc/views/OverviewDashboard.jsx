import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, AlertTriangle, CheckCircle2, 
  XCircle, Clock, Video, BookOpen, ShieldCheck, 
  TrendingUp, ArrowUpRight, Search, Play, Pause,
  Download, Filter, ChevronRight, AlertCircle, FileText
} from 'lucide-react';

const MODULES_LIST = [
  { id: 1, name: "Phishing Foundations & Header Analysis" },
  { id: 2, name: "Spear Phishing & Spoofed Domains" },
  { id: 3, name: "Malicious Attachments & Trojan Payloads" },
  { id: 4, name: "Credential Harvesting & Password Hygiene" },
  { id: 5, name: "MFA Fatigue & Push Bombing Defense" },
  { id: 6, name: "Social Engineering & Voice Phishing (Vishing)" },
  { id: 7, name: "Safe URL Inspection & Typosquatting" },
  { id: 8, name: "Drive-By Downloads & Malvertising" },
  { id: 9, name: "Ransomware Early Indicators & Triage" },
  { id: 10, name: "Removable Media & BadUSB Exploitation" },
  { id: 11, name: "Public Wi-Fi & Evil Twin Access Points" },
  { id: 12, name: "Data Exfiltration & Privacy Leak Prevention" },
  { id: 13, name: "Insider Threats & Privilege Misuse" },
  { id: 14, name: "SQL Injection Probe Defense" },
  { id: 15, name: "Cross-Site Scripting (XSS) Mitigation" },
  { id: 16, name: "Man-in-the-Middle (MitM) Inspection" },
  { id: 17, name: "Cloud Identity & Session Token Hijack" },
  { id: 18, name: "Endpoint Telemetry & Incident Reporting" },
  { id: 19, name: "Containment Playbooks & SOC Escalation" },
  { id: 20, name: "Final AI Threat Defense Simulation & Capstone" }
];

export default function OverviewDashboard({ 
  trainingMetrics = {}, 
  trainees = [], 
  incidents = [], 
  onSimulateEvent,
  playSound 
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, FAILED, STUCK, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');

  // Default Fallback Metrics if server hasn't sent data yet (Zero dummy numbers)
  const metrics = {
    traineesToday: trainingMetrics.traineesToday ?? 0,
    avgScoreToday: trainingMetrics.avgScoreToday ?? 0,
    completedToday: trainingMetrics.completedToday ?? (trainingMetrics.certifiedToday ?? 0),
    inProgressToday: trainingMetrics.inProgressToday ?? 0,
    failedToday: trainingMetrics.failedToday ?? 0,
    stuckToday: trainingMetrics.stuckToday ?? 0,
    passRate: trainingMetrics.passRate ?? "0%",
    totalModules: 20
  };

  // Filter Trainees
  const filteredTrainees = trainees.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'FAILED') return t.status === 'FAILED';
    if (selectedFilter === 'STUCK') return t.status === 'STUCK_VIDEO' || t.status === 'STUCK_INCOMPLETE';
    if (selectedFilter === 'COMPLETED') return t.status === 'COMPLETED' || t.status === 'CERTIFIED' || t.currentModule === 20;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 relative custom-scrollbar">
      
      {/* 1. TOP STATS STRIP: TODAY'S TRAINING METRICS & AVERAGE SCORE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Total Trainees */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Trainees Today
            </span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-white tracking-tight font-mono">
              {metrics.traineesToday}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Active Learners
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Enrolled in 20-Module Cyber Defense LMS
          </p>
        </div>

        {/* Metric 2: Today's Average Score */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Today's Average Score
            </span>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-cyan-300 tracking-tight font-mono">
              {metrics.avgScoreToday}%
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
              Pass Mark: 60%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Aggregated across videos, quizzes & simulations
          </p>
        </div>

        {/* Metric 3: Completed 20/20 Modules */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              20/20 Modules Completed
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-emerald-400 tracking-tight font-mono">
              {metrics.completedToday}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Full Course Finished
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Successfully mastered all 20 modules
          </p>
        </div>

        {/* Metric 4: Failed & Stuck Trainees */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Failed & Stuck Trainees
            </span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-rose-400 tracking-tight font-mono">
                {metrics.failedToday + metrics.stuckToday}
              </span>
              <span className="text-xs font-mono text-slate-400">total</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded mr-1">
                {metrics.failedToday} Failed
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {metrics.stuckToday} Stuck
              </span>
            </div>
          </div>
          <p className="text-[11px] text-rose-400/80 mt-2 font-mono">
            Requires quiz re-take or video completion
          </p>
        </div>
      </div>

      {/* 2. REAL-TIME SOFTWARE CONNECTION STATUS BANNER */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Live Software Synchronization Online
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Receiving live video-watch times, quiz scores & AI defense actions directly from friend's software.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-emerald-400 font-bold">{trainees.length}</span> Real Trainees Synchronized
        </div>
      </div>

      {/* 3. 20-MODULE CURRICULUM FUNNEL (PROGRESSION ACROSS ALL 20 MODULES) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              20-Module Training Pipeline & Video-Gate Drop-Off Analysis
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Learners must finish 100% of the video before unlocking the quiz & defense simulation for the next module.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="flex items-center text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1"/> Passed (&ge;60%)</span>
            <span className="flex items-center text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1"/> Stuck Mid-Video</span>
            <span className="flex items-center text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400 mr-1"/> Failed Quiz</span>
          </div>
        </div>

        {/* 20 Module Horizontal Bar Grid (Calculated from Real Trainees) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5 mt-4">
          {MODULES_LIST.map((mod) => {
            const activeCount = trainees.filter(t => t.currentModule >= mod.id).length;
            const completionPercent = metrics.traineesToday > 0 ? Math.round((activeCount / metrics.traineesToday) * 100) : 0;
            const isFinal = mod.id === 20;

            return (
              <div 
                key={mod.id} 
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                  isFinal 
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.2)]' 
                  : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold ${isFinal ? 'text-indigo-400' : 'text-slate-400'}`}>
                      M-{mod.id}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">{completionPercent}%</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium line-clamp-2 mt-1 leading-snug" title={mod.name}>
                    {mod.name}
                  </p>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isFinal ? 'bg-indigo-400' : 'bg-emerald-500'}`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                    {activeCount} active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: TRAINEE ROSTER (FAILED, STUCK & ALL) + LIVE SIMULATION FEED */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: DETAILED TRAINEE TRACKER */}
        <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[560px] overflow-hidden shadow-2xl">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <h3 className="font-bold text-slate-200 tracking-tight font-mono text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Trainee Roster: Module Status, Quizzes & Stuck Analysis
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Identifies students who failed, stopped mid-video, or completed all 20 modules
              </p>
            </div>
            
            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              {['ALL', 'FAILED', 'STUCK', 'COMPLETED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                    selectedFilter === f 
                    ? f === 'FAILED' ? 'bg-rose-500 text-white' :
                      f === 'STUCK' ? 'bg-amber-500 text-slate-950' :
                      f === 'COMPLETED' ? 'bg-emerald-500 text-slate-950' :
                      'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search trainee by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              Showing {filteredTrainees.length} learners
            </span>
          </div>

          {/* Trainee Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3">TRAINEE</th>
                  <th className="p-3">MODULE #</th>
                  <th className="p-3">VIDEO STATUS</th>
                  <th className="p-3">AVG SCORE</th>
                  <th className="p-3">STATUS & ISSUE</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredTrainees.map((t) => {
                  const isCompleted = t.status === 'COMPLETED' || t.status === 'CERTIFIED' || t.currentModule === 20;
                  const isFailed = t.status === 'FAILED';
                  const isStuck = t.status === 'STUCK_VIDEO' || t.status === 'STUCK_INCOMPLETE';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Email */}
                      <td className="p-3">
                        <p className="font-bold text-white text-xs">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.email}</p>
                      </td>

                      {/* Current Module out of 20 */}
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-indigo-300">
                            {t.currentModule}/20
                          </span>
                        </div>
                        <div className="w-20 bg-slate-800 rounded-full h-1 mt-1">
                          <div 
                            className={`h-full rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                            style={{ width: `${(t.currentModule / 20) * 100}%` }}
                          />
                        </div>
                      </td>

                      {/* Video Status */}
                      <td className="p-3">
                        {t.videoWatched ? (
                          <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> 100% Watched
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-bold animate-pulse">
                            <Video className="w-3 h-3 mr-1" /> Incomplete
                          </span>
                        )}
                      </td>

                      {/* Average Score */}
                      <td className="p-3">
                        <span className={`font-bold font-mono text-xs ${
                          t.avgScore >= 75 ? 'text-emerald-400' :
                          t.avgScore >= 60 ? 'text-cyan-400' :
                          'text-rose-400'
                        }`}>
                          {t.avgScore}%
                        </span>
                      </td>

                      {/* Status & Stuck Detail */}
                      <td className="p-3">
                        {isCompleted && (
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center w-fit">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> 20/20 Completed
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                              Final Score: {t.avgScore}%
                            </span>
                          </div>
                        )}
                        {isFailed && (
                          <div>
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/40 px-2 py-0.5 rounded flex items-center w-fit">
                              <XCircle className="w-3 h-3 mr-1" /> Failed Quiz / Defense
                            </span>
                            <span className="text-[10px] text-rose-300 font-mono block mt-0.5">
                              {t.stuckReason || `Failed Module ${t.currentModule} Quiz (<60%)`}
                            </span>
                          </div>
                        )}
                        {isStuck && (
                          <div>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded flex items-center w-fit">
                              <AlertCircle className="w-3 h-3 mr-1" /> Stuck at Module {t.currentModule}
                            </span>
                            <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                              {t.stuckReason || "Video unfinished. Next module locked."}
                            </span>
                          </div>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                            Progressing (M-{t.currentModule})
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        {isCompleted ? (
                          <span className="inline-flex items-center text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
                          </span>
                        ) : isFailed || isStuck ? (
                          <button 
                            onClick={() => {
                              playSound('action');
                              alert(`Notification & Retake link sent to ${t.email} for Module ${t.currentModule}!`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold transition-all flex items-center gap-1 ml-auto"
                          >
                            Send Prompt
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Normal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredTrainees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-14 text-center text-slate-500 font-mono text-xs">
                      No live trainee records received yet. Awaiting live progress events from the software...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: LIVE ACTIVITY STREAM */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[560px] overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <h3 className="font-bold text-slate-200 tracking-tight font-mono text-sm flex items-center">
                Live Simulation Feed
              </h3>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              PORT 8000
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar font-mono text-xs">
            {incidents.map((ev, idx) => {
              const isCrit = ev.severity === 'CRITICAL';
              const isHigh = ev.severity === 'HIGH';

              return (
                <div 
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      isCrit ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      isHigh ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {ev.severity || 'INFO'}
                    </span>
                  </div>

                  <p className="text-slate-200 text-xs font-semibold leading-tight">
                    {ev.vector || ev.threat_type || 'Training Activity Event'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                    <span className="truncate max-w-[160px] text-indigo-300">
                      Target: {ev.target || 'Module Simulation'}
                    </span>
                    <span className="text-emerald-400 font-bold shrink-0">
                      &rarr; {ev.action || 'Defended'}
                    </span>
                  </div>
                </div>
              );
            })}

            {incidents.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Awaiting real-time activity packets from friend's simulation software...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
