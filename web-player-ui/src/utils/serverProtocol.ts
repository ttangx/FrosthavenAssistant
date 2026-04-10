import type { Character, GameState } from '../types';

/**
 * Raw server data types (as sent by the Dart server).
 * The server's GameState format differs from our internal types.
 */
interface RawCharacterState {
  initiative: number;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  conditions: string[];
  display: string; // Player-given character name
}

interface RawListItem {
  id: string; // Class name (e.g. "Frozen Fist")
  turnState: number;
  edition: string;
  characterState?: RawCharacterState;
  monsterInstances?: unknown;
}

interface RawGameState {
  level: number;
  round: number;
  roundState: number;
  scenario: string;
  currentCampaign: string;
  currentList: RawListItem[];
  [key: string]: unknown;
}

/**
 * Parse raw server game state JSON into our internal GameState format.
 * Filters currentList to only player characters (items with characterState).
 */
export function parseServerGameState(raw: RawGameState): GameState {
  const characters: Character[] = raw.currentList
    .filter((item) => item.characterState != null)
    .map((item) => {
      const cs = item.characterState!;
      return {
        id: item.id,
        name: cs.display || item.id,
        className: item.id,
        level: cs.level,
        health: cs.health,
        maxHealth: cs.maxHealth,
        xp: cs.xp,
        maxXP: 0, // Not provided by server; display-only
        initiative: cs.initiative,
        conditions: cs.conditions ?? [],
      };
    });

  return {
    characters,
    round: raw.round,
    roundState: raw.roundState,
    currentTurn: null, // Derived from turnState if needed
    scenarioName: raw.scenario,
    scenarioLevel: raw.level,
    trapDamage: 0,
    hazardDamage: 0,
    coinMultiplier: 0,
  };
}
