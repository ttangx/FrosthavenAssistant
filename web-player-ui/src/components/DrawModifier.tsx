import { useEffect, useState } from 'react';
import type { GameState } from '../types';

interface DrawModifierProps {
  characterId: string;
  gameState: GameState;
  send: (message: any) => void;
  isConnected: boolean;
}

interface MonsterStatEntry {
  levels: Record<string, { normal?: number; elite?: number; boss?: number }>;
  deck: string;
}

interface AttackData {
  monsterStats: Record<string, MonsterStatEntry>;
  cardAttacks: Record<string, number>;
}

interface MonsterOption {
  id: string;
  type: string;
  totalAttack: number;
  standeeNr: number;
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
  const [monsterOptions, setMonsterOptions] = useState<MonsterOption[]>([]);

  useEffect(() => {
    loadAttackData().then(setAttackData);
  }, []);

  // Rebuild options whenever game state or attack data changes
  useEffect(() => {
    if (!attackData) return;

    const options: MonsterOption[] = [];

    // Only show the currently active monster (turnState 1)
    const activeMonsters = gameState.monsters.filter((m) => m.turnState === 1);

    for (const monster of activeMonsters) {
      const monsterData = attackData.monsterStats[monster.id];
      const deckName = monsterData?.deck ?? monster.id;

      // Find drawn ability card using the monster's deck name
      const abilityDeck = gameState.abilityDecks.find((d) => d.name === deckName || d.name === monster.id);
      let abilityMod = 0;
      if (abilityDeck && abilityDeck.discardPile.length > 0) {
        const lastDrawn = abilityDeck.discardPile[abilityDeck.discardPile.length - 1];
        abilityMod = attackData.cardAttacks[String(lastDrawn.nr)] ?? 0;
      }

      for (const instance of monster.instances) {
        const levelStats = monsterData?.levels?.[String(monster.level)];
        // type: 0=normal, 1=elite, 2=boss
        const baseAttack = instance.type === 2
          ? (levelStats?.boss ?? 0)
          : instance.type === 1
            ? (levelStats?.elite ?? levelStats?.boss ?? 0)
            : (levelStats?.normal ?? 0);
        const total = Math.max(0, baseAttack + abilityMod);

        options.push({
          id: monster.id,
          type: instance.type === 2 ? 'boss' : instance.type === 1 ? 'elite' : 'normal',
          totalAttack: total,
          standeeNr: instance.standeeNr,
        });
      }
    }

    setMonsterOptions(options);
  }, [attackData, gameState]);

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
          border-color: rgba(255, 200, 100, 0.3);
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
