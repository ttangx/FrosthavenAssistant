import type { GameState } from '../types';
import {
  cleanMonsterName,
  type AbilityData,
  type MonsterAbilityRow,
} from './monsterAbilities';

export interface TurnOrderRow {
  id: string;
  kind: 'character' | 'monster';
  name: string;
  initiative: number;
  isCurrent: boolean;
}

export function getMonsterAbilityRows(
  gameState: GameState,
  abilityData: AbilityData,
): MonsterAbilityRow[] {
  return gameState.monsters.filter((monster) => monster.isActive).flatMap((monster) => {
    const deckName = abilityData.monsters[monster.id] ?? monster.id;
    const deck = gameState.abilityDecks.find((item) => item.name === deckName);
    const cardNumber = deck && deck.discardPile.length > 0
      ? deck.discardPile[deck.discardPile.length - 1].nr
      : undefined;
    const card = cardNumber === undefined
      ? undefined
      : abilityData.decks[deckName]?.[String(cardNumber)];

    if (!card) return [];

    return [{
      monsterId: monster.id,
      deckName,
      displayName: cleanMonsterName(monster.id),
      card,
      isCurrent: monster.turnState === 1,
    }];
  });
}

export function buildTurnOrder(
  gameState: GameState,
  abilityData: AbilityData,
): TurnOrderRow[] {
  const characters = gameState.characters
    .filter((character) => character.initiative !== null)
    .sort((a, b) => (a.initiative ?? 99) - (b.initiative ?? 99));
  const currentCharacterId = gameState.currentTurn === null
    ? null
    : characters[gameState.currentTurn]?.id ?? null;

  const characterRows: TurnOrderRow[] = characters.map((character) => ({
    id: `character:${character.id}`,
    kind: 'character',
    name: character.name,
    initiative: character.initiative ?? 0,
    isCurrent: character.id === currentCharacterId,
  }));
  const monsterRows: TurnOrderRow[] = getMonsterAbilityRows(
    gameState,
    abilityData,
  ).map((monster) => ({
    id: `monster:${monster.monsterId}`,
    kind: 'monster',
    name: monster.displayName,
    initiative: monster.card.initiative,
    isCurrent: monster.isCurrent,
  }));

  return [...characterRows, ...monsterRows]
    .sort((a, b) => a.initiative - b.initiative);
}
