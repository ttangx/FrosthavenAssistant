import { useCallback, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useWebSocket } from './hooks/useWebSocket';
import { ServerStateMessage } from './types';
import { getClassPortrait } from './utils/classAssets';
import CharacterSelection from './components/CharacterSelection';
import CharacterSheet from './components/CharacterSheet';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Default to same origin (when served by Dart server) or fallback to known server
  const [serverAddress, setServerAddress] = useState(
    () => window.location.port === '5173'
      ? '3.228.107.88'       // Vite dev server — use IP until DNS propagates
      : window.location.host  // Served by Dart server on same port
  );
  const [error, setError] = useState<string | null>(null);

  const {
    gameState,
    selectedCharacterId,
    updateFromServer,
    selectCharacter,
    getSelectedCharacter,
    optimisticHealthChange,
    optimisticInitiativeSet,
    optimisticAddXP,
    optimisticToggleCondition,
  } = useGameState();

  const handleStateUpdate = useCallback(
    (message: ServerStateMessage) => {
      updateFromServer(message.gameState, message.index);
    },
    [updateFromServer],
  );

  const handleMismatch = useCallback((message: string) => {
    console.warn('State mismatch from server:', message);
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  const { isConnected, send } = useWebSocket({
    url: serverAddress,
    onStateUpdate: handleStateUpdate,
    onMismatch: handleMismatch,
    onError: handleError,
  });

  const selectedCharacter = getSelectedCharacter();

  const handleHealthChange = useCallback(
    (delta: number) => {
      if (!selectedCharacterId) return;
      optimisticHealthChange(selectedCharacterId, delta);
      send({ action: 'healthChange', characterId: selectedCharacterId, delta });
    },
    [selectedCharacterId, optimisticHealthChange, send],
  );

  const handleInitiativeSet = useCallback(
    (value: number) => {
      if (!selectedCharacterId) return;
      optimisticInitiativeSet(selectedCharacterId, value);
      send({
        action: 'setInitiative',
        characterId: selectedCharacterId,
        value,
      });
    },
    [selectedCharacterId, optimisticInitiativeSet, send],
  );

  const handleAddXP = useCallback(
    (amount: number) => {
      if (!selectedCharacterId) return;
      optimisticAddXP(selectedCharacterId, amount);
      send({ action: 'addXP', characterId: selectedCharacterId, amount });
    },
    [selectedCharacterId, optimisticAddXP, send],
  );

  const handleToggleCondition = useCallback(
    (condition: string) => {
      if (!selectedCharacterId) return;
      optimisticToggleCondition(selectedCharacterId, condition);
      send({
        action: 'toggleCondition',
        characterId: selectedCharacterId,
        condition,
      });
    },
    [selectedCharacterId, optimisticToggleCondition, send],
  );

  return (
    <ErrorBoundary>
      {selectedCharacter && (
        <img
          src={getClassPortrait(selectedCharacter.className)}
          alt=""
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            maxWidth: '550px',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'saturate(0.15)',
            maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 70%)',
          }}
        />
      )}
      <div className="app">
        <ConnectionStatus isConnected={isConnected} error={error} />

        {!selectedCharacter && gameState && (
          <CharacterSelection
            characters={gameState.characters}
            onSelect={selectCharacter}
            serverAddress={serverAddress}
            onServerAddressChange={setServerAddress}
          />
        )}

        {selectedCharacter && gameState && (
          <CharacterSheet
            character={selectedCharacter}
            gameState={gameState}
            onHealthChange={handleHealthChange}
            onInitiativeSet={handleInitiativeSet}
            onAddXP={handleAddXP}
            onToggleCondition={handleToggleCondition}
            isConnected={isConnected}
          />
        )}

        {!gameState && (
          <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
              {isConnected ? 'Waiting for game data...' : 'Connecting to server...'}
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
