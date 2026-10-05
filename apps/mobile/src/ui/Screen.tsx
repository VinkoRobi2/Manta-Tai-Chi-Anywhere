import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { space, TOUCH } from '@/theme/tokens';

import { Icon } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

const BAR_IOS = 44;
const BAR_ANDROID = 64;

export interface ScreenProps {
  /** Título de la pantalla. En iOS se muestra grande y se contrae al hacer scroll. */
  title?: string;
  /** Contenido de la barra en Android en lugar del título (por ejemplo, la marca en Hoy). */
  androidTitle?: ReactNode;
  /** Oculta el título grande de iOS (cuando la pantalla tiene su propio encabezado). */
  largeTitle?: boolean;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  label,
  onPress,
  color,
}: {
  name: Parameters<typeof Icon>[0]['name'];
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const palette = useTheme();
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'ios' ? palette.surfaceAlt : 'transparent',
      }}
    >
      <Icon name={name} size={Platform.OS === 'ios' ? 19 : 24} color={color ?? palette.ink} />
    </Press>
  );
}

/**
 * Estructura común de pantalla: barra superior según la plataforma y contenido con scroll.
 * iOS: título grande en el contenido y título pequeño que aparece en la barra al bajar.
 * Android: barra Material 3 con el título siempre visible, que cambia de color al bajar.
 */
export function Screen({
  title,
  androidTitle,
  largeTitle = true,
  back = false,
  right,
  children,
  contentStyle,
}: ScreenProps) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const ios = Platform.OS !== 'android';
  const barHeight = ios ? BAR_IOS : BAR_ANDROID;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const barBackground = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [8, 40], [0, 1], Extrapolation.CLAMP),
  }));
  const smallTitle = useAnimatedStyle(() => ({
    // En iOS el título pequeño aparece cuando el encabezado grande (o el propio de la pantalla) sale de vista.
    opacity: ios ? interpolate(scrollY.value, [30, 56], [0, 1], Extrapolation.CLAMP) : 1,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          {
            paddingTop: insets.top + barHeight + (ios ? 0 : space.s),
            paddingBottom: space.xxxl,
            paddingHorizontal: space.gutter,
            gap: space.l,
          },
          contentStyle,
        ]}
      >
        {ios && largeTitle && title ? (
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {children}
      </Animated.ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          paddingTop: insets.top,
          height: insets.top + barHeight,
        }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: ios ? palette.background : palette.surfaceAlt,
              borderBottomWidth: ios ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: palette.border,
            },
            barBackground,
          ]}
        />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: ios ? space.s : space.xs,
            gap: space.xs,
          }}
        >
          <View
            style={{ minWidth: ios ? 72 : undefined, flexDirection: 'row', alignItems: 'center' }}
          >
            {back ? (
              ios ? (
                <Press
                  onPress={() => router.back()}
                  accessibilityLabel={t('common.back')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: TOUCH - 12,
                    paddingRight: space.s,
                  }}
                >
                  <Icon name="back" size={20} color={palette.accent} />
                  <Text variant="callout" tone="accent">
                    {t('common.back')}
                  </Text>
                </Press>
              ) : (
                <IconButton name="back" label={t('common.back')} onPress={() => router.back()} />
              )
            ) : null}
          </View>

          <Animated.View
            style={[
              {
                flex: 1,
                alignItems: ios ? 'center' : 'flex-start',
                paddingLeft: !ios && !back ? space.m : 0,
              },
              smallTitle,
            ]}
          >
            {!ios && androidTitle ? (
              androidTitle
            ) : title ? (
              <Text
                variant={ios ? 'callout' : 'headline'}
                weight={ios ? 'semibold' : 'regular'}
                numberOfLines={1}
                accessibilityRole={ios ? undefined : 'header'}
              >
                {title}
              </Text>
            ) : null}
          </Animated.View>

          <View
            style={{
              minWidth: ios ? 72 : undefined,
              alignItems: 'flex-end',
              paddingRight: ios ? space.s : space.xs,
            }}
          >
            {right}
          </View>
        </View>
      </View>
    </View>
  );
}
