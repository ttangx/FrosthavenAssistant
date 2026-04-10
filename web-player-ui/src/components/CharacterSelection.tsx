import { useState } from 'react';
import type { CharacterSelectionProps } from '../types';

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
          gap: 1rem;
        }

        .character-selection__title {
          text-align: center;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-frost);
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .character-selection__subtitle {
          text-align: center;
          font-size: 0.95rem;
          color: var(--color-gray-dark);
          opacity: 0.7;
          margin-bottom: 0.5rem;
        }

        .character-selection__list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .character-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 72px;
          padding: 1rem 1.25rem;
          border: 2px solid transparent;
          border-radius: var(--border-radius);
          background: linear-gradient(135deg, var(--color-ice-medium), var(--color-ice-dark));
          color: var(--color-snow);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition);
          box-shadow: var(--shadow-button);
          text-align: left;
        }

        .character-button:hover {
          border-color: var(--color-frost);
          background: linear-gradient(135deg, var(--color-ice-dark), var(--color-frost));
          box-shadow: 0 4px 16px rgba(44, 138, 168, 0.32);
          transform: translateY(-2px);
        }

        .character-button:active {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(44, 138, 168, 0.18);
        }

        .character-button__info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .character-button__name {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .character-button__class {
          font-size: 0.85rem;
          opacity: 0.85;
          font-weight: 400;
        }

        .character-button__level {
          font-size: 0.85rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          white-space: nowrap;
        }

        .character-selection__waiting {
          text-align: center;
          padding: 2rem 1rem;
        }

        .character-selection__waiting p {
          font-size: 1.1rem;
          color: var(--color-gray-dark);
          margin-bottom: 1rem;
        }

        .settings-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          min-height: 44px;
          padding: 0.5rem;
          background: transparent;
          color: var(--color-frost);
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          box-shadow: none;
          cursor: pointer;
        }

        .settings-toggle:hover {
          background: transparent;
          box-shadow: none;
          opacity: 0.8;
          transform: none;
        }

        .settings-toggle__arrow {
          transition: transform var(--transition);
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
          padding: 0.75rem 0;
        }

        .settings-section__label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-gray-dark);
          margin-bottom: 0.35rem;
        }
      `}</style>

      <div className="card">
        <h1 className="character-selection__title">Frosthaven Player UI</h1>
        <p className="character-selection__subtitle">Select your character</p>

        {characters.length > 0 ? (
          <div className="character-selection__list">
            {characters.map((character) => (
              <button
                key={character.id}
                className="character-button"
                onClick={() => onSelect(character.id)}
              >
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
