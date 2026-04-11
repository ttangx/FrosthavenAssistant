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

export interface MonsterInstance {
  standeeNr: number;
  type: number; // 1=normal, 2=elite/boss
  health: number;
}

export interface Monster {
  id: string;
  turnState: number;
  level: number;
  instances: MonsterInstance[];
}

export interface AbilityDeck {
  name: string;
  discardPile: { nr: number }[];
}

// Elements: fire(0), ice(1), air(2), earth(3), light(4), dark(5)
// ElementState: full(0)=infused, half(1)=waning, inert(2)=off
export type ElementStateValue = 0 | 1 | 2;
export type ElementStates = Record<string, ElementStateValue>;

export interface GameState {
  characters: Character[];
  monsters: Monster[];
  abilityDecks: AbilityDeck[];
  elementState: ElementStates;
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
  send: (message: any) => void;
  isConnected: boolean;
}
