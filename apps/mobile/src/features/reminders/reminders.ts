import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { updateSettings } from '@/features/settings/settings';

/** Recordatorio diario local: no necesita internet ni cuenta. Como máximo uno al día. */

const CHANNEL_ID = 'recordatorios';

export function configureNotifications(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Pide permiso (solo aquí) y programa el recordatorio. Devuelve false si la persona no lo permite. */
export async function enableReminder(
  hour: number,
  minute: number,
  texts: { title: string; body: string; channel: string },
): Promise<boolean> {
  if (Platform.OS !== 'web') {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) {
      updateSettings({ reminderAsked: true });
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: texts.channel,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: texts.title, body: texts.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  }
  updateSettings({ reminder: { enabled: true, hour, minute }, reminderAsked: true });
  return true;
}

export async function disableReminder(): Promise<void> {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
  updateSettings({ reminder: { enabled: false, hour: 7, minute: 30 } });
}

/** "A esta hora", redondeado a 5 minutos. */
export function roundedNow(date = new Date()): { hour: number; minute: number } {
  const total = Math.round((date.getHours() * 60 + date.getMinutes()) / 5) * 5;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}

export function formatTime(hour: number, minute: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(2026, 0, 1, hour, minute),
  );
}
