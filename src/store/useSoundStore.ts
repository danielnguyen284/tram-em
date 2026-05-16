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

interface SoundState {
  activeSounds: Sound[];
  addSound: (sound: Omit<Sound, 'volume' | 'isPlaying'>) => void;
  removeSound: (id: string) => void;
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  clearAll: () => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  activeSounds: [],

  addSound: (sound) => set((state) => {
    if (state.activeSounds.some(s => s.id === sound.id)) return state;
    return {
      activeSounds: [...state.activeSounds, { ...sound, volume: 0.5, isPlaying: true }]
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

  clearAll: () => set({ activeSounds: [] }),
}));
