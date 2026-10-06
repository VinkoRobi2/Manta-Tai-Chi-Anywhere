import type { PeriodComparison, PeriodStats } from '@manta/shared';
import { Fragment } from 'react';
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
 * Cuatro números en una sola tarjeta, uno al lado del otro: días activos, clases, minutos y cuántas
 * veces terminó en calma (sin calorías: el tai chi no va de eso). Debajo de cada número, cuánto
 * cambió frente al periodo anterior.
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
      style={{
        flexDirection: 'row',
        borderRadius: 20,
        backgroundColor: palette.card,
        paddingVertical: 14,
      }}
    >
      {STATS.map((key, index) => {
        const value = valueOf(comparison.current, key);
        const before = valueOf(comparison.previous, key);
        const label = t(`home.stats.${key}`);
        const unit = key === 'calm' && value !== null ? '%' : '';
        const change = value !== null && before !== null ? value - before : null;
        return (
          <Fragment key={key}>
            {index > 0 ? (
              <View style={{ width: 1, marginVertical: 4, backgroundColor: palette.line }} />
            ) : null}
            <View
              accessible
              accessibilityLabel={`${label}: ${value ?? '—'}${unit}`}
              style={{ flex: 1, paddingHorizontal: 10, gap: 4 }}
            >
              <Text
                weight="medium"
                color={palette.muted}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontSize: 12, lineHeight: 16 }}
              >
                {label}
              </Text>
              <Animated.View
                key={`${comparison.days}-${value}`}
                entering={FadeIn.duration(260)}
                style={{ flexDirection: 'row', alignItems: 'baseline' }}
              >
                <Text
                  color={value === null ? palette.faint : palette.ink}
                  maxFontSizeMultiplier={1.2}
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 26,
                    lineHeight: 31,
                    letterSpacing: -0.6,
                  }}
                >
                  {value ?? '—'}
                </Text>
                {unit ? (
                  <Text
                    weight="medium"
                    color={palette.ink}
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    {unit}
                  </Text>
                ) : null}
              </Animated.View>
              {showChange && change !== null ? (
                <Change value={change} percent={key === 'calm'} />
              ) : (
                <View style={{ height: 15 }} />
              )}
            </View>
          </Fragment>
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
      style={{ fontSize: 12, lineHeight: 15 }}
    >
      {value === 0 ? '=' : `${up ? '▲' : '▼'} ${amount}`}
    </Text>
  );
}
