import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Goal, OfflineUsage, PracticeMode } from '@/features/settings/settings';

import type { OnboardingCareTag } from './onboarding';

/** Iconos de línea de las opciones del onboarding. Se pintan del color que dicta la selección. */

interface GlyphProps {
  color: string;
  size?: number;
}

function Glyph({ color, size = 24, children }: GlyphProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {children}
    </Svg>
  );
}

export function PracticeIcon({ mode, ...props }: GlyphProps & { mode: PracticeMode }) {
  if (mode === 'seated') {
    return (
      <Glyph {...props}>
        <Path d="M7 3v18M7 13h11M18 13v8M7 17h11" />
      </Glyph>
    );
  }
  if (mode === 'standing') {
    return (
      <Glyph {...props}>
        <Circle cx={12} cy={4.5} r={2.2} />
        <Path d="M12 7.5v7M7 10.5l5-1.5 5 1.5M12 14.5l-3.2 6.5M12 14.5l3.2 6.5" />
      </Glyph>
    );
  }
  return (
    <Glyph {...props}>
      <Circle cx={7} cy={4.5} r={2} />
      <Path d="M7 7.2v6.8M7 14l-2.6 6.5M7 14l2.6 6.5M14.5 6v15M14.5 14h6M20.5 14v7" />
    </Glyph>
  );
}

export function GoalIcon({ goal, ...props }: GlyphProps & { goal: Goal }) {
  switch (goal) {
    case 'calm':
      return (
        <Glyph {...props}>
          <Path d="M2 9c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.6 5-1" />
          <Path d="M2 15c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.6 5-1" />
        </Glyph>
      );
    case 'balance':
      return (
        <Glyph {...props}>
          <Ellipse cx={12} cy={18.5} rx={7.5} ry={2.6} />
          <Ellipse cx={12} cy={12.4} rx={5.2} ry={2.3} />
          <Ellipse cx={12} cy={6.8} rx={3} ry={1.9} />
        </Glyph>
      );
    case 'joints':
      return (
        <Glyph {...props}>
          <Path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <Path d="M20 4v4h-4" />
          <Circle cx={12} cy={12} r={2.2} />
        </Glyph>
      );
    case 'sleep':
      return (
        <Glyph {...props}>
          <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </Glyph>
      );
    case 'energy':
      return (
        <Glyph {...props}>
          <Circle cx={12} cy={12} r={4} />
          <Path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </Glyph>
      );
  }
}

/**
 * Las zonas que cuidar: cada una es la parte del cuerpo de cerca, con la zona marcada por el sol.
 * Rodillas: las piernas de frente. Espalda: la columna. Hombros y cuello:
 * el busto. Ninguna: una cara tranquila.
 */
export function ZoneIcon({
  zone,
  accent,
  ...props
}: GlyphProps & { zone: OnboardingCareTag | 'none'; accent: string }) {
  const sun = { fill: accent, stroke: 'none' } as const;
  switch (zone) {
    case 'knees':
      return (
        <Glyph {...props}>
          <Circle cx={7.6} cy={12.4} r={2.6} {...sun} />
          <Circle cx={16.4} cy={12.4} r={2.6} {...sun} />
          <Path d="M5.4 2c-.6 3.6-.9 6.8-.7 10.2.2 3 .8 5.8 1 8.6M10.6 2c-.2 3.6-.5 6.8-.6 10.2-.1 3-.4 5.8-.6 8.6M5.6 21.4h3.8" />
          <Path d="M18.6 2c.6 3.6.9 6.8.7 10.2-.2 3-.8 5.8-1 8.6M13.4 2c.2 3.6.5 6.8.6 10.2.1 3 .4 5.8.6 8.6M18.4 21.4h-3.8" />
        </Glyph>
      );
    case 'back':
      return (
        <Glyph {...props}>
          <Circle cx={12} cy={15.2} r={5.4} {...sun} />
          <G fill={props.color} stroke="none">
            <Rect x={9.6} y={1.8} width={4.8} height={2.8} rx={1.4} />
            <Rect x={9.2} y={5.8} width={5.4} height={2.8} rx={1.4} />
            <Rect x={8.9} y={9.8} width={5.8} height={2.8} rx={1.4} />
            <Rect x={9} y={13.8} width={6} height={2.8} rx={1.4} />
            <Rect x={9.4} y={17.8} width={5.6} height={2.8} rx={1.4} />
          </G>
        </Glyph>
      );
    case 'shoulders':
      return (
        <Glyph {...props}>
          <Circle cx={5.6} cy={15.6} r={2.6} {...sun} />
          <Circle cx={18.4} cy={15.6} r={2.6} {...sun} />
          <Circle cx={12} cy={6.6} r={3.6} />
          <Path d="M3 22v-3.2c0-3.6 2.7-5.8 6.2-5.8h5.6c3.5 0 6.2 2.2 6.2 5.8V22" />
        </Glyph>
      );
    case 'neck':
      return (
        <Glyph {...props}>
          <Circle cx={12} cy={12.2} r={2.8} {...sun} />
          <Circle cx={12} cy={5.6} r={3.6} />
          <Path d="M10.2 9v4.6M13.8 9v4.6M3 22v-2.4c0-3.4 2.6-5.6 6-5.6h6c3.4 0 6 2.2 6 5.6V22" />
        </Glyph>
      );
    case 'none':
      return (
        <Glyph {...props}>
          <Circle cx={12} cy={12} r={8.6} />
          <Circle cx={9.2} cy={10.2} r={1} fill={props.color} stroke="none" />
          <Circle cx={14.8} cy={10.2} r={1} fill={props.color} stroke="none" />
          <Path d="M8.6 14.2c1.9 2.4 4.9 2.4 6.8 0" />
        </Glyph>
      );
  }
}

export function OfflineIcon({ usage, ...props }: GlyphProps & { usage: OfflineUsage }) {
  return (
    <Glyph {...props}>
      <Path d="M2 8.5a15 15 0 0 1 20 0" opacity={usage === 'sometimes' ? 0.3 : 1} />
      <Path d="M5.5 12a10 10 0 0 1 13 0" />
      <Path d="M9 15.5a5 5 0 0 1 6 0" />
      <Circle cx={12} cy={19} r={0.8} />
      {usage === 'often' ? <Path d="M3 3l18 18" /> : null}
    </Glyph>
  );
}

export function CheckGlyph({ color, size = 12 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2.5 6.2l2.3 2.3 4.7-5" />
    </Svg>
  );
}

export function ShieldGlyph({ color, size = 16 }: GlyphProps) {
  return (
    <Glyph color={color} size={size}>
      <Path d="M12 3l7 3v5.5c0 4.3-3 7.9-7 9.5-4-1.6-7-5.2-7-9.5V6z" />
    </Glyph>
  );
}

export function DownloadGlyph({ color, size = 16 }: GlyphProps) {
  return (
    <Glyph color={color} size={size}>
      <Path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />
    </Glyph>
  );
}

export function ChevronLeftGlyph({ color, size = 22 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

/** El idioma: un globo terráqueo. */
export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M3 12h18" />
      <Path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </Glyph>
  );
}

export function PlayGlyph({ color, size = 16 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d="M4.5 2.6c0-.8.9-1.3 1.6-.9l7.4 4.6c.6.4.6 1.3 0 1.7l-7.4 4.6c-.7.4-1.6-.1-1.6-.9z"
        fill={color}
      />
    </Svg>
  );
}
