import type { PeriodComparison, PeriodStats } from '@manta/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { appLight, fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

type StatKey = 'activeDays' | 'sessions' | 'minutes' | 'calm';

const STATS: readonly StatKey[] = ['activeDays', 'sessions', 'minutes', 'calm'];

function valueOf(stats: PeriodStats, key: StatKey): number | null {
  return key === 'calm' ? stats.calmPercent : stats[key];
}

/**
 * Cuatro números en un mosaico de dos por dos: días activos, clases, minutos y cuántas veces
 * terminó en calma (sin calorías: el tai chi no va de eso). Debajo de cada número, cuánto cambió
 * frente al periodo anterior.
 */
export function StatGrid({
  comparison,
  showChange,
}: {
  comparison: PeriodComparison;
  /** Sin prácticas todavía, comparar no dice nada. */
  showChange: boolean;
}) {
  const { t } = useTranslation();
  const palette = appLight;

  return (
    <View
      accessibilityHint={
        showChange ? t('home.stats.versus', { count: comparison.days }) : undefined
      }
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
    >
      {STATS.map((key) => {
        const value = valueOf(comparison.current, key);
        const before = valueOf(comparison.previous, key);
        const label = t(`home.stats.${key}`);
        const unit = key === 'calm' && value !== null ? '%' : '';
        const change = value !== null && before !== null ? value - before : null;
        return (
          <View
            key={key}
            accessible
            accessibilityLabel={`${label}: ${value ?? '—'}${unit}`}
            style={{
              flexGrow: 1,
              flexBasis: '40%',
              borderRadius: 22,
              backgroundColor: palette.card,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14,
              gap: 2,
            }}
          >
            <Text
              weight="medium"
              color={palette.muted}
              numberOfLines={1}
              style={{ fontSize: 13, lineHeight: 17 }}
            >
              {label}
            </Text>
            <Animated.View
              key={`${comparison.days}-${value}`}
              entering={FadeIn.duration(260)}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}
            >
              <Text
                color={value === null ? palette.faint : palette.ink}
                maxFontSizeMultiplier={1.2}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 34,
                  lineHeight: 40,
                  letterSpacing: -1,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {value ?? '—'}
              </Text>
              {unit ? (
                <Text
                  weight="semibold"
                  color={palette.ink}
                  style={{ fontSize: 17, lineHeight: 22 }}
                >
                  {unit}
                </Text>
              ) : null}
            </Animated.View>
            {showChange && change !== null ? (
              <Change value={change} percent={key === 'calm'} />
            ) : (
              <View style={{ height: 17 }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** ▲ en verde si subió; si bajó, ▼ en gris y sin dramatismo. */
function Change({ value, percent }: { value: number; percent: boolean }) {
  const { t } = useTranslation();
  const palette = appLight;
  const up = value > 0;
  const amount = `${Math.abs(value)}${percent ? '%' : ''}`;
  const label =
    value === 0
      ? t('home.stats.same')
      : t(up ? 'home.stats.up' : 'home.stats.down', { value: amount });
  return (
    <Text
      weight="medium"
      color={up ? palette.positive : palette.muted}
      numberOfLines={1}
      accessibilityLabel={label}
      style={{ fontSize: 13, lineHeight: 17 }}
    >
      {value === 0 ? label : `${up ? '▲' : '▼'} ${label}`}
    </Text>
  );
}
