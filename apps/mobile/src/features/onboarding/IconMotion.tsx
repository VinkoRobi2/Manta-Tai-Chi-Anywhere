import type { ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { Goal } from '@/features/settings/settings';

import { useBreath, useCycle, usePop } from './motion';

export type IconMotionKind = Goal | 'pulse' | 'signal';

/**
 * Da vida al icono de una opción elegida: un "pop" al tocarla y después un movimiento propio
 * que cuenta lo que significa. Calma: las ondas se mecen. Equilibrio: las piedras se balancean.
 * Articulaciones: gira despacio. Dormir: la luna flota. Energía: el sol gira y late.
 */
export function IconMotion({
  kind,
  active,
  children,
}: {
  kind: IconMotionKind;
  active: boolean;
  children: ReactNode;
}) {
  const pop = usePop(active);
  const wave = useBreath({ inMs: 1300, outMs: 1300, active });
  const turn = useCycle(
    kind === 'energy' ? 9000 : 5200,
    active && (kind === 'joints' || kind === 'energy'),
  );

  const style = useAnimatedStyle(() => {
    const w = (wave.value - 0.5) * 2; // de -1 a 1
    switch (kind) {
      case 'calm':
        return { transform: [{ scale: pop.value }, { translateX: w * 2.5 }] };
      case 'balance':
        return { transform: [{ scale: pop.value }, { rotate: `${w * 9}deg` }] };
      case 'joints':
        return { transform: [{ scale: pop.value }, { rotate: `${turn.value * 360}deg` }] };
      case 'sleep':
        return {
          transform: [{ scale: pop.value }, { translateY: w * 2.5 }, { rotate: `${w * -7}deg` }],
        };
      case 'energy':
        return {
          transform: [
            { scale: pop.value * (1 + wave.value * 0.08) },
            { rotate: `${turn.value * 360}deg` },
          ],
        };
      case 'signal':
        return { opacity: 0.55 + wave.value * 0.45, transform: [{ scale: pop.value }] };
      default:
        return { transform: [{ scale: pop.value * (1 + wave.value * 0.07) }] };
    }
  });

  return <Animated.View style={style}>{children}</Animated.View>;
}
