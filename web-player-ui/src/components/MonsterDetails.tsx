import { useEffect, useState } from 'react';
import type { GameState } from '../types';

interface MonsterDetailsProps {
  gameState: GameState;
}

interface AbilityCard {
  name: string;
  initiative: number;
  lines: string[];
}

interface AbilityData {
  decks: Record<string, Record<string, AbilityCard>>;
  monsters: Record<string, string>; // monsterId -> deckName
}

interface DeckRow {
  deckName: string;
  displayName: string;
  card: AbilityCard;
  isActive: boolean;
}

let cachedAbilityData: AbilityData | null = null;

async function loadAbilityData(): Promise<AbilityData> {
  if (cachedAbilityData) return cachedAbilityData;
  const resp = await fetch('/monster-abilities.json');
  cachedAbilityData = await resp.json();
  return cachedAbilityData!;
}

// Strip the "(FH)", "(2e)", etc. suffix from monster/deck names for display.
function cleanName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

// Render an ability card line: strip layout markers, replace %tokens% with words.
function formatLine(raw: string): string {
  let s = raw;
  // Strip layout markers at the start of a line
  s = s.replace(/^\^+/, '');
  // Divider lines are just "*..." — drop them.
  if (/^\*\.+$/.test(s.trim())) return '';
  // Drop bare bullets/asterisks
  s = s.replace(/^\*\s*/, '');
  // Drop column/row brackets used for two-column layouts in source
  s = s.replace(/\[\/?[rc]\]/g, '');
  // Drop image tokens (e.g. ¤aoe-triangle-2-side-with-black)
  s = s.replace(/¤[a-z0-9-]+/gi, '');
  // Replace %word% tokens with the word (lowercased)
  s = s.replace(/%([a-zA-Z]+)%/g, (_m, w) => w.toLowerCase());
  return s.trim();
}

export default function MonsterDetails({ gameState }: MonsterDetailsProps) {
  const [abilityData, setAbilityData] = useState<AbilityData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAbilityData().then(setAbilityData).catch(() => {});
  }, []);

  if (!abilityData) return null;

  // Build rows: for each deck with a drawn card, look up the latest card.
  const activeMonsterIds = new Set(
    gameState.monsters.filter((m) => m.turnState === 1).map((m) => m.id)
  );
  const activeDeckNames = new Set(
    Array.from(activeMonsterIds).map(
      (id) => abilityData.monsters[id] ?? id
    )
  );

  const rows: DeckRow[] = [];
  for (const deck of gameState.abilityDecks) {
    if (deck.discardPile.length === 0) continue;
    const lastNr = deck.discardPile[deck.discardPile.length - 1].nr;
    const card = abilityData.decks[deck.name]?.[String(lastNr)];
    if (!card) continue;
    rows.push({
      deckName: deck.name,
      displayName: cleanName(deck.name),
      card,
      isActive: activeDeckNames.has(deck.name),
    });
  }

  if (rows.length === 0) return null;

  // Sort by initiative ascending, then pin active rows to the top.
  rows.sort((a, b) => a.card.initiative - b.card.initiative);
  rows.sort((a, b) => Number(b.isActive) - Number(a.isActive));

  const toggleRow = (deckName: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(deckName)) next.delete(deckName);
      else next.add(deckName);
      return next;
    });
  };

  return (
    <section className="monster-details card" aria-label="Monster Details">
      <style>{`
        .monster-details__toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          min-height: 36px;
          padding: 0.4rem;
          background: transparent;
          border: none;
          box-shadow: none;
          color: var(--color-text-muted);
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .monster-details__toggle:hover {
          background: transparent;
          box-shadow: none;
          color: var(--color-frost);
          transform: none;
        }

        .monster-details__count {
          color: var(--color-text);
          font-weight: 700;
        }

        .monster-details__arrow {
          transition: transform var(--transition);
          font-size: 0.7rem;
        }

        .monster-details__arrow--open {
          transform: rotate(180deg);
        }

        .monster-details__body {
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease;
          max-height: 0;
          opacity: 0;
        }

        .monster-details__body--open {
          max-height: 1200px;
          opacity: 1;
        }

        .monster-details__list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.25rem;
        }

        .monster-row {
          display: grid;
          grid-template-columns: 42px 1fr auto;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.6rem;
          background: var(--color-panel-dark);
          border: 1px solid var(--color-panel-border);
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          transition: all var(--transition);
          font-family: var(--font-condensed);
          text-align: left;
          width: 100%;
          color: var(--color-text);
        }

        .monster-row:hover {
          border-color: var(--color-frost);
        }

        .monster-row--active {
          border-color: var(--color-damage);
          background: linear-gradient(135deg, rgba(220, 80, 80, 0.18), rgba(220, 80, 80, 0.05));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .monster-row__init {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #5cc8e0 0%, var(--color-ice-dark) 60%, #1a5a72 100%);
          border: 1px solid rgba(91, 189, 213, 0.5);
          color: var(--color-text-bright);
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 900;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        }

        .monster-row--active .monster-row__init {
          background: radial-gradient(circle at 35% 35%, #f08080 0%, var(--color-damage) 60%, var(--color-damage-dark) 100%);
          border-color: rgba(255, 200, 100, 0.5);
        }

        .monster-row__main {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }

        .monster-row__name {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--color-text-bright);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .monster-row__card {
          font-size: 0.78rem;
          color: var(--color-text-muted);
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .monster-row__chevron {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          transition: transform var(--transition);
        }

        .monster-row__chevron--open {
          transform: rotate(180deg);
        }

        .monster-row__lines {
          grid-column: 1 / -1;
          margin-top: 0.5rem;
          padding: 0.5rem 0.65rem;
          background: rgba(0, 0, 0, 0.25);
          border-radius: var(--border-radius-sm);
          border-left: 2px solid var(--color-frost);
          font-size: 0.85rem;
          line-height: 1.4;
          color: var(--color-text);
        }

        .monster-row__line {
          margin: 0.15rem 0;
        }

        .monster-row__line:empty {
          display: none;
        }
      `}</style>

      <button
        type="button"
        className="monster-details__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>Monsters this round</span>
        <span className="monster-details__count">({rows.length})</span>
        <span
          className={`monster-details__arrow${isOpen ? ' monster-details__arrow--open' : ''}`}
          aria-hidden="true"
        >
          &#9660;
        </span>
      </button>

      <div className={`monster-details__body${isOpen ? ' monster-details__body--open' : ''}`}>
        <div className="monster-details__list">
          {rows.map((row) => {
            const isExpanded = expandedRows.has(row.deckName);
            const lines = row.card.lines.map(formatLine).filter(Boolean);
            return (
              <button
                key={row.deckName}
                type="button"
                className={`monster-row${row.isActive ? ' monster-row--active' : ''}`}
                onClick={() => toggleRow(row.deckName)}
                aria-expanded={isExpanded}
              >
                <span className="monster-row__init">{row.card.initiative}</span>
                <span className="monster-row__main">
                  <span className="monster-row__name">{row.displayName}</span>
                  <span className="monster-row__card">{row.card.name}</span>
                </span>
                <span
                  className={`monster-row__chevron${isExpanded ? ' monster-row__chevron--open' : ''}`}
                  aria-hidden="true"
                >
                  &#9660;
                </span>

                {isExpanded && lines.length > 0 && (
                  <div className="monster-row__lines">
                    {lines.map((l, i) => (
                      <div key={i} className="monster-row__line">{l}</div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
