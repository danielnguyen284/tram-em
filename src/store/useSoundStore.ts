import { create } from 'zustand';

export interface Sound {
  id: string;
  name: string;
  url: string;
  icon: string;
  category?: string;
  duration?: string;
  image?: string;
  volume: number;
  isPlaying: boolean;
}

export type SoundInput = Omit<Sound, 'volume' | 'isPlaying'>;

interface SoundState {
  activeSounds: Sound[];
  playlist: SoundInput[];
  shuffleEnabled: boolean;
  repeatEnabled: boolean;
  setPlaylist: (sounds: SoundInput[]) => void;
  addSound: (sound: SoundInput) => void;
  removeSound: (id: string) => void;
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  clearAll: () => void;
}

const createActiveSound = (sound: SoundInput, volume = 0.65): Sound => ({
  ...sound,
  volume,
  isPlaying: true,
});

const getCurrentIndex = (playlist: SoundInput[], activeSound?: Sound) => {
  if (!activeSound) return -1;
  return playlist.findIndex((sound) => sound.id === activeSound.id);
};

export const useSoundStore = create<SoundState>((set) => ({
  activeSounds: [],
  playlist: [],
  shuffleEnabled: false,
  repeatEnabled: true,

  setPlaylist: (sounds) => set((state) => ({
    playlist: sounds,
    activeSounds: state.activeSounds.length
      ? state.activeSounds
      : [],
  })),

  addSound: (sound) => set((state) => {
    const currentVolume = state.activeSounds[0]?.volume ?? 0.65;
    return {
      activeSounds: [createActiveSound(sound, currentVolume)]
    };
  }),

  removeSound: (id) => set((state) => ({
    activeSounds: state.activeSounds.filter(s => s.id !== id)
  })),

  toggleSound: (id) => set((state) => ({
    activeSounds: state.activeSounds.map(s => 
      s.id === id ? { ...s, isPlaying: !s.isPlaying } : s
    )
  })),

  setVolume: (id, volume) => set((state) => ({
    activeSounds: state.activeSounds.map(s => 
      s.id === id ? { ...s, volume } : s
    )
  })),

  playNext: () => set((state) => {
    if (!state.playlist.length) return state;

    const currentSound = state.activeSounds[0];
    const currentVolume = currentSound?.volume ?? 0.65;
    const currentIndex = getCurrentIndex(state.playlist, currentSound);
    const nextIndex = state.shuffleEnabled
      ? Math.floor(Math.random() * state.playlist.length)
      : (currentIndex + 1 + state.playlist.length) % state.playlist.length;

    return {
      activeSounds: [createActiveSound(state.playlist[nextIndex], currentVolume)],
    };
  }),

  playPrevious: () => set((state) => {
    if (!state.playlist.length) return state;

    const currentSound = state.activeSounds[0];
    const currentVolume = currentSound?.volume ?? 0.65;
    const currentIndex = getCurrentIndex(state.playlist, currentSound);
    const previousIndex = currentIndex <= 0 ? state.playlist.length - 1 : currentIndex - 1;

    return {
      activeSounds: [createActiveSound(state.playlist[previousIndex], currentVolume)],
    };
  }),

  toggleShuffle: () => set((state) => ({
    shuffleEnabled: !state.shuffleEnabled,
  })),

  toggleRepeat: () => set((state) => ({
    repeatEnabled: !state.repeatEnabled,
  })),

  clearAll: () => set({ activeSounds: [] }),
}));
