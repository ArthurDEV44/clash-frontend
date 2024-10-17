import React from 'react';
import { useWebSocketContext } from '../WebSocketContext';

const ClashControls: React.FC = () => {
  const { clashStarted, startClash } = useWebSocketContext();

  return (
    <div className="mb-4">
      <button
        onClick={startClash}
        className={`py-2 px-4 font-bold rounded-lg shadow-lg ${clashStarted ? 'bg-gray-600' : 'bg-yellow-300'} text-black hover:bg-opacity-80 transition-all duration-300`}
        disabled={clashStarted}
      >
        {clashStarted ? 'En cours...' : 'Start Clash'}
      </button>
    </div>
  );
};

export default ClashControls;
