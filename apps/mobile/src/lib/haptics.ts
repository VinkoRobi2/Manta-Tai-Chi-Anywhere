import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Háptica suave al tocar. En web no hace nada. */
export function tapFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => undefined);
}
