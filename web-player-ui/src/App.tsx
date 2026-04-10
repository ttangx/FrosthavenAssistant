import { useCallback, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useWebSocket } from './hooks/useWebSocket';
import { ServerStateMessage } from './types';
import CharacterSelection from './components/CharacterSelection';
import CharacterSheet from './components/CharacterSheet';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [serverAddress, setServerAddress] = useState('localhost:4568');
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
          <p>Connecting to server at {serverAddress}...</p>
          <label>
            Server address:{' '}
            <input
              type="text"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default App;
