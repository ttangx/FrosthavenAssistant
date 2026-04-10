import type { Character } from '../types';

interface StatusEffectsProps {
  character: Character;
  onToggleCondition: (condition: string) => void;
  isConnected: boolean;
}

const CONDITIONS: { name: string; icon: string }[] = [
  { name: 'poisoned', icon: '/icons/conditions/fh-poison-condition.png' },
  { name: 'wounded', icon: '/icons/conditions/fh-wound-condition.png' },
  { name: 'muddle', icon: '/icons/conditions/fh-muddle-condition.png' },
  { name: 'immobilize', icon: '/icons/conditions/fh-immobilize-condition.png' },
  { name: 'disarm', icon: '/icons/conditions/fh-disarm-condition.png' },
  { name: 'stun', icon: '/icons/conditions/fh-stun-condition.png' },
  { name: 'invisible', icon: '/icons/conditions/fh-invisible-condition.png' },
  { name: 'strengthen', icon: '/icons/conditions/fh-strengthen-condition.png' },
  { name: 'bless', icon: '/icons/conditions/fh-bless-condition.png' },
  { name: 'curse', icon: '/icons/conditions/fh-curse-condition.png' },
  { name: 'regenerate', icon: '/icons/conditions/fh-regenerate-condition.png' },
  { name: 'ward', icon: '/icons/conditions/fh-ward-condition.png' },
  { name: 'brittle', icon: '/icons/conditions/fh-brittle-condition.png' },
  { name: 'bane', icon: '/icons/conditions/fh-bane-condition.png' },
  { name: 'impair', icon: '/icons/conditions/fh-impair-condition.png' },
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
        {CONDITIONS.map(({ name, icon }) => {
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
              <img className="condition-badge__icon" src={icon} alt="" />
              {name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
