import { useEffect, useState } from 'react';
import type { GameState } from '../types';

interface DrawModifierProps {
  characterId: string;
  gameState: GameState;
  send: (message: any) => void;
  isConnected: boolean;
}

interface AttackData {
  monsterStats: Record<string, Record<string, { normal?: number; elite?: number; boss?: number }>>;
  cardAttacks: Record<string, number>;
}

interface MonsterOption {
  id: string;
  level: number;
  type: 'normal' | 'elite' | 'boss';
  baseAttack: number;
  abilityMod: number;
  totalAttack: number;
  standeeNr: number;
}

// Raw game state types for monsters
interface RawMonsterInstance {
  standeeNr: number;
  type: number; // 1=normal, 2=elite/boss
  level: number;
}

interface RawAbilityDeck {
  name: string;
  drawPile: { nr: number }[];
  discardPile: { nr: number }[];
  lastRoundDrawn: number;
}

let cachedAttackData: AttackData | null = null;

async function loadAttackData(): Promise<AttackData> {
  if (cachedAttackData) return cachedAttackData;
  const resp = await fetch('/frosthaven-attacks.json');
  cachedAttackData = await resp.json();
  return cachedAttackData!;
}

export default function DrawModifier({
  characterId,
  gameState,
  send,
  isConnected,
}: DrawModifierProps) {
  const [attackData, setAttackData] = useState<AttackData | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<string>('');
  const [monsterOptions, setMonsterOptions] = useState<MonsterOption[]>([]);

  // Load attack data on mount
  useEffect(() => {
    loadAttackData().then(setAttackData);
  }, []);

  // Build monster options from raw game state whenever it changes
  useEffect(() => {
    if (!attackData || !gameState) return;

    // Access raw state through a re-fetch since our parsed GameState strips monsters
    // We need to get the raw state. Use the WebSocket to get it.
    // Actually, we can reconstruct from the raw game state that the hook stores.
    // For now, let's fetch the attack data and build options from what we can see.
    // The gameState.characters only has player characters. We need the raw state.
  }, [attackData, gameState]);

  // We need access to the raw game state for monsters. Let's fetch it directly.
  const [rawMonsters, setRawMonsters] = useState<any[]>([]);
  const [rawAbilityDecks, setRawAbilityDecks] = useState<RawAbilityDeck[]>([]);

  useEffect(() => {
    // Re-parse raw state from server on each update
    // This is a workaround since our GameState type strips monsters
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`);
    ws.onmessage = (event) => {
      const data = String(event.data);
      const match = data.match(/GameState:(.+)$/s);
      if (match && match[1].length > 100) {
        try {
          const state = JSON.parse(match[1]);
          const monsters = (state.currentList || []).filter((c: any) => c.monsterInstances);
          setRawMonsters(monsters);
          setRawAbilityDecks(state.currentAbilityDecks || []);
        } catch { /* ignore parse errors */ }
      }
    };
    // Close after getting one message
    const timeout = setTimeout(() => ws.close(), 3000);
    return () => { clearTimeout(timeout); ws.close(); };
  }, [gameState.round, gameState.roundState]);

  // Build options when data is available
  useEffect(() => {
    if (!attackData || rawMonsters.length === 0) return;

    const options: MonsterOption[] = [];

    for (const monster of rawMonsters) {
      const monsterId = monster.id as string;
      const monsterLevel = (monster.level as number) ?? 0;
      const stats = attackData.monsterStats[monsterId];

      // Find drawn ability card for this monster
      const abilityDeck = rawAbilityDecks.find((d: RawAbilityDeck) => d.name === monsterId);
      let abilityMod = 0;
      if (abilityDeck && abilityDeck.discardPile.length > 0) {
        const lastDrawn = abilityDeck.discardPile[abilityDeck.discardPile.length - 1];
        abilityMod = attackData.cardAttacks[String(lastDrawn.nr)] ?? 0;
      }

      for (const instance of (monster.monsterInstances || [])) {
        const mi = instance as RawMonsterInstance;
        const typeName = mi.type === 2 ? 'elite' : 'normal';
        const levelStats = stats?.[String(monsterLevel)];
        const baseAttack = levelStats?.[typeName] ?? levelStats?.boss ?? 0;
        const total = Math.max(0, baseAttack + abilityMod);

        options.push({
          id: monsterId,
          level: monsterLevel,
          type: mi.type === 2 ? 'elite' : 'normal',
          baseAttack,
          abilityMod,
          totalAttack: total,
          standeeNr: mi.standeeNr,
        });
      }
    }

    setMonsterOptions(options);
  }, [attackData, rawMonsters, rawAbilityDecks]);

  const handleDraw = (option: MonsterOption) => {
    send({
      action: 'drawModifier',
      characterId,
      baseAttack: option.totalAttack,
    });
  };

  if (monsterOptions.length === 0) return null;

  return (
    <section className="draw-modifier card" aria-label="Draw Modifier">
      <style>{`
        .draw-modifier__heading {
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-ice-light);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.4rem;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .draw-modifier__list {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .draw-modifier__btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 38px;
          padding: 0.35rem 0.6rem;
          font-size: 0.8rem;
          background: linear-gradient(180deg, var(--color-damage) 0%, var(--color-damage-dark) 100%);
          border-color: rgba(255, 255, 255, 0.1);
          text-align: left;
          text-transform: none;
          letter-spacing: 0;
        }

        .draw-modifier__btn:hover {
          background: linear-gradient(180deg, #e05050 0%, var(--color-damage) 100%);
        }

        .draw-modifier__monster-name {
          font-family: var(--font-condensed);
          font-weight: 700;
          font-size: 0.85rem;
        }

        .draw-modifier__type {
          font-size: 0.7rem;
          opacity: 0.8;
          text-transform: uppercase;
        }

        .draw-modifier__attack {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 900;
          min-width: 30px;
          text-align: center;
        }
      `}</style>

      <h3 className="draw-modifier__heading">Draw Against Me</h3>

      <div className="draw-modifier__list">
        {monsterOptions.map((opt) => (
          <button
            key={`${opt.id}-${opt.standeeNr}`}
            className="draw-modifier__btn"
            onClick={() => handleDraw(opt)}
            disabled={!isConnected}
          >
            <div>
              <span className="draw-modifier__monster-name">
                {opt.id} #{opt.standeeNr}
              </span>{' '}
              <span className="draw-modifier__type">
                ({opt.type})
              </span>
            </div>
            <span className="draw-modifier__attack">
              {opt.totalAttack}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
