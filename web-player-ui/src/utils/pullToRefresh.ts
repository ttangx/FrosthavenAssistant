export const PULL_REFRESH_THRESHOLD = 72;

const MAX_PULL_OFFSET = 96;
const PULL_RESISTANCE = 0.5;

export interface PullGestureState {
  offset: number;
  progress: number;
  ready: boolean;
}

export function getPullGestureState(distance: number): PullGestureState {
  const normalizedDistance = Math.max(0, distance);

  return {
    offset: Math.min(MAX_PULL_OFFSET, normalizedDistance * PULL_RESISTANCE),
    progress: Math.min(1, normalizedDistance / PULL_REFRESH_THRESHOLD),
    ready: normalizedDistance >= PULL_REFRESH_THRESHOLD,
  };
}

export function canStartPull(scrollY: number, touchCount: number): boolean {
  return scrollY <= 0 && touchCount === 1;
}
