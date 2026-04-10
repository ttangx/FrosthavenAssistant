import { Character } from '../types';

interface CharacterSelectionProps {
  characters: Character[];
  onSelect: (characterId: string) => void;
  serverAddress: string;
  onServerAddressChange: (address: string) => void;
}

export default function CharacterSelection({
  characters,
  onSelect,
  serverAddress,
  onServerAddressChange,
}: CharacterSelectionProps) {
  return (
    <div className="card">
      <h2>Select Character</h2>
      <p>Placeholder - character selection UI coming in Phase 3</p>
      {characters.map((c) => (
        <button key={c.id} onClick={() => onSelect(c.id)} style={{ margin: '0.5rem' }}>
          {c.name} ({c.className})
        </button>
      ))}
    </div>
  );
}
