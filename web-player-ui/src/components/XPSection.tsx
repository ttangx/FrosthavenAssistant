import { useState } from 'react';
import type { Character } from '../types';
import { getGeneralIcon } from '../utils/classAssets';

interface XPSectionProps {
  character: Character;
  onAddXP: (amount: number) => void;
  isConnected: boolean;
}

export default function XPSection({
  character,
  onAddXP,
  isConnected,
}: XPSectionProps) {
  const [xpAmount, setXpAmount] = useState('');
  const { xp, maxXP } = character;
  const percentage = maxXP > 0 ? (xp / maxXP) * 100 : 0;

  const handleAddXP = () => {
    const parsed = parseInt(xpAmount, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onAddXP(parsed);
      setXpAmount('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddXP();
    }
  };

  return (
    <section className="xp-section card" aria-label="Experience">
      <style>{`
        .xp-section__heading {
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-ice-light);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.35rem;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .xp-bar {
          width: 100%;
          height: 8px;
          background: var(--color-panel-dark);
          border: 1px solid var(--color-panel-border);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 0.35rem;
          box-shadow: var(--shadow-inset);
        }

        .xp-bar__fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--color-xp), #2980b9);
          transition: width 0.4s ease;
        }

        .xp-display {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--color-xp);
          margin-bottom: 0.35rem;
        }

        .xp-display__separator {
          font-weight: 400;
          opacity: 0.4;
          margin: 0 0.15rem;
        }

        .xp-display__max {
          opacity: 0.5;
          font-weight: 600;
        }

        .xp-quick-buttons {
          display: flex;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }

        .xp-quick-buttons button {
          flex: 1;
          min-height: 44px;
          font-size: 1rem;
          font-weight: 700;
          background: linear-gradient(180deg, var(--color-xp) 0%, var(--color-xp-dark) 100%);
          color: var(--color-panel-dark);
        }

        .xp-quick-buttons button:hover {
          background: linear-gradient(180deg, #e0b850 0%, var(--color-xp) 100%);
        }

        .xp-custom-group {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }

        .xp-custom-group input[type='number'] {
          flex: 1;
          text-align: center;
          font-size: 1rem;
          -moz-appearance: textfield;
        }

        .xp-custom-group input[type='number']::-webkit-outer-spin-button,
        .xp-custom-group input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .xp-custom-group button {
          min-width: 90px;
          font-size: 0.9rem;
          background: linear-gradient(180deg, var(--color-xp) 0%, var(--color-xp-dark) 100%);
          color: var(--color-panel-dark);
        }

        .xp-custom-group button:hover {
          background: linear-gradient(180deg, #e0b850 0%, var(--color-xp) 100%);
        }
      `}</style>

      <h3 className="xp-section__heading">
        <img src={getGeneralIcon('xp')} alt="" style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.9, filter: 'brightness(2.5)', verticalAlign: 'middle', marginRight: 6 }} />
        Experience
      </h3>

      <div className="xp-display">
        <img src="/icons/xp-star.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', filter: 'brightness(1.5)', marginRight: 6 }} />
        <span>{xp}</span>
      </div>

      <div className="xp-quick-buttons">
        <button onClick={() => onAddXP(1)} disabled={!isConnected}>+1</button>
        <button onClick={() => onAddXP(2)} disabled={!isConnected}>+2</button>
      </div>

      <div className="xp-custom-group">
        <input
          type="number"
          min={1}
          value={xpAmount}
          onChange={(e) => setXpAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Custom"
          disabled={!isConnected}
          aria-label="Custom XP amount"
        />
        <button
          onClick={handleAddXP}
          disabled={!isConnected || xpAmount === ''}
        >
          Add
        </button>
      </div>
    </section>
  );
}
