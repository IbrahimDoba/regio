"use client";

import React from "react";
import { FaUserClock, FaCheck, FaVideo, FaLock } from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";

export default function VerificationPage() {
  const { language, setLanguage } = useLanguage();

  const content = {
    'GB': {
      title: 'Verification Pending',
      desc: 'Welcome to the community! To ensure trust and safety, we verify every member personally via a short video call.',
      step1: 'Register', step2: 'Video Call', step3: 'Active',
      actTitle: 'Next Step', actDesc: 'Please schedule a 2-minute call with a moderator to activate your account.',
      btnBook: 'Book Appointment',
      secure: 'Your data is secure and will only be used for verification.',
      logout: 'Log Out'
    },
    'HU': {
      title: 'Ellenőrzés folyamatban',
      desc: 'Üdvözlünk a közösségben! A bizalom és biztonság érdekében minden tagot személyesen ellenőrzünk egy rövid videohívás során.',
      step1: 'Regisztráció', step2: 'Videohívás', step3: 'Aktív',
      actTitle: 'Következő lépés', actDesc: 'Kérlek foglalj egy 2 perces időpontot egy moderátorral a fiókod aktiválásához.',
      btnBook: 'Időpont foglalása',
      secure: 'Adataid biztonságban vannak, csak az ellenőrzéshez használjuk.',
      logout: 'Kijelentkezés'
    },
    'DE': {
      title: 'Verifizierung ausstehend',
      desc: 'Willkommen in der Community! Um Vertrauen und Sicherheit zu gewährleisten, verifizieren wir jedes Mitglied persönlich per kurzem Video-Call.',
      step1: 'Registriert', step2: 'Video Call', step3: 'Aktiv',
      actTitle: 'Nächster Schritt', actDesc: 'Bitte vereinbare einen 2-minütigen Termin mit einem Moderator zur Freischaltung.',
      btnBook: 'Termin buchen',
      secure: 'Deine Daten sind sicher und werden nur zur Prüfung genutzt.',
      logout: 'Abmelden'
    }
  };

  const t = content[language] || content['GB'];

  const flags: { [key: string]: string } = { 'GB': '🇬🇧 EN', 'HU': '🇭🇺 HU', 'DE': '🇩🇪 DE' };

  const toggleLanguage = () => {
    const langs: ('GB' | 'HU' | 'DE')[] = ['GB', 'HU', 'DE'];
    const idx = langs.indexOf(language);
    const next = langs[(idx + 1) % langs.length];
    setLanguage(next);
  };

  return (
    <div className="bg-[var(--bg-app)] min-h-screen flex flex-col relative bg-[url('https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center bg-blend-multiply bg-[#fcfcfc]">
      
      {/* Top Bar */}
      <div className="p-[20px] flex justify-end">
        <div 
          className="bg-[rgba(255,255,255,0.9)] p-[6px_12px] rounded-[20px] text-[13px] font-[700] cursor-pointer flex items-center gap-[5px] shadow-sm"
          onClick={toggleLanguage}
        >
          {flags[language]}
        </div>
      </div>

      {/* Main Card */}
      <div className="m-[20px] bg-white rounded-[20px] p-[30px_25px] text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-600">
        <div className="w-[80px] h-[80px] bg-[#fff8e1] rounded-full mx-auto mb-[20px] flex justify-center items-center border-[2px] border-dashed border-[#f57c00]">
          <FaUserClock className="text-[32px] text-[#f57c00]" />
        </div>
        
        <h1 className="text-[22px] font-[800] text-[#333] mb-[10px]">{t.title}</h1>
        <p className="text-[14px] text-[#666] leading-[1.5] mb-[30px]">
          {t.desc}
        </p>

        {/* Timeline */}
        <div className="flex justify-between items-center relative mb-[40px] px-[10px]">
          <div className="absolute top-[15px] left-[30px] right-[30px] h-[2px] bg-[#eee] z-0"></div>
          
          {/* Step 1: Done */}
          <div className="relative z-10 flex flex-col items-center gap-[8px] w-1/3">
            <div className="w-[32px] h-[32px] rounded-full bg-[var(--color-green-offer)] border-[2px] border-[var(--color-green-offer)] flex justify-center items-center text-white text-[12px]">
              <FaCheck />
            </div>
            <span className="text-[11px] font-[600] text-[var(--color-green-offer)]">{t.step1}</span>
          </div>

          {/* Step 2: Current */}
          <div className="relative z-10 flex flex-col items-center gap-[8px] w-1/3">
            <div className="w-[32px] h-[32px] rounded-full bg-[#fff8e1] border-[2px] border-[#f57c00] flex justify-center items-center text-[#f57c00] text-[12px] font-bold animate-pulse shadow-[0_0_0_4px_rgba(245,124,0,0.1)]">
              2
            </div>
            <span className="text-[11px] font-[800] text-[#f57c00]">{t.step2}</span>
          </div>

          {/* Step 3: Future */}
          <div className="relative z-10 flex flex-col items-center gap-[8px] w-1/3">
            <div className="w-[32px] h-[32px] rounded-full bg-white border-[2px] border-[#ddd] flex justify-center items-center text-[#ccc] text-[12px]">
              3
            </div>
            <span className="text-[11px] font-[600] text-[#999]">{t.step3}</span>
          </div>
        </div>

        {/* Action Box */}
        <div className="bg-[#f0f7e6] border border-[#dcedc8] p-[15px] rounded-[10px] mb-[20px]">
          <span className="font-[700] text-[var(--color-nav-bg)] text-[13px] mb-[5px] block">{t.actTitle}</span>
          <div className="text-[12px] text-[#555] mb-[15px]">{t.actDesc}</div>
          <button 
            className="w-full p-[12px] bg-[var(--color-green-offer)] text-white border-none rounded-[6px] text-[14px] font-[700] cursor-pointer flex justify-center items-center gap-[8px] hover:scale-[1.02] transition-transform"
            onClick={() => window.open('https://calendly.com', '_blank')}
          >
            <FaVideo /> <span>{t.btnBook}</span>
          </button>
        </div>

        <div className="text-[11px] text-[#999] mt-[20px]">
          <FaLock className="inline mr-[4px]" /> <span>{t.secure}</span>
        </div>
      </div>

      <div 
        className="mt-auto pb-[30px] text-center text-[13px] font-[600] text-[#888] cursor-pointer underline"
        onClick={() => window.location.href = '/auth'}
      >
        {t.logout}
      </div>

    </div>
  );
}
