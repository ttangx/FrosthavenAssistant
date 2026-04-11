import { useEffect, useState } from 'react';
import type { GameState } from '../types';

interface DrawModifierProps {
  characterId: string;
  conditions: string[];
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

interface AttackOption {
  monsterName: string;
  type: string;
  totalAttack: number;
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
  conditions,
  gameState,
  send,
  isConnected,
}: DrawModifierProps) {
  const isPoisoned = conditions.includes('poisoned');
  const isBrittle = conditions.includes('brittle');
  const [attackData, setAttackData] = useState<AttackData | null>(null);
  const [options, setOptions] = useState<AttackOption[]>([]);

  useEffect(() => {
    loadAttackData().then(setAttackData);
  }, []);

  useEffect(() => {
    if (!attackData) return;

    const activeMonsters = gameState.monsters.filter((m) => m.turnState === 1);
    const newOptions: AttackOption[] = [];

    for (const monster of activeMonsters) {
      const monsterData = attackData.monsterStats[monster.id];
      const deckName = monsterData?.deck ?? monster.id;
      const levelStats = monsterData?.levels?.[String(monster.level)];

      // Find ability card modifier
      const abilityDeck = gameState.abilityDecks.find((d) => d.name === deckName || d.name === monster.id);
      let abilityMod = 0;
      if (abilityDeck && abilityDeck.discardPile.length > 0) {
        const lastDrawn = abilityDeck.discardPile[abilityDeck.discardPile.length - 1];
        abilityMod = attackData.cardAttacks[String(lastDrawn.nr)] ?? 0;
      }

      // Determine which types exist for this monster
      const types = new Set(monster.instances.map((i) => i.type));
      const isBoss = levelStats?.boss !== undefined && levelStats?.normal === undefined;

      if (isBoss) {
        const total = Math.max(0, (levelStats?.boss ?? 0) + abilityMod);
        newOptions.push({ monsterName: monster.id, type: 'Boss', totalAttack: total });
      } else {
        if (types.has(0)) {
          const total = Math.max(0, (levelStats?.normal ?? 0) + abilityMod);
          newOptions.push({ monsterName: monster.id, type: 'Normal', totalAttack: total });
        }
        if (types.has(1)) {
          const total = Math.max(0, (levelStats?.elite ?? 0) + abilityMod);
          newOptions.push({ monsterName: monster.id, type: 'Elite', totalAttack: total });
        }
      }
    }

    setOptions(newOptions);
  }, [attackData, gameState]);

  const getFinalAttack = (base: number) => {
    let attack = base;
    if (isPoisoned) attack += 1;
    if (isBrittle) attack *= 2;
    return attack;
  };

  const handleDraw = (opt: AttackOption) => {
    send({
      action: 'drawModifier',
      characterId,
      baseAttack: getFinalAttack(opt.totalAttack),
    });
  };

  if (options.length === 0) return null;

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

        .draw-modifier__name {
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.3rem;
        }

        .draw-modifier__buttons {
          display: flex;
          gap: 0.3rem;
        }

        .draw-modifier__btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0.3rem 0.4rem;
          background: linear-gradient(180deg, var(--color-damage) 0%, var(--color-damage-dark) 100%);
          border-color: rgba(255, 200, 100, 0.2);
          text-transform: none;
          letter-spacing: 0;
        }

        .draw-modifier__btn:hover {
          background: linear-gradient(180deg, #e05050 0%, var(--color-damage) 100%);
        }

        .draw-modifier__type {
          font-family: var(--font-condensed);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.85;
        }

        .draw-modifier__attack {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 900;
        }
      `}</style>

      <h3 className="draw-modifier__heading">Draw Against Me</h3>

      {options.length > 0 && (
        <div className="draw-modifier__name">{options[0].monsterName}</div>
      )}

      <div className="draw-modifier__buttons">
        {options.map((opt) => (
          <button
            key={`${opt.monsterName}-${opt.type}`}
            className="draw-modifier__btn"
            onClick={() => handleDraw(opt)}
            disabled={!isConnected}
          >
            <span className="draw-modifier__type">{opt.type}</span>
            <span className="draw-modifier__attack">
              {getFinalAttack(opt.totalAttack)}
            </span>
            {(isPoisoned || isBrittle) && (
              <span style={{ fontSize: '0.55rem', opacity: 0.7, lineHeight: 1 }}>
                {isPoisoned && '+1 poison'}
                {isPoisoned && isBrittle && ' '}
                {isBrittle && 'x2 brittle'}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
