import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { type OnboardingPalette } from '@/theme/tokens';
import { Text } from '@/ui/Text';

import { CheckGlyph } from './OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from './responsive';
import { Squish } from './Squish';

export interface ChoiceColors {
  selected: boolean;
  /** Texto principal: tinta, o blanco sobre la tarjeta negra. */
  text: string;
  /** Texto secundario. */
  muted: string;
  /** Icono: tinta, o el sol sobre la tarjeta negra. */
  icon: string;
  /** Fondo de la casilla del icono. */
  tile: string;
}

export function choiceColors(palette: OnboardingPalette, selected: boolean): ChoiceColors {
  return {
    selected,
    text: selected ? palette.onSelected : palette.ink,
    muted: selected ? palette.onSelectedMuted : palette.muted,
    icon: selected ? palette.accent : palette.ink,
    tile: selected ? palette.tileSelected : palette.tile,
  };
}

/** El círculo del sol con el visto, arriba a la derecha de la opción elegida. */
export function CheckBadge({ size = 24 }: { size?: number }) {
  const palette = useOnboardingPalette();
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(14)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CheckGlyph color={palette.onAccent} size={size * 0.5} />
    </Animated.View>
  );
}

/** Casilla redondeada para el icono de una opción. `large` para dibujos con más detalle. */
export function IconTile({
  colors,
  large = false,
  children,
}: {
  colors: ChoiceColors;
  large?: boolean;
  children: ReactNode;
}) {
  const layout = useOnboardingLayout();
  const size =
    (layout.breakpoint === 'tablet' ? 52 : layout.breakpoint === 'compact' ? 40 : 46) +
    (large ? 6 : 0);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: colors.tile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

export interface ChoiceCardProps {
  selected: boolean;
  onPress: () => void;
  /** radio: una sola respuesta. checkbox: varias. */
  role: 'radio' | 'checkbox';
  label: string;
  description?: string;
  /** Etiqueta de sol encima del nombre ("Ideal para empezar"). */
  badge?: string;
  /** Una línea extra que aparece debajo al elegirla (por ejemplo, la primera clase). */
  detail?: string;
  /** Lo que va a la izquierda (un icono en su casilla). */
  leading?: (colors: ChoiceColors) => ReactNode;
  /** Lo que va a la derecha (una ilustración). Por defecto, el visto si está elegida. */
  trailing?: (colors: ChoiceColors) => ReactNode;
  /** row: en lista. tile: cuadrada, icono arriba y texto abajo. */
  variant?: 'row' | 'tile';
  minHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Una respuesta: tarjeta gris redondeada que se vuelve negra (blanca en modo cabina) al elegirla,
 * con una transición corta y el visto del sol.
 */
export function ChoiceCard({
  selected,
  onPress,
  role,
  label,
  description,
  badge,
  detail,
  leading,
  trailing,
  variant = 'row',
  minHeight,
  containerStyle,
}: ChoiceCardProps) {
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const colors = choiceColors(palette, selected);
  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [progress, selected]);
  const background = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [palette.card, palette.selected]),
  }));

  const tile = variant === 'tile';
  const radius = layout.breakpoint === 'tablet' ? 24 : 20;
  const labelSize = layout.labelSize;

  return (
    <Squish
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityState={{ checked: selected }}
      containerStyle={containerStyle}
      style={{ flexGrow: 1 }}
    >
      <Animated.View
        style={[
          {
            flexGrow: 1,
            minHeight: minHeight ?? layout.rowHeight,
            borderRadius: radius,
            overflow: 'hidden',
            paddingHorizontal: tile ? 16 : 16,
            paddingVertical: tile ? 16 : 12,
            flexDirection: tile ? 'column' : 'row',
            alignItems: tile ? 'flex-start' : 'center',
            justifyContent: tile ? 'space-between' : 'flex-start',
            gap: tile ? 14 : 14,
          },
          background,
        ]}
      >
        {leading ? leading(colors) : null}
        <View style={{ flex: tile ? undefined : 1, gap: 3 }}>
          {badge ? (
            <View
              style={{
                alignSelf: 'flex-start',
                marginBottom: 3,
                paddingHorizontal: 8,
                height: 20,
                borderRadius: 10,
                justifyContent: 'center',
                backgroundColor: palette.accent,
              }}
            >
              <Text
                weight="semibold"
                color={palette.onAccent}
                style={{ fontSize: 11, lineHeight: 14 }}
              >
                {badge}
              </Text>
            </View>
          ) : null}
          <Text
            weight="medium"
            color={colors.text}
            style={{
              fontSize: labelSize,
              lineHeight: Math.round(labelSize * 1.25),
              letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
          {description ? (
            <Text
              variant="caption"
              color={colors.muted}
              style={{ fontSize: labelSize - 3, lineHeight: Math.round((labelSize - 3) * 1.35) }}
            >
              {description}
            </Text>
          ) : null}
          {detail && selected ? (
            <Animated.View
              entering={FadeInDown.duration(320)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}
            >
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accent }}
              />
              <Text
                weight="medium"
                color={colors.text}
                numberOfLines={2}
                style={{
                  flexShrink: 1,
                  fontSize: labelSize - 4,
                  lineHeight: Math.round((labelSize - 4) * 1.35),
                }}
              >
                {detail}
              </Text>
            </Animated.View>
          ) : null}
        </View>
        {trailing ? trailing(colors) : null}
        {!trailing && selected ? (
          tile ? (
            <View style={{ position: 'absolute', top: 14, right: 14 }}>
              <CheckBadge />
            </View>
          ) : (
            <CheckBadge />
          )
        ) : null}
      </Animated.View>
    </Squish>
  );
}
