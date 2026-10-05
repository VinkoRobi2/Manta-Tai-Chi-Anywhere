import { SPACE_MODES, type SpaceMode } from '@manta/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

/** Clase de ejemplo por modo (las crea el seed de la API). Luego vendrán del catálogo. */
const DEMO_LESSON: Record<SpaceMode, string> = {
  SEATED: 'sentado-primeros-movimientos',
  STANDING_IN_PLACE: 'en-el-lugar-manos-de-nube',
  FULL_FORM: 'forma-24-apertura',
};

export function SpaceSelector() {
  const { t } = useTranslation();

  return (
    <View className="mt-8 gap-4 px-6">
      {SPACE_MODES.map((mode) => (
        <Pressable
          key={mode}
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/clase/[slug]', params: { slug: DEMO_LESSON[mode] } })
          }
          className="rounded-2xl border border-bruma bg-white px-5 py-5 active:bg-espuma"
        >
          <Text className="text-xl font-semibold text-abismo">{t(`space.${mode}.title`)}</Text>
          <Text className="mt-1 text-base leading-6 text-abismo/70">{t(`space.${mode}.body`)}</Text>
        </Pressable>
      ))}
    </View>
  );
}
