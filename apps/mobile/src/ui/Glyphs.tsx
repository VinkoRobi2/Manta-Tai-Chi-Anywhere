import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { SeaState, SpaceMode } from '@manta/shared';

/** Iconos de línea de la app (rejilla de 24). Se pintan del color que toque. */

export interface GlyphProps {
  color: string;
  size?: number;
  strokeWidth?: number;
}

function Glyph({
  color,
  size = 24,
  strokeWidth = 1.8,
  children,
}: GlyphProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {children}
    </Svg>
  );
}

export function HomeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5h-6v5.5H5.5A1.5 1.5 0 0 1 4 19z" />
    </Glyph>
  );
}

export function ClassesGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={3.5} y={4.5} width={17} height={15} rx={3.5} />
      <Path d="M10.5 9.2v5.6l4.6-2.8z" />
    </Glyph>
  );
}

export function ProfileGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={8.5} r={3.8} />
      <Path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5" />
    </Glyph>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="m5.5 12.5 4.2 4.2 8.8-9.4" />
    </Glyph>
  );
}

export function LockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={5} y={10.5} width={14} height={10} rx={2.5} />
      <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Glyph>
  );
}

/** Triángulo de "play", relleno. */
export function PlayGlyph({ color, size = 24 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.4-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z"
        fill={color}
      />
    </Svg>
  );
}

export function PauseGlyph({ color, size = 24 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Rect x={6} y={5} width={4} height={14} rx={1.5} fill={color} />
      <Rect x={14} y={5} width={4} height={14} rx={1.5} fill={color} />
    </Svg>
  );
}

export function CloseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Glyph>
  );
}

export function BackGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M14.5 5.5 8 12l6.5 6.5" />
    </Glyph>
  );
}

export function ChevronGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Glyph>
  );
}

export function ClockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}

/** La clase ya está en el teléfono y funciona sin internet: flecha hacia una bandeja. */
export function SavedGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M4.5 15.5v2a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-2" />
    </Glyph>
  );
}

export function OfflineGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M3.5 3.5l17 17M8.6 13.2a5 5 0 0 1 6 .2M5.5 10.2a9.5 9.5 0 0 1 3-1.9M18.5 10.2a9.5 9.5 0 0 0-5.7-2.6M12 18.2h.01" />
    </Glyph>
  );
}

export function PhoneGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={6.5} y={2.5} width={11} height={19} rx={2.8} />
      <Path d="M10.5 18.5h3" />
    </Glyph>
  );
}

export function CloudGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M7 18.5h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7 10a4.25 4.25 0 0 0 0 8.5z" />
    </Glyph>
  );
}

export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z" />
    </Glyph>
  );
}

/** Programas por espacio: silla, de pie en el lugar y la forma completa con pasos. */
export function SpaceGlyph({ mode, ...props }: GlyphProps & { mode: SpaceMode }) {
  switch (mode) {
    case 'SEATED':
      return (
        <Glyph {...props}>
          <Circle cx={10} cy={4.5} r={2} />
          <Path d="M10 7.5v6h5.5l1 6.5M10 10.5l5-1M6 9.5v11M6 15.5h10" />
        </Glyph>
      );
    case 'STANDING_IN_PLACE':
      return (
        <Glyph {...props}>
          <Circle cx={12} cy={4.5} r={2.2} />
          <Path d="M12 7.5v7M7 10.5l5-1.5 5 1.5M12 14.5l-2.5 6M12 14.5l2.5 6M7 20.5h10" />
        </Glyph>
      );
    case 'FULL_FORM':
      return (
        <Glyph {...props}>
          <Circle cx={12.5} cy={4.5} r={2.2} />
          <Path d="M12.5 7.5 11.5 14M5.5 8.5l6.5 1 5.5-2.5M11.5 14l-5 6.5M11.5 14l4 2.5 2.5 4" />
        </Glyph>
      );
  }
}

/** Cómo se siente al terminar: de la cara más tranquila a la más tensa. */
export function MoodGlyph({ mood, ...props }: GlyphProps & { mood: SeaState }) {
  const mouth = {
    CALM: 'M8 14.5c1.1 1.6 2.4 2.4 4 2.4s2.9-.8 4-2.4',
    SLIGHT: 'M8.5 15c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3',
    MODERATE: 'M8.5 15.5h7',
    ROUGH: 'M8.5 16.5c1-.9 2.2-1.3 3.5-1.3s2.5.4 3.5 1.3',
  }[mood];
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      {mood === 'CALM' ? (
        <Path d="M8.2 10.3c.5-.6 1.2-.6 1.7 0M14.1 10.3c.5-.6 1.2-.6 1.7 0" />
      ) : (
        <Path d="M9.2 10h.01M14.8 10h.01" strokeWidth={2.6} />
      )}
      <Path d={mouth} />
    </Glyph>
  );
}
