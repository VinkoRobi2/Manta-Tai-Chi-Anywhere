import { DEFAULT_LOCALE, LOCALES, type Locale } from '@manta/shared';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from '@/i18n/de.json';
import en from '@/i18n/en.json';
import es from '@/i18n/es.json';

/** Idioma del teléfono si Manta lo tiene; si no, español. */
function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
  return (LOCALES as readonly string[]).includes(code) ? (code as Locale) : DEFAULT_LOCALE;
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en }, de: { translation: de } },
  lng: deviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export default i18n;
