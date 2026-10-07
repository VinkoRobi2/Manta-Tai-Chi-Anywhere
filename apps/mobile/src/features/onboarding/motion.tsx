import { useEffect, useId, type ReactNode } from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/ui/Text';

import { svgId } from './svgId';

/**
 * El movimiento de Manta: todo respira. Inhalar 4 s, exhalar 5 s, sin rebotes bruscos.
 * Cada pieza respeta "Reducir movimiento": entonces se queda quieta, en su punto medio.
 */

export const BREATH = { inMs: 4000, outMs: 5000 } as const;
const SOFT = Easing.inOut(Easing.sin);

/** Un valor que va de 0 a 1 y vuelve, al ritmo de una respiración (o del periodo que se pida). */
export function useBreath({
  delay = 0,
  inMs = BREATH.inMs,
  outMs = BREATH.outMs,
  active = true,
}: { delay?: number; inMs?: number; outMs?: number; active?: boolean } = {}): SharedValue<number> {
  const reducedMotion = useReducedMotion();
  const value = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion || !active) {
      cancelAnimation(value);
      value.value = withTiming(reducedMotion ? 0.5 : 0, { duration: 300 });
      return;
    }
    value.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: inMs, easing: SOFT }),
          withTiming(0, { duration: outMs, easing: SOFT }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(value);
  }, [active, delay, inMs, outMs, reducedMotion, value]);
  return value;
}

/** Un valor que avanza de 0 a 1 sin parar (para girar o recorrer). */
export function useCycle(durationMs: number, active = true): SharedValue<number> {
  const reducedMotion = useReducedMotion();
  const value = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion || !active) {
      cancelAnimation(value);
      value.value = 0;
      return;
    }
    value.value = 0;
    value.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1);
    return () => cancelAnimation(value);
  }, [active, durationMs, reducedMotion, value]);
  return value;
}

/**
 * El sol: un disco que respira, con un halo suave que se abre al inhalar.
 * El halo es un degradado radial, así no tiene borde duro.
 */
export function BreathingSun({
  size,
  color,
  halo = true,
  delay = 0,
  style,
}: {
  size: number;
  color: string;
  /** El resplandor alrededor. */
  halo?: boolean;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const breath = useBreath({ delay });
  const glowId = svgId(useId());
  const disc = useAnimatedStyle(() => ({ transform: [{ scale: 0.97 + breath.value * 0.06 }] }));
  const glow = useAnimatedStyle(() => ({
    opacity: 0.35 + breath.value * 0.45,
    transform: [{ scale: 1.02 + breath.value * 0.14 }],
  }));
  const glowSize = size * 1.5;

  return (
    <View
      pointerEvents="none"
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {halo ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: glowSize,
              height: glowSize,
              left: (size - glowSize) / 2,
              top: (size - glowSize) / 2,
            },
            glow,
          ]}
        >
          <Svg width={glowSize} height={glowSize}>
            <Defs>
              <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
                <Stop offset="0.55" stopColor={color} stopOpacity={0.55} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill={`url(#${glowId})`} />
          </Svg>
        </Animated.View>
      ) : null}
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          disc,
        ]}
      />
    </View>
  );
}

/**
 * Ondas que salen del centro y se desvanecen, una tras otra, como la respiración que se expande.
 * Se dibujan como aros (o rellenas, con `filled`).
 */
export function Ripples({
  size,
  color,
  count = 3,
  durationMs = 4200,
  from = 0.55,
  to = 1.25,
  strokeWidth = 2,
  filled = false,
  active = true,
}: {
  size: number;
  color: string;
  count?: number;
  durationMs?: number;
  /** Escala inicial y final de cada onda. */
  from?: number;
  to?: number;
  strokeWidth?: number;
  filled?: boolean;
  active?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <Ripple
          key={index}
          size={size}
          color={color}
          delay={(durationMs / count) * index}
          durationMs={durationMs}
          from={from}
          to={to}
          strokeWidth={strokeWidth}
          filled={filled}
          active={active}
        />
      ))}
    </View>
  );
}

function Ripple({
  size,
  color,
  delay,
  durationMs,
  from,
  to,
  strokeWidth,
  filled,
  active,
}: {
  size: number;
  color: string;
  delay: number;
  durationMs: number;
  from: number;
  to: number;
  strokeWidth: number;
  filled: boolean;
  active: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion || !active) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: durationMs, easing: Easing.out(Easing.quad) }), -1),
    );
    return () => cancelAnimation(t);
  }, [active, delay, durationMs, reducedMotion, t]);
  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion || !active ? 0 : (1 - t.value) * (filled ? 0.35 : 0.7),
    transform: [{ scale: from + (to - from) * t.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: filled ? 0 : strokeWidth,
          borderColor: color,
          backgroundColor: filled ? color : 'transparent',
        },
        style,
      ]}
    />
  );
}

/** Flota: sube y baja unos píxeles, despacio. Con `sway`, además se mece un poco. */
export function Float({
  children,
  amplitude = 4,
  periodMs = 4500,
  delay = 0,
  sway = 0,
  active = true,
  style,
}: {
  children: ReactNode;
  amplitude?: number;
  periodMs?: number;
  delay?: number;
  /** Grados que se mece hacia cada lado. */
  sway?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const wave = useBreath({ delay, inMs: periodMs / 2, outMs: periodMs / 2, active });
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: (wave.value - 0.5) * 2 * amplitude },
      { rotate: `${(wave.value - 0.5) * 2 * sway}deg` },
    ],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** Un "pop" con resorte cada vez que `trigger` cambia a verdadero (al elegir una opción). */
export function usePop(trigger: boolean): SharedValue<number> {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!trigger || reducedMotion) return;
    scale.value = withSequence(
      withTiming(1.22, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 9, stiffness: 220 }),
    );
  }, [reducedMotion, scale, trigger]);
  return scale;
}

/**
 * Un título que entra palabra por palabra, como si se dijera despacio.
 * Para lectores de pantalla es un solo texto.
 */
export function RevealText({
  text,
  style,
  color,
  delay = 0,
  stagger = 55,
  header = false,
  maxFontSizeMultiplier,
  align = 'left',
}: {
  text: string;
  style: StyleProp<TextStyle>;
  color: string;
  delay?: number;
  stagger?: number;
  header?: boolean;
  maxFontSizeMultiplier?: number;
  align?: 'left' | 'center';
}) {
  const words = text.split(' ');
  return (
    <View
      accessible
      accessibilityRole={header ? 'header' : 'text'}
      accessibilityLabel={text}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {words.map((word, index) => (
        <Word key={`${word}-${index}`} delay={delay + index * stagger}>
          <Text
            color={color}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            importantForAccessibility="no"
            style={style}
          >
            {index === words.length - 1 ? word : `${word} `}
          </Text>
        </Word>
      ))}
    </View>
  );
}

function Word({ children, delay }: { children: ReactNode; delay: number }) {
  const reducedMotion = useReducedMotion();
  const shown = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    shown.value = withDelay(
      delay,
      withTiming(1, { duration: 520, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
    );
  }, [delay, reducedMotion, shown]);
  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * 14 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Trazos de movimiento: curvas finas que se dibujan solas alrededor de la figura, como la estela
 * de las manos en "manos de nube". Se dibujan, se desvanecen y vuelven, en bucle.
 */
export function FlowLines({
  size,
  color,
  paths = DEFAULT_FLOW,
  strokeWidth = 2,
  periodMs = 5200,
  opacity = 0.85,
}: {
  /** Lado del cuadro donde se dibujan (las curvas viven en un lienzo de 100 × 100). */
  size: number;
  color: string;
  paths?: readonly string[];
  strokeWidth?: number;
  periodMs?: number;
  /** Opacidad máxima de cada trazo. */
  opacity?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {paths.map((d, index) => (
        <FlowPath
          key={d}
          d={d}
          color={color}
          strokeWidth={(strokeWidth * 100) / Math.max(size, 1)}
          delay={index * 700}
          periodMs={periodMs}
          opacity={opacity}
        />
      ))}
    </Svg>
  );
}

/** Largo de cada curva en el lienzo de 100 (un poco más que la más larga). */
const FLOW_LENGTH = 100;

function FlowPath({
  d,
  color,
  strokeWidth,
  delay,
  periodMs,
  opacity,
}: {
  d: string;
  color: string;
  strokeWidth: number;
  delay: number;
  periodMs: number;
  opacity: number;
}) {
  const reducedMotion = useReducedMotion();
  const t = useSharedValue(reducedMotion ? 0.6 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1),
    );
    return () => cancelAnimation(t);
  }, [delay, periodMs, reducedMotion, t]);
  // Hasta 0.6 se dibuja (con una curva suave); después se desvanece.
  const animatedProps = useAnimatedProps(() => {
    const drawing = Math.min(1, t.value / 0.6);
    const eased = 1 - Math.pow(1 - drawing, 3);
    const fading = Math.max(0, (t.value - 0.6) / 0.4);
    return {
      strokeDashoffset: FLOW_LENGTH * (1 - eased),
      strokeOpacity: opacity * (1 - fading),
    };
  });
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${FLOW_LENGTH} ${FLOW_LENGTH}`}
      animatedProps={animatedProps}
    />
  );
}

/** Las estelas por defecto: arcos a la altura del pecho y las manos de una figura centrada. */
const DEFAULT_FLOW = [
  'M18 40 C 26 30, 40 27, 50 32 S 72 36, 82 28',
  'M16 58 C 28 52, 40 55, 52 50 S 74 44, 86 49',
] as const;

/** Chispas: puntos de sol que salen disparados desde el centro una vez (al terminar algo). */
export function Burst({
  size,
  color,
  count = 8,
  delay = 0,
}: {
  size: number;
  color: string;
  count?: number;
  delay?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <Spark
          key={index}
          size={size}
          color={color}
          angle={(index / count) * Math.PI * 2}
          delay={delay}
          dot={index % 2 === 0 ? 7 : 5}
        />
      ))}
    </View>
  );
}

function Spark({
  size,
  color,
  angle,
  delay,
  dot,
}: {
  size: number;
  color: string;
  angle: number;
  delay: number;
  dot: number;
}) {
  const reducedMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    t.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [delay, reducedMotion, t]);
  const radius = size / 2;
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * radius * (0.35 + t.value * 0.65) },
      { translateY: Math.sin(angle) * radius * (0.35 + t.value * 0.65) },
      { scale: 1 - t.value * 0.4 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: size / 2 - dot / 2,
          top: size / 2 - dot / 2,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
