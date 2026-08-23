import { useState } from 'react';
import type { GameState } from '../types';
import { useMonsterAbilityData } from '../hooks/useMonsterAbilityData';
import {
  formatAbilityLine,
} from '../utils/monsterAbilities';
import { getMonsterAbilityRows } from '../utils/turnOrder';

interface MonsterDetailsProps {
  gameState: GameState;
}

export default function MonsterDetails({ gameState }: MonsterDetailsProps) {
  const abilityData = useMonsterAbilityData();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (!abilityData) return null;

  const rows = getMonsterAbilityRows(gameState, abilityData);

  if (rows.length === 0) return null;

  // Sort by initiative ascending, then pin active rows to the top.
  rows.sort((a, b) => a.card.initiative - b.card.initiative);
  rows.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));

  const toggleRow = (monsterId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(monsterId)) next.delete(monsterId);
      else next.add(monsterId);
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
            const isExpanded = expandedRows.has(row.monsterId);
            const lines = row.card.lines.map(formatAbilityLine).filter(Boolean);
            return (
              <button
                key={row.monsterId}
                type="button"
                className={`monster-row${row.isCurrent ? ' monster-row--active' : ''}`}
                onClick={() => toggleRow(row.monsterId)}
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
