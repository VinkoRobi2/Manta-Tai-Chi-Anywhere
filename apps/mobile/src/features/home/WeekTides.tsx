import type { TideWeek } from '@manta/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { appLight } from '@/theme/tokens';
import { CheckGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/**
 * Las mareas de la semana, de lunes a domingo. Un día con práctica se llena de sol;
 * hoy lleva un aro negro hasta que practicas. Los días sin práctica no se marcan como fallos.
 */
export function WeekTides({
  week,
  size = 40,
  empty = appLight.card,
}: {
  week: TideWeek;
  size?: number;
  /** Relleno de los días sin práctica (sobre una tarjeta gris, va en blanco). */
  empty?: string;
}) {
  const { t } = useTranslation();
  const palette = appLight;
  const letters = t('onboarding.plan.weekdays', { returnObjects: true }) as string[];

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {week.days.map((done, index) => {
        const today = index === week.todayIndex;
        const future = index > week.todayIndex;
        const letter = letters[index] ?? '';
        return (
          <View
            key={letter + index}
            style={{ alignItems: 'center', gap: 7 }}
            accessible
            accessibilityLabel={[
              letter,
              today ? t('home.today') : null,
              done ? t('home.tideDone') : null,
            ]
              .filter(Boolean)
              .join(', ')}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done ? palette.accent : today ? 'transparent' : empty,
                borderWidth: today && !done ? 2 : 0,
                borderColor: palette.ink,
              }}
            >
              {done ? (
                <Animated.View entering={ZoomIn.duration(320)}>
                  <CheckGlyph color={palette.onAccent} size={size * 0.5} strokeWidth={2.4} />
                </Animated.View>
              ) : null}
            </View>
            <Text
              weight={today ? 'semibold' : 'medium'}
              color={today ? palette.ink : future ? palette.faint : palette.muted}
              style={{ fontSize: 13, lineHeight: 16 }}
            >
              {letter}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
