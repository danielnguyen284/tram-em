'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type BrowserPWAState = {
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
};

const DISMISSED_STORAGE_KEY = 'pwa-install-dismissed';
const INSTALL_STATE_EVENT = 'pwa-install-state-change';

const serverSnapshot: BrowserPWAState = {
  isIOS: false,
  isAndroid: false,
  isStandalone: false,
  isDismissed: false,
};

let cachedSnapshot = serverSnapshot;
let cachedSnapshotKey = 'false:false:false:false';

function getBrowserSnapshot(): BrowserPWAState {
  if (typeof window === 'undefined') {
    return serverSnapshot;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true;
  const isDismissed = window.localStorage.getItem(DISMISSED_STORAGE_KEY) === 'true';
  const snapshotKey = `${isIOS}:${isAndroid}:${isStandalone}:${isDismissed}`;

  if (snapshotKey === cachedSnapshotKey) {
    return cachedSnapshot;
  }

  cachedSnapshotKey = snapshotKey;
  cachedSnapshot = {
    isIOS,
    isAndroid,
    isStandalone,
    isDismissed,
  };

  return cachedSnapshot;
}

function subscribeBrowserSnapshot(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const standaloneQuery = window.matchMedia('(display-mode: standalone)');
  standaloneQuery.addEventListener('change', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('appinstalled', onStoreChange);
  window.addEventListener(INSTALL_STATE_EVENT, onStoreChange);

  return () => {
    standaloneQuery.removeEventListener('change', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('appinstalled', onStoreChange);
    window.removeEventListener(INSTALL_STATE_EVENT, onStoreChange);
  };
}

function notifyInstallStateChange() {
  window.dispatchEvent(new Event(INSTALL_STATE_EVENT));
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { isIOS, isAndroid, isStandalone, isDismissed } = useSyncExternalStore(
    subscribeBrowserSnapshot,
    getBrowserSnapshot,
    () => serverSnapshot
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
      notifyInstallStateChange();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }

    return outcome === 'accepted';
  }, [installPrompt]);

  const dismissPrompt = useCallback(() => {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    notifyInstallStateChange();
  }, []);

  const resetDismiss = useCallback(() => {
    window.localStorage.removeItem(DISMISSED_STORAGE_KEY);
    notifyInstallStateChange();
  }, []);

  return {
    isIOS,
    isAndroid,
    isStandalone,
    isDismissed,
    canInstallAndroid: !!installPrompt,
    triggerInstall,
    dismissPrompt,
    resetDismiss,
  };
}
