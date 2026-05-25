'use client';

import { useCallback, useRef } from 'react';

type ActivityType = 'soundscape_play' | 'breathing_complete' | 'game_play';

export type NewBadge = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  description: string;
};

// Custom event fired globally when new badges are unlocked
export const BADGE_UNLOCKED_EVENT = 'tramem:badge-unlocked';

/**
 * Logs a one-time user activity to the server. Fire-and-forget.
 * If the server responds with newly unlocked badges, fires a global
 * `tramem:badge-unlocked` CustomEvent with the badge data.
 * Uses a ref to avoid duplicate calls within the same component mount.
 */
export function useLogActivity() {
  const logged = useRef<Set<ActivityType>>(new Set());

  const log = useCallback((activityType: ActivityType) => {
    if (logged.current.has(activityType)) return;
    logged.current.add(activityType);

    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity_type: activityType }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; newBadges?: NewBadge[] }) => {
        if (data.newBadges && data.newBadges.length > 0) {
          window.dispatchEvent(
            new CustomEvent(BADGE_UNLOCKED_EVENT, { detail: data.newBadges })
          );
        }
      })
      .catch(() => {
        // Silent — badge tracking should never break the UI
      });
  }, []);

  return log;
}
