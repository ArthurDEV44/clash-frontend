import React from 'react';
import { useWebSocketContext } from '../WebSocketContext';

const WinnerModal: React.FC = () => {
  const {
    showModal,
    winner,
    players,
    calculateTotalScore,
    closeModal,
  } = useWebSocketContext();

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Clash terminé !</h2>
        <p className="mb-4 text-xl">Le vainqueur est : <strong className='text text-green-500'>{winner?.name}</strong></p>
        <h3 className="text-lg font-semibold mb-2">Classement des joueurs :</h3>
        <ul>
          {players
            .slice()
            .sort((a, b) => parseFloat(calculateTotalScore(b)) - parseFloat(calculateTotalScore(a)))
            .map((player, index) => (
              <li key={player.id} className="mb-2">
                {index + 1}. {player.name} - Score : {calculateTotalScore(player)}
              </li>
            ))}
        </ul>
        <button
          onClick={closeModal}
          className="w-full mt-4 button-gradient text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-all duration-300"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default WinnerModal;
