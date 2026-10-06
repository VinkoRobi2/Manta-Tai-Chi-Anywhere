import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import type { Program } from '@/features/catalog/catalog';
import { Squish } from '@/features/onboarding/Squish';
import { appLight } from '@/theme/tokens';
import { LockGlyph, SpaceGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** Atajos a cada programa, como en una tienda: tarjetas blancas que se deslizan de lado. */
export function ProgramChips({ programs, gutter }: { programs: Program[]; gutter: number }) {
  const { t } = useTranslation();
  const palette = appLight;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: gutter, gap: 10 }}
    >
      {programs.map((program) => (
        <Squish
          key={program.slug}
          onPress={() => router.push({ pathname: '/clases', params: { programa: program.slug } })}
          accessibilityLabel={`${program.title}${program.isPremium ? `, ${t('classes.premium')}` : ''}`}
          style={{
            height: 60,
            borderRadius: 18,
            backgroundColor: palette.raised,
            paddingLeft: 14,
            paddingRight: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <SpaceGlyph mode={program.spaceMode} color={palette.ink} size={26} />
          <Text weight="semibold" color={palette.ink} style={{ fontSize: 16, lineHeight: 20 }}>
            {program.title}
          </Text>
          {program.isPremium ? <LockGlyph color={palette.faint} size={16} /> : null}
        </Squish>
      ))}
    </ScrollView>
  );
}
