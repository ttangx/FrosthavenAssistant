import { useState } from 'react';

interface DrawModifierProps {
  characterId: string;
  send: (message: any) => void;
  isConnected: boolean;
}

/** Map card gfx to display text */
function cardDisplay(gfx: string): string {
  if (gfx === 'nullAttack' || gfx === 'null') return 'MISS';
  if (gfx === 'doubleAttack' || gfx === 'double') return 'x2';
  if (gfx === 'curse') return 'CURSE';
  if (gfx === 'bless') return 'BLESS';

  const plus = gfx.match(/plus(\d+)/);
  if (plus) return `+${plus[1]}`;

  const minus = gfx.match(/minus(\d+)/);
  if (minus) return `-${minus[1]}`;

  return gfx;
}

function cardColor(gfx: string): string {
  if (gfx === 'nullAttack' || gfx === 'null' || gfx === 'curse') return 'var(--color-damage)';
  if (gfx === 'doubleAttack' || gfx === 'double' || gfx === 'bless') return 'var(--color-xp)';
  if (gfx.includes('plus')) return 'var(--color-damage)';
  if (gfx.includes('minus')) return 'var(--color-healing)';
  return 'var(--color-text)';
}

export default function DrawModifier({
  characterId,
  send,
  isConnected,
}: DrawModifierProps) {
  const [baseAttack, setBaseAttack] = useState('');
  const [lastDraw, setLastDraw] = useState<{ card: string; damage: number } | null>(null);

  const handleDraw = () => {
    const base = parseInt(baseAttack, 10);
    if (isNaN(base) || base < 0) return;

    send({
      action: 'drawModifier',
      characterId,
      baseAttack: base,
    });

    // We can't get the drawn card back from the server directly via WebSocket response.
    // The state update will reflect the health change. Show the base attack for now.
    // TODO: The server could echo back the drawn card info
    setLastDraw(null);
  };

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

        .draw-modifier__row {
          display: flex;
          gap: 0.35rem;
          align-items: stretch;
        }

        .draw-modifier__row input[type='number'] {
          flex: 1;
          text-align: center;
          font-family: var(--font-condensed);
          font-size: 1.2rem;
          font-weight: 700;
          -moz-appearance: textfield;
        }

        .draw-modifier__row input[type='number']::-webkit-outer-spin-button,
        .draw-modifier__row input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .draw-modifier__btn {
          min-width: 140px;
          font-size: 0.85rem;
          background: linear-gradient(180deg, var(--color-damage) 0%, var(--color-damage-dark) 100%);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .draw-modifier__btn:hover {
          background: linear-gradient(180deg, #e05050 0%, var(--color-damage) 100%);
        }

        .draw-modifier__label {
          font-family: var(--font-condensed);
          font-size: 0.7rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-align: center;
          margin-top: 0.3rem;
        }
      `}</style>

      <h3 className="draw-modifier__heading">Draw Against Me</h3>

      <div className="draw-modifier__row">
        <div style={{ flex: 1 }}>
          <input
            type="number"
            min={0}
            value={baseAttack}
            onChange={(e) => setBaseAttack(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDraw()}
            placeholder="0"
            disabled={!isConnected}
            aria-label="Base attack value"
          />
          <div className="draw-modifier__label">Base Attack</div>
        </div>
        <button
          className="draw-modifier__btn"
          onClick={handleDraw}
          disabled={!isConnected || baseAttack === ''}
        >
          Draw
        </button>
      </div>
    </section>
  );
}
