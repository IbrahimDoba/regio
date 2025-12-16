"use client";

import React, { useState } from "react";
import { FaArrowRightArrowLeft, FaEnvelope, FaLock, FaTicket, FaCircleInfo, FaUsers, FaPenNib, FaSpinner } from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRegisterUser, setAccessToken } from "@/lib/api";
import MobileContainer from "@/components/layout/MobileContainer";
import ErrorMessage from "@/components/auth/ErrorMessage";

export default function AuthPage() {
  const { t, language, setLanguage } = useLanguage();
  const { login } = useAuth();
  const registerMutation = useRegisterUser();

  const [view, setView] = useState<'login' | 'register'>('login');
  const [isNoCodeOpen, setIsNoCodeOpen] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const flags: { [key: string]: string } = { 'GB': '🇬🇧 EN', 'HU': '🇭🇺 HU', 'DE': '🇩🇪 DE' };
  const langOrder: ('GB' | 'HU' | 'DE')[] = ['GB', 'HU', 'DE'];

  const toggleLang = () => {
    const idx = langOrder.indexOf(language);
    setLanguage(langOrder[(idx + 1) % langOrder.length]);
  };

  // Handle login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await login({
        username: loginEmail,
        password: loginPassword,
      });
      // On success, AuthContext redirects to '/'
    } catch (error: any) {
      console.error('Login error:', error);
      // Extract error message from API response
      const message = error?.response?.data?.detail || 'Invalid email or password. Please try again.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle register form submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    // Validate password length
    if (registerPassword.length < 8) {
      setRegisterError('Password must be at least 8 characters long.');
      return;
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      setRegisterError('You must agree to the terms and conditions.');
      return;
    }

    setIsRegistering(true);

    try {
      const result = await registerMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email: registerEmail,
        password: registerPassword,
        invite_code: inviteCode,
      });

      // On successful registration, automatically log in the user
      await login({
        username: registerEmail,
        password: registerPassword,
      });
      // AuthContext will redirect to '/'
    } catch (error: any) {
      console.error('Registration error:', error);
      // Extract error message from API response
      let message = 'Registration failed. Please try again.';

      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle array of validation errors
        if (Array.isArray(detail)) {
          message = detail.map((err: any) => err.msg).join(', ');
        } else if (typeof detail === 'string') {
          message = detail;
        }
      }

      setRegisterError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <MobileContainer className="flex flex-col bg-[#f8f8f8] bg-[url('https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center bg-blend-multiply">
      
      {/* Top Bar */}
      <div className="p-[15px] flex justify-end">
        <div 
          className="bg-[rgba(255,255,255,0.8)] p-[5px_10px] rounded-[20px] text-[14px] font-bold cursor-pointer flex items-center gap-[5px] shadow-sm backdrop-blur-sm"
          onClick={toggleLang}
        >
          {flags[language]}
        </div>
      </div>

      {/* Hero */}
      <div className="p-[20px_20px_40px_20px] text-center">
        <div className="text-[40px] font-[900] text-[#1a3b15] tracking-[-2px] mb-[10px] inline-flex items-center gap-[10px]">
          <FaArrowRightArrowLeft className="text-[#d32f2f] text-[32px]" /> REGIO
        </div>
        <div className="text-[16px] text-[#666] max-w-[280px] mx-auto leading-[1.4] whitespace-pre-line">
          {t.subtitle}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-[25px] flex-grow p-[30px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-10 duration-500 flex flex-col">
        
        {view === 'login' ? (
          <div className="animate-in fade-in duration-300">
            <h2 className="mb-[25px] text-[#333] text-[24px] font-bold">{t.welcome}</h2>

            {loginError && <ErrorMessage message={loginError} className="mb-[20px]" />}

            <form onSubmit={handleLoginSubmit}>
              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.email}</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] text-[16px]" />
                  <input
                    type="email"
                    className="w-full p-[14px_14px_14px_45px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] focus:border-[var(--color-green-offer)] outline-none"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoggingIn}
                    required
                  />
                </div>
              </div>

              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.pass}</label>
                <div className="relative">
                  <FaLock className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] text-[16px]" />
                  <input
                    type="password"
                    className="w-full p-[14px_14px_14px_45px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] focus:border-[var(--color-green-offer)] outline-none"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoggingIn}
                    required
                  />
                </div>
                <div className="text-right mt-[8px]">
                  <a href="#" className="text-[12px] color-[#888] font-bold text-[var(--color-nav-bg)] no-underline">{t.forgot}</a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-[15px] bg-[var(--color-green-offer)] text-white border-none rounded-[8px] text-[16px] font-bold cursor-pointer mt-[10px] shadow-[0_4px_10px_rgba(140,179,72,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  t.btnLogin
                )}
              </button>
            </form>

            <div className="text-center mt-[25px] text-[13px] text-[#777] pb-[20px]">
              <span>{t.noAcc}</span> <span className="text-[var(--color-nav-bg)] font-bold cursor-pointer" onClick={() => setView('register')}>{t.useInvite}</span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <h2 className="mb-[15px] text-[#333] text-[24px] font-bold">{t.join}</h2>

            {registerError && <ErrorMessage message={registerError} className="mb-[20px]" />}

            <form onSubmit={handleRegisterSubmit}>

              <div className="bg-[#f0f7e6] border border-dashed border-[var(--color-green-offer)] p-[15px] rounded-[8px] mb-[10px] text-center">
                <div className="text-[12px] font-bold text-[var(--color-nav-bg)] mb-[5px] uppercase">{t.invReq}</div>
                <div className="relative bg-white rounded-[6px]">
                  <FaTicket className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] text-[16px]" />
                  <input
                    type="text"
                    className="w-full p-[14px_14px_14px_45px] border border-[#ddd] rounded-[8px] text-[15px] text-center font-mono font-bold tracking-[1px] uppercase outline-none"
                    placeholder="REGIO-XXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              <span className="text-[12px] text-center mb-[20px] block text-[#888] underline cursor-pointer" onClick={() => setIsNoCodeOpen(true)}>{t.noCode}</span>

              <div className="bg-[#e3f2fd] border-l-[3px] border-[#2196f3] p-[10px] text-[11px] text-[#0d47a1] mb-[20px] rounded-[4px] leading-[1.4]">
                <FaCircleInfo className="inline mr-[5px]" />
                <strong>{t.realTitle}</strong> <span>{t.realMsg}</span>
              </div>

              <div className="flex gap-[10px] mb-[20px]">
                <div className="flex-1">
                  <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.fname}</label>
                  <input
                    type="text"
                    className="w-full p-[14px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] outline-none"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.lname}</label>
                  <input
                    type="text"
                    className="w-full p-[14px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] outline-none"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.email}</label>
                <input
                  type="email"
                  className="w-full p-[14px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] outline-none"
                  placeholder="you@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  disabled={isRegistering}
                  required
                />
              </div>

              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.createPass}</label>
                <input
                  type="password"
                  className="w-full p-[14px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] outline-none"
                  placeholder="Min. 8 chars"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={isRegistering}
                  required
                />
              </div>

              <div className="flex gap-[10px] items-start text-[12px] text-[#666] mb-[15px]">
                <input
                  type="checkbox"
                  id="agb"
                  className="mt-[2px]"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={isRegistering}
                  required
                />
                <label htmlFor="agb">{t.terms}</label>
              </div>

              <button
                type="submit"
                className="w-full p-[15px] bg-[var(--color-green-offer)] text-white border-none rounded-[8px] text-[16px] font-bold cursor-pointer mt-[10px] shadow-[0_4px_10px_rgba(140,179,72,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  t.btnCreate
                )}
              </button>
            </form>

            <div className="text-center mt-[25px] text-[13px] text-[#777] pb-[20px]">
              <span>{t.hasAcc}</span> <span className="text-[var(--color-nav-bg)] font-bold cursor-pointer" onClick={() => setView('login')}>{t.btnLoginLink}</span>
            </div>
          </div>
        )}
      </div>

      {/* No Code Modal */}
      {isNoCodeOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
          <div className="w-[90%] max-w-[400px] bg-white rounded-[12px] p-[25px] relative shadow-2xl animate-in zoom-in-95">
            <div className="absolute top-[15px] right-[15px] text-[24px] text-[#999] cursor-pointer" onClick={() => setIsNoCodeOpen(false)}>&times;</div>
            <h3 className="text-[20px] font-[800] text-[#333] mb-[10px]">{t.mTitle}</h3>
            <p className="text-[14px] text-[#555] leading-[1.5] mb-[20px]">{t.mText}</p>
            
            <p className="font-bold text-[13px] mb-[10px]">{t.mAlt}</p>

            <div className="bg-[#f9f9f9] p-[15px] rounded-[8px] mb-[10px] border border-[#eee] cursor-pointer hover:bg-[#f0f7e6] hover:border-[var(--color-green-offer)] transition-colors" onClick={() => alert('Redirecting...')}>
              <span className="font-bold text-[14px] text-[var(--color-nav-bg)] block mb-[4px]"><FaUsers className="inline mr-[5px]" /> {t.opt1T}</span>
              <span className="text-[12px] text-[#666]">{t.opt1D}</span>
            </div>

            <div className="bg-[#f9f9f9] p-[15px] rounded-[8px] mb-[10px] border border-[#eee] cursor-pointer hover:bg-[#f0f7e6] hover:border-[var(--color-green-offer)] transition-colors" onClick={() => alert('Opening form...')}>
              <span className="font-bold text-[14px] text-[var(--color-nav-bg)] block mb-[4px]"><FaPenNib className="inline mr-[5px]" /> {t.opt2T}</span>
              <span className="text-[12px] text-[#666]">{t.opt2D}</span>
            </div>

          </div>
        </div>
      )}

    </MobileContainer>
  );
}
