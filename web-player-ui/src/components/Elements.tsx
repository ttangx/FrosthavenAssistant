import type { ElementStates, ElementStateValue } from '../types';

interface ElementsProps {
  elementState: ElementStates;
  send: (message: any) => void;
  isConnected: boolean;
}

const ELEMENTS = [
  { index: 0, name: 'fire', icon: '/icons/element-fire.png' },
  { index: 1, name: 'ice', icon: '/icons/element-ice.png' },
  { index: 2, name: 'air', icon: '/icons/element-air.png' },
  { index: 3, name: 'earth', icon: '/icons/element-earth.png' },
  { index: 4, name: 'light', icon: '/icons/element-light.png' },
  { index: 5, name: 'dark', icon: '/icons/element-dark.png' },
];

// Cycle: inert(2) -> full(0) -> half(1) -> inert(2)
function nextState(current: ElementStateValue): ElementStateValue {
  if (current === 2) return 0; // inert -> full
  if (current === 0) return 1; // full -> half
  return 2; // half -> inert
}

export default function Elements({
  elementState,
  send,
  isConnected,
}: ElementsProps) {
  const handleClick = (index: number) => {
    const current = (elementState[String(index)] ?? 2) as ElementStateValue;
    const next = nextState(current);
    send({ action: 'setElement', element: index, state: next });
  };

  return (
    <div className="elements-bar">
      <style>{`
        .elements-bar {
          display: flex;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.3rem 0;
          margin-bottom: 0.4rem;
        }

        .element-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          min-height: 40px;
          min-width: 40px;
          padding: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          background: var(--color-panel-dark);
          box-shadow: var(--shadow-inset);
          cursor: pointer;
          transition: all var(--transition);
        }

        .element-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .element-btn__icon {
          width: 24px;
          height: 24px;
          object-fit: contain;
          transition: all var(--transition);
        }

        /* Inert: dim */
        .element-btn--inert {
          opacity: 0.35;
        }
        .element-btn--inert .element-btn__icon {
          filter: brightness(1.5) saturate(0);
        }

        /* Full: bright with colored glow */
        .element-btn--full {
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 10px rgba(255, 200, 100, 0.4), inset 0 0 8px rgba(255, 200, 100, 0.15);
        }
        .element-btn--full .element-btn__icon {
          filter: brightness(2.5);
        }

        /* Half/waning: medium brightness */
        .element-btn--half {
          border-color: rgba(255, 255, 255, 0.15);
          opacity: 0.7;
        }
        .element-btn--half .element-btn__icon {
          filter: brightness(1.8) saturate(0.6);
        }
      `}</style>

      {ELEMENTS.map((el) => {
        const state = (elementState[String(el.index)] ?? 2) as ElementStateValue;
        const stateName = state === 0 ? 'full' : state === 1 ? 'half' : 'inert';
        return (
          <button
            key={el.index}
            className={`element-btn element-btn--${stateName}`}
            onClick={() => handleClick(el.index)}
            disabled={!isConnected}
            title={`${el.name} (${stateName})`}
            aria-label={`${el.name}: ${stateName}`}
          >
            <img className="element-btn__icon" src={el.icon} alt={el.name} />
          </button>
        );
      })}
    </div>
  );
}
