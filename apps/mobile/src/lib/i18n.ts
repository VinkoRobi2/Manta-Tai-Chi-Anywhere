import { DEFAULT_LOCALE, LOCALES, LocaleSchema, type Locale } from '@manta/shared';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import de from '@/i18n/de.json';
import en from '@/i18n/en.json';
import es from '@/i18n/es.json';

/** Idioma del teléfono si Manta lo tiene; si no, español. */
export function deviceLocale(): Locale {
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

/** Aplica la preferencia de Ajustes: 'system' sigue al teléfono. */
export function applyLanguage(language: 'system' | Locale): void {
  const next = language === 'system' ? deviceLocale() : language;
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

export function currentLocale(): Locale {
  return LocaleSchema.safeParse(i18n.language).data ?? DEFAULT_LOCALE;
}

/** Idioma activo; el componente se vuelve a dibujar cuando cambia. */
export function useLocale(): Locale {
  const { i18n: instance } = useTranslation();
  return LocaleSchema.safeParse(instance.language).data ?? DEFAULT_LOCALE;
}

/** Etiqueta BCP 47 para fechas, números y la voz: usa la región del teléfono si coincide el idioma. */
export function localeTag(locale: Locale): string {
  const device = getLocales()[0];
  if (device?.languageCode === locale && device.languageTag) return device.languageTag;
  return { es: 'es-ES', en: 'en-US', de: 'de-DE' }[locale];
}

export default i18n;
