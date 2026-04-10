import { useState } from 'react';
import type { CharacterSelectionProps } from '../types';
import { getClassIcon } from '../utils/classAssets';

export default function CharacterSelection({
  characters,
  onSelect,
  serverAddress,
  onServerAddressChange,
}: CharacterSelectionProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="character-selection">
      <style>{`
        .character-selection {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .character-selection__title {
          text-align: center;
          font-family: var(--font-fantasy);
          font-size: 1.6rem;
          font-weight: 400;
          color: var(--color-text-bright);
          letter-spacing: 0.06em;
          text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255,255,255,0.08);
          margin-bottom: 0;
        }

        .character-selection__subtitle {
          text-align: center;
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.25rem;
        }

        .character-selection__list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .character-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 64px;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(120, 180, 210, 0.15);
          border-radius: var(--border-radius);
          background: linear-gradient(135deg, var(--color-panel-light) 0%, var(--color-panel) 100%);
          color: var(--color-text);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          text-align: left;
          text-transform: none;
          letter-spacing: 0;
        }

        .character-button:hover {
          border-color: var(--color-frost);
          background: linear-gradient(135deg, #2e4a60 0%, var(--color-panel-light) 100%);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 12px rgba(91, 189, 213, 0.1);
          transform: translateY(-1px);
        }

        .character-button:active {
          transform: translateY(0);
        }

        .character-button__icon {
          width: 36px;
          height: 36px;
          object-fit: contain;
          opacity: 1;
          filter: brightness(2.5) contrast(0.9);
          flex-shrink: 0;
        }

        .character-button__info {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          flex: 1;
        }

        .character-button__name {
          font-family: var(--font-fantasy);
          font-size: 1.1rem;
          font-weight: 400;
          color: var(--color-text-bright);
          text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
        }

        .character-button__class {
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .character-button__level {
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(91, 189, 213, 0.15);
          border: 1px solid rgba(91, 189, 213, 0.25);
          color: var(--color-frost);
          padding: 0.25rem 0.6rem;
          border-radius: var(--border-radius-sm);
          white-space: nowrap;
        }

        .character-selection__waiting {
          text-align: center;
          padding: 2rem 1rem;
        }

        .character-selection__waiting p {
          font-family: var(--font-condensed);
          font-size: 1rem;
          color: var(--color-text-muted);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .settings-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          min-height: 36px;
          padding: 0.4rem;
          background: transparent;
          border: none;
          box-shadow: none;
          color: var(--color-text-muted);
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .settings-toggle:hover {
          background: transparent;
          box-shadow: none;
          color: var(--color-frost);
          transform: none;
        }

        .settings-toggle__arrow {
          transition: transform var(--transition);
          font-size: 0.65rem;
        }

        .settings-toggle__arrow--open {
          transform: rotate(180deg);
        }

        .settings-section {
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease;
          max-height: 0;
          opacity: 0;
        }

        .settings-section--open {
          max-height: 200px;
          opacity: 1;
        }

        .settings-section__content {
          padding: 0.5rem 0;
        }

        .settings-section__label {
          display: block;
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }
      `}</style>

      <div className="card">
        <h1 className="character-selection__title">X-Haven Assistant</h1>
        <p className="character-selection__subtitle">Select your character</p>

        {characters.length > 0 ? (
          <div className="character-selection__list">
            {characters.map((character) => (
              <button
                key={character.id}
                className="character-button"
                onClick={() => onSelect(character.id)}
              >
                <img
                  className="character-button__icon"
                  src={getClassIcon(character.className)}
                  alt=""
                />
                <div className="character-button__info">
                  <span className="character-button__name">{character.name}</span>
                  <span className="character-button__class">{character.className}</span>
                </div>
                <span className="character-button__level">Lv {character.level}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="character-selection__waiting">
            <p>Waiting for game data...</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <button
          className="settings-toggle"
          onClick={() => setShowSettings((prev) => !prev)}
          type="button"
        >
          Server Settings
          <span
            className={`settings-toggle__arrow${showSettings ? ' settings-toggle__arrow--open' : ''}`}
          >
            &#9660;
          </span>
        </button>

        <div className={`settings-section${showSettings ? ' settings-section--open' : ''}`}>
          <div className="settings-section__content">
            <label className="settings-section__label" htmlFor="server-address">
              Server Address
            </label>
            <input
              id="server-address"
              type="text"
              value={serverAddress}
              onChange={(e) => onServerAddressChange(e.target.value)}
              placeholder="localhost:4568"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
