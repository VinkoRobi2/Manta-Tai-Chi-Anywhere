import { View } from 'react-native';

import { useSession } from '@/features/auth/session';
import { appLight, fonts } from '@/theme/tokens';
import { MantaMark } from '@/ui/Brand';
import { Text } from '@/ui/Text';

/** El nombre de pila de la cuenta, si Apple o Google lo dieron. */
export function useFirstName(): string | null {
  const session = useSession();
  const name = session?.kind === 'account' ? session.user.name?.trim() : null;
  return name ? (name.split(/\s+/)[0] ?? null) : null;
}

/** Círculo negro con la inicial; sin nombre (invitado), la manta raya en sol. */
export function Avatar({ size = 52 }: { size?: number }) {
  const palette = appLight;
  const name = useFirstName();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.selected,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name ? (
        <Text
          color={palette.onSelected}
          style={{ fontFamily: fonts.semibold, fontSize: size * 0.42, lineHeight: size * 0.52 }}
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <MantaMark width={size * 0.58} color={palette.accent} />
      )}
    </View>
  );
}
