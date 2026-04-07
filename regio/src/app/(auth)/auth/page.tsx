"use client";

import React, { useState } from "react";
import { FaEnvelope, FaLock, FaTicket, FaCircleInfo, FaUsers, FaPenNib, FaSpinner } from "react-icons/fa6";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRegisterUser } from "@/lib/api";
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await login({ username: loginEmail, password: loginPassword });
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      const message = err?.response?.data?.detail || err.message || t.auth.login.error_invalid;
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (registerPassword.length < 8) {
      setRegisterError('Password must be at least 8 characters long.');
      return;
    }
    if (!agreeToTerms) {
      setRegisterError('You must agree to the terms and conditions.');
      return;
    }

    setIsRegistering(true);
    try {
      await registerMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email: registerEmail,
        password: registerPassword,
        invite_code: inviteCode,
      });
      await login({ username: registerEmail, password: registerPassword });
    } catch (error: unknown) {
      console.error('Registration error:', error);
      let message = 'Registration failed. Please try again.';
      const err = error as { response?: { data?: { detail?: unknown } } };
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          message = detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ');
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
        <div className="mb-[10px] flex justify-center">
          <Image src="/logo-M.png" alt="REGIO" width={160} height={58} priority />
        </div>
        <div className="text-[16px] text-[#666] max-w-[280px] mx-auto leading-[1.4] whitespace-pre-line">
          {t.feed.header.subtitle}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-[25px] flex-grow p-[30px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-10 duration-500 flex flex-col">

        {view === 'login' ? (
          <div className="animate-in fade-in duration-300">
            <h2 className="mb-[25px] text-[#333] text-[24px] font-bold">{t.auth.login.section_title}</h2>

            {loginError && <ErrorMessage message={loginError} className="mb-[20px]" />}

            <form onSubmit={handleLoginSubmit}>
              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.login.email_label}</label>
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
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.login.password_label}</label>
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
              </div>

              <button
                type="submit"
                className="w-full p-[15px] bg-[var(--color-green-offer)] text-white border-none rounded-[8px] text-[16px] font-bold cursor-pointer mt-[10px] shadow-[0_4px_10px_rgba(140,179,72,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {t.auth.login.submit_loading}
                  </>
                ) : (
                  t.auth.login.submit
                )}
              </button>
            </form>

            <div className="text-center mt-[25px] text-[13px] text-[#777] pb-[20px]">
              <span
                className="text-[var(--color-nav-bg)] font-bold cursor-pointer"
                onClick={() => setView('register')}
              >
                {t.auth.login.toggle_to_register}
              </span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <h2 className="mb-[15px] text-[#333] text-[24px] font-bold">{t.auth.register.section_title}</h2>

            {registerError && <ErrorMessage message={registerError} className="mb-[20px]" />}

            <form onSubmit={handleRegisterSubmit}>
              <div className="bg-[#f0f7e6] border border-dashed border-[var(--color-green-offer)] p-[15px] rounded-[8px] mb-[10px] text-center">
                <div className="text-[12px] font-bold text-[var(--color-nav-bg)] mb-[5px] uppercase">{t.auth.register.section_title}</div>
                <div className="relative bg-white rounded-[6px]">
                  <FaTicket className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] text-[16px]" />
                  <input
                    type="text"
                    className="w-full p-[14px_14px_14px_45px] border border-[#ddd] rounded-[8px] text-[15px] text-center font-mono font-bold tracking-[1px] uppercase outline-none"
                    placeholder={t.auth.register.invite_placeholder}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              <span
                className="text-[12px] text-center mb-[20px] block text-[#888] underline cursor-pointer"
                onClick={() => setIsNoCodeOpen(true)}
              >
                {t.auth.no_code_modal.title}
              </span>

              <div className="bg-[#e3f2fd] border-l-[3px] border-[#2196f3] p-[10px] text-[11px] text-[#0d47a1] mb-[20px] rounded-[4px] leading-[1.4]">
                <FaCircleInfo className="inline mr-[5px]" />
                {t.auth.register.real_name_notice}
              </div>

              <div className="flex gap-[10px] mb-[20px]">
                <div className="flex-1">
                  <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.register.first_name_label}</label>
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
                  <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.register.last_name_label}</label>
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
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.register.email_label}</label>
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
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.register.password_label}</label>
                <input
                  type="password"
                  className="w-full p-[14px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] outline-none"
                  placeholder={t.auth.register.password_placeholder}
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
                <label htmlFor="agb">{t.auth.register.terms_checkbox}</label>
              </div>

              <button
                type="submit"
                className="w-full p-[15px] bg-[var(--color-green-offer)] text-white border-none rounded-[8px] text-[16px] font-bold cursor-pointer mt-[10px] shadow-[0_4px_10px_rgba(140,179,72,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {t.auth.register.submit_loading}
                  </>
                ) : (
                  t.auth.register.submit
                )}
              </button>
            </form>

            <div className="text-center mt-[25px] text-[13px] text-[#777] pb-[20px]">
              <span
                className="text-[var(--color-nav-bg)] font-bold cursor-pointer"
                onClick={() => setView('login')}
              >
                {t.auth.register.toggle_to_login}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* No Code Modal */}
      {isNoCodeOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
          <div className="w-[90%] max-w-[400px] bg-white rounded-[12px] p-[25px] relative shadow-2xl animate-in zoom-in-95">
            <div className="absolute top-[15px] right-[15px] text-[24px] text-[#999] cursor-pointer" onClick={() => setIsNoCodeOpen(false)}>&times;</div>
            <h3 className="text-[20px] font-[800] text-[#333] mb-[10px]">{t.auth.no_code_modal.title}</h3>

            <div
              className="bg-[#f9f9f9] p-[15px] rounded-[8px] mb-[10px] border border-[#eee] cursor-pointer hover:bg-[#f0f7e6] hover:border-[var(--color-green-offer)] transition-colors"
              onClick={() => alert('Redirecting...')}
            >
              <span className="font-bold text-[14px] text-[var(--color-nav-bg)] block mb-[4px]">
                <FaUsers className="inline mr-[5px]" /> {t.auth.no_code_modal.request_community}
              </span>
            </div>

            <div
              className="bg-[#f9f9f9] p-[15px] rounded-[8px] mb-[10px] border border-[#eee] cursor-pointer hover:bg-[#f0f7e6] hover:border-[var(--color-green-offer)] transition-colors"
              onClick={() => alert('Opening form...')}
            >
              <span className="font-bold text-[14px] text-[var(--color-nav-bg)] block mb-[4px]">
                <FaPenNib className="inline mr-[5px]" /> {t.auth.no_code_modal.apply_access}
              </span>
            </div>
          </div>
        </div>
      )}

    </MobileContainer>
  );
}
