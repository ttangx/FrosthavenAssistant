export interface AbilityCard {
  name: string;
  initiative: number;
  lines: string[];
}

export interface AbilityData {
  decks: Record<string, Record<string, AbilityCard>>;
  monsters: Record<string, string>;
}

export interface MonsterAbilityRow {
  monsterId: string;
  deckName: string;
  displayName: string;
  card: AbilityCard;
  isCurrent: boolean;
}

let cachedAbilityData: AbilityData | null = null;
let pendingAbilityData: Promise<AbilityData> | null = null;

export function loadMonsterAbilityData(): Promise<AbilityData> {
  if (cachedAbilityData) return Promise.resolve(cachedAbilityData);

  pendingAbilityData ??= fetch('/monster-abilities.json')
    .then((response) => response.json())
    .then((data: AbilityData) => {
      cachedAbilityData = data;
      return data;
    })
    .finally(() => {
      pendingAbilityData = null;
    });

  return pendingAbilityData;
}

export function cleanMonsterName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

export function formatAbilityLine(raw: string): string {
  let line = raw.replace(/^\^+/, '');
  if (/^\*\.+$/.test(line.trim())) return '';

  line = line.replace(/^\*\s*/, '');
  line = line.replace(/\[\/?[rc]\]/g, '');
  line = line.replace(/¤[a-z0-9-]+/gi, '');
  line = line.replace(/%([a-zA-Z]+)%/g, (_match, word: string) => (
    word.toLowerCase()
  ));
  return line.trim();
}
