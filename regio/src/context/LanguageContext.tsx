"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { uiTexts } from '@/data/mockData';
import { LangTexts } from '@/lib/types';

type Language = 'GB' | 'HU' | 'DE';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: LangTexts;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('GB');

  const value = {
    language,
    setLanguage,
    t: uiTexts[language]
  };

  return (
    <LanguageContext.Provider value={value}>
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
