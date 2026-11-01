import React, { useState, useEffect } from 'react';
import SentinelAuth from './components/SentinelAuth';
import SentinelSOCDashboard from './components/SentinelSOCDashboard';

/**
 * SentinelAI Main Application Router
 * Protected Gateway:
 * 1. Default Landing: 'auth' - Multi-tier Admin Login & OTP Verification Gate
 * 2. Authenticated View: 'admin-soc' - 20-Module Training & Defense Command Center
 */
export default function App() {
  const [currentView, setCurrentView] = useState('auth');
  const [session, setSession] = useState(null);

  // Initialize Session Guard on Mount (Strictly enforces Admin Login gate)
  useEffect(() => {
    try {
      // Clear any legacy persistent auto-login tokens from localStorage
      localStorage.removeItem('sentinel_session');
      localStorage.removeItem('sentinel_auth_token');

      // Check for active authenticated session in sessionStorage
      const activeSession = sessionStorage.getItem('sentinel_session');
      if (activeSession) {
        const parsed = JSON.parse(activeSession);
        if (parsed && parsed.access_token && parsed.user) {
          setSession(parsed);
          setCurrentView('admin-soc');
          return;
        }
      }
      
      // If no active session, show Login Page
      setSession(null);
      setCurrentView('auth');
    } catch (err) {
      console.warn('Session verification error:', err);
      setSession(null);
      setCurrentView('auth');
    }
  }, []);

  // Handle Admin Login & Verification Success
  const handleLoginSuccess = (loginData) => {
    const activeSession = {
      access_token: loginData.access_token || `admin_token_${Date.now()}`,
      user: {
        email: loginData.email || 'admin.soc@sentinel.ai',
        role: 'admin',
        name: loginData.name || 'Admin Evaluator',
        department: loginData.department || 'Cyber Defense Academy'
      }
    };
    
    try {
      sessionStorage.setItem('sentinel_session', JSON.stringify(activeSession));
    } catch (e) {}

    setSession(activeSession);
    setCurrentView('admin-soc');
  };

  // Clean Logout Action
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('sentinel_session');
      localStorage.removeItem('sentinel_session');
      localStorage.removeItem('sentinel_auth_token');
      localStorage.removeItem('sentinel_user_email');
      localStorage.removeItem('sentinel_user_role');
      localStorage.removeItem('sentinel_user_name');
    } catch (err) {
      console.warn('Error clearing session:', err);
    }

    setSession(null);
    setCurrentView('auth');
  };

  return (
    <div className={`min-h-screen ${currentView === 'auth' ? 'bg-[#ebeef5] text-slate-800 flex flex-col items-center justify-center' : 'bg-[#070b14] text-slate-100 flex flex-col'}`}>
      {currentView === 'auth' ? (
        <SentinelAuth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <SentinelSOCDashboard 
          session={session} 
          onLogout={handleLogout}
          onSwitchToAuth={() => setCurrentView('auth')}
        />
      )}
    </div>
  );
}
