import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { glowShadow, radius, space } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'quiet' | 'outline';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'large' | 'medium' | 'small';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Ocupa todo el ancho. Por defecto, solo el botón grande. */
  block?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT = { large: 60, medium: 48, small: 44 } as const;

/**
 * Tinta: el principal es bermellón, como el sello; el secundario, tinta llena.
 * Abisal: el principal es menta luminosa; el secundario, vidrio.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  disabled = false,
  loading = false,
  block = size === 'large',
  accessibilityHint,
  style,
}: ButtonProps) {
  const palette = useTheme();
  const night = palette.name === 'abisal';
  const colors = {
    primary: { bg: palette.primary, fg: palette.onPrimary, border: 'transparent' },
    secondary: night
      ? { bg: palette.surfaceAlt, fg: palette.ink, border: palette.border }
      : { bg: palette.ink, fg: palette.background, border: 'transparent' },
    tonal: { bg: palette.surfaceAlt, fg: palette.ink, border: 'transparent' },
    quiet: { bg: 'transparent', fg: night ? palette.accent : palette.ink, border: 'transparent' },
    outline: { bg: 'transparent', fg: palette.ink, border: palette.border },
  }[variant];

  return (
    <Press
      haptic
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        {
          minHeight: HEIGHT[size],
          borderRadius: radius.pill,
          backgroundColor: colors.bg,
          borderWidth: colors.border === 'transparent' ? 0 : 1,
          borderColor: colors.border,
          paddingHorizontal: size === 'small' ? space.l : space.xl,
          alignSelf: block ? 'stretch' : 'flex-start',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: disabled ? 0.45 : 1,
        },
        variant === 'primary' ? glowShadow(palette, 0.45) : null,
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.s,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.fg} />
        ) : icon ? (
          <Icon name={icon} size={size === 'large' ? 20 : 18} color={colors.fg} />
        ) : null}
        <Text
          variant={size === 'small' ? 'caption' : 'callout'}
          weight="bold"
          color={colors.fg}
          style={
            size === 'large' ? { fontSize: 18 } : size === 'small' ? { fontSize: 15 } : undefined
          }
        >
          {label}
        </Text>
      </View>
    </Press>
  );
}
