import { describe, expect, it } from 'vitest';

import type { GameState } from '../types';
import type { AbilityData } from './monsterAbilities';
import { buildTurnOrder } from './turnOrder';

const gameState: GameState = {
  characters: [
    {
      id: 'blinkblade',
      name: 'Blinkblade',
      className: 'Blinkblade',
      level: 2,
      health: 8,
      maxHealth: 8,
      xp: 0,
      maxXP: 0,
      initiative: 46,
      conditions: [],
    },
    {
      id: 'beast-tyrant',
      name: 'Beast Tyrant',
      className: 'Beast Tyrant',
      level: 3,
      health: 10,
      maxHealth: 10,
      xp: 0,
      maxXP: 0,
      initiative: 18,
      conditions: [],
    },
  ],
  monsters: [
    {
      id: 'Algox Guard',
      turnState: 1,
      level: 2,
      instances: [
        { standeeNr: 1, type: 1, health: 8 },
        { standeeNr: 3, type: 2, health: 12 },
      ],
    },
    {
      id: 'Unresolved Monster',
      turnState: 0,
      level: 2,
      instances: [{ standeeNr: 4, type: 1, health: 5 }],
    },
  ],
  abilityDecks: [
    { name: 'Guard (FH)', discardPile: [{ nr: 105 }] },
    { name: 'Unresolved Monster', discardPile: [{ nr: 999 }] },
  ],
  elementState: {},
  round: 2,
  roundState: 1,
  currentTurn: null,
  scenarioName: 'Test scenario',
  scenarioLevel: 2,
  trapDamage: 3,
  hazardDamage: 2,
  coinMultiplier: 2,
};

const abilityData: AbilityData = {
  decks: {
    'Guard (FH)': {
      '105': {
        name: 'Calculated Strike',
        initiative: 22,
        lines: ['%attack% + 1'],
      },
    },
  },
  monsters: {
    'Algox Guard': 'Guard (FH)',
    'Unresolved Monster': 'Unresolved Monster',
  },
};

describe('buildTurnOrder', () => {
  it('sorts one row per monster group together with characters', () => {
    const rows = buildTurnOrder(gameState, abilityData);

    expect(rows.map(({ kind, name, initiative }) => ({
      kind,
      name,
      initiative,
    }))).toEqual([
      { kind: 'character', name: 'Beast Tyrant', initiative: 18 },
      { kind: 'monster', name: 'Algox Guard', initiative: 22 },
      { kind: 'character', name: 'Blinkblade', initiative: 46 },
    ]);
  });
});
