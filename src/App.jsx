import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInAnonymously } from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import MainMenu from './components/menu/MainMenu';
import LandingScreen from './components/LandingScreen';
import PinnacleGame from './components/games/PinnacleGame';
import CrosswordGame from './components/games/crossword/CrosswordGame';
import LoginScreen from './components/auth/LoginScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import RankRoadmap from './components/profile/RankRoadmap';
import CreateRoom from './components/menu/CreateRoom';
import JoinRoom from './components/menu/JoinRoom';
import WaitingRoom from './components/menu/WaitingRoom';
import { useUserStore } from './store/userStore';
import { useRoomStore } from './store/roomStore';
import { auth, db } from './config/firebase';
import { getRankByScore } from './utils/ranks';

// ── Fullscreen helpers ──
const enterFullscreen = () => {
  const el = document.documentElement;
  const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (rfs) rfs.call(el).catch(() => {});
};
const exitFullscreen = () => {
  const efs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (efs && document.fullscreenElement) efs.call(document).catch(() => {});
};

// Global Background Animation Nodes
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
  // Đọc phần guestSession một cách an toàn nhất
  const hasSession = (() => {
    try {
      const session = localStorage.getItem('guestSession');
      if (!session) return false;
      const parsed = JSON.parse(session);
      return !!parsed && typeof parsed === 'object';
    } catch { return false; }
  })();

  // Views: 'login' | 'menu' | 'profile' | 'create_room' | 'join_room' | 'waiting_room' | 'playing'
  const [currentView, setCurrentView] = useState(hasSession ? 'menu' : 'login');
  const [activeGameType, setActiveGameType] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [initialPin, setInitialPin] = useState('');
  const [showProfileRoadmap, setShowProfileRoadmap] = useState(false);

  const { setUser } = useUserStore();
  const { resetRoom } = useRoomStore();

  // ── Firebase Anonymous Auth (chạy background, chỉ cập nhật UID) ──
  useEffect(() => {
    signInAnonymously(auth).then(({ user }) => {
      const saved = localStorage.getItem('guestSession');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const nickname = parsed.name || 'Khách Vô Danh';
          setUser({ uid: user.uid, nickname });
          set(ref(db, `users/${user.uid}/nickname`), nickname);
        } catch { /* ignore */ }
      }
    }).catch(console.error);

    // Global interaction listener for fullscreen (runs once on first click/touch)
    const handleFirstInteraction = () => {
      enterFullscreen();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // ── Handlers ──
  const handleLogin = async (method, customName = null) => {
    const uid = auth.currentUser?.uid;
    const nickname = method === 'guest'
      ? (customName || 'Khách Vô Danh')
      : (method === 'facebook' ? 'Người chơi Facebook' : 'Người chơi Google');

    const baseScore = method === 'guest' ? 0 : (method === 'facebook' ? 12500 : 45000);
    const mockUser = { isGuest: method === 'guest', name: nickname, score: baseScore, rank: getRankByScore(baseScore), gameStats: {} };

    localStorage.setItem('guestSession', JSON.stringify(mockUser));
    setUser({ uid, nickname });

    // Ghi lên Firebase — chỉ set coins ban đầu cho user MỚI
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      // User đã tồn tại → cập nhật nickname, khôi phục coins nếu bị mất
      const data = snap.val();
      const updates = { nickname };
      if (!data.coins) updates.coins = 500; // khôi phục coins ban đầu nếu bị xóa
      await update(ref(db, `users/${uid}`), updates);
    } else {
      // User mới → set đầy đủ với 500 coins ban đầu
      await set(ref(db, `users/${uid}`), { nickname, global_score: baseScore, coins: 500 });
    }
    setCurrentView('menu');
  };

  const handleUpdateName = (newName) => {
    const saved = JSON.parse(localStorage.getItem('guestSession') || '{}');
    const updated = { ...saved, name: newName };
    localStorage.setItem('guestSession', JSON.stringify(updated));
  };

  const handleLinkAccount = () => {
    const saved = JSON.parse(localStorage.getItem('guestSession') || '{}');
    localStorage.setItem('guestSession', JSON.stringify({ ...saved, isGuest: false }));
    alert('Đã liên kết thành công!');
  };

  // Tạo phòng → chuyển sang create_room modal
  const handleCreateGame = (gameId, mode) => {
    enterFullscreen();
    setActiveGameType(gameId);
    setActiveMode(mode);
    if (mode === 'solo') {
      setCurrentView('playing');
    } else if (mode === 'p2p_private') {
      setCurrentView('create_room');
    }
  };

  // Sau khi tạo phòng thành công → vào WaitingRoom
  const handleRoomCreated = () => {
    setCurrentView('waiting_room');
  };

  // Guest join phòng → vào WaitingRoom
  const handleJoined = () => {
    setCurrentView('waiting_room');
  };
  // Game bắt đầu (từ WaitingRoom)
  const handleGameStart = (roomData) => {
    setActiveGameType(roomData?.gameType || activeGameType);
    setCurrentView('playing');
  };

  const handleLeaveGame = () => {
    setActiveGameType(null);
    setActiveMode(null);
    resetRoom();
    setCurrentView('menu');
  };

  const handleLogout = () => {
    localStorage.removeItem('guestSession');
    useUserStore.getState().reset();
    setCurrentView('login');
  };

  const handleGameComplete = (gameId, earnedXP) => {
    if (!gameId || !earnedXP) return;
    // XP update qua userStore khi implement đầy đủ
  };

  // Helper: lấy user object từ localStorage cho MainMenu
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('guestSession') || 'null'); } catch { return null; }
  })();

  // ── Auto fullscreen khi vào các view chức năng ──
  useEffect(() => {
    if (currentView !== 'menu' && currentView !== 'login') {
      enterFullscreen();
    }
  }, [currentView]);

  // ── Exit app ──
  const handleExit = () => {
    if (window.confirm('Bạn có muốn thoát ứng dụng?')) {
      exitFullscreen();
      window.close();
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020617]">
      <BackgroundAnimations />

      <AnimatePresence mode="wait" initial={false}>

        {/* ── Login ── */}
        {currentView === 'login' && (
          <motion.div key="view-login"
            initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50">
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        )}

        {/* ── Menu ── */}
        {currentView === 'menu' && (
          <motion.div key="view-menu"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex justify-center items-start z-10 relative overflow-y-auto overflow-x-hidden">
            <MainMenu
              user={user}
              returnToGame={activeGameType}
              returnToMode={activeMode}
              onClearReturn={() => { setActiveGameType(null); setActiveMode(null); }}
              onJoinRoom={(pin, gameId) => { 
                enterFullscreen(); 
                setInitialPin(pin || ''); 
                if (gameId) setActiveGameType(gameId);
                setActiveMode('join_pin');
                setCurrentView('join_room'); 
              }}
              onCreateGame={(gameId, mode) => handleCreateGame(gameId, mode)}
              onLinkAccount={handleLinkAccount}
              onUpdateName={handleUpdateName}
              onOpenProfile={() => { enterFullscreen(); setCurrentView('profile'); }}
              onLogout={handleLogout}
              onExit={handleExit}
            />
          </motion.div>
        )}

        {/* ── Profile ── */}
        {currentView === 'profile' && (
          <motion.div key="view-profile"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full z-10 relative">
            <ProfileScreen
              user={user}
              onBack={() => setCurrentView('menu')}
              onOpenRoadmap={() => setShowProfileRoadmap(true)}
            />
            {/* Roadmap overlay from Profile */}
            <AnimatePresence>
              {showProfileRoadmap && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-8">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                    className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden">
                    <RankRoadmap currentScore={user?.score} onBack={() => setShowProfileRoadmap(false)} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Create Room ── */}
        {currentView === 'create_room' && (
          <motion.div key="view-create-room"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full h-full z-10 relative">
            <CreateRoom
              gameName={activeGameType}
              gameType={activeGameType}
              onBack={() => setCurrentView('menu')}
              onRoomCreated={handleRoomCreated}
            />
          </motion.div>
        )}

        {/* ── Join Room ── */}
        {currentView === 'join_room' && (
          <motion.div key="view-join-room"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full h-full z-10 relative">
            <JoinRoom
              initialPin={initialPin}
              onBack={() => setCurrentView('menu')}
              onJoined={handleJoined}
            />
          </motion.div>
        )}

        {/* ── Waiting Room ── */}
        {currentView === 'waiting_room' && (
          <motion.div key="view-waiting-room"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full h-full z-10 relative">
            <WaitingRoom
              onLeave={handleLeaveGame}
              onGameStart={handleGameStart}
            />
          </motion.div>
        )}

        {/* ── Playing ── */}
        {currentView === 'playing' && (
          activeGameType === 'millionaire' ? (
            <motion.div key="view-pinnacle"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full flex justify-center items-center z-10 relative overflow-y-auto">
              <PinnacleGame onLeaveGame={handleLeaveGame} onGameComplete={(xp) => handleGameComplete('millionaire', xp)} />
            </motion.div>
          ) : activeGameType === 'crossword' ? (
            <motion.div key="view-crossword"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full z-10 relative">
              <CrosswordGame onLeaveGame={handleLeaveGame} onGameComplete={(xp) => handleGameComplete('crossword', xp)} />
            </motion.div>
          ) : (
            <motion.div key="view-playing"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
              className="z-10 bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
              <h2 className="text-3xl font-bold mb-4 text-kahoot-green">Game Started!</h2>
              <div className="bg-gray-100 p-4 rounded-xl mb-6 text-left space-y-2">
                <p><strong>Loại game:</strong> {activeGameType || 'N/A'}</p>
                <p><strong>Chế độ:</strong> {activeMode || 'N/A'}</p>
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
