import { useState } from 'react';
import type { CharacterSheetProps } from '../types';
import InitiativeSection from './InitiativeSection';
import HealthSection from './HealthSection';
import XPSection from './XPSection';
import StatusEffects from './StatusEffects';

export default function CharacterSheet({
  character,
  gameState,
  onHealthChange,
  onInitiativeSet,
  onAddXP,
  onToggleCondition,
  isConnected,
}: CharacterSheetProps) {
  const [showScenarioInfo, setShowScenarioInfo] = useState(false);

  return (
    <div className="character-sheet">
      <style>{`
        .character-sheet {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .character-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .character-header__info {
          display: flex;
          flex-direction: column;
        }

        .character-header__name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-frost);
          letter-spacing: -0.02em;
        }

        .character-header__class {
          font-size: 0.9rem;
          color: var(--color-gray-dark);
          opacity: 0.7;
        }

        .character-header__level {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-ice-dark), var(--color-frost));
          color: var(--color-snow);
          font-size: 1rem;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(44, 138, 168, 0.25);
        }

        .scenario-toggle {
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
          margin-top: 0.25rem;
        }

        .scenario-toggle:hover {
          background: transparent;
          box-shadow: none;
          opacity: 0.8;
          transform: none;
        }

        .scenario-toggle__arrow {
          transition: transform var(--transition);
          font-size: 0.7rem;
        }

        .scenario-toggle__arrow--open {
          transform: rotate(180deg);
        }

        .scenario-info {
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease;
          max-height: 0;
          opacity: 0;
        }

        .scenario-info--open {
          max-height: 400px;
          opacity: 1;
        }

        .scenario-info__content {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: var(--border-radius-sm);
        }

        .scenario-info__title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-frost);
          margin-bottom: 0.5rem;
        }

        .scenario-info__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.35rem 1rem;
        }

        .scenario-info__item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          padding: 0.2rem 0;
        }

        .scenario-info__label {
          color: var(--color-gray-dark);
          opacity: 0.7;
        }

        .scenario-info__value {
          font-weight: 700;
          color: var(--color-gray-dark);
        }
      `}</style>

      {/* Character Header */}
      <div className="card">
        <div className="character-header">
          <div className="character-header__info">
            <span className="character-header__name">{character.name}</span>
            <span className="character-header__class">{character.className}</span>
          </div>
          <span className="character-header__level" title={`Level ${character.level}`}>
            {character.level}
          </span>
        </div>
      </div>

      {/* Initiative */}
      <InitiativeSection
        character={character}
        gameState={gameState}
        onInitiativeSet={onInitiativeSet}
        isConnected={isConnected}
      />

      {/* Health */}
      <HealthSection
        character={character}
        onHealthChange={onHealthChange}
        isConnected={isConnected}
      />

      {/* XP */}
      <XPSection
        character={character}
        onAddXP={onAddXP}
        isConnected={isConnected}
      />

      {/* Status Effects */}
      <StatusEffects
        character={character}
        onToggleCondition={onToggleCondition}
        isConnected={isConnected}
      />

      {/* Scenario Info (collapsible) */}
      <div className="card">
        <button
          className="scenario-toggle"
          onClick={() => setShowScenarioInfo((prev) => !prev)}
          type="button"
        >
          Scenario Info
          <span
            className={`scenario-toggle__arrow${showScenarioInfo ? ' scenario-toggle__arrow--open' : ''}`}
          >
            &#9660;
          </span>
        </button>

        <div className={`scenario-info${showScenarioInfo ? ' scenario-info--open' : ''}`}>
          <div className="scenario-info__content">
            <div className="scenario-info__title">
              {gameState.scenarioName || 'Unknown Scenario'}
            </div>
            <div className="scenario-info__grid">
              <div className="scenario-info__item">
                <span className="scenario-info__label">Level</span>
                <span className="scenario-info__value">{gameState.scenarioLevel}</span>
              </div>
              <div className="scenario-info__item">
                <span className="scenario-info__label">Round</span>
                <span className="scenario-info__value">{gameState.round}</span>
              </div>
              <div className="scenario-info__item">
                <span className="scenario-info__label">Trap Damage</span>
                <span className="scenario-info__value">{gameState.trapDamage}</span>
              </div>
              <div className="scenario-info__item">
                <span className="scenario-info__label">Hazard Damage</span>
                <span className="scenario-info__value">{gameState.hazardDamage}</span>
              </div>
              <div className="scenario-info__item">
                <span className="scenario-info__label">Coin Value</span>
                <span className="scenario-info__value">{gameState.coinMultiplier}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
