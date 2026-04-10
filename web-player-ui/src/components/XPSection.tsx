import { useState } from 'react';
import type { Character } from '../types';

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
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-frost);
          margin-bottom: 0.75rem;
        }

        .xp-bar {
          width: 100%;
          height: 12px;
          background: rgba(179, 223, 232, 0.3);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .xp-bar__fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--color-xp), #2980b9);
          transition: width 0.4s ease;
        }

        .xp-display {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-gray-dark);
          margin-bottom: 0.75rem;
        }

        .xp-display__separator {
          font-weight: 400;
          opacity: 0.5;
          margin: 0 0.2rem;
        }

        .xp-display__max {
          opacity: 0.6;
          font-weight: 600;
        }

        .xp-input-group {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }

        .xp-input-group input[type='number'] {
          flex: 1;
          text-align: center;
          font-size: 1rem;
          -moz-appearance: textfield;
        }

        .xp-input-group input[type='number']::-webkit-outer-spin-button,
        .xp-input-group input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .xp-input-group button {
          min-width: 90px;
          font-size: 0.9rem;
          background: linear-gradient(135deg, var(--color-xp), #2980b9);
        }

        .xp-input-group button:hover {
          background: linear-gradient(135deg, #2980b9, #21618c);
        }
      `}</style>

      <h3 className="xp-section__heading">Experience</h3>

      <div className="xp-bar">
        <div
          className="xp-bar__fill"
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>

      <div className="xp-display">
        <span>{xp}</span>
        <span className="xp-display__separator">/</span>
        <span className="xp-display__max">{maxXP}</span>
      </div>

      <div className="xp-input-group">
        <input
          type="number"
          min={1}
          value={xpAmount}
          onChange={(e) => setXpAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Amount"
          disabled={!isConnected}
          aria-label="XP amount to add"
        />
        <button
          onClick={handleAddXP}
          disabled={!isConnected || xpAmount === ''}
        >
          Add XP
        </button>
      </div>
    </section>
  );
}
