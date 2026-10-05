import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-abismo px-6" style={{ paddingTop: insets.top + 16 }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        className="self-start py-3"
      >
        <Text className="text-lg text-espuma">{t('lesson.back')}</Text>
      </Pressable>

      {/* Aquí va el reproductor 3D después de la prueba del motor (docs/spike-3d.md). */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-center text-xl text-espuma">{t('lesson.placeholder')}</Text>
        <Text className="mt-3 text-base text-bruma">{slug}</Text>
      </View>
    </View>
  );
}
