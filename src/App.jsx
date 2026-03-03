import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainMenu from './components/menu/MainMenu';
import LandingScreen from './components/LandingScreen';
import PinnacleGame from './components/games/PinnacleGame';
import LoginScreen from './components/auth/LoginScreen';
import { getRankByScore } from './utils/ranks';

// Global Background Animation Nodes (Same as LandingScreen to keep consistency)
const BackgroundAnimations = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-kahoot-red opacity-10" />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 10, repeat: Infinity }}
      className="absolute top-[20%] -right-[5%] w-[30vw] h-[30vw] rounded-lg rotate-45 bg-kahoot-blue opacity-10" />
    <motion.div
      animate={{ y: [0, -50, 0] }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute -bottom-[10%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-kahoot-yellow opacity-10" />
  </div>
);

function App() {
  // Routes: 'login' | 'menu' | 'lobby_public' | 'lobby_private' | 'playing'
  const [currentView, setCurrentView] = useState('login');

  // App State
  const [user, setUser] = useState(null);
  const [activeGameType, setActiveGameType] = useState(null); // 'quiz', 'true_false'...
  const [activeMode, setActiveMode] = useState(null); // 'solo', 'p2p_public', 'p2p_private'
  const [roomPin, setRoomPin] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('guestSession');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Ensure backward compat: older sessions may not have gameStats
      setUser({ gameStats: {}, ...parsed });
      setCurrentView('menu');
    }
  }, []);

  // Handlers
  const handleLogin = (method, customName = null) => {
    // Mock user login
    const baseScore = method === 'guest' ? 0 : (method === 'facebook' ? 12500 : 45000);

    const mockUser = {
      isGuest: method === 'guest',
      name: method === 'guest' ? (customName || 'Khách Vô Danh') : (method === 'facebook' ? 'Người chơi Facebook' : 'Người chơi Google'),
      score: baseScore,
      rank: getRankByScore(baseScore),
      gameStats: {}, // { [gameId]: { xp: number, plays: number } }
    };

    setUser(mockUser);
    localStorage.setItem('guestSession', JSON.stringify(mockUser));
    setCurrentView('menu');
  };

  const handleUpdateName = (newName) => {
    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    localStorage.setItem('guestSession', JSON.stringify(updatedUser));
  };

  const handleLinkAccount = () => {
    // Mock linking account
    const linkedUser = { ...user, isGuest: false, name: 'Người chơi đã Link' };
    setUser(linkedUser);
    localStorage.setItem('guestSession', JSON.stringify(linkedUser));
    alert('Đã liên kết Google thành công! Điểm của bạn giờ đây đã được bảo vệ.');
  };

  const handleJoinRoom = (pin) => {
    setRoomPin(pin);
    // Determine gameType from Firebase later
    setCurrentView('playing');
  };

  const handleCreateGame = (gameId, mode) => {
    setActiveGameType(gameId);
    setActiveMode(mode);

    if (mode === 'solo') {
      setCurrentView('playing');
    } else if (mode === 'p2p_private') {
      // Generate PIN logic here later
      const fakePin = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomPin(fakePin);
      setCurrentView('lobby_private');
    } else if (mode === 'p2p_public') {
      setCurrentView('lobby_public');
    }
  };

  const handleLeaveGame = () => {
    setActiveGameType(null);
    setActiveMode(null);
    setRoomPin(null);
    setCurrentView('menu');
  };

  // Called when a game session ends with earned XP
  const handleGameComplete = (gameId, earnedXP) => {
    if (!gameId || !earnedXP) return;
    setUser(prev => {
      const prevStats = prev.gameStats || {};
      const prevGame = prevStats[gameId] || { xp: 0, plays: 0 };
      const updated = {
        ...prev,
        score: (prev.score || 0) + earnedXP,
        gameStats: {
          ...prevStats,
          [gameId]: { xp: prevGame.xp + earnedXP, plays: prevGame.plays + 1 },
        },
      };
      localStorage.setItem('guestSession', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020617]">

      {/* Route Switcher */}
      <AnimatePresence mode="wait">

        {currentView === 'login' && (
          <motion.div
            key="view-login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full h-full flex justify-center items-center z-10 relative"
          >
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        )}

        {currentView === 'menu' && (
          <motion.div
            key="view-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full h-full flex justify-center items-start z-10 relative overflow-y-auto overflow-x-hidden"
          >
            <MainMenu
              user={user}
              onJoinRoom={handleJoinRoom}
              onCreateGame={handleCreateGame}
              onLinkAccount={handleLinkAccount}
              onUpdateName={handleUpdateName}
            />
          </motion.div>
        )}

        {currentView === 'lobby_private' && (
          <motion.div
            key="view-lobby-private"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="z-10 bg-white p-8 rounded-3xl shadow-xl text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Phòng Chờ (Private)</h2>
            <p className="text-gray-500 mb-6">Mã phòng của bạn là:</p>
            <div className="text-6xl font-black bg-gray-100 p-6 rounded-2xl tracking-[0.2em] mb-8">
              {roomPin}
            </div>
            <button onClick={handleLeaveGame} className="text-red-500 font-bold underline">Thoát phòng</button>
          </motion.div>
        )}

        {currentView === 'lobby_public' && (
          <motion.div
            key="view-lobby-public"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="z-10 bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm"
          >
            <h2 className="text-2xl font-bold mb-4">Sảnh Công Khai</h2>
            <div className="flex justify-center my-6">
              <div className="w-12 h-12 border-4 border-kahoot-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium mb-2">Đang tìm đối thủ...</p>
            <p className="text-sm text-gray-400 mb-8">Game: {activeGameType}</p>
            <button onClick={handleLeaveGame} className="text-red-500 font-bold underline">Hủy tìm trận</button>
          </motion.div>
        )}

        {currentView === 'playing' && (
          activeGameType === 'millionaire' ? (
            <motion.div
              key="view-pinnacle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full flex justify-center items-center z-10 relative overflow-y-auto"
            >
              <PinnacleGame onLeaveGame={handleLeaveGame} onGameComplete={(xp) => handleGameComplete('millionaire', xp)} />
            </motion.div>
          ) : (
            <motion.div
              key="view-playing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="z-10 bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full"
            >
              <h2 className="text-3xl font-bold mb-4 text-kahoot-green">Game Started!</h2>
              <div className="bg-gray-100 p-4 rounded-xl mb-6 text-left space-y-2">
                <p><strong>Loại game:</strong> {activeGameType || 'N/A'}</p>
                <p><strong>Chế độ:</strong> {activeMode || 'N/A'}</p>
                <p><strong>Mã phòng:</strong> {roomPin || 'N/A'}</p>
              </div>
              <p className="text-gray-500 mb-8">Đây sẽ là nơi render GameEngine.jsx</p>
              <button onClick={handleLeaveGame} className="bg-kahoot-red text-white font-bold px-6 py-3 rounded-xl w-full">Thoát Game</button>
            </motion.div>
          )
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
