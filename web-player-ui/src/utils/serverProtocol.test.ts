import { describe, expect, it } from 'vitest';

import { parseServerGameState } from './serverProtocol';

function stateAtLevel(level: number) {
  return {
    level,
    round: 3,
    roundState: 1,
    scenario: 'Live scenario',
    currentCampaign: 'Frosthaven',
    currentList: [],
  };
}

describe('parseServerGameState', () => {
  it('derives Frosthaven scenario values from the live scenario level', () => {
    const state = parseServerGameState(stateAtLevel(4));

    expect({
      trapDamage: state.trapDamage,
      hazardDamage: state.hazardDamage,
      coinMultiplier: state.coinMultiplier,
    }).toEqual({
      trapDamage: 6,
      hazardDamage: 3,
      coinMultiplier: 4,
    });
  });

  it('uses Frosthaven special coin value at scenario level 7', () => {
    const state = parseServerGameState(stateAtLevel(7));

    expect({
      trapDamage: state.trapDamage,
      hazardDamage: state.hazardDamage,
      coinMultiplier: state.coinMultiplier,
    }).toEqual({
      trapDamage: 9,
      hazardDamage: 4,
      coinMultiplier: 6,
    });
  });

  it('preserves whether a monster group is active', () => {
    const state = parseServerGameState({
      ...stateAtLevel(2),
      currentList: [{
        id: 'Algox Guard',
        turnState: 0,
        edition: 'Frosthaven',
        isActive: false,
        monsterInstances: [],
      }],
    });

    expect(state.monsters[0].isActive).toBe(false);
  });
});
