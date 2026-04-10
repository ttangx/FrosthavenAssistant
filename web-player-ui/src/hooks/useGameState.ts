import { useCallback, useState } from 'react';
import { Character, GameState } from '../types';

interface GameStateHook {
  gameState: GameState | null;
  serverIndex: number;
  selectedCharacterId: string | null;
  updateFromServer: (newState: GameState, index: number) => void;
  selectCharacter: (characterId: string) => void;
  getSelectedCharacter: () => Character | null;
  optimisticHealthChange: (characterId: string, delta: number) => void;
  optimisticInitiativeSet: (characterId: string, value: number) => void;
  optimisticAddXP: (characterId: string, amount: number) => void;
  optimisticToggleCondition: (characterId: string, condition: string) => void;
}

function updateCharacter(
  state: GameState,
  characterId: string,
  updater: (character: Character) => Character,
): GameState {
  return {
    ...state,
    characters: state.characters.map((c) =>
      c.id === characterId ? updater(c) : c,
    ),
  };
}

export function useGameState(): GameStateHook {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [serverIndex, setServerIndex] = useState(0);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );

  const updateFromServer = useCallback(
    (newState: GameState, index: number) => {
      setGameState(newState);
      setServerIndex(index);
    },
    [],
  );

  const selectCharacter = useCallback((characterId: string) => {
    setSelectedCharacterId(characterId);
  }, []);

  const getSelectedCharacter = useCallback((): Character | null => {
    if (!gameState || !selectedCharacterId) return null;
    return (
      gameState.characters.find((c) => c.id === selectedCharacterId) ?? null
    );
  }, [gameState, selectedCharacterId]);

  const optimisticHealthChange = useCallback(
    (characterId: string, delta: number) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return updateCharacter(prev, characterId, (c) => ({
          ...c,
          health: Math.max(0, Math.min(c.maxHealth, c.health + delta)),
        }));
      });
    },
    [],
  );

  const optimisticInitiativeSet = useCallback(
    (characterId: string, value: number) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return updateCharacter(prev, characterId, (c) => ({
          ...c,
          initiative: value,
        }));
      });
    },
    [],
  );

  const optimisticAddXP = useCallback(
    (characterId: string, amount: number) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return updateCharacter(prev, characterId, (c) => ({
          ...c,
          xp: Math.min(c.maxXP, c.xp + amount),
        }));
      });
    },
    [],
  );

  const optimisticToggleCondition = useCallback(
    (characterId: string, condition: string) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return updateCharacter(prev, characterId, (c) => ({
          ...c,
          conditions: c.conditions.includes(condition)
            ? c.conditions.filter((cond) => cond !== condition)
            : [...c.conditions, condition],
        }));
      });
    },
    [],
  );

  return {
    gameState,
    serverIndex,
    selectedCharacterId,
    updateFromServer,
    selectCharacter,
    getSelectedCharacter,
    optimisticHealthChange,
    optimisticInitiativeSet,
    optimisticAddXP,
    optimisticToggleCondition,
  };
}
