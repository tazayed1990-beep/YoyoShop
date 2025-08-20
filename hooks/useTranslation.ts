
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const t = (key: string, options?: { [key: string]: string | number }) => {
    let translation = context.translations[key] || key;
    if (options) {
        Object.keys(options).forEach(optionKey => {
            translation = translation.replace(`{{${optionKey}}}`, String(options[optionKey]));
        });
    }
    return translation;
  };

  return { t, language: context.language, setLanguage: context.setLanguage };
};