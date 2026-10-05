import type { SeaState, SpaceMode, TideWeek as TideWeekData } from '@manta/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { Icon } from './Icon';
import { Text } from './Text';

/** Piezas gráficas propias de Manta: el mar, las mareas y los espacios vistos desde arriba. */

const SEA_SHAPE: Record<SeaState, { amplitude: number; cycles: number }> = {
  CALM: { amplitude: 0.5, cycles: 1.5 },
  SLIGHT: { amplitude: 2, cycles: 2 },
  MODERATE: { amplitude: 4, cycles: 2 },
  ROUGH: { amplitude: 6, cycles: 3 },
};

/** Una ola cuya altura muestra el estado del mar: de "En calma" a "Mar picado". */
export function SeaStateIcon({
  state,
  color,
  width = 34,
}: {
  state: SeaState;
  color?: string;
  width?: number;
}) {
  const palette = useTheme();
  const { amplitude, cycles } = SEA_SHAPE[state];
  const w = 30;
  const h = 16;
  let d = `M1 ${h / 2}`;
  for (let i = 1; i <= 28; i++) {
    const x = 1 + (i * (w - 2)) / 28;
    const y = h / 2 - amplitude * Math.sin((i / 28) * cycles * 2 * Math.PI);
    d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return (
    <Svg
      width={width}
      height={(width * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d={d}
        fill="none"
        stroke={color ?? palette.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TideDay({ filled, today }: { filled: boolean; today: boolean }) {
  const palette = useTheme();
  return (
    <Svg width={28} height={32} viewBox="0 0 24 28">
      <Rect
        x={1}
        y={1}
        width={22}
        height={26}
        rx={7}
        fill={palette.background}
        stroke={today ? palette.ink : palette.border}
        strokeWidth={today ? 1.6 : 1}
      />
      {filled ? (
        <Path
          d="M1.6 14.5Q6.5 11.5 12 14.5T22.4 14.5V20a6.4 6.4 0 0 1-6.4 6.4H8A6.4 6.4 0 0 1 1.6 20Z"
          fill={palette.accent}
        />
      ) : null}
    </Svg>
  );
}

/** Las mareas de la semana: siete marcas que se llenan de agua cuando hubo práctica. */
export function TideWeek({
  week,
  title,
  subtitle,
}: {
  week: TideWeekData;
  title: string;
  subtitle: string;
}) {
  const { t } = useTranslation();
  const days = t('tides.days', { returnObjects: true }) as string[];
  const fullNames = t('tides.dayNames', { returnObjects: true }) as string[];
  return (
    <View accessible accessibilityLabel={`${title}. ${subtitle}`}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Text variant="callout" weight="semibold">
          {title}
        </Text>
        <Text variant="caption" tone="soft">
          {subtitle}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.s }}>
        {week.days.map((filled, index) => (
          <View key={fullNames[index] ?? index} style={{ alignItems: 'center', gap: 2 }}>
            <TideDay filled={filled} today={index === week.todayIndex} />
            <Text
              variant="caption"
              tone={index === week.todayIndex ? 'ink' : 'soft'}
              weight={index === week.todayIndex ? 'semibold' : 'regular'}
              style={{ fontSize: 12 }}
            >
              {days[index]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Cada espacio visto desde arriba, en planta. */
export function SpacePlan({ mode, size = 60 }: { mode: SpaceMode; size?: number }) {
  const palette = useTheme();
  const c = palette.accent;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: c,
    strokeWidth: 1.6,
  } as const;

  if (mode === 'SEATED') {
    return (
      <Svg {...common}>
        <Rect x={15} y={10} width={34} height={6} rx={3} fill={c} fillOpacity={0.18} />
        <Rect x={17} y={18} width={30} height={28} rx={5} />
        <Ellipse cx={32} cy={29} rx={12.5} ry={6} fill={c} fillOpacity={0.14} stroke="none" />
        <Circle cx={32} cy={29} r={4.6} fill={c} stroke="none" />
        <Path d="M17 56h30M17 53.5v5M47 53.5v5" strokeWidth={1.2} />
      </Svg>
    );
  }
  if (mode === 'STANDING_IN_PLACE') {
    return (
      <Svg {...common}>
        <Rect x={10} y={6} width={44} height={44} rx={2} strokeDasharray="3 3" />
        <Ellipse cx={25.5} cy={29} rx={4} ry={7} fill={c} stroke="none" />
        <Ellipse cx={38.5} cy={29} rx={4} ry={7} fill={c} stroke="none" />
        <Path d="M10 57h44M10 54.5v5M54 54.5v5" strokeWidth={1.2} />
      </Svg>
    );
  }
  const steps: [number, number, number][] = [
    [12, 50, 40],
    [19, 45, 48],
    [23, 37, 40],
    [30, 33, 48],
    [34, 25, 40],
    [42, 21, 48],
    [46, 13, 40],
    [53, 10, 48],
  ];
  return (
    <Svg {...common}>
      <Rect x={4} y={4} width={56} height={50} rx={3} strokeDasharray="3 3" strokeOpacity={0.5} />
      <Path d="M8 54C20 42 38 36 57 6" strokeDasharray="1.5 3" strokeOpacity={0.45} />
      {steps.map(([x, y, angle], index) => (
        <Ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx={2.2}
          ry={3.6}
          rotation={angle}
          originX={x}
          originY={y}
          fill={c}
          fillOpacity={0.35 + index * 0.09}
          stroke="none"
        />
      ))}
    </Svg>
  );
}

/** "Anclada": la clase ya está en el teléfono y funciona sin señal. */
export function AnchoredBadge() {
  const { t } = useTranslation();
  const palette = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name="anchor" size={14} color={palette.accent} />
      <Text variant="caption" tone="accent" weight="semibold">
        {t('common.anchored')}
      </Text>
    </View>
  );
}

/** Anillo de progreso de una descarga. */
export function ProgressRing({ progress, size = 26 }: { progress: number; size?: number }) {
  const palette = useTheme();
  const r = 10;
  const circumference = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={r} stroke={palette.surfaceAlt} strokeWidth={3} fill="none" />
      <Circle
        cx={12}
        cy={12}
        r={r}
        stroke={palette.accent}
        strokeWidth={3}
        fill="none"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        strokeLinecap="round"
        rotation={-90}
        originX={12}
        originY={12}
      />
    </Svg>
  );
}
