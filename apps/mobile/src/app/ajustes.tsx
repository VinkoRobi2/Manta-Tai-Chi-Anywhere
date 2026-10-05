import type { Locale } from '@manta/shared';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { formatBytes, removeAnchored, useDownloads } from '@/features/downloads/downloads';
import { purchases, usePremium } from '@/features/paywall/purchases';
import { disableReminder, enableReminder, formatTime } from '@/features/reminders/reminders';
import { updateSettings, useSettings, type CaptionSize } from '@/features/settings/settings';
import { applyLanguage, localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space, type Appearance } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';

const REMINDER_TIMES: [number, number][] = [
  [6, 0],
  [7, 0],
  [7, 30],
  [8, 0],
  [12, 0],
  [18, 0],
  [20, 0],
  [21, 0],
];

function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <View style={{ gap: space.s }}>
      <Text variant="label" tone="soft" style={{ marginLeft: space.xs }} accessibilityRole="header">
        {title}
      </Text>
      <Card style={{ gap: space.m }}>{children}</Card>
      {hint ? (
        <Text variant="caption" tone="soft" style={{ marginHorizontal: space.xs }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const palette = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: 48 }}>
      <Text variant="callout" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: palette.accent, false: palette.surfaceAlt }}
        thumbColor={palette.surface}
        ios_backgroundColor={palette.surfaceAlt}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const settings = useSettings();
  const premium = usePremium();
  const downloads = useDownloads();
  const tag = localeTag(locale);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const downloaded = Object.entries(downloads.anchored);
  const downloadedBytes = downloaded.reduce((sum, [, bytes]) => sum + bytes, 0);
  const reminderTexts = {
    title: t('notification.title'),
    body: t('notification.body'),
    channel: t('notification.channel'),
  };

  const setLanguage = (language: 'system' | Locale) => {
    updateSettings({ language });
    applyLanguage(language);
  };

  return (
    <Screen title={t('settings.title')} back>
      <Section title={t('settings.language')}>
        <Segmented
          accessibilityLabel={t('settings.language')}
          value={settings.language}
          onChange={setLanguage}
          options={[
            { value: 'system', label: t('settings.languageSystem') },
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
            { value: 'de', label: 'Deutsch' },
          ]}
        />
      </Section>

      <Section title={t('settings.appearance')} hint={t('settings.appearanceHint')}>
        <Segmented<Appearance>
          accessibilityLabel={t('settings.appearance')}
          value={settings.appearance}
          onChange={(appearance) => updateSettings({ appearance })}
          options={[
            { value: 'system', label: t('settings.appearanceSystem') },
            { value: 'light', label: t('settings.appearanceLight') },
            { value: 'cabin', label: t('settings.appearanceCabin') },
          ]}
        />
      </Section>

      <Section title={t('settings.captions')}>
        <Segmented<CaptionSize>
          accessibilityLabel={t('settings.captions')}
          value={settings.captionSize}
          onChange={(captionSize) => updateSettings({ captionSize })}
          options={[
            { value: 'normal', label: t('settings.captionNormal') },
            { value: 'large', label: t('settings.captionLarge') },
            { value: 'xlarge', label: t('settings.captionXLarge') },
          ]}
        />
        <SwitchRow
          label={t('settings.haptics')}
          value={settings.breathHaptics}
          onChange={(breathHaptics) => updateSettings({ breathHaptics })}
        />
        <Text variant="caption" tone="soft" style={{ marginTop: -space.s }}>
          {t('settings.hapticsHint')}
        </Text>
        <ListRow divider title={t('settings.voice')} subtitle={t('settings.voiceValue')} />
      </Section>

      <Section title={t('settings.reminder')} hint={t('settings.reminderHint')}>
        <SwitchRow
          label={t('settings.reminder')}
          value={settings.reminder.enabled}
          onChange={(enabled) =>
            void (enabled
              ? enableReminder(settings.reminder.hour, settings.reminder.minute, reminderTexts)
              : disableReminder())
          }
        />
        {settings.reminder.enabled ? (
          <View style={{ gap: space.s }}>
            <Text variant="caption" tone="soft">
              {t('settings.reminderTime')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
              {REMINDER_TIMES.map(([hour, minute]) => (
                <Chip
                  key={`${hour}:${minute}`}
                  label={formatTime(hour, minute, tag)}
                  selected={settings.reminder.hour === hour && settings.reminder.minute === minute}
                  onPress={() => void enableReminder(hour, minute, reminderTexts)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </Section>

      <Section title={t('settings.storage')} hint={t('settings.storagePackaged')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Icon name="anchor" size={18} color={palette.accent} />
          <Text variant="callout">
            {t('settings.storageValue', {
              count: downloaded.length,
              size: formatBytes(downloadedBytes, tag),
            })}
          </Text>
        </View>
        {downloaded.length > 0 ? (
          <Button
            label={t('settings.storageDelete')}
            icon="trash"
            variant="outline"
            size="medium"
            block
            onPress={() => removeAnchored(downloaded.map(([slug]) => slug))}
          />
        ) : null}
      </Section>

      <Section title={t('settings.premium')}>
        <ListRow
          title={t('settings.premium')}
          subtitle={premium ? t('settings.premiumActive') : t('settings.premiumInactive')}
          right={
            premium ? (
              <Icon name="check" size={18} color={palette.accent} />
            ) : (
              <Icon name="chevronRight" size={16} color={palette.inkSoft} />
            )
          }
          onPress={premium ? undefined : () => router.push('/manta-completa')}
        />
        <ListRow
          divider
          title={t('settings.restore')}
          subtitle={restoreMessage ?? undefined}
          onPress={async () => {
            const result = await purchases.restore();
            setRestoreMessage(
              result.premium ? t('paywall.restored') : t('paywall.nothingToRestore'),
            );
          }}
        />
      </Section>

      <Card padded={false} style={{ paddingHorizontal: space.l }}>
        <ListRow
          title={t('settings.health')}
          left={<Icon name="info" size={20} color={palette.accent} />}
          right={<Icon name="chevronRight" size={16} color={palette.inkSoft} />}
          onPress={() => router.push('/salud')}
        />
      </Card>

      <Text variant="caption" tone="soft" align="center">
        Manta · {t('settings.version', { version: Constants.expoConfig?.version ?? '—' })}
      </Text>
    </Screen>
  );
}
