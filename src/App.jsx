import React, { useState, useEffect } from 'react';
import SentinelAuth from './components/SentinelAuth';
import SentinelSOCDashboard from './components/SentinelSOCDashboard';

/**
 * SentinelAI Main Application Router
 * Refactored exclusively for Admin SOC Incident Command Center & Authentication.
 */
export default function App() {
  // 1. Root View State: 'auth' (Login/Register Page) | 'admin-soc' (Admin Incident Command Console)
  const [currentView, setCurrentView] = useState('auth');
  const [session, setSession] = useState(null);

  // 2. Strict Session Guard on Mount
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem('sentinel_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.access_token && parsed.user) {
          // Permanently enforce Admin Role
          parsed.user.role = 'admin';
          setSession(parsed);
          setCurrentView('admin-soc');
        } else {
          localStorage.removeItem('sentinel_session');
          setSession(null);
          setCurrentView('auth');
        }
      } else {
        setSession(null);
        setCurrentView('auth');
      }
    } catch (err) {
      console.warn('Session verification error:', err);
      localStorage.removeItem('sentinel_session');
      setSession(null);
      setCurrentView('auth');
    }
  }, []);

  // 3. Handle Admin Login Success
  const handleLoginSuccess = (loginData) => {
    console.log('[SentinelAI Route Guard] Admin SOC Authentication granted:', loginData);
    
    let activeSession = null;
    try {
      const storedSession = localStorage.getItem('sentinel_session');
      if (storedSession) {
        activeSession = JSON.parse(storedSession);
      }
    } catch (e) {}

    if (!activeSession) {
      activeSession = {
        access_token: loginData.access_token || `admin_token_${Date.now()}`,
        user: {
          email: loginData.email,
          role: 'admin',
          name: loginData.name || 'SOC Lead Analyst',
          department: loginData.department || 'Security Operations (SOC)'
        }
      };
    }
    
    activeSession.user.role = 'admin';
    setSession(activeSession);
    setCurrentView('admin-soc');
  };

  // 4. Clean Admin Logout Action
  const handleLogout = () => {
    try {
      localStorage.removeItem('sentinel_session');
      localStorage.removeItem('sentinel_auth_token');
      localStorage.removeItem('sentinel_user_email');
      localStorage.removeItem('sentinel_user_role');
      localStorage.removeItem('sentinel_user_name');
    } catch (err) {
      console.warn('Error clearing localStorage session:', err);
    }

    setSession(null);
    setCurrentView('auth');
  };

  return (
    <div className="min-h-screen bg-[#ebeef5] text-slate-800 flex flex-col items-center justify-center">
      {currentView === 'auth' ? (
        <SentinelAuth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <SentinelSOCDashboard session={session} onLogout={handleLogout} />
      )}
    </div>
  );
}
