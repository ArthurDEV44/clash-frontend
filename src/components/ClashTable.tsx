import React from 'react';
import { useWebSocketContext } from '../WebSocketContext';

const ClashTable: React.FC = () => {
  const {
    players,
    maps,
    clashFinished,
    calculateTotalScore,
    handleInputChange,
    removePlayerFromClash,
  } = useWebSocketContext();

  return (
    <div className="overflow-x-auto rounded-3xl">
      <table className="min-w-full table-auto bg-gray-800 rounded-lg shadow-lg text-gray-200">
        <thead className="bg-gray-700 text-purple-500">
          <tr>
            <th className="px-4 py-2">Players</th>
            {maps.map(mapIndex => [
              <th key={`kills-header-${mapIndex}`} className="px-4 py-2">{`Kills Map ${mapIndex}`}</th>,
              <th key={`rank-header-${mapIndex}`} className="px-4 py-2">{`Rank Map ${mapIndex}`}</th>
            ])}
            <th className="px-4 py-2">Scores</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id} className="hover:bg-gray-700 transition-all duration-200">
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={player.name || ''}
                  onChange={e => handleInputChange(e, player.id, 'name')}
                  className="w-full p-2 bg-gray-900 border-none text-purple-500 font-bold rounded-lg"
                  disabled={clashFinished}
                />
              </td>
              {maps.map(mapIndex => [
                <td key={`kills-${player.id}-${mapIndex}`} className="px-4 py-2">
                  <input
                    type="number"
                    value={player[`kills_map${mapIndex}`] || 0}
                    onChange={e => handleInputChange(e, player.id, `kills_map${mapIndex}`)}
                    className="w-full p-2 bg-gray-900 border-none text-white rounded-lg"
                    disabled={clashFinished}
                  />
                </td>,
                <td key={`rank-${player.id}-${mapIndex}`} className="px-4 py-2">
                  <input
                    type="number"
                    value={player[`rank_map${mapIndex}`] || 0}
                    onChange={e => handleInputChange(e, player.id, `rank_map${mapIndex}`)}
                    className="w-full p-2 bg-gray-900 border-none text-white rounded-lg"
                    disabled={clashFinished}
                  />
                </td>
              ])}
              <td className="px-4 py-2 text text-center text-green-500">{calculateTotalScore(player)}</td>
              <td className="px-4 py-2 text text-center">
                <button
                  onClick={() => removePlayerFromClash(player.id)}
                  className="py-1 px-2 font-bold bg-gray-600 rounded-lg text-white hover:bg-red-800 transition-all duration-300"
                >
                  Retirer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClashTable;
