import { WebSocketProvider } from './WebSocketContext';
import MapControls from './components/MapControls';
import ClashControls from './components/ClashControls';
import ClashTable from './components/ClashTable';
import PlayerList from './components/PlayerList';
import WinnerModal from './components/WinnerModal';
import './style/button.css';

function App() {
  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
        <h1 className="text-5xl font-extrabold text-white text-center mb-6 shadow-neon">Clash</h1>
        <div className='flex flex-row justify-between'>
          <MapControls />
          <ClashControls />
        </div>
        <ClashTable />
        <PlayerList />
        <WinnerModal />
      </div>
    </WebSocketProvider>
  );
}

export default App;
