export interface Character {
  id: string;
  name: string;
  className: string;
  level: number;
  health: number;
  maxHealth: number;
  xp: number;
  maxXP: number;
  initiative: number | null;
  conditions: string[];
}

export interface GameState {
  characters: Character[];
  round: number;
  roundState: number; // 0 = pre-draw (initiative input), 1+ = round active (turn order revealed)
  currentTurn: number | null;
  scenarioName: string;
  scenarioLevel: number;
  trapDamage: number;
  hazardDamage: number;
  coinMultiplier: number;
}

export interface WebSocketMessage {
  action: string;
  characterId: string;
  [key: string]: any;
}

export interface ServerStateMessage {
  index: number;
  description: string;
  gameState: GameState;
}

export interface CharacterSelectionProps {
  characters: Character[];
  onSelect: (characterId: string) => void;
  serverAddress: string;
  onServerAddressChange: (address: string) => void;
}

export interface CharacterSheetProps {
  character: Character;
  gameState: GameState;
  onHealthChange: (delta: number) => void;
  onInitiativeSet: (value: number) => void;
  onAddXP: (amount: number) => void;
  onToggleCondition: (condition: string) => void;
  isConnected: boolean;
}
