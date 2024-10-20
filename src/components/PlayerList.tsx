import React, { useState } from 'react';
import { useWebSocketContext } from '../WebSocketContext';

const PlayerList: React.FC = () => {
  const {
    playerList,
    clashStarted,
    addPlayerToList,
    addPlayerToClash,
    removePlayerFromList,
  } = useWebSocketContext();

  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = () => {
    addPlayerToList(newPlayerName);
    setNewPlayerName('');
  };

  return (
    <div className="w-full mt-8 mr-2">
      <h2 className="text-2xl text-white mb-4">Liste des joueurs disponibles</h2>
      <ul className="space-y-4">
        {playerList.map(player => (
          <li key={player.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-lg text-white">
            <span>{player.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => addPlayerToClash(player)}
                className="button-gradient text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300"
                disabled={clashStarted}
              >
                Ajouter au clash
              </button>
              <button
                onClick={() => removePlayerFromList(player.id)}
                className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 shadow-lg transition-all duration-300"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Formulaire pour ajouter un joueur à la liste */}
      <div className="mt-4">
        <input
          type="text"
          value={newPlayerName}
          onChange={e => setNewPlayerName(e.target.value)}
          placeholder="Nom du joueur"
          className="p-2 rounded-lg bg-gray-900 text-white border-none w-full mb-4"
          disabled={clashStarted}
        />
        <button
          onClick={handleAddPlayer}
          className="button-gradient text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 shadow-lg transition-all duration-300"
          disabled={clashStarted}
        >
          Ajouter un joueur
        </button>
      </div>
    </div>
  );
};

export default PlayerList;
