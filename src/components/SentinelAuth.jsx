import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  KeyRound, 
  Server, 
  Cpu, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  HelpCircle,
  X,
  Code2,
  Volume2,
  VolumeX,
  Fingerprint,
  QrCode,
  Globe,
  Database,
  Key,
  Ban,
  Smartphone,
  Check,
  User,
  Building,
  Clock,
  AlertTriangle,
  RotateCcw,
  Send,
  LockKeyhole
} from 'lucide-react';
import { sendOtpEmail } from '../utils/emailService';

/**
 * Synchronous Disposable Email Evaluator
 */
export const isBlockedEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  const parts = email.split('@');
  if (parts.length < 2 || !parts[1]) return false;
  const domain = parts[1].toLowerCase().trim();

  const blockedKeywords = [
    'playboot', 'temp', 'disposable', 'throwaway', 'trash', 'fake', 
    'burner', 'inbox', 'mailinator', 'guerrilla', 'sharklasers', 
    'yopmail', 'nada', 'mohmal', 'dropmail', 'crazymail', 'mytemp'
  ];
  if (blockedKeywords.some(keyword => domain.includes(keyword))) {
    return true;
  }

  const exactBlockedDomains = [
    'playboot.com', 'mailinator.com', 'tempmail.com', '10minutemail.com',
    'guerrillamail.com', 'sharklasers.com', 'yopmail.com', 'trashmail.com',
    'burnermail.io', 'getairmail.com', 'throwawaymail.com', 'temp-mail.org'
  ];
  return exactBlockedDomains.includes(domain);
};

/**
 * Password Complexity Evaluator
 * Regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
 */
export const checkPasswordComplexity = (pass) => {
  const minLength = pass.length >= 8;
  const hasUppercase = /[A-Z]/.test(pass);
  const hasLowercase = /[a-z]/.test(pass);
  const hasNumber = /\d/.test(pass);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);
  const isAllValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    isAllValid
  };
};

/**
 * Default Registered Admin Users (Strictly Admin / SOC Roles)
 */
const DEFAULT_REGISTERED_USERS = [
  {
    email: 'admin.soc@sentinel.ai',
    password: 'AdminSOC#2026',
    role: 'admin',
    name: 'SOC Lead Operator',
    department: 'Security Operations (SOC)'
  },
  {
    email: 'sarah.connor@sentinel.ai',
    password: 'Sentinel@1234',
    role: 'admin',
    name: 'Sarah Connor',
    department: 'Security Operations (SOC)'
  }
];

/**
 * Get or initialize registered users from localStorage (Enforcing Admin Clearance)
 */
const getRegisteredUsers = () => {
  try {
    const data = localStorage.getItem('sentinel_registered_users');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Elevate all stored accounts strictly to admin role
        return parsed.map(u => ({ ...u, role: 'admin' }));
      }
    }
    localStorage.setItem('sentinel_registered_users', JSON.stringify(DEFAULT_REGISTERED_USERS));
    return DEFAULT_REGISTERED_USERS;
  } catch (err) {
    console.warn('localStorage read error:', err);
    return DEFAULT_REGISTERED_USERS;
  }
};

/**
 * SentinelAI Administrative Auth Platform (Dedicated Admin SOC Console Edition)
 * Clean Production Security Interface with Live EmailJS Delivery
 */
export default function SentinelAuth({ onLoginSuccess }) {
  // 1. Mode State (Role is permanently fixed to 'admin')
  // authMode: 'signin' | 'signup' | 'signup-verify-otp' | 'forgot-password' | 'verify-reset-otp'
  const [authMode, setAuthMode] = useState('signin'); 
  const selectedRole = 'admin'; 
  const isAdmin = true;

  // 2. Form Inputs State
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Security Operations (SOC)');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(true);

  // 3. UI & Security States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [registrationBanner, setRegistrationBanner] = useState(null);

  // Temporary Email Security State
  const [isTempMailBlocked, setIsTempMailBlocked] = useState(false);
  const [tempMailErrorMessage, setTempMailErrorMessage] = useState('');

  // Rate Limiting & Account Lockout State (3 Failed Attempts -> 5 Minute Cooldown)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);
  const [lockoutDisplayTime, setLockoutDisplayTime] = useState('05:00');

  // Modals state
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  // Forgot Password & Reset Lifecycle State
  const [resetOtpState, setResetOtpState] = useState({ email: '', code: '', expiresAt: 0 });
  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpBannerMessage, setOtpBannerMessage] = useState(null);

  // Sign-Up OTP Verification State
  const [signupOtpState, setSignupOtpState] = useState({ email: '', code: '', expiresAt: 0, pendingUser: null });
  const [signupOtpDigits, setSignupOtpDigits] = useState(['', '', '', '', '', '']);
  const [signupOtpResendCooldown, setSignupOtpResendCooldown] = useState(30);
  const [signupOtpError, setSignupOtpError] = useState('');
  const [signupOtpSuccessBanner, setSignupOtpSuccessBanner] = useState('');

  // Segmented OTP Input Refs
  const resetOtpRefs = useRef([]);
  const signupOtpRefs = useRef([]);

  // Audio Context Ref for Web Audio Haptics
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
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'switch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99].forEach((freq, index) => {
          const toneOsc = ctx.createOscillator();
          const toneGain = ctx.createGain();
          toneOsc.type = 'sine';
          toneOsc.frequency.setValueAtTime(freq, now + index * 0.07);
          toneGain.gain.setValueAtTime(0.15, now + index * 0.07);
          toneGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.15);
          toneOsc.connect(toneGain);
          toneGain.connect(ctx.destination);
          toneOsc.start(now + index * 0.07);
          toneOsc.stop(now + index * 0.07 + 0.15);
        });
      } else if (type === 'error' || type === 'disposable_buzz') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (err) {
      console.warn('Web Audio synthesis error:', err);
    }
  };

  const isSignUp = authMode === 'signup';
  const isForgotPassword = authMode === 'forgot-password';
  const isVerifyResetOtp = authMode === 'verify-reset-otp';
  const isVerifySignupOtp = authMode === 'signup-verify-otp';

  const passRules = checkPasswordComplexity(password);

  const formatMMSS = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mount Effect for Registered Users & Rate-Limiting Lockout check
  useEffect(() => {
    getRegisteredUsers();

    try {
      const storedSecData = localStorage.getItem('sentinel_auth_security');
      if (storedSecData) {
        const parsed = JSON.parse(storedSecData);
        const { failedAttempts: attempts, lockUntil } = parsed;
        if (attempts) setFailedAttempts(attempts);

        if (lockUntil && Date.now() < lockUntil) {
          const diffSec = Math.ceil((lockUntil - Date.now()) / 1000);
          setIsLockedOut(true);
          setLockRemainingSeconds(diffSec);
          setLockoutDisplayTime(formatMMSS(diffSec));
        } else if (lockUntil && Date.now() >= lockUntil) {
          setIsLockedOut(false);
          setFailedAttempts(0);
          localStorage.removeItem('sentinel_auth_security');
        }
      }
    } catch (err) {
      console.warn('Error reading lockout security state:', err);
    }
  }, []);

  // Lockout Countdown Timer
  useEffect(() => {
    let interval = null;
    if (isLockedOut && lockRemainingSeconds > 0) {
      interval = setInterval(() => {
        setLockRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLockedOut(false);
            setFailedAttempts(0);
            try {
              localStorage.removeItem('sentinel_auth_security');
            } catch (e) {}
            return 0;
          }
          const nextSec = prev - 1;
          setLockoutDisplayTime(formatMMSS(nextSec));
          return nextSec;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedOut, lockRemainingSeconds]);

  // Sign-Up OTP Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (authMode === 'signup-verify-otp' && signupOtpResendCooldown > 0) {
      interval = setInterval(() => {
        setSignupOtpResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authMode, signupOtpResendCooldown]);

  // Real-Time Disposable Email Detection
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: null }));

    const blocked = isBlockedEmail(val);
    setIsTempMailBlocked(blocked);

    if (blocked) {
      setTempMailErrorMessage("⚠️ Disposable / temporary email addresses are prohibited.");
      playCyberSound('disposable_buzz');
    } else {
      setTempMailErrorMessage("");
    }
  };

  useEffect(() => {
    if (email) {
      const blocked = isBlockedEmail(email);
      setIsTempMailBlocked(blocked);
      if (blocked) {
        setTempMailErrorMessage("⚠️ Disposable / temporary email addresses are prohibited.");
      } else {
        setTempMailErrorMessage("");
      }
    }
  }, [authMode]);

  const handleAuthModeSwitch = (mode) => {
    playCyberSound('switch');
    setAuthMode(mode);
    setErrors({});
    setSubmitSuccess(null);
    setRegistrationBanner(null);
    setOtpBannerMessage(null);
    setPassword('');
    setConfirmPassword('');
    setResetOtpDigits(['', '', '', '', '', '']);
  };

  const calculatePasswordEntropy = (pass) => {
    if (!pass) return { bits: 0, score: 0, label: 'None', time: 'Instant' };
    let pool = 0;
    if (/[a-z]/.test(pass)) pool += 26;
    if (/[A-Z]/.test(pass)) pool += 26;
    if (/[0-9]/.test(pass)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pass)) pool += 32;

    const bits = Math.round(pass.length * Math.log2(pool || 1));
    let score = 0;
    let label = 'Weak';
    let time = '< 1 Sec';

    if (bits >= 80) {
      score = 100;
      label = 'VERY STRONG';
      time = '> 500 Years';
    } else if (bits >= 60) {
      score = 75;
      label = 'STRONG';
      time = '~ 12 Years';
    } else if (bits >= 40) {
      score = 50;
      label = 'MODERATE';
      time = '~ 3 Days';
    } else if (bits > 0) {
      score = 25;
      label = 'WEAK';
      time = '< 10 Mins';
    }

    return { bits, score, label, time };
  };

  const entropyInfo = calculatePasswordEntropy(password);

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isSignUp && !fullName.trim()) {
      newErrors.fullName = 'Full Name is required for Admin SOC registration.';
    }

    if (!email.trim()) {
      newErrors.email = 'Administrative corporate email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid corporate email format.';
    } else if (isTempMailBlocked) {
      newErrors.email = 'Disposable email addresses are prohibited.';
    }

    if (!password && !isForgotPassword) {
      newErrors.password = 'Security password is required.';
    } else if ((isSignUp || isVerifyResetOtp) && !passRules.isAllValid) {
      newErrors.password = 'Password must fulfill all 5 security complexity rules.';
    } else if (password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (isSignUp || isVerifyResetOtp) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }

      if (isSignUp && !agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to SentinelAI Security Protocols.';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      playCyberSound('error');
    }
    return Object.keys(newErrors).length === 0;
  };

  // Request Reset Code Handler (`forgot-password`)
  const handleSendRecoveryCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setOtpBannerMessage(null);

    if (isLockedOut) {
      playCyberSound('error');
      alert(`🚨 Security Lockout: Access restricted. Try again in ${lockoutDisplayTime}.`);
      setIsLoading(false);
      return;
    }

    const emailTrim = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrim || !emailRegex.test(emailTrim)) {
      setErrors({ email: 'Please enter a valid corporate email format.' });
      playCyberSound('error');
      setIsLoading(false);
      return;
    }

    if (isBlockedEmail(emailTrim)) {
      setErrors({ email: 'Disposable email addresses are prohibited.' });
      playCyberSound('error');
      setIsLoading(false);
      return;
    }

    const currentUsers = getRegisteredUsers();
    const existing = currentUsers.find(u => u.email.toLowerCase() === emailTrim);

    if (!existing) {
      setErrors({ email: '❌ No registered corporate account found with this email.' });
      playCyberSound('error');
      setIsLoading(false);
      return;
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // 1. Dispatch real Email via EmailJS service
      const emailSent = await sendOtpEmail(emailTrim, generatedOtp);

      // 2. Execute Backend API call if Django server running
      try {
        await fetch('http://localhost:8000/api/auth/forgot-password/request-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrim, otp: generatedOtp }),
        });
      } catch (backendErr) {
        console.warn('Backend API endpoint notice:', backendErr);
      }

      setResetOtpState({
        email: emailTrim,
        code: generatedOtp,
        expiresAt: Date.now() + 600000
      });
      setResetOtpDigits(['', '', '', '', '', '']);

      if (emailSent) {
        playCyberSound('success');
        setOtpBannerMessage("📧 A 6-digit recovery code has been sent to your registered corporate email address.");
        setAuthMode('verify-reset-otp');
      } else {
        playCyberSound('error');
      }
    } catch (err) {
      console.error('OTP Dispatch Error:', err);
      setErrors({ email: err.message || 'Network error: Unable to reach email service.' });
      playCyberSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP & Update Password Handler (`verify-reset-otp`)
  const handleVerifyResetOtpAndUpdatePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const enteredOtp = resetOtpDigits.join('');
      if (enteredOtp.length < 6 || enteredOtp !== resetOtpState.code || Date.now() > resetOtpState.expiresAt) {
        playCyberSound('error');
        setErrors({ otp: '❌ Invalid or expired 6-digit recovery code.' });
        return;
      }

      if (!passRules.isAllValid) {
        playCyberSound('error');
        setErrors({ password: 'Password must fulfill all 5 security complexity rules.' });
        return;
      }

      if (password !== confirmPassword) {
        playCyberSound('error');
        setErrors({ confirmPassword: 'Passwords do not match.' });
        return;
      }

      // Execute Backend API call for verifying reset OTP
      try {
        await fetch('http://localhost:8000/api/auth/forgot-password/verify-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: resetOtpState.email,
            otp: enteredOtp,
            new_password: password,
            confirm_password: confirmPassword
          }),
        });
      } catch (backendErr) {
        console.warn('Backend API verify notice:', backendErr);
      }

      // Update password in localStorage
      const currentUsers = getRegisteredUsers();
      const updatedUsers = currentUsers.map(u => {
        if (u.email.toLowerCase() === resetOtpState.email.toLowerCase()) {
          return { ...u, password: password, role: 'admin' };
        }
        return u;
      });

      try {
        localStorage.setItem('sentinel_registered_users', JSON.stringify(updatedUsers));
      } catch (err) {
        console.warn('localStorage save error:', err);
      }

      setFailedAttempts(0);
      setIsLockedOut(false);
      try {
        localStorage.removeItem('sentinel_auth_security');
      } catch (err) {}

      playCyberSound('success');
      setRegistrationBanner("✅ Password successfully reset! Sign in with your new Admin credentials.");
      setEmail(resetOtpState.email);
      setPassword('');
      setConfirmPassword('');
      setResetOtpDigits(['', '', '', '', '', '']);
      setAuthMode('signin');
    } catch (err) {
      console.error('Password Reset Error:', err);
      setErrors({ general: err.message || 'Error updating password.' });
      playCyberSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign-Up OTP Verification Handlers
  const handleVerifySignupOtp = (e) => {
    e.preventDefault();
    setSignupOtpError('');

    const enteredCode = signupOtpDigits.join('');

    if (enteredCode !== signupOtpState.code) {
      playCyberSound('error');
      setSignupOtpError('❌ Incorrect 6-digit code. Please try again.');
      return;
    }

    // SUCCESSFUL SIGNUP VERIFICATION
    playCyberSound('success');
    
    const newUser = signupOtpState.pendingUser;
    const currentUsers = getRegisteredUsers();
    const updatedUsers = [...currentUsers, newUser];
    
    try {
      localStorage.setItem('sentinel_registered_users', JSON.stringify(updatedUsers));
    } catch (err) {
      console.warn('localStorage save error:', err);
    }

    setAuthMode('signin');
    setEmail(newUser.email);
    setPassword('');
    setConfirmPassword('');
    setRegistrationBanner("✅ Email verified & account created! Please sign in with your password.");
  };

  const handleResendSignupOtp = async () => {
    if (signupOtpResendCooldown > 0) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSignupOtpState(prev => ({ ...prev, code: newCode }));
    setSignupOtpResendCooldown(30);
    setSignupOtpError('');

    await sendOtpEmail(signupOtpState.email, newCode);
    setSignupOtpSuccessBanner(`📧 A 6-digit verification code has been sent to ${signupOtpState.email}.`);
    playCyberSound('success');
  };

  // Main Submit Router
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitSuccess(null);

    if (isForgotPassword) {
      handleSendRecoveryCode(e);
      return;
    }

    if (isVerifyResetOtp) {
      handleVerifyResetOtpAndUpdatePassword(e);
      return;
    }

    if (isLockedOut) {
      playCyberSound('error');
      alert(`🚨 Security Lockout: Too many failed attempts. Try again in ${lockoutDisplayTime}.`);
      return false;
    }

    if (isBlockedEmail(email)) {
      const domainName = email.includes('@') ? email.split('@')[1] : email;
      alert("Access Denied: Temporary and disposable emails (including @" + domainName + ") are prohibited.");
      playCyberSound('error');
      return false;
    }

    if (!validateForm()) {
      return false;
    }

    const enteredEmail = email.trim().toLowerCase();
    const enteredPassword = password;
    const currentUsers = getRegisteredUsers();

    // SIGN UP FLOW (STRICT ADMIN REGISTRATION WITH EMAIL VERIFICATION)
    if (isSignUp) {
      playCyberSound('click');
      setIsLoading(true);

      setTimeout(async () => {
        setIsLoading(false);

        const existing = currentUsers.find(u => u.email.toLowerCase() === enteredEmail);
        if (existing) {
          playCyberSound('error');
          setErrors({ email: 'An account with this corporate email already exists.' });
          return false;
        }

        const newUser = {
          email: email.trim(),
          password: password,
          role: 'admin',
          name: fullName.trim(),
          department: department || 'Security Operations (SOC)'
        };

        const generatedSignupOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        setSignupOtpState({
          email: newUser.email,
          pendingUser: newUser,
          code: generatedSignupOtp,
          expiresAt: Date.now() + 15 * 60 * 1000
        });
        setSignupOtpDigits(['', '', '', '', '', '']);
        setSignupOtpResendCooldown(30);
        setSignupOtpError('');

        await sendOtpEmail(newUser.email, generatedSignupOtp);

        playCyberSound('success');
        setAuthMode('signup-verify-otp');
      }, 1200);

      return;
    }

    // SIGN IN VERIFICATION FLOW
    const userMatch = currentUsers.find(u => u.email.toLowerCase() === enteredEmail);

    if (!userMatch) {
      playCyberSound('error');
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPassword('');

      if (nextAttempts >= 3) {
        const lockTime = Date.now() + 5 * 60 * 1000;
        setIsLockedOut(true);
        setLockRemainingSeconds(300);
        setLockoutDisplayTime('05:00');
        try {
          localStorage.setItem('sentinel_auth_security', JSON.stringify({
            failedAttempts: nextAttempts,
            lockUntil: lockTime
          }));
        } catch (err) {}
        setErrors({ general: '🚨 Security Lockout: 3 failed attempts. Access restricted for 5 minutes.' });
      } else {
        try {
          localStorage.setItem('sentinel_auth_security', JSON.stringify({
            failedAttempts: nextAttempts,
            lockUntil: null
          }));
        } catch (err) {}
        setErrors({ general: '❌ Invalid corporate email or account does not exist.' });
      }
      return false;
    }

    if (userMatch.password !== enteredPassword) {
      playCyberSound('error');
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPassword('');

      if (nextAttempts >= 3) {
        const lockTime = Date.now() + 5 * 60 * 1000;
        setIsLockedOut(true);
        setLockRemainingSeconds(300);
        setLockoutDisplayTime('05:00');
        try {
          localStorage.setItem('sentinel_auth_security', JSON.stringify({
            failedAttempts: nextAttempts,
            lockUntil: lockTime
          }));
        } catch (err) {}
        setErrors({ general: '🚨 Security Lockout: 3 failed attempts. Access restricted for 5 minutes.' });
      } else {
        try {
          localStorage.setItem('sentinel_auth_security', JSON.stringify({
            failedAttempts: nextAttempts,
            lockUntil: null
          }));
        } catch (err) {}
        setErrors({ general: `❌ Incorrect password. (${3 - nextAttempts} attempt(s) remaining before lockout).` });
      }

      return false;
    }

    // DIRECT ADMIN LOGIN (Bypass 2FA)
    playCyberSound('click');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      
      setFailedAttempts(0);
      setIsLockedOut(false);
      try {
        localStorage.removeItem('sentinel_auth_security');
      } catch (err) {}

      setRegistrationBanner(null);

      const mockAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: userMatch.email, role: 'admin', exp: Date.now() + 3600 }))}.sentinel_admin_verified_signature`;

      const sessionObj = {
        access_token: mockAccessToken,
        user: {
          email: userMatch.email,
          role: 'admin',
          name: userMatch.name || userMatch.email.split('@')[0],
          department: userMatch.department || 'Security Operations (SOC)'
        },
        login_timestamp: new Date().toISOString()
      };

      try {
        localStorage.setItem('sentinel_session', JSON.stringify(sessionObj));
        localStorage.setItem('sentinel_auth_token', mockAccessToken);
        localStorage.setItem('sentinel_user_email', userMatch.email);
        localStorage.setItem('sentinel_user_role', 'admin');
        localStorage.setItem('sentinel_user_name', userMatch.name || userMatch.email.split('@')[0]);
      } catch (err) {
        console.warn('localStorage session save warning:', err);
      }

      setSubmitSuccess({
        payload: { email: userMatch.email, role: 'admin', timestamp: new Date().toISOString() },
        response: { status: 200, data: sessionObj }
      });

      playCyberSound('success');
      if (onLoginSuccess) {
        onLoginSuccess({
          ...sessionObj.user,
          access_token: mockAccessToken,
          targetRoute: '/admin-soc'
        });
      }
    }, 800);
  };

  // Segmented 6-Digit OTP Box Renderer
  const renderSegmentedOtpInput = (digits, setDigits, refs) => {
    const handleChange = (index, value) => {
      if (!/^\d*$/.test(value)) return;
      const newDigits = [...digits];
      newDigits[index] = value.slice(-1);
      setDigits(newDigits);
      if (value && index < 5 && refs.current[index + 1]) {
        refs.current[index + 1].focus();
      }
    };

    const handleKeyDown = (index, e) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0 && refs.current[index - 1]) {
        refs.current[index - 1].focus();
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setDigits(newDigits);
        const nextFocusIndex = Math.min(pasted.length, 5);
        if (refs.current[nextFocusIndex]) {
          refs.current[nextFocusIndex].focus();
        }
      }
    };

    return (
      <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (refs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-11 h-12 text-center text-lg font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
          />
        ))}
      </div>
    );
  };

  const isSubmitDisabled = isLoading || isLockedOut || isTempMailBlocked || (
    isForgotPassword ? !email :
    isVerifyResetOtp ? (resetOtpDigits.join('').length < 6 || !passRules.isAllValid || !confirmPassword || password !== confirmPassword) :
    (!email || !password || (isSignUp && (!passRules.isAllValid || !confirmPassword || password !== confirmPassword || !agreeToTerms)))
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#ebeef5] text-slate-800 font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      
      {/* Main Split-Card Container */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100">
        
        {/* LEFT COLUMN: Form Section */}
        <div className="p-8 sm:p-12 flex flex-col justify-between space-y-6">
          {/* Top Branding */}
          <div>
            <div className="flex items-center justify-between mb-6">
              {/* App Logo & Title */}
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
                  <Shield className="w-5 h-5 fill-indigo-600/20" />
                </div>
                <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
                  Sentinel<span className="text-indigo-600">AI</span>
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200">
                ADMIN CONSOLE
              </span>
            </div>

            {/* Dynamic Header Titles */}
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isForgotPassword
                  ? 'Reset Your Password'
                  : isVerifyResetOtp
                  ? 'Set New Secure Password'
                  : isSignUp
                  ? 'Create Your Account'
                  : 'Holla, Welcome Back'}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {isForgotPassword
                  ? 'Enter your registered corporate email to receive a secure recovery code.'
                  : isVerifyResetOtp
                  ? 'Enter the 6-digit code sent to your email and your new password.'
                  : isSignUp 
                  ? 'Register as an Administrative SOC Incident Command Analyst' 
                  : 'Sign in to access the SentinelAI SOC Incident Command Center'}
              </p>
            </div>
          </div>

          {/* Rate Limiting & 5-Minute Account Lockout Banner */}
          {isLockedOut && (
            <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs leading-relaxed space-y-1.5 shadow-lg animate-bounce">
              <div className="flex items-center space-x-2 font-bold font-mono text-rose-400 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                <span>🚨 Security Lockout Triggered</span>
              </div>
              <p className="font-sans">
                Too many failed login attempts. Access temporarily restricted for security protection.
              </p>
              <div className="pt-1 flex items-center justify-between font-mono text-rose-300 font-bold border-t border-rose-900">
                <span>Cooldown Remaining:</span>
                <span className="text-sm bg-rose-900 px-2 py-0.5 rounded border border-rose-700">
                  {lockoutDisplayTime}
                </span>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {errors.general && !isLockedOut && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono font-semibold space-y-1 animate-fadeIn">
              <div className="flex items-center space-x-1.5 text-rose-700 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Authentication Denied</span>
              </div>
              <p>{errors.general}</p>
            </div>
          )}

          {/* Clean Information Banner */}
          {otpBannerMessage && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs leading-relaxed space-y-1 animate-fadeIn">
              <div className="flex items-center space-x-2 font-bold text-indigo-800">
                <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Recovery Dispatch Triggered</span>
              </div>
              <p className="text-[11px] text-indigo-900 font-medium">{otpBannerMessage}</p>
            </div>
          )}

          {/* Registration / Reset Success Banner */}
          {registrationBanner && !isSignUp && !isForgotPassword && !isVerifyResetOtp && !isLockedOut && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs leading-relaxed space-y-1 animate-fadeIn">
              <div className="flex items-center space-x-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Security Update Verified</span>
              </div>
              <p>{registrationBanner}</p>
            </div>
          )}

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            
            {/* VIEW 1: FORGOT PASSWORD FORM */}
            {isForgotPassword && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    ADMINISTRATIVE CORPORATE EMAIL <span className="text-indigo-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={isLockedOut}
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="admin.soc@sentinel.ai"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        isTempMailBlocked
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/50'
                          : errors.email
                          ? 'border-rose-500'
                          : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                      } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-sans disabled:opacity-50`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      {isTempMailBlocked ? (
                        <Ban className="w-4 h-4 text-red-500" />
                      ) : email && email.includes('@') && email.includes('.') ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : null}
                    </div>
                  </div>

                  {errors.email && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin text-white" />
                      <span>Sending OTP Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Recovery Code →</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* VIEW 2: VERIFY OTP & NEW PASSWORD FORM */}
            {isVerifyResetOtp && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    6-Digit Recovery Code <span className="text-indigo-600">*</span>
                  </label>
                  {renderSegmentedOtpInput(resetOtpDigits, setResetOtpDigits, resetOtpRefs)}
                  {errors.otp && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.otp}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    New Password <span className="text-indigo-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        errors.password ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                      } rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white font-sans`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Complexity Interactive Checklist */}
                  <div className="pt-1.5 space-y-1.5">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                      Password Security Complexity Requirements:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                        passRules.minLength ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span>{passRules.minLength ? '✓' : '•'}</span>
                        <span>8+ Characters</span>
                      </div>

                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                        passRules.hasUppercase ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span>{passRules.hasUppercase ? '✓' : '•'}</span>
                        <span>1 Uppercase (A-Z)</span>
                      </div>

                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                        passRules.hasLowercase ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span>{passRules.hasLowercase ? '✓' : '•'}</span>
                        <span>1 Lowercase (a-z)</span>
                      </div>

                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                        passRules.hasNumber ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span>{passRules.hasNumber ? '✓' : '•'}</span>
                        <span>1 Number (0-9)</span>
                      </div>

                      <div className={`col-span-2 flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                        passRules.hasSpecialChar ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span>{passRules.hasSpecialChar ? '✓' : '•'}</span>
                        <span>1 Special Character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    Confirm New Password <span className="text-indigo-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white font-sans"
                      required
                    />
                    {confirmPassword && password === confirmPassword && (
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LockKeyhole className="w-4 h-4" />
                  <span>Update Password & Sign In →</span>
                </button>
              </div>
            )}

            {/* SIGN-UP OTP VERIFICATION VIEW */}
            {isVerifySignupOtp && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Verify Your Email</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter the 6-digit verification code sent to <strong className="text-slate-900">{signupOtpState.email}</strong>.
                  </p>
                </div>

                {/* Notification Banner */}
                {signupOtpSuccessBanner && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-mono font-medium space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-indigo-800">
                      <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Code Sent</span>
                    </div>
                    <p className="text-[11px] text-indigo-900">{signupOtpSuccessBanner}</p>
                  </div>
                )}

                {signupOtpError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{signupOtpError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    6-DIGIT VERIFICATION CODE
                  </label>
                  {renderSegmentedOtpInput(signupOtpDigits, setSignupOtpDigits, signupOtpRefs)}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={signupOtpResendCooldown > 0}
                    onClick={handleResendSignupOtp}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {signupOtpResendCooldown > 0 ? `Resend code in ${signupOtpResendCooldown}s` : 'Resend verification code'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVerifySignupOtp}
                  disabled={isLoading || signupOtpDigits.join('').length < 6}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Complete Registration →</span>
                </button>
              </div>
            )}

            {/* STANDARD SIGN IN & SIGN UP FORMS */}
            {!isForgotPassword && !isVerifyResetOtp && !isVerifySignupOtp && (
              <>
                {/* SIGN UP FIELD 1: Full Name */}
                {isSignUp && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                      Full Name <span className="text-indigo-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isLockedOut}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                      }}
                      placeholder="SOC Lead Operator"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        errors.fullName ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                      } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-sans disabled:opacity-50`}
                      required
                    />
                    {errors.fullName && (
                      <p className="text-[11px] text-rose-500 font-medium">{errors.fullName}</p>
                    )}
                  </div>
                )}

                {/* SIGN UP FIELD 2: Department Selection */}
                {isSignUp && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                      Department <span className="text-indigo-600">*</span>
                    </label>
                    <select
                      disabled={isLockedOut}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-sans disabled:opacity-50"
                    >
                      <option value="Security Operations (SOC)">Security Operations (SOC)</option>
                      <option value="IT & Infrastructure">IT & Infrastructure Security</option>
                      <option value="Engineering & Cyber Research">Engineering & Cyber Research</option>
                    </select>
                  </div>
                )}

                {/* FIELD: Administrative Corporate Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    ADMINISTRATIVE CORPORATE EMAIL <span className="text-indigo-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={isLockedOut}
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="admin.soc@sentinel.ai"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        isTempMailBlocked
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/50'
                          : errors.email
                          ? 'border-rose-500'
                          : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                      } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-sans disabled:opacity-50`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      {isTempMailBlocked ? (
                        <Ban className="w-4 h-4 text-red-500" />
                      ) : email && email.includes('@') && email.includes('.') ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : null}
                    </div>
                  </div>

                  {isTempMailBlocked && (
                    <p className="text-[11px] text-red-500 font-medium leading-relaxed mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>{tempMailErrorMessage}</span>
                    </p>
                  )}

                  {errors.email && !isTempMailBlocked && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* FIELD: Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    {isSignUp ? 'Create Password' : 'Password'} <span className="text-indigo-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isLockedOut}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                        if (errors.general) setErrors((prev) => ({ ...prev, general: null }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        errors.password || errors.general ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                      } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-sans disabled:opacity-50`}
                      required
                    />
                    <button
                      type="button"
                      disabled={isLockedOut}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Complexity Interactive Checklist (In Sign Up Mode) */}
                  {isSignUp && (
                    <div className="pt-1.5 space-y-1.5">
                      <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                        Password Security Complexity Requirements:
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                          passRules.minLength ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <span>{passRules.minLength ? '✓' : '•'}</span>
                          <span>8+ Characters</span>
                        </div>

                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                          passRules.hasUppercase ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <span>{passRules.hasUppercase ? '✓' : '•'}</span>
                          <span>1 Uppercase (A-Z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                          passRules.hasLowercase ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <span>{passRules.hasLowercase ? '✓' : '•'}</span>
                          <span>1 Lowercase (a-z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                          passRules.hasNumber ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <span>{passRules.hasNumber ? '✓' : '•'}</span>
                          <span>1 Number (0-9)</span>
                        </div>

                        <div className={`col-span-2 flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                          passRules.hasSpecialChar ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <span>{passRules.hasSpecialChar ? '✓' : '•'}</span>
                          <span>1 Special Character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Entropy Meter */}
                  {password.length > 0 && !isSignUp && (
                    <div className="pt-0.5 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Entropy: <strong>{entropyInfo.bits} bits</strong></span>
                        <span className={entropyInfo.score >= 75 ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                          {entropyInfo.label} ({entropyInfo.time})
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            entropyInfo.score >= 75 ? 'bg-emerald-500' : entropyInfo.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${entropyInfo.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* SIGN UP FIELD: Confirm Password */}
                {isSignUp && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                      Confirm Password <span className="text-indigo-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={isLockedOut}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                        }}
                        placeholder="••••••••••••"
                        className={`w-full px-4 py-2.5 bg-slate-50 border ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-rose-500 ring-1 ring-rose-500'
                            : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                        } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-sans disabled:opacity-50`}
                        required
                      />
                      {confirmPassword && password === confirmPassword && (
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[11px] text-rose-500 font-medium">Passwords do not match.</p>
                    )}
                  </div>
                )}

                {/* Options Row for SIGN IN */}
                {!isSignUp && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isLockedOut}
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                      />
                      <span className="text-slate-600 font-medium">Remember me</span>
                    </label>

                    <button
                      type="button"
                      disabled={isLockedOut}
                      onClick={() => handleAuthModeSwitch('forgot-password')}
                      className="text-indigo-600 hover:underline font-semibold transition-colors disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* SIGN UP Terms Checkbox */}
                {isSignUp && (
                  <div className="pt-1 text-xs animate-fadeIn">
                    <label className="flex items-start space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isLockedOut}
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer disabled:opacity-50"
                      />
                      <span className="text-slate-600 leading-snug">
                        I agree to the <strong className="text-slate-900">SentinelAI Zero-Trust Security Protocols</strong> and corporate data handling terms.
                      </span>
                    </label>
                  </div>
                )}

                {/* Primary Action Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <Cpu className="w-4 h-4 animate-spin text-white" />
                        <span>{isSignUp ? 'Creating Admin Profile...' : 'Authenticating Admin...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Admin Account' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Admin Authentication Granted (HTTP 200)
                </span>
                <button
                  onClick={() => setShowPayloadModal(true)}
                  className="text-[11px] font-mono text-emerald-700 underline hover:text-emerald-900"
                >
                  Inspect DRF Payload
                </button>
              </div>
            </div>
          )}

          {/* Footer Link */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-400 font-medium">
              {isForgotPassword || isVerifyResetOtp ? (
                <span>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => handleAuthModeSwitch('signin')}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </span>
              ) : isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleAuthModeSwitch('signin')}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleAuthModeSwitch('signup')}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Smartphone & Security Hero Banner */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 m-3 rounded-2xl p-8 flex flex-col items-center justify-between text-center relative overflow-hidden text-white min-h-[500px]">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="self-end z-10">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-lg">
              <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
              <span>Zero-Trust Shield Active</span>
            </div>
          </div>

          <div className="my-auto relative z-10 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-44 h-72 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl p-3 flex flex-col items-center justify-between transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="w-16 h-3 bg-slate-800 rounded-full mb-4" />
              <div className="flex-1 w-full bg-gradient-to-b from-indigo-950 to-slate-950 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden border border-indigo-500/30">
                <div className="absolute w-28 h-28 rounded-full bg-indigo-500/20 animate-ping" />
                <div className="p-4 rounded-full bg-indigo-600/30 border border-indigo-400/50 text-indigo-300 relative z-10 shadow-lg shadow-indigo-500/50">
                  <Fingerprint className="w-10 h-10 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono text-indigo-300 mt-4 tracking-widest uppercase">
                  Biometric Auth
                </span>
              </div>
              <div className="w-12 h-1 bg-slate-700 rounded-full mt-3" />
            </div>

            <div className="absolute -top-2 -right-4 bg-white text-indigo-900 p-3 rounded-2xl shadow-xl border border-indigo-100 flex items-center space-x-2 transform rotate-6 animate-bounce" style={{ animationDuration: '4s' }}>
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-bold font-mono">256-BIT ENCRYPTED</span>
            </div>
          </div>

          <div className="space-y-1.5 z-10">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Administrative SOC Incident Command Center
            </h3>
            <p className="text-xs text-indigo-100/80 max-w-xs font-normal">
              SentinelAI Cyber Incident Analytics & Threat Response Control
            </p>
          </div>
        </div>
      </div>


      {/* MODAL 1: Django REST Framework Payload Inspector */}
      {showPayloadModal && submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Django REST Framework Payload Inspector
                </h3>
              </div>
              <button
                onClick={() => setShowPayloadModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Target DRF Endpoint:</span>
                <span className="text-indigo-400">
                  POST {isSignUp ? '/api/v1/soc/admin/register/' : '/api/v1/soc/admin/token/'}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-56">
                <pre>{JSON.stringify(submitSuccess.payload, null, 2)}</pre>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
                <span>Simulated DRF Auth Response:</span>
                <span className="text-emerald-400">HTTP 200 Admin Token Pair</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-36">
                <pre>{JSON.stringify(submitSuccess.response.data, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPayloadModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
