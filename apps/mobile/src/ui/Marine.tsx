import type { SeaState, SpaceMode, TideWeek as TideWeekData } from '@manta/shared';
import { useTranslation } from 'react-i18next';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { contentGlow, glowShadow, space, type Palette } from '@/theme/tokens';

import { Icon } from './Icon';
import { Text } from './Text';

/** Piezas gráficas propias de Manta, en sus dos mundos: tinta de día y luz de noche. */

const SEA_SHAPE: Record<SeaState, { amplitude: number; cycles: number; choppy?: boolean }> = {
  CALM: { amplitude: 0.4, cycles: 1.5 },
  SLIGHT: { amplitude: 2.2, cycles: 2 },
  MODERATE: { amplitude: 4.5, cycles: 2 },
  ROUGH: { amplitude: 6, cycles: 4.5, choppy: true },
};

/** Una ola cuya altura muestra el estado del mar: de "En calma" a "Mar picado". */
export function SeaStateIcon({
  state,
  color,
  width = 40,
}: {
  state: SeaState;
  color?: string;
  width?: number;
}) {
  const palette = useTheme();
  const { amplitude, cycles, choppy } = SEA_SHAPE[state];
  const w = 30;
  const h = 16;
  let d = `M1 ${h / 2}`;
  const steps = choppy ? 9 : 28;
  for (let i = 1; i <= steps; i++) {
    const x = 1 + (i * (w - 2)) / steps;
    const y = choppy
      ? h / 2 + (i % 2 === 0 ? -amplitude : amplitude) * (i === steps ? 0.4 : 1)
      : h / 2 - amplitude * Math.sin((i / steps) * cycles * 2 * Math.PI);
    d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return (
    <View style={contentGlow(palette, 0.7)}>
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
          stroke={color ?? (palette.glow ? palette.accent : palette.ink)}
          strokeWidth={palette.glow ? 1.8 : 2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/** Sello bermellón, como los de la pintura china. */
export function Seal({
  char,
  size = 40,
  tilt = -3,
  style,
}: {
  char: string;
  size?: number;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.14,
          backgroundColor: palette.name === 'tinta' ? palette.accent : '#B8321F',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: `${tilt}deg` }],
        },
        style,
      ]}
    >
      <Text
        color="#F7F4EE"
        style={{
          fontSize: size * 0.55,
          lineHeight: size * 0.7,
          fontWeight: '600',
          fontFamily: undefined,
        }}
      >
        {char}
      </Text>
    </View>
  );
}

function TideMark({
  filled,
  today,
  palette,
}: {
  filled: boolean;
  today: boolean;
  palette: Palette;
}) {
  if (palette.name === 'tinta') {
    if (filled) return <Seal char="潮" size={38} tilt={today ? 0 : -3} />;
    return (
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 6,
          borderWidth: today ? 1.5 : 1,
          borderColor: today ? palette.ink : palette.border,
        }}
      />
    );
  }
  return (
    <View
      style={[
        {
          width: 16,
          height: 52,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.08)',
          justifyContent: 'flex-end',
          borderWidth: today ? 1.5 : 0,
          borderColor: palette.ink,
        },
        filled ? glowShadow(palette, 0.7) : null,
      ]}
    >
      {filled ? (
        <View style={{ height: '70%', backgroundColor: palette.accent, borderRadius: 8 }} />
      ) : null}
    </View>
  );
}

/** Las mareas de la semana. En Tinta, un sello 潮 (marea) por día practicado; en Abisal, columnas de luz. */
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
  const palette = useTheme();
  const days = t('tides.days', { returnObjects: true }) as string[];
  const fullNames = t('tides.dayNames', { returnObjects: true }) as string[];
  return (
    <View accessible accessibilityLabel={`${title}. ${subtitle}`} style={{ gap: space.m }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Text variant="headline">{title}</Text>
        <Text variant="caption" tone="soft">
          {subtitle}
        </Text>
      </View>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
      >
        {week.days.map((filled, index) => (
          <View key={fullNames[index] ?? index} style={{ alignItems: 'center', gap: 6 }}>
            <TideMark filled={filled} today={index === week.todayIndex} palette={palette} />
            <Text
              variant="caption"
              tone={index === week.todayIndex ? 'ink' : 'soft'}
              weight={index === week.todayIndex ? 'bold' : 'regular'}
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

/** El carácter chino de cada espacio: 坐 sentarse, 立 estar de pie, 行 andar. */
export const SPACE_HANZI: Record<SpaceMode, string> = {
  SEATED: '坐',
  STANDING_IN_PLACE: '立',
  FULL_FORM: '行',
};

/** Cada espacio visto desde arriba, en planta. */
export function SpacePlan({
  mode,
  size = 60,
  color,
}: {
  mode: SpaceMode;
  size?: number;
  color?: string;
}) {
  const palette = useTheme();
  const c = color ?? palette.accent;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: c,
    strokeWidth: 2.4,
  } as const;

  if (mode === 'SEATED') {
    return (
      <Svg {...common}>
        <Rect x={15} y={10} width={34} height={7} rx={3.5} />
        <Rect x={17} y={19} width={30} height={28} rx={6} />
        <Circle cx={32} cy={31} r={5.5} fill={c} stroke="none" />
      </Svg>
    );
  }
  if (mode === 'STANDING_IN_PLACE') {
    return (
      <Svg {...common}>
        <Rect x={10} y={8} width={44} height={44} rx={3} strokeDasharray="4 4" />
        <Ellipse cx={25} cy={30} rx={4.5} ry={8} fill={c} stroke="none" />
        <Ellipse cx={39} cy={30} rx={4.5} ry={8} fill={c} stroke="none" />
      </Svg>
    );
  }
  const steps: [number, number, number][] = [
    [14, 49, 42],
    [28, 38, 46],
    [42, 25, 42],
    [53, 12, 46],
  ];
  return (
    <Svg {...common}>
      <Path d="M8 54C20 42 38 36 56 8" strokeDasharray="3 5" />
      {steps.map(([x, y, angle]) => (
        <Ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx={3}
          ry={5}
          rotation={angle}
          originX={x}
          originY={y}
          fill={c}
          stroke="none"
        />
      ))}
    </Svg>
  );
}

/**
 * La marca de cada espacio. Tinta: el carácter en tinta. Abisal: la planta del espacio, luminosa, en un círculo.
 */
export function SpaceGlyph({ mode, size = 64 }: { mode: SpaceMode; size?: number }) {
  const palette = useTheme();
  if (palette.name === 'tinta') {
    return (
      <View
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text
          color={palette.ink}
          style={{
            fontSize: size * 0.74,
            lineHeight: size * 0.9,
            fontWeight: '600',
            fontFamily: undefined,
          }}
        >
          {SPACE_HANZI[mode]}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(95,227,232,0.10)',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <View style={contentGlow(palette, 0.8)}>
        <SpacePlan mode={mode} size={size * 0.6} />
      </View>
    </View>
  );
}

/** "Anclada": la clase ya está en el teléfono y funciona sin señal. */
export function AnchoredBadge() {
  const { t } = useTranslation();
  const palette = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={[
          { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.secondary },
          palette.glow ? glowShadow({ ...palette, glow: palette.secondary }, 0.9) : null,
        ]}
      />
      <Text variant="caption" tone="secondary" weight="bold">
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
        stroke={palette.name === 'tinta' ? palette.ink : palette.accent}
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

/** Marcador de "Anclar" para la fila de una clase que todavía no está en el teléfono. */
export function DownloadMark() {
  const palette = useTheme();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="download" size={14} color={palette.inkSoft} />
    </View>
  );
}
