import type { TimelineSegment } from '@manta/shared';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/ui/Text';

/**
 * Dónde aparece el instructor. Manta usa video realista (no un muñeco 3D):
 * cada movimiento es un clip .mp4 de frente y otro de lado, dentro del paquete de la clase.
 */

export type StageView = 'front' | 'side';

export interface InstructorStageProps {
  lessonSlug: string;
  segment: TimelineSegment;
  playing: boolean;
  rate: number;
  mirrored: boolean;
  view: StageView;
}

/**
 * Videos disponibles por archivo. Fase 1: todavía no hay videos, así que está vacío.
 * Para probar uno: pon el .mp4 en assets/videos y agrégalo aquí, por ejemplo
 *   'comienzo.mp4': require('../../../assets/videos/comienzo.mp4'),
 * Fase 2: los videos llegan con el paquete descargado y se resuelven por su ruta local.
 */
const PACKAGED_CLIPS: Record<string, VideoSource> = {};

export function resolveClip(segment: TimelineSegment, view: StageView): VideoSource | null {
  const file = view === 'side' && segment.clipSide ? segment.clipSide : segment.clip;
  return PACKAGED_CLIPS[file] ?? null;
}

export function hasVideo(segment: TimelineSegment): boolean {
  return resolveClip(segment, 'front') !== null;
}

/** El reproductor de video es un objeto nativo mutable: se ajusta fuera del render. */
function setPlaybackRate(player: VideoPlayer, rate: number) {
  player.playbackRate = rate;
}

function VideoStage({
  source,
  segment,
  playing,
  rate,
  mirrored,
}: InstructorStageProps & { source: VideoSource }) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    player.replace(source);
  }, [player, source]);

  useEffect(() => {
    setPlaybackRate(player, rate * segment.playbackRate);
  }, [player, rate, segment.playbackRate]);

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="contain"
      style={{ flex: 1, transform: mirrored && segment.mirrorable ? [{ scaleX: -1 }] : undefined }}
    />
  );
}

/** Sin video: el nombre del movimiento, grande y sereno, mientras la voz y la marea guían. */
function GuideStage({ segment }: { segment: TimelineSegment }) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      <Text
        variant="title"
        tone="stage"
        weight="light"
        align="center"
        style={{ fontSize: 34, lineHeight: 42 }}
      >
        {segment.title}
      </Text>
      {__DEV__ ? (
        <Text variant="caption" tone="stageSoft" align="center">
          {t('player.videoPending')}
        </Text>
      ) : null}
    </View>
  );
}

export function InstructorStage(props: InstructorStageProps) {
  const source = resolveClip(props.segment, props.view);
  if (!source) return <GuideStage segment={props.segment} />;
  return <VideoStage {...props} source={source} />;
}
