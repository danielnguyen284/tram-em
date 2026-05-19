import type { Sound as DbSound } from '@/types/database';
import type { SoundInput } from '@/store/useSoundStore';

const fallbackAudioByIcon: Record<string, string> = {
  rain: '/audio/rain.wav',
  forest: '/audio/forest.wav',
  lake: '/audio/ocean.wav',
  river: '/audio/stream.wav',
  wind: '/audio/bowl.wav',
  story: '/audio/forest.wav',
  night: '/audio/ocean.wav',
  fire: '/audio/campfire.wav',
  music: '/audio/bowl.wav',
};

export function resolveAudioUrl(sound: DbSound) {
  const fallbackUrl = fallbackAudioByIcon[sound.icon ?? 'music'] ?? fallbackAudioByIcon.music;

  if (!sound.audio_url || sound.audio_url.includes('cdn.pixabay.com/download/audio')) {
    return fallbackUrl;
  }

  return sound.audio_url;
}

export function toPlayableSound(sound: DbSound): SoundInput {
  return {
    id: sound.id,
    name: sound.name,
    url: resolveAudioUrl(sound),
    icon: sound.icon ?? 'music',
    category: sound.category,
    duration: sound.duration ?? undefined,
    image: sound.image_url ?? undefined,
  };
}
