// WebSocketContext.tsx
import React, { createContext, useEffect, useRef, useState, useContext } from 'react';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

interface Player {
  id: number;
  name: string;
  [key: string]: any;
}

interface WebSocketContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  playerList: Player[];
  setPlayerList: React.Dispatch<React.SetStateAction<Player[]>>;
  maps: number[];
  clashStarted: boolean;
  clashFinished: boolean;
  winner: Player | null;
  showModal: boolean;
  addMap: () => void;
  removeMap: () => void;
  startClash: () => void;
  removePlayerFromClash: (playerId: number) => void;
  calculateTotalScore: (player: Player) => string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, playerId: number, field: string) => void;
  addPlayerToList: (name: string) => void;
  addPlayerToClash: (player: Player) => void;
  removePlayerFromList: (playerId: number) => void;
  closeModal: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const ignoreNextAddMap = useRef(false);
  const ignoreNextRemoveMap = useRef(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [maps, setMaps] = useState<number[]>([1]);
  const [clashStarted, setClashStarted] = useState(false);
  const [clashFinished, setClashFinished] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch(`${backendUrl}/players`)
      .then(response => response.json())
      .then(data => {
        if (data && data.data) {
          setPlayerList(data.data);
        }
      })
      .catch(error => console.error('Error fetching players:', error));

    // Connexion WebSocket
    ws.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'update_players') {
        setPlayers(message.data);
      } else if (message.type === 'new_player') {
        setPlayerList(prev => [...prev, message.data]);
      } else if (message.type === 'add_map') {
        if (ignoreNextAddMap.current) {
          ignoreNextAddMap.current = false;
        } else {
          setMaps(prevMaps => [...prevMaps, message.newMapIndex]);
          setPlayers(message.updatedPlayers);
        }
      } else if (message.type === 'remove_map') {
        if (ignoreNextRemoveMap.current) {
          ignoreNextRemoveMap.current = false;
        } else {
          setMaps(prevMaps => prevMaps.slice(0, -1));
          setPlayers(message.updatedPlayers);
        }
      } else if (message.type === 'remove_player_from_clash') {
        setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== message.playerId));
      } else if (message.type === 'delete_player_from_list') {
        setPlayerList(prevPlayerList => prevPlayerList.filter(player => player.id !== message.playerId));
      } else if (message.type === 'clash_started') {
        setClashStarted(true);
      } else if (message.type === 'clash_finished') {
        setClashFinished(true);
      } else if (message.type === 'show_modal') {
        setWinner(message.winner);
        setShowModal(true);
      }
    };      

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const sendPlayerUpdate = (updatedPlayers: Player[]) => {
    sendMessage({ type: 'update_players', data: updatedPlayers });
  };

  const addMap = () => {
    const newMapIndex = maps.length + 1;
    setMaps([...maps, newMapIndex]);

    const updatedPlayers = players.map(player => ({
      ...player,
      [`kills_map${newMapIndex}`]: 0,
      [`rank_map${newMapIndex}`]: 0,
    }));

    setPlayers(updatedPlayers);
    sendPlayerUpdate(updatedPlayers);

    ignoreNextAddMap.current = true;

    sendMessage({
      type: 'add_map',
      newMapIndex: newMapIndex,
      updatedPlayers: updatedPlayers,
    });
  };

  const removeMap = () => {
    if (maps.length > 1) {
      const updatedMaps = maps.slice(0, -1);
      setMaps(updatedMaps);

      const updatedPlayers = players.map(player => {
        const updatedPlayer = { ...player };
        delete updatedPlayer[`kills_map${maps.length}`];
        delete updatedPlayer[`rank_map${maps.length}`];
        return updatedPlayer;
      });

      setPlayers(updatedPlayers);
      sendPlayerUpdate(updatedPlayers);

      ignoreNextRemoveMap.current = true;

      sendMessage({
        type: 'remove_map',
        mapIndexToRemove: maps.length,
        updatedPlayers: updatedPlayers,
      });
    }
  };

  const calculateTotalScore = (player: Player): string => {
    let totalScore = 0;
  
    maps.forEach((mapIndex) => {
      const kills = Number(player[`kills_map${mapIndex}`]) || 0;
      const rank = Number(player[`rank_map${mapIndex}`]) || 0;
  
      let multiplier = 1;
      if (rank >= 16 && rank <= 20) {
        multiplier = 1.2;
      } else if (rank >= 11 && rank <= 15) {
        multiplier = 1.5;
      } else if (rank >= 6 && rank <= 10) {
        multiplier = 1.6;
      } else if (rank >= 2 && rank <= 5) {
        multiplier = 1.8;
      } else if (rank === 1) {
        multiplier = 2;
      }
  
      totalScore += kills * multiplier;
    });
  
    return totalScore.toFixed(2);
  };  

  const startClash = () => {
    setClashStarted(true);
    sendMessage({ type: 'clash_started' });
  };

  const determineWinner = () => {
    let highestScore = -Infinity;
    let topPlayer: Player | null = null;
  
    players.forEach(player => {
      const score = parseFloat(calculateTotalScore(player));
      if (score > highestScore) {
        highestScore = score;
        topPlayer = player;
      }
    });
  
    setWinner(topPlayer);
    setShowModal(true);

    sendMessage({
      type: 'show_modal',
      winner: topPlayer,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, playerId: number, field: string) => {
    const { value } = e.target;
    const updatedValue = field === 'name' ? value : Number(value) || 0;

    const updatedPlayers = players.map(player =>
      player.id === playerId
        ? { ...player, [field]: updatedValue }
        : player
    );

    setPlayers(updatedPlayers);
    setTimeout(() => checkClashFinished(updatedPlayers), 0);
    sendPlayerUpdate(updatedPlayers);
  };

  const checkClashFinished = (updatedPlayers: Player[]) => {
    let allFieldsFilled = true;

    updatedPlayers.forEach(player => {
      maps.forEach(mapIndex => {
        const kills = Number(player[`kills_map${mapIndex}`]);
        const rank = Number(player[`rank_map${mapIndex}`]);

        if (isNaN(kills) || isNaN(rank) || kills <= 0 || rank <= 0) {
          allFieldsFilled = false;
        }
      });
    });

    if (allFieldsFilled) {
      determineWinner();
    }
  };

  const removePlayerFromClash = (playerId: number) => {
    const updatedPlayers = players.filter(player => player.id !== playerId);
    setPlayers(updatedPlayers);

    sendMessage({ type: 'remove_player_from_clash', playerId });
  };

  const addPlayerToList = (name: string) => {
    if (name.trim() === '' || clashStarted) return;
  
    const newPlayer: Player = { id: 0, name };
  
    fetch(`${backendUrl}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlayer),
    })
      .then(response => response.json())
      .then(data => {
        if (data && data.id) {
          newPlayer.id = data.id;
          setPlayerList([...playerList, newPlayer]);
  
          sendMessage({ type: 'new_player', data: newPlayer });
        }
      })
      .catch(error => console.error('Error adding player:', error));
  };  

  const addPlayerToClash = (player: Player) => {
    if (clashStarted) return;

    const playerToClash = { ...player };

    maps.forEach(mapIndex => {
      playerToClash[`kills_map${mapIndex}`] = 0;
      playerToClash[`rank_map${mapIndex}`] = 0;
    });

    const updatedPlayers = [...players, playerToClash];
    setPlayers(updatedPlayers);

    sendPlayerUpdate(updatedPlayers);
  };

  const removePlayerFromList = (playerId: number) => {
    fetch(`${backendUrl}/players/${playerId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          setPlayerList(playerList.filter(player => player.id !== playerId));
  
          sendMessage({ type: 'delete_player_from_list', playerId });
        } else {
          console.error('Failed to delete player');
        }
      })
      .catch(error => console.error('Error deleting player:', error));
  };  

  const closeModal = () => {
    setShowModal(false);
    setClashStarted(false);
    setClashFinished(false);

    sendMessage({ type: 'clash_finished' });
  };

  const value = {
    players,
    setPlayers,
    playerList,
    setPlayerList,
    maps,
    clashStarted,
    clashFinished,
    winner,
    showModal,
    addMap,
    removeMap,
    startClash,
    removePlayerFromClash,
    calculateTotalScore,
    handleInputChange,
    addPlayerToList,
    addPlayerToClash,
    removePlayerFromList,
    closeModal,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
