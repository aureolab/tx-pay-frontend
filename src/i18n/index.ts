import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAdmin from './locales/en/admin.json';
import enPartner from './locales/en/partner.json';
import enAuth from './locales/en/auth.json';

import esCommon from './locales/es/common.json';
import esAdmin from './locales/es/admin.json';
import esPartner from './locales/es/partner.json';
import esAuth from './locales/es/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        admin: enAdmin,
        partner: enPartner,
        auth: enAuth,
      },
      es: {
        common: esCommon,
        admin: esAdmin,
        partner: esPartner,
        auth: esAuth,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
