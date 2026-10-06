import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Háptica suave. En web no hace nada. */

export function tapFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => undefined);
}

/** Pulso al empezar cada inhalación: permite practicar con los ojos cerrados. */
export function breathPulse(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => undefined);
}

/** Confirmación al terminar algo importante (el plan está listo). */
export function successFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
