import type { LearningPath, PathStepState } from '@manta/shared';
import { router } from 'expo-router';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Lesson, Program } from '@/features/catalog/catalog';
import { Squish } from '@/features/onboarding/Squish';
import { appLight } from '@/theme/tokens';
import { CheckGlyph, LockGlyph, PlayGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/**
 * El camino del programa: una fila de clases unidas por una línea. Las hechas en negro,
 * la que toca en sol (más grande), las que faltan en gris y las de Premium con candado.
 */
export function PathCard({ program, path }: { program: Program; path: LearningPath<Lesson> }) {
  const { t } = useTranslation();
  const palette = appLight;
  const current = path.currentIndex === null ? null : path.steps[path.currentIndex]?.lesson;

  return (
    <View style={{ borderRadius: 24, backgroundColor: palette.raised, padding: 18, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        <Text
          weight="semibold"
          color={palette.ink}
          style={{ flex: 1, fontSize: 17, lineHeight: 22 }}
        >
          {program.title}
        </Text>
        <Text weight="medium" color={palette.muted} style={{ fontSize: 14, lineHeight: 18 }}>
          {t('home.pathCount', { done: path.doneCount, total: path.steps.length })}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {path.steps.map((step, index) => (
          <Fragment key={step.lesson.slug}>
            {index > 0 ? (
              <View
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  marginHorizontal: 4,
                  backgroundColor: step.state === 'done' ? palette.ink : palette.track,
                }}
              />
            ) : null}
            <Node
              state={step.state}
              number={step.lesson.number}
              label={`${step.lesson.number}. ${step.lesson.title}, ${t(`home.step.${step.state}`)}`}
              onPress={() =>
                router.push({ pathname: '/clase/[slug]', params: { slug: step.lesson.slug } })
              }
            />
          </Fragment>
        ))}
      </View>

      <Text color={palette.muted} numberOfLines={1} style={{ fontSize: 15, lineHeight: 20 }}>
        {current ? t('home.pathNext', { title: current.title }) : t('home.pathComplete')}
      </Text>
    </View>
  );
}

function Node({
  state,
  number,
  label,
  onPress,
}: {
  state: PathStepState;
  number: number;
  label: string;
  onPress: () => void;
}) {
  const palette = appLight;
  const size = state === 'current' ? 46 : 36;
  const background =
    state === 'done' ? palette.ink : state === 'current' ? palette.accent : palette.card;

  return (
    <Squish
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {state === 'done' ? (
        <CheckGlyph color={palette.onSelected} size={18} strokeWidth={2.4} />
      ) : state === 'current' ? (
        <PlayGlyph color={palette.onAccent} size={18} />
      ) : state === 'locked' ? (
        <LockGlyph color={palette.faint} size={16} strokeWidth={2} />
      ) : (
        <Text weight="semibold" color={palette.muted} style={{ fontSize: 15, lineHeight: 18 }}>
          {number}
        </Text>
      )}
    </Squish>
  );
}
