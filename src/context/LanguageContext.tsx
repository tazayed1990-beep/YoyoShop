
import React, { createContext, useState, useEffect, useCallback } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  translations: { [key: string]: string };
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(localStorage.getItem('language') || 'en');
  const [translations, setTranslations] = useState({});

  const fetchTranslations = useCallback(async (lang: string) => {
    try {
      // For Vite, files in `public` are served from the root.
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error(`Could not load translations for ${lang}`, error);
      // Fallback to English if translations are missing
      if (lang !== 'en') {
        fetchTranslations('en');
      }
    }
  }, []);

  useEffect(() => {
    fetchTranslations(language);
  }, [language, fetchTranslations]);
  
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    // Set initial language direction
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {Object.keys(translations).length > 0 && children}
    </LanguageContext.Provider>
  );
};
