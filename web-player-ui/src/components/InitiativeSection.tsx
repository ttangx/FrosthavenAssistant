import { useEffect, useRef, useState } from 'react';
import type { Character, GameState } from '../types';

interface InitiativeSectionProps {
  character: Character;
  gameState: GameState;
  onInitiativeSet: (value: number) => void;
  isConnected: boolean;
}

export default function InitiativeSection({
  character,
  gameState,
  onInitiativeSet,
  isConnected,
}: InitiativeSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // roundState 0 = pre-draw (players inputting initiative), 1+ = cards drawn (turn order visible)
  const roundStarted = gameState.roundState > 0;
  // Server sends 0 for "not set" — valid Gloomhaven initiatives are 1-99
  const hasInitiative = character.initiative !== null && character.initiative !== 0;

  // Check if this player is the last one who hasn't set initiative
  const othersWithInitiative = gameState.characters.filter(
    (c) => c.id !== character.id && c.initiative !== null && c.initiative !== 0
  );
  const isLastToEnter = !hasInitiative && othersWithInitiative.length === gameState.characters.length - 1 && gameState.characters.length > 1;

  // Sort characters by initiative (ascending - lower goes first in Gloomhaven)
  const sortedCharacters = [...gameState.characters]
    .filter((c) => c.initiative !== null)
    .sort((a, b) => (a.initiative ?? 99) - (b.initiative ?? 99));

  const myPosition =
    sortedCharacters.findIndex((c) => c.id === character.id) + 1;
  const isMyTurn =
    gameState.currentTurn !== null &&
    sortedCharacters[gameState.currentTurn]?.id === character.id;

  // Auto-focus the input when in pre-round mode
  useEffect(() => {
    if (!roundStarted && !hasInitiative && inputRef.current) {
      inputRef.current.focus();
    }
  }, [roundStarted, hasInitiative]);

  // Send repeating browser notification when player is last to enter initiative
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isLastToEnter && Notification.permission === 'granted') {
      // Fire immediately
      new Notification('Frosthaven', { body: 'Waiting on your initiative!' });
      // Then every 30 seconds
      intervalRef.current = setInterval(() => {
        new Notification('Frosthaven', { body: 'Still waiting on your initiative!' });
      }, 30000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLastToEnter]);

  const handleSubmit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) {
      onInitiativeSet(parsed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <section className="initiative-section card" aria-label="Initiative">
      <style>{`
        .initiative-section__heading {
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-ice-light);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.5rem;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .initiative-input-group {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }

        .initiative-input-group input[type='number'] {
          flex: 1;
          font-family: var(--font-condensed);
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          min-height: 42px;
          -moz-appearance: textfield;
        }

        .initiative-input-group input[type='number']::-webkit-outer-spin-button,
        .initiative-input-group input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .initiative-input-group button {
          min-width: 80px;
          font-size: 0.85rem;
          min-height: 42px;
        }

        .initiative-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }

        .initiative-badge__value {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #5cc8e0 0%, var(--color-ice-dark) 60%, #1a5a72 100%);
          border: 2px solid rgba(91, 189, 213, 0.5);
          color: var(--color-text-bright);
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 900;
          text-shadow: 0 2px 4px rgba(0,0,0,0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0,0,0,0.2);
        }

        .initiative-badge__label {
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          color: var(--color-text);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .turn-order {
          margin-top: 0.75rem;
        }

        .turn-order__heading {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }

        .turn-order__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .turn-order__item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--border-radius-sm);
          font-family: var(--font-condensed);
          font-size: 0.9rem;
          background: var(--color-panel-dark);
          border: 1px solid transparent;
          color: var(--color-text);
          transition: all var(--transition);
        }

        .turn-order__item--active {
          background: linear-gradient(135deg, var(--color-ice-dark), #1a6080);
          color: var(--color-text-bright);
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .turn-order__item--self {
          border: 1px solid var(--color-frost);
        }

        .turn-order__position {
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }

        .turn-order__name {
          flex: 1;
        }

        .turn-order__initiative {
          font-weight: 700;
          opacity: 0.8;
        }

        .turn-indicator {
          text-align: center;
          padding: 0.5rem;
          border-radius: var(--border-radius-sm);
          font-weight: 700;
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }

        .turn-indicator--your-turn {
          background: linear-gradient(135deg, var(--color-healing), #1e8449);
          color: var(--color-snow);
          animation: pulse 2s ease-in-out infinite;
        }

        .turn-indicator--waiting {
          background: rgba(91, 189, 213, 0.1);
          color: var(--color-text-muted);
          border: 1px solid var(--color-panel-border);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }

        .initiative-nudge {
          text-align: center;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
          border-radius: var(--border-radius-sm);
          background: rgba(212, 169, 64, 0.15);
          border: 1px solid rgba(212, 169, 64, 0.3);
          color: var(--color-xp);
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <h3 className="initiative-section__heading">Initiative</h3>

      {!roundStarted && isLastToEnter && (
        <div className="initiative-nudge">Waiting on you!</div>
      )}

      {/* Pre-round: input mode */}
      {!roundStarted && !hasInitiative && (
        <div className="initiative-input-group">
          <input
            ref={inputRef}
            type="number"
            min={0}
            max={99}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="00"
            disabled={!isConnected}
            aria-label="Initiative value"
          />
          <button
            onClick={handleSubmit}
            disabled={!isConnected || inputValue === ''}
          >
            Set Initiative
          </button>
        </div>
      )}

      {/* Pre-round: already set, can update */}
      {!roundStarted && hasInitiative && (
        <>
          <div className="initiative-badge">
            <div>
              <div className="initiative-badge__value">
                {character.initiative}
              </div>
              <div className="initiative-badge__label">Your Initiative</div>
            </div>
          </div>
          <div className="initiative-input-group">
            <input
              type="number"
              min={0}
              max={99}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="New value"
              disabled={!isConnected}
              aria-label="Update initiative value"
            />
            <button
              onClick={handleSubmit}
              disabled={!isConnected || inputValue === ''}
            >
              Update
            </button>
          </div>
        </>
      )}

      {/* Post-round: read-only badge + turn order */}
      {roundStarted && (
        <>
          {hasInitiative && (
            <div className="initiative-badge">
              <div>
                <div className="initiative-badge__value">
                  {character.initiative}
                </div>
                <div className="initiative-badge__label">Initiative</div>
              </div>
            </div>
          )}

          {sortedCharacters.length > 0 && (
            <div className="turn-order">
              <h4 className="turn-order__heading">Turn Order</h4>
              <ul className="turn-order__list">
                {sortedCharacters.map((c, index) => {
                  const isActive = gameState.currentTurn === index;
                  const isSelf = c.id === character.id;
                  const classNames = [
                    'turn-order__item',
                    isActive ? 'turn-order__item--active' : '',
                    isSelf ? 'turn-order__item--self' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <li key={c.id} className={classNames}>
                      <span className="turn-order__position">{index + 1}</span>
                      <span className="turn-order__name">{c.name}</span>
                      <span className="turn-order__initiative">
                        {c.initiative}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {isMyTurn ? (
                <div className="turn-indicator turn-indicator--your-turn">
                  Your turn now!
                </div>
              ) : myPosition > 0 ? (
                <div className="turn-indicator turn-indicator--waiting">
                  You&apos;re #{myPosition} in initiative order
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}
