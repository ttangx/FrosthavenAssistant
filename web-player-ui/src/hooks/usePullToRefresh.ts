import { useEffect, useRef, useState } from 'react';

import {
  canStartPull,
  getPullGestureState,
  type PullGestureState,
} from '../utils/pullToRefresh';

const REFRESH_DELAY_MS = 120;
const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'label',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="button"]',
].join(',');

interface PullToRefreshState extends PullGestureState {
  active: boolean;
  refreshing: boolean;
}

export function usePullToRefresh(onRefresh: () => void): PullToRefreshState {
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const gestureCancelled = useRef(false);
  const refreshingRef = useRef(false);
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const resetPull = () => {
      startY.current = null;
      distanceRef.current = 0;
      setDistance(0);
      setActive(false);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current) return;
      if (event.touches.length !== 1) {
        gestureCancelled.current = true;
        resetPull();
        return;
      }
      if (gestureCancelled.current) return;

      const target = event.target;
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) return;
      if (!canStartPull(window.scrollY, event.touches.length)) return;

      startY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (gestureCancelled.current) return;
      if (event.touches.length !== 1) {
        gestureCancelled.current = true;
        resetPull();
        return;
      }
      if (startY.current == null) return;
      if (window.scrollY > 0) {
        resetPull();
        return;
      }

      const nextDistance = event.touches[0].clientY - startY.current;
      if (nextDistance <= 0) {
        distanceRef.current = 0;
        setDistance(0);
        setActive(false);
        return;
      }

      if (event.cancelable) event.preventDefault();
      distanceRef.current = nextDistance;
      setDistance(nextDistance);
      setActive(true);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (gestureCancelled.current) {
        if (event.touches.length === 0) gestureCancelled.current = false;
        resetPull();
        return;
      }
      if (startY.current == null) return;
      if (event.touches.length !== 0) {
        gestureCancelled.current = true;
        resetPull();
        return;
      }

      const shouldRefresh = getPullGestureState(distanceRef.current).ready;
      resetPull();
      if (!shouldRefresh) return;

      refreshingRef.current = true;
      setRefreshing(true);
      refreshTimer.current = window.setTimeout(onRefresh, REFRESH_DELAY_MS);
    };

    const handleTouchCancel = () => {
      gestureCancelled.current = false;
      resetPull();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      if (refreshTimer.current != null) window.clearTimeout(refreshTimer.current);
    };
  }, [onRefresh]);

  return {
    ...getPullGestureState(distance),
    active,
    refreshing,
  };
}
