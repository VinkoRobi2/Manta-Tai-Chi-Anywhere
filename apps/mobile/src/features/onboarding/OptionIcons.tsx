import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import type { Goal, OfflineUsage, PracticeMode } from '@/features/settings/settings';

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

/** Flecha larga y fina, como la de "NEXT ⟶". */
export function LongArrow({
  color,
  direction = 'right',
  width = 34,
}: {
  color: string;
  direction?: 'left' | 'right';
  width?: number;
}) {
  const d =
    direction === 'right'
      ? `M1 6h${width - 2}M${width - 6} 1l5 5-5 5`
      : `M${width - 1} 6H1M6 1L1 6l5 5`;
  return (
    <Svg
      width={width}
      height={12}
      viewBox={`0 0 ${width} 12`}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={d} />
    </Svg>
  );
}
