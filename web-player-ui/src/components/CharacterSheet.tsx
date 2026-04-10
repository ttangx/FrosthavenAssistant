import { useState } from 'react';
import type { CharacterSheetProps } from '../types';
import { getClassIcon, getClassPortrait } from '../utils/classAssets';
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
          position: relative;
        }

        .character-sheet__bg-art {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          max-width: 550px;
          height: auto;
          opacity: 0.14;
          pointer-events: none;
          z-index: -1;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          filter: saturate(0.2);
        }

        .character-header-card {
          padding: 0 !important;
          overflow: hidden;
        }

        .character-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          min-height: 80px;
        }

        .character-header__portrait-bg {
          position: absolute;
          right: -30px;
          top: 50%;
          transform: translateY(-50%);
          width: 180px;
          height: 180px;
          object-fit: cover;
          object-position: top center;
          opacity: 0.12;
          pointer-events: none;
          mask-image: radial-gradient(ellipse at center, black 20%, transparent 65%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 65%);
        }

        .character-header__class-icon {
          width: 44px;
          height: 44px;
          object-fit: contain;
          opacity: 1;
          filter: brightness(2.5) contrast(0.9) drop-shadow(0 2px 4px rgba(0,0,0,0.4));
          flex-shrink: 0;
        }

        .character-header__info {
          display: flex;
          flex-direction: column;
          flex: 1;
          position: relative;
        }

        .character-header__name {
          font-family: var(--font-fantasy);
          font-size: 1.5rem;
          font-weight: 400;
          color: var(--color-text-bright);
          letter-spacing: 0.04em;
          text-shadow: 2px 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08);
        }

        .character-header__class {
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          color: var(--color-frost);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .character-header__level {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          min-width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(180deg, var(--color-ice-medium) 0%, var(--color-ice-dark) 100%);
          border: 2px solid rgba(91, 189, 213, 0.5);
          color: var(--color-text-bright);
          font-family: var(--font-condensed);
          font-size: 1.15rem;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
        }

        /* Decorative bottom accent bar */
        .character-header__accent {
          height: 2px;
          background: linear-gradient(90deg, transparent 5%, var(--color-gold-dim) 30%, var(--color-gold) 50%, var(--color-gold-dim) 70%, transparent 95%);
          opacity: 0.6;
        }

        .scenario-toggle {
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
          margin-top: 0.25rem;
        }

        .scenario-toggle:hover {
          background: transparent;
          box-shadow: none;
          color: var(--color-frost);
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
          background: var(--color-panel-dark);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--color-panel-border);
        }

        .scenario-info__title {
          font-family: var(--font-condensed);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-frost);
          text-transform: uppercase;
          letter-spacing: 0.04em;
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
          color: var(--color-text-muted);
          font-family: var(--font-condensed);
        }

        .scenario-info__value {
          font-weight: 700;
          color: var(--color-text);
          font-family: var(--font-condensed);
        }
      `}</style>

      {/* Character Header */}
      <div className="card character-header-card">
        <div className="character-header">
          <img
            className="character-header__portrait-bg"
            src={getClassPortrait(character.className)}
            alt=""
          />
          <img
            className="character-header__class-icon"
            src={getClassIcon(character.className)}
            alt=""
          />
          <div className="character-header__info">
            <span className="character-header__name">{character.name}</span>
            <span className="character-header__class">{character.className}</span>
          </div>
          <span className="character-header__level" title={`Level ${character.level}`}>
            {character.level}
          </span>
        </div>
        <div className="character-header__accent" />
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
