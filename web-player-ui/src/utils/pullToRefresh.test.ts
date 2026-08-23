import { describe, expect, it } from 'vitest';

import { canStartPull, getPullGestureState } from './pullToRefresh';

describe('getPullGestureState', () => {
  it.each([
    { distance: -12, offset: 0, progress: 0, ready: false },
    { distance: 36, offset: 18, progress: 0.5, ready: false },
    { distance: 72, offset: 36, progress: 1, ready: true },
    { distance: 400, offset: 96, progress: 1, ready: true },
  ])(
    'maps a $distance px drag to bounded visual feedback',
    ({ distance, offset, progress, ready }) => {
      expect(getPullGestureState(distance)).toEqual({ offset, progress, ready });
    },
  );
});

describe('canStartPull', () => {
  it.each([
    { scrollY: 0, touchCount: 1, expected: true },
    { scrollY: 1, touchCount: 1, expected: false },
    { scrollY: 0, touchCount: 2, expected: false },
  ])(
    'returns $expected at scroll $scrollY with $touchCount touches',
    ({ scrollY, touchCount, expected }) => {
      expect(canStartPull(scrollY, touchCount)).toBe(expected);
    },
  );
});
