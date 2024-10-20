import React, { useEffect, useState } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

interface Player {
  id: number;
  name: string;
  points: number;
}

const PlayerRanking: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  // Charger le classement des joueurs
  const fetchPlayerRanking = async () => {
    try {
      const response = await fetch(`${backendUrl}/clash/players/ranking`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      } else {
        console.error('Unexpected data format:', data);
        setPlayers([]); // Renvoyer un tableau vide en cas de problème
      }
    } catch (error) {
      console.error('Error fetching player ranking:', error);
      setPlayers([]); // Renvoyer un tableau vide en cas d'erreur
    }
  };

  useEffect(() => {
    fetchPlayerRanking();
  }, []);

  return (
    <div className="w-full ml-2 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Player Rankings</h2>
      <ul className="divide-y divide-gray-600">
        {players.map((player) => (
          <li key={player.id} className="py-2 flex justify-between">
            <span>{player.name}</span>
            <span><strong className='text text-green-500 font-bold'>{player.points}</strong> pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerRanking;
