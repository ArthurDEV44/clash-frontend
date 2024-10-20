// WebSocketContext.tsx
import React, { createContext, useEffect, useRef, useState, useContext } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const websocketUrl = import.meta.env.PROD
  ? import.meta.env.VITE_WEBSOCKET_URL
  : 'ws://localhost:3001/ws'; // Utiliser 'ws://' pour un environnement local sans SSL

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
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, playerId: number, field: string, mapIndex: number) => void;
  addPlayerToList: (name: string) => void;
  addPlayerToClash: (player: Player) => void;
  removePlayerFromList: (playerId: number) => void;
  closeModal: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ignoreNextAddMap = useRef(false);
  const ignoreNextRemoveMap = useRef(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [maps, setMaps] = useState<number[]>([1]);
  const [clashStarted, setClashStarted] = useState(false);
  const [clashFinished, setClashFinished] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentClashId, setCurrentClashId] = useState<number | null>(null);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const savedClashId = localStorage.getItem('currentClashId');

    if (savedClashId) {
      setCurrentClashId(Number(savedClashId)); // Restaurer l'ID depuis le LocalStorage
      fetchInitialData(); // Charger l'état initial avec l'ID restauré
    }

    // Connexion WebSocket
    ws.current = new WebSocket(websocketUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      fetchInitialData();
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.current.onerror = (error) => console.error('WebSocket error:', error);

    ws.current.onclose = () => console.log('WebSocket disconnected');

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const fetchInitialData = () => {
    if (currentClashId) {
      fetch(`${backendUrl}/clash/${currentClashId}`)
        .then(response => response.json())
        .then(data => {
          setPlayers(data.players);
          setPlayerList(data.playerList); // Assurez-vous de cette ligne
          setMaps(data.maps);
          setClashStarted(data.clashStarted);
          setClashFinished(data.clashFinished);
          setWinner(data.winner);
          setShowModal(data.showModal);
        })
        .catch(error => console.error('Error fetching initial state:', error));
    }
  };  

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'initial_state':
        setPlayers(message.data.players);
        setPlayerList(message.data.playerList);
        setMaps(message.data.maps);
        setClashStarted(message.data.clashStarted);
        setClashFinished(message.data.clashFinished);
        setWinner(message.data.winner);
        setShowModal(message.data.showModal);
        break;
      case 'update_players':
        setPlayers(message.data);
        break;
      case 'new_player':
        setPlayerList((prev) => [...prev, message.data]);
        break;
      case 'add_map':
        handleAddMap(message.newMapIndex, message.updatedPlayers);
        break;
      case 'remove_map':
        handleRemoveMap(message.updatedPlayers);
        break;
      case 'remove_player_from_clash':
        setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== message.playerId));
        break;
      case 'delete_player_from_list':
        setPlayerList((prev) => prev.filter((player) => player.id !== message.playerId));
        break;
      case 'clash_started':
        setClashStarted(true);
        setCurrentClashId(message.clashId);
        localStorage.setItem('currentClashId', message.clashId); // Enregistrer l'ID du clash dans le LocalStorage pour tous les utilisateurs
        break;
      case 'clash_finished':
        resetClash();
        localStorage.removeItem('currentClashId'); // Supprimer l'ID du clash du LocalStorage pour tous les utilisateurs
        break;
      case 'show_modal':
        setWinner(message.winner);
        setShowModal(true);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent.');
    }
  };  

  const handleAddMap = (newMapIndex: number, updatedPlayers: Player[]) => {
    setMaps((prev) => [...prev, newMapIndex]);
    setPlayers(updatedPlayers);
  };

  const handleRemoveMap = (updatedPlayers: Player[]) => {
    setMaps((prev) => prev.slice(0, -1));
    setPlayers(updatedPlayers);
  };

  const sendPlayerUpdate = (updatedPlayers: Player[]) => {
    sendMessage({ type: 'update_players', data: updatedPlayers });
  };

  const resetClash = () => {
    // Envoyer la requête pour supprimer les données du clash
    if (currentClashId) {
      fetch(`${backendUrl}/clash/${currentClashId}`, {
        method: 'DELETE',
      })
        .then((response) => {
          if (response.ok) {
            console.log('Clash data deleted successfully'); // Log de confirmation côté client
          } else {
            console.error('Error deleting clash data');
          }
        })
        .catch((error) => console.error('Error deleting clash data:', error));
    }
  
    // Réinitialiser l'état du clash côté client
    setClashStarted(false);
    setClashFinished(true);
    setPlayers([]);
    setMaps([1]);
    setCurrentClashId(null);
    localStorage.removeItem('currentClashId'); // Supprimer l'ID du LocalStorage
  };  

  const addMap = () => {
    const newMapIndex = maps.length + 1;
    setMaps([...maps, newMapIndex]);

    const updatedPlayers = players.map((player) => ({
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

      const updatedPlayers = players.map((player) => {
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
    fetch(`${backendUrl}/clash`, { method: 'POST' })
      .then((response) => response.json())
      .then((data) => {
        if (data.id) {
          console.log("Clash started with ID:", data.id); 
          setCurrentClashId(data.id);
          localStorage.setItem('currentClashId', data.id); // Enregistrer dans le LocalStorage
          setClashStarted(true);
          sendMessage({ type: 'clash_started', clashId: data.id });
        } else {
          console.error('Error: No Clash ID returned from server');
        }
      })
      .catch((error) => console.error('Error starting clash:', error));
  };  

  const determineWinner = () => {
    let topPlayer = players.reduce((prev, curr) =>
      parseFloat(calculateTotalScore(curr)) > parseFloat(calculateTotalScore(prev)) ? curr : prev, players[0]);

    setWinner(topPlayer);
    setShowModal(true);
    sendMessage({ type: 'show_modal', winner: topPlayer });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    playerId: number,
    field: string,
    mapIndex: number
  ) => {
    const { value } = e.target;
    const updatedValue = Number(value) || 0;
  
    // Mise à jour des joueurs localement
    const updatedPlayers = players.map((player) =>
      player.id === playerId ? { ...player, [`${field}_map${mapIndex}`]: updatedValue } : player
    );
  
    setPlayers(updatedPlayers);
  
    // Envoyer les modifications via WebSocket
    sendMessage({
      type: 'update_players',
      data: updatedPlayers,
    });
  
    // Enregistrer les modifications dans la base de données
    fetch(`${backendUrl}/clash/${currentClashId}/player/${playerId}/map/${mapIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: updatedValue }),
    }).catch((error) => console.error('Error updating player score:', error));
  
    // Vérifier la fin du clash après chaque mise à jour
    checkClashFinished(updatedPlayers);
  };  

  const checkClashFinished = (updatedPlayers: Player[]) => {
    const allFieldsFilled = updatedPlayers.every((player) =>
      maps.every((mapIndex) => {
        const kills = player[`kills_map${mapIndex}`];
        const rank = player[`rank_map${mapIndex}`];
        return !isNaN(kills) && !isNaN(rank) && kills > 0 && rank > 0;
      })
    );

    if (allFieldsFilled) determineWinner();
  };

  const removePlayerFromClash = (playerId: number) => {
    const updatedPlayers = players.filter((player) => player.id !== playerId);
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
      .then((response) => response.json())
      .then((data) => {
        if (data && data.id) {
          newPlayer.id = data.id;
          setPlayerList((prevList) => [...prevList, newPlayer]); // Mettez à jour la liste des joueurs
          sendMessage({ type: 'new_player', data: newPlayer }); // Émettez un message WebSocket
        }
      })
      .catch((error) => console.error('Error adding player:', error));
  };  

  const addPlayerToClash = (player: Player) => {
    if (clashStarted) return;

    const playerToClash = { ...player };

    maps.forEach((mapIndex) => {
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
      .then((response) => {
        if (response.ok) {
          setPlayerList(playerList.filter((player) => player.id !== playerId));

          sendMessage({ type: 'delete_player_from_list', playerId });
        } else {
          console.error('Failed to delete player');
        }
      })
      .catch((error) => console.error('Error deleting player:', error));
  };

  const closeModal = () => {
    setShowModal(false);
    setClashStarted(false);
    setClashFinished(true);
    setWinner(null);
    setPlayers([]);
    setMaps([1]);
  
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

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
