"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translationsEn from '@/locales/translations.json';
import translationsDe from '@/locales/translations_de.json';
import translationsHu from '@/locales/translations_hu.json';

export type Language = 'GB' | 'HU' | 'DE';
export type Translations = typeof translationsEn;

const TRANSLATIONS: Record<Language, Translations> = {
  GB: translationsEn,
  DE: translationsDe as Translations,
  HU: translationsHu as Translations,
};

const STORAGE_KEY = 'regio_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('GB');

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
