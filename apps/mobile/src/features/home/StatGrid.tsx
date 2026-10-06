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
 * Cuatro números en una cuadrícula de 2 × 2 (nada queda escondido fuera de la pantalla):
 * días activos, clases, minutos y cuántas veces terminó en calma. Sin calorías: el tai chi no va de eso.
 * Debajo de cada número, cuánto cambió frente al periodo anterior.
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
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
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
              accessibilityLabel={`${label}: ${value ?? t('home.stats.calmEmpty')}${unit}`}
              style={{
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 112,
                borderRadius: 20,
                backgroundColor: palette.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
                justifyContent: 'space-between',
              }}
            >
              <Text weight="medium" color={palette.muted} style={{ fontSize: 14, lineHeight: 18 }}>
                {label}
              </Text>
              <Animated.View
                key={`${comparison.days}-${value}`}
                entering={FadeIn.duration(260)}
                style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}
              >
                {value === null ? (
                  <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 19 }}>
                    {t('home.stats.calmEmpty')}
                  </Text>
                ) : (
                  <>
                    <Text
                      color={palette.ink}
                      maxFontSizeMultiplier={1.3}
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 34,
                        lineHeight: 40,
                        letterSpacing: -0.8,
                      }}
                    >
                      {value}
                    </Text>
                    {unit ? (
                      <Text
                        weight="medium"
                        color={palette.ink}
                        style={{ fontSize: 18, lineHeight: 22 }}
                      >
                        {unit}
                      </Text>
                    ) : null}
                  </>
                )}
              </Animated.View>
              {showChange && change !== null ? (
                <Change value={change} percent={key === 'calm'} />
              ) : null}
            </View>
          );
        })}
      </View>
      {showChange ? (
        <Text color={palette.faint} style={{ fontSize: 13, lineHeight: 17 }}>
          {t('home.stats.versus', { count: comparison.days })}
        </Text>
      ) : null}
    </View>
  );
}

/** ▲ en verde si subió; si bajó, en gris y sin dramatismo. */
function Change({ value, percent }: { value: number; percent: boolean }) {
  const { t } = useTranslation();
  const palette = appLight;
  const amount = `${Math.abs(value)}${percent ? '%' : ''}`;
  const up = value > 0;
  const label =
    value === 0
      ? t('home.stats.same')
      : t(up ? 'home.stats.up' : 'home.stats.down', { value: amount });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {value !== 0 ? (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            ...(up
              ? { borderBottomWidth: 7, borderBottomColor: palette.positive }
              : { borderTopWidth: 7, borderTopColor: palette.muted }),
          }}
        />
      ) : null}
      <Text
        weight="medium"
        color={up ? palette.positive : palette.muted}
        style={{ fontSize: 13, lineHeight: 17 }}
      >
        {label}
      </Text>
    </View>
  );
}
