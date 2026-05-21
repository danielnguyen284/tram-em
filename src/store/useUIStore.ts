import { create } from 'zustand';

type UIState = {
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isCheckoutOpen: false,
  openCheckout: () => set({ isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
}));
