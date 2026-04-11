import { useState } from 'react';
import type { Character } from '../types';
import { getConditionColorIcon } from '../utils/classAssets';

interface StatusEffectsProps {
  character: Character;
  onToggleCondition: (condition: string) => void;
  isConnected: boolean;
}

const COMMON_CONDITIONS = [
  'poisoned',
  'wounded',
  'muddle',
  'strengthen',
  'immobilize',
];

const OTHER_CONDITIONS = [
  'disarm',
  'stun',
  'invisible',
  'bless',
  'curse',
  'regenerate',
  'ward',
  'brittle',
  'bane',
  'impair',
];

export default function StatusEffects({
  character,
  onToggleCondition,
  isConnected,
}: StatusEffectsProps) {
  // Auto-expand if any "other" condition is active
  const hasActiveOther = OTHER_CONDITIONS.some((c) => character.conditions.includes(c));
  const [showMore, setShowMore] = useState(hasActiveOther);

  return (
    <section className="status-effects card" aria-label="Status Effects">
      <style>{`
        .status-effects__heading {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-ice-light);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.75rem;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .status-effects__grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.4rem;
        }

        .condition-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          min-height: 56px;
          padding: 0.4rem 0.2rem;
          border-radius: var(--border-radius-sm);
          font-size: 0.6rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition);
          -webkit-tap-highlight-color: transparent;
          border: 1px solid transparent;
          text-transform: capitalize;
          font-family: var(--font-condensed);
          letter-spacing: 0.03em;
        }

        .condition-badge__icon {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: brightness(2.2) contrast(1.3) drop-shadow(0 2px 4px rgba(0,0,0,0.6));
        }

        .condition-badge--inactive .condition-badge__icon {
          opacity: 0.85;
          filter: brightness(1.8) contrast(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        .condition-badge--inactive {
          background: rgba(17, 28, 38, 0.85);
          color: var(--color-text);
          border: 1px solid var(--color-panel-border);
        }

        .condition-badge--inactive:hover {
          background: var(--color-panel-light);
          border-color: rgba(91, 189, 213, 0.3);
        }

        .condition-badge--active {
          background: linear-gradient(180deg, rgba(44, 138, 168, 0.4) 0%, rgba(26, 96, 128, 0.5) 100%);
          color: var(--color-text-bright);
          border-color: var(--color-frost);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 12px rgba(91, 189, 213, 0.15);
        }

        .condition-badge--active .condition-badge__icon {
          opacity: 1;
          filter: brightness(2) contrast(1.2) drop-shadow(0 0 5px rgba(91, 189, 213, 0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        .condition-badge--active:hover {
          opacity: 0.9;
        }

        .condition-badge:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .status-effects__more-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          width: 100%;
          min-height: 28px;
          padding: 0.2rem;
          margin: 0.3rem 0;
          background: transparent;
          border: none;
          box-shadow: none;
          color: var(--color-text-muted);
          font-family: var(--font-condensed);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .status-effects__more-toggle:hover {
          background: transparent;
          box-shadow: none;
          color: var(--color-frost);
          transform: none;
        }

        .status-effects__arrow {
          font-size: 0.55rem;
          transition: transform var(--transition);
        }

        .status-effects__arrow--open {
          transform: rotate(180deg);
        }
      `}</style>

      <h3 className="status-effects__heading">Status Effects</h3>

      <div className="status-effects__grid">
        {COMMON_CONDITIONS.map((name) => {
          const isActive = character.conditions.includes(name);
          return (
            <button
              key={name}
              className={`condition-badge ${isActive ? 'condition-badge--active' : 'condition-badge--inactive'}`}
              onClick={() => onToggleCondition(name)}
              disabled={!isConnected}
              aria-pressed={isActive}
              aria-label={`${name}${isActive ? ' (active)' : ''}`}
            >
              <img className="condition-badge__icon" src={getConditionColorIcon(name)} alt="" />
              {name}
            </button>
          );
        })}
      </div>

      <button
        className="status-effects__more-toggle"
        onClick={() => setShowMore((prev) => !prev)}
        type="button"
      >
        {showMore ? 'Less' : 'More'}
        <span className={`status-effects__arrow${showMore ? ' status-effects__arrow--open' : ''}`}>&#9660;</span>
      </button>

      {showMore && (
        <div className="status-effects__grid">
          {OTHER_CONDITIONS.map((name) => {
            const isActive = character.conditions.includes(name);
            return (
              <button
                key={name}
                className={`condition-badge ${isActive ? 'condition-badge--active' : 'condition-badge--inactive'}`}
                onClick={() => onToggleCondition(name)}
                disabled={!isConnected}
                aria-pressed={isActive}
                aria-label={`${name}${isActive ? ' (active)' : ''}`}
              >
                <img className="condition-badge__icon" src={getConditionColorIcon(name)} alt="" />
                {name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
