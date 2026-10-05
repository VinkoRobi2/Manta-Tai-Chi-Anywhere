import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

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

const HEIGHT = { large: 60, medium: 48, small: 40 } as const;

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
  const colors = {
    primary: { bg: palette.sol, fg: palette.onSol, border: 'transparent' },
    secondary: { bg: palette.accent, fg: palette.onAccent, border: 'transparent' },
    tonal: { bg: palette.surfaceAlt, fg: palette.ink, border: 'transparent' },
    quiet: { bg: 'transparent', fg: palette.accent, border: 'transparent' },
    outline: { bg: 'transparent', fg: palette.accent, border: palette.border },
  }[variant];

  return (
    <Press
      haptic
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      hitSlop={size === 'small' ? 8 : undefined}
      style={[
        {
          minHeight: HEIGHT[size],
          borderRadius: radius.pill,
          backgroundColor: colors.bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.border,
          paddingHorizontal: size === 'small' ? space.l : space.xl,
          alignSelf: block ? 'stretch' : 'flex-start',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: disabled ? 0.45 : 1,
        },
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
          weight="semibold"
          color={colors.fg}
          style={size === 'large' ? { fontSize: 18 } : undefined}
        >
          {label}
        </Text>
      </View>
    </Press>
  );
}
