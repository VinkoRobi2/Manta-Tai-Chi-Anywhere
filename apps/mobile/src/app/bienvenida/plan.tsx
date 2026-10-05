import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nextLessonFor } from '@/features/catalog/catalog';
import {
  completeOnboarding,
  spaceForPractice,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { PoseArt, type Pose } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import type { PracticeMode } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { fonts, radius } from '@/theme/tokens';
import { Press } from '@/ui/Press';
import { Text } from '@/ui/Text';

const POSES: Record<PracticeMode, readonly Pose[]> = {
  seated: ['seated'],
  standing: ['standing'],
  both: ['standing', 'seated'],
};

function Tag({ label }: { label: string }) {
  const palette = useOnboardingPalette();
  return (
    <View
      style={{
        minHeight: 34,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: palette.line,
      }}
    >
      <Text
        variant="caption"
        weight="medium"
        color={palette.ink}
        style={{ fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
    </View>
  );
}

/** El plan: la imagen grande, el programa con sus etiquetas y el botón para la primera clase. */
export default function PlanScreen() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const context = draft.forRelative ? 'relative' : undefined;
  const tablet = layout.breakpoint === 'tablet';
  const compact = layout.breakpoint === 'compact';
  const panelHeight = layout.wide ? layout.height * 0.58 : tablet ? 440 : compact ? 230 : 330;

  const start = () => {
    const answers = completeOnboarding();
    const lesson = nextLessonFor(spaceForPractice(answers.practiceMode), locale, new Set());
    router.replace('/');
    router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } });
  };

  const panel = (
    <View
      style={{
        height: panelHeight,
        backgroundColor: palette.panel,
        overflow: 'hidden',
        ...(layout.wide ? { flex: 1 } : null),
      }}
    >
      <PoseArt poses={POSES[draft.practiceMode]} maxHeight={panelHeight * 0.88} />
      <Text
        color={palette.ink}
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          fontFamily: fonts.extrabold,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: 2.8,
          textTransform: 'uppercase',
        }}
      >
        {t('onboarding.plan.week')}
      </Text>
    </View>
  );

  const details = (
    <View style={{ alignItems: 'center', gap: compact ? 10 : 14 }}>
      <Text
        align="center"
        color={palette.ink}
        maxFontSizeMultiplier={1.4}
        style={{
          fontFamily: fonts.extrabold,
          fontSize: tablet ? 28 : compact ? 19 : 22,
          lineHeight: tablet ? 34 : compact ? 24 : 27,
          textTransform: 'uppercase',
        }}
      >
        {t(`onboarding.plan.program.${draft.practiceMode}`)}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        <Tag label={t('common.minutes', { count: draft.dailyMinutes })} />
        <Tag label={t('onboarding.plan.level')} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingTop: insets.top + Math.round(layout.topPad * 0.7),
          paddingHorizontal: layout.gutter,
          paddingBottom: layout.gap * 2,
        }}
      >
        <View style={{ width: '100%', maxWidth: layout.contentWidth }}>
          <Text
            accessibilityRole="header"
            align="center"
            color={palette.ink}
            maxFontSizeMultiplier={1.4}
            style={{
              fontFamily: fonts.extrabold,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLine,
              textTransform: 'uppercase',
            }}
          >
            {t('onboarding.plan.title', { context })}
          </Text>
          <View
            style={{
              marginTop: layout.sectionGap,
              flexDirection: layout.wide ? 'row' : 'column',
              alignItems: layout.wide ? 'center' : 'stretch',
              gap: layout.wide ? layout.gutter * 1.5 : layout.sectionGap,
            }}
          >
            {panel}
            <View style={layout.wide ? { flex: 1 } : undefined}>{details}</View>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + (compact ? 4 : 12),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: tablet ? 440 : layout.contentWidth }}>
          <Press
            haptic
            onPress={start}
            accessibilityLabel={t('onboarding.plan.start')}
            style={{
              minHeight: tablet ? 64 : 58,
              borderRadius: radius.pill,
              backgroundColor: palette.ink,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              paddingHorizontal: 20,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: 0,
                height: 0,
                borderTopWidth: 6,
                borderBottomWidth: 6,
                borderLeftWidth: 10,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: palette.accent,
              }}
            />
            <Text
              color={palette.background}
              maxFontSizeMultiplier={1.4}
              style={{
                fontFamily: fonts.extrabold,
                fontSize: tablet ? 16 : 14,
                lineHeight: 20,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
              }}
            >
              {t('onboarding.plan.start')}
            </Text>
          </Press>
          <Press
            onPress={() => router.dismissTo('/bienvenida/practica')}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.plan.change')}
            style={{
              alignSelf: 'center',
              minHeight: 48,
              justifyContent: 'center',
              paddingHorizontal: 12,
            }}
          >
            <Text variant="caption" weight="medium" color={palette.muted}>
              {t('onboarding.plan.change')}
            </Text>
          </Press>
        </View>
      </View>
    </View>
  );
}
