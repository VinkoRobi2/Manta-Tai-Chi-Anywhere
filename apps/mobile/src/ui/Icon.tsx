import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme';

/**
 * Iconos con nombre semántico. En iOS usan SF Symbols y en Android Material Symbols,
 * así cada sistema ve sus iconos de siempre. Para cambiar un icono se toca solo esta tabla.
 */
const SYMBOLS = {
  settings: { ios: 'slider.horizontal.3', android: 'tune' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause' },
  back10: { ios: 'gobackward.10', android: 'replay_10' },
  forward10: { ios: 'goforward.10', android: 'forward_10' },
  turtle: { ios: 'tortoise', android: 'slow_motion_video' },
  mirror: { ios: 'arrow.left.and.right.righttriangle.left.righttriangle.right', android: 'flip' },
  captions: { ios: 'captions.bubble', android: 'closed_caption' },
  voice: { ios: 'headphones', android: 'headphones' },
  close: { ios: 'xmark', android: 'close' },
  check: { ios: 'checkmark', android: 'check' },
  lock: { ios: 'lock.fill', android: 'lock' },
  download: { ios: 'arrow.down.circle', android: 'download' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  bell: { ios: 'bell', android: 'notifications' },
  gift: { ios: 'gift', android: 'redeem' },
  view: { ios: 'eye', android: 'visibility' },
  sailboat: { ios: 'sailboat', android: 'sailing' },
  info: { ios: 'info.circle', android: 'info' },
  trash: { ios: 'trash', android: 'delete' },
  today: { ios: 'sun.horizon', android: 'wb_twilight' },
  classes: { ios: 'square.grid.2x2', android: 'grid_view' },
  log: { ios: 'book.closed', android: 'menu_book' },
  moon: { ios: 'moon.stars', android: 'bedtime' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof SYMBOLS | 'anchor';

/** Ancla propia: "Anclada" es parte de la marca y SF Symbols no tiene ancla. */
function AnchorGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={5} r={2.5} />
      <Path d="M12 7.5V21M8 11h8M4.5 13.5A7.5 7.5 0 0 0 12 21a7.5 7.5 0 0 0 7.5-7.5" />
    </Svg>
  );
}

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color }: IconProps) {
  const palette = useTheme();
  const tint = color ?? palette.ink;
  if (name === 'anchor') return <AnchorGlyph size={size} color={tint} />;
  const symbol = SYMBOLS[name];
  return (
    <SymbolView
      // En web se usan los mismos Material Symbols que en Android.
      name={{ ...symbol, web: symbol.android }}
      size={size}
      tintColor={tint}
      weight="medium"
      style={{ width: size, height: size }}
      fallback={<View style={{ width: size, height: size }} />}
    />
  );
}
