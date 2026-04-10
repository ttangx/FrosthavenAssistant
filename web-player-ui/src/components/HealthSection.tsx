import { useState } from 'react';
import type { Character } from '../types';

interface HealthSectionProps {
  character: Character;
  onHealthChange: (delta: number) => void;
  isConnected: boolean;
}

export default function HealthSection({
  character,
  onHealthChange,
  isConnected,
}: HealthSectionProps) {
  const [exactHealth, setExactHealth] = useState('');
  const { health, maxHealth } = character;
  const percentage = maxHealth > 0 ? (health / maxHealth) * 100 : 0;

  const barColor =
    percentage > 50
      ? 'var(--color-healing)'
      : percentage > 25
        ? 'var(--color-condition)'
        : 'var(--color-damage)';

  const handleSetExact = () => {
    const parsed = parseInt(exactHealth, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const delta = parsed - health;
      if (delta !== 0) {
        onHealthChange(delta);
      }
      setExactHealth('');
    }
  };

  const handleExactKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSetExact();
    }
  };

  return (
    <section className="health-section card" aria-label="Health">
      <style>{`
        .health-section__heading {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }

        .health-bar {
          width: 100%;
          height: 14px;
          background: var(--color-panel-dark);
          border: 1px solid var(--color-panel-border);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 0.5rem;
          box-shadow: var(--shadow-inset);
        }

        .health-bar__fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease, background-color 0.4s ease;
        }

        .health-display {
          text-align: center;
          font-family: var(--font-condensed);
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-text-bright);
          margin-bottom: 0.75rem;
        }

        .health-display__separator {
          font-weight: 400;
          opacity: 0.4;
          margin: 0 0.15rem;
        }

        .health-display__max {
          opacity: 0.5;
          font-weight: 600;
        }

        .health-quick-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .health-quick-buttons button {
          font-size: 1.1rem;
          font-weight: 700;
          min-height: 48px;
          padding: 0.5rem;
        }

        .health-exact {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }

        .health-exact input[type='number'] {
          flex: 1;
          text-align: center;
          font-size: 1rem;
          -moz-appearance: textfield;
        }

        .health-exact input[type='number']::-webkit-outer-spin-button,
        .health-exact input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .health-exact button {
          min-width: 72px;
          font-size: 0.9rem;
        }
      `}</style>

      <h3 className="health-section__heading">Health</h3>

      <div className="health-bar">
        <div
          className="health-bar__fill"
          style={{
            width: `${Math.max(0, Math.min(100, percentage))}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <div className="health-display">
        <span>{health}</span>
        <span className="health-display__separator">/</span>
        <span className="health-display__max">{maxHealth}</span>
      </div>

      <div className="health-quick-buttons">
        <button
          className="btn-damage"
          onClick={() => onHealthChange(-5)}
          disabled={!isConnected}
          aria-label="Take 5 damage"
        >
          -5
        </button>
        <button
          className="btn-damage"
          onClick={() => onHealthChange(-1)}
          disabled={!isConnected}
          aria-label="Take 1 damage"
        >
          -1
        </button>
        <button
          className="btn-healing"
          onClick={() => onHealthChange(1)}
          disabled={!isConnected}
          aria-label="Heal 1"
        >
          +1
        </button>
        <button
          className="btn-healing"
          onClick={() => onHealthChange(5)}
          disabled={!isConnected}
          aria-label="Heal 5"
        >
          +5
        </button>
      </div>

      <div className="health-exact">
        <input
          type="number"
          min={0}
          max={maxHealth}
          value={exactHealth}
          onChange={(e) => setExactHealth(e.target.value)}
          onKeyDown={handleExactKeyDown}
          placeholder="Set exact health"
          disabled={!isConnected}
          aria-label="Set exact health value"
        />
        <button
          onClick={handleSetExact}
          disabled={!isConnected || exactHealth === ''}
        >
          Set
        </button>
      </div>
    </section>
  );
}
