import type { Character } from '../types';

interface StatusEffectsProps {
  character: Character;
  onToggleCondition: (condition: string) => void;
  isConnected: boolean;
}

const CONDITIONS = [
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
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-frost);
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
          min-height: 36px;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition);
          -webkit-tap-highlight-color: transparent;
          border: 2px solid transparent;
          text-transform: capitalize;
        }

        .condition-badge--inactive {
          background: rgba(179, 223, 232, 0.3);
          color: var(--color-gray-dark);
        }

        .condition-badge--inactive:hover {
          background: rgba(179, 223, 232, 0.5);
          border-color: var(--color-ice);
        }

        .condition-badge--active {
          background: var(--color-frost);
          color: var(--color-snow);
          border-color: var(--color-ice-dark);
          box-shadow: 0 2px 8px rgba(44, 138, 168, 0.25);
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
        {CONDITIONS.map((condition) => {
          const isActive = character.conditions.includes(condition);
          return (
            <button
              key={condition}
              className={`condition-badge ${isActive ? 'condition-badge--active' : 'condition-badge--inactive'}`}
              onClick={() => onToggleCondition(condition)}
              disabled={!isConnected}
              aria-pressed={isActive}
              aria-label={`${condition}${isActive ? ' (active)' : ''}`}
            >
              {condition}
            </button>
          );
        })}
      </div>
    </section>
  );
}
