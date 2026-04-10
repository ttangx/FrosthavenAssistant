import { Character, GameState } from '../types';

interface CharacterSheetProps {
  character: Character;
  gameState: GameState;
  onHealthChange: (delta: number) => void;
  onInitiativeSet: (value: number) => void;
  onAddXP: (amount: number) => void;
  onToggleCondition: (condition: string) => void;
  isConnected: boolean;
}

export default function CharacterSheet({
  character,
  gameState,
  onHealthChange,
  onInitiativeSet,
  onAddXP,
  onToggleCondition,
  isConnected,
}: CharacterSheetProps) {
  return (
    <div className="card">
      <h2>{character.name}</h2>
      <p>Placeholder - character sheet UI coming in Phase 3</p>
      <p>
        HP: {character.health}/{character.maxHealth} | XP: {character.xp}/{character.maxXP}
      </p>
    </div>
  );
}
