import React from 'react';
import { useWebSocketContext } from '../WebSocketContext';

const MapControls: React.FC = () => {
  const { maps, addMap, removeMap, clashStarted } = useWebSocketContext();

  return (
    <div className="mb-4 flex space-x-2">
      <button
        onClick={addMap}
        className="py-2 px-4 font-bold button-gradient rounded-lg text-white hover:bg-green-800 transition-all duration-300"
        disabled={clashStarted}
      >
        Ajouter une map
      </button>
      <button
        onClick={removeMap}
        className="py-2 px-4 font-bold bg-gray-600 rounded-lg text-white hover:bg-gray-800 transition-all duration-300 cursor-pointer"
        disabled={clashStarted || maps.length === 1}
      >
        Retirer une map
      </button>
    </div>
  );
};

export default MapControls;
