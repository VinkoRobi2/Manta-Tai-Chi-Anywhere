import type { Locale } from '@manta/shared';
import * as Speech from 'expo-speech';

import { localeTag } from '@/lib/i18n';

/**
 * Voz provisional: la del sistema (funciona sin red en la mayoría de los teléfonos).
 * Cuando existan las voces grabadas, el segmento traerá su archivo `cue` y sonará con expo-audio.
 */

export function speak(text: string, locale: Locale, rate: number): void {
  Speech.speak(text, {
    language: localeTag(locale),
    // Un poco más lenta que lo normal: es una clase, no una noticia.
    rate: Math.max(0.5, 0.9 * rate),
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
}
