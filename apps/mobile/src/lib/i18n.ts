import { DEFAULT_LOCALE, LOCALES, type Locale } from '@manta/shared';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from '@/i18n/de.json';
import en from '@/i18n/en.json';
import es from '@/i18n/es.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;

export const currentLocale: Locale = (LOCALES as readonly string[]).includes(deviceLanguage)
  ? (deviceLanguage as Locale)
  : DEFAULT_LOCALE;

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en }, de: { translation: de } },
  lng: currentLocale,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export default i18n;
