import { LOCALES, type Locale } from '@manta/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckGlyph } from '@/features/onboarding/OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { updateSettings } from '@/features/settings/settings';
import { applyLanguage, LANGUAGE_NAMES, useLocale } from '@/lib/i18n';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

/**
 * Hoja para elegir el idioma. Cada idioma va escrito en su propio idioma: así se encuentra
 * aunque la app esté en uno que no se entiende. La elección se guarda en el teléfono.
 */
export default function LanguageSheet() {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const current = useLocale();

  const choose = (locale: Locale) => {
    updateSettings({ language: locale });
    applyLanguage(locale);
    router.back();
  };

  return (
    <View
      style={{
        paddingTop: 28,
        paddingHorizontal: layout.gutter,
        paddingBottom: insets.bottom + 16,
        backgroundColor: palette.background,
        gap: 10,
      }}
    >
      <Text
        accessibilityRole="header"
        color={palette.ink}
        style={{
          marginBottom: 6,
          fontFamily: fonts.semibold,
          fontSize: 22,
          lineHeight: 28,
          letterSpacing: -0.4,
        }}
      >
        {t('onboarding.language.title')}
      </Text>
      {LOCALES.map((locale) => {
        const selected = locale === current;
        return (
          <Squish
            key={locale}
            onPress={() => choose(locale)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={LANGUAGE_NAMES[locale]}
            style={{
              minHeight: 58,
              borderRadius: 18,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: selected ? palette.selected : palette.card,
            }}
          >
            <Text
              weight="medium"
              color={selected ? palette.onSelected : palette.ink}
              style={{ fontSize: 17, lineHeight: 22 }}
            >
              {LANGUAGE_NAMES[locale]}
            </Text>
            {selected ? <CheckGlyph color={palette.accent} size={16} /> : null}
          </Squish>
        );
      })}
    </View>
  );
}
