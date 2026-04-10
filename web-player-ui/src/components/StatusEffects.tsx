import type { Character } from '../types';
import { getConditionColorIcon } from '../utils/classAssets';

interface StatusEffectsProps {
  character: Character;
  onToggleCondition: (condition: string) => void;
  isConnected: boolean;
}

const CONDITION_NAMES = [
  'poisoned',
  'wounded',
  'muddle',
  'immobilize',
  'disarm',
  'stun',
  'invisible',
  'strengthen',
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
  return (
    <section className="status-effects card" aria-label="Status Effects">
      <style>{`
        .status-effects__heading {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }

        .status-effects__grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .condition-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          min-height: 44px;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition);
          -webkit-tap-highlight-color: transparent;
          border: 2px solid transparent;
          text-transform: capitalize;
        }

        .condition-badge__icon {
          width: 22px;
          height: 22px;
          object-fit: contain;
        }

        .condition-badge--inactive .condition-badge__icon {
          opacity: 0.5;
        }

        .condition-badge--inactive {
          background: var(--color-panel-dark);
          color: var(--color-text-muted);
          border: 1px solid var(--color-panel-border);
        }

        .condition-badge--inactive:hover {
          background: var(--color-panel-light);
          border-color: rgba(91, 189, 213, 0.3);
        }

        .condition-badge--active {
          background: linear-gradient(180deg, var(--color-ice-dark) 0%, #1a6080 100%);
          color: var(--color-text-bright);
          border-color: var(--color-frost);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 6px rgba(91, 189, 213, 0.2);
        }

        .condition-badge--active:hover {
          opacity: 0.9;
        }

        .condition-badge:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <h3 className="status-effects__heading">Status Effects</h3>

      <div className="status-effects__grid">
        {CONDITION_NAMES.map((name) => {
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
    </section>
  );
}
