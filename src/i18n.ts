// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es.json';
import ca from './locales/ca.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      ca: { translation: ca },
      en: { translation: en },
    },
    lng: 'es', // Idioma predeterminado
    fallbackLng: 'es',
    debug: true,
    interpolation: {
      escapeValue: false, // No escapar valores para React
    },
  });

export default i18n;