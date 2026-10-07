import type { ComponentType } from 'react';
import { View } from 'react-native';

import { CheckGlyph, CloudGlyph, PhoneGlyph, type GlyphProps } from '@/ui/Glyphs';

import { Float } from './motion';
import { PoseArt } from './PoseArt';
import { useOnboardingPalette } from './responsive';

const BADGES: readonly {
  Icon: ComponentType<GlyphProps>;
  left: `${number}%`;
  top: `${number}%`;
  delay: number;
  accent?: boolean;
}[] = [
  { Icon: PhoneGlyph, left: '8%', top: '22%', delay: 0 },
  { Icon: CloudGlyph, left: '76%', top: '12%', delay: 900 },
  { Icon: CheckGlyph, left: '74%', top: '62%', delay: 1800, accent: true },
];

/**
 * La ilustración de la cuenta: la figura que sube los brazos frente al sol, con estelas de
 * movimiento y tres insignias que flotan alrededor: el teléfono, la nube y el visto
 * (tu progreso va del teléfono a la nube y vuelve).
 */
export function AccountArt({ maxHeight }: { maxHeight: number }) {
  const palette = useOnboardingPalette();
  return (
    <View style={{ flex: 1 }}>
      <PoseArt poses={['rise']} maxHeight={maxHeight} flow />
      {BADGES.map(({ Icon, left, top, delay, accent }) => (
        <Float
          key={left + top}
          amplitude={6}
          periodMs={4200}
          delay={delay}
          sway={4}
          style={{ position: 'absolute', left, top }}
        >
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: accent ? palette.accent : palette.background,
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Icon color={palette.ink} size={22} strokeWidth={accent ? 2.4 : 1.9} />
          </View>
        </Float>
      ))}
    </View>
  );
}
