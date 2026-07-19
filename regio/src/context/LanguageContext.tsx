"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translationsEn from '@/locales/translations.json';
import translationsDe from '@/locales/translations_de.json';
import translationsHu from '@/locales/translations_hu.json';

export type Language = 'EN' | 'HU' | 'DE';
export type Translations = typeof translationsEn;

const TRANSLATIONS: Record<Language, Translations> = {
  EN: translationsEn,
  DE: translationsDe as Translations,
  HU: translationsHu as Translations,
};

const STORAGE_KEY = 'regio_language';

function readLanguageCookie(): Language | null {
  const match = document.cookie.match(/(?:^|;\s*)regio_language=([^;]+)/);
  return match ? (decodeURIComponent(match[1]) as Language) : null;
}

function clearLanguageCookie() {
  document.cookie = 'regio_language=; path=/; max-age=0';
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('EN');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A locale entry path (e.g. /de) leaves a one-shot cookie via middleware; it always
    // wins over the stored preference, then is persisted to localStorage and cleared.
    const fromCookie = readLanguageCookie();
    if (fromCookie && fromCookie in TRANSLATIONS) {
      localStorage.setItem(STORAGE_KEY, fromCookie);
      clearLanguageCookie();
      const id = window.setTimeout(() => setLanguageState(fromCookie), 0);
      return () => window.clearTimeout(id);
    }

    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && stored in TRANSLATIONS) {
      const id = window.setTimeout(() => setLanguageState(stored), 0);
      return () => window.clearTimeout(id);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: TRANSLATIONS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
