import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { ref, update, onValue } from 'firebase/database';
import { db } from './config/firebase';
import MainMenu from './components/menu/MainMenu';
import LandingScreen from './components/LandingScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import PinnacleGame from './components/games/PinnacleGame';
import CrosswordGame from './components/games/crossword/CrosswordGame';
import LoginScreen from './components/auth/LoginScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import RankRoadmap from './components/profile/RankRoadmap';
import XPLeaderboardModal from './components/menu/XPLeaderboardModal';
import LoadingScreen, { usePreload } from './components/LoadingScreen';
import CreateRoom from './components/menu/CreateRoom';
import JoinRoom from './components/menu/JoinRoom';
import WaitingRoom from './components/menu/WaitingRoom';
import { useUserStore } from './store/userStore';
import { useRoomStore } from './store/roomStore';
import { usePlayFabStore } from './store/playfabStore';
import { auth } from './config/firebase';
import { getRankByScore } from './utils/ranks';
import { usePendingRefund } from './hooks/usePendingRefund';

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

  const { done: preloadDone, progress } = usePreload(1200);

  // Views: 'login' | 'menu' | 'profile' | 'create_room' | 'join_room' | 'waiting_room' | 'playing' | 'privacy'
  const [currentView, setCurrentView] = useState(hasSession ? 'menu' : 'login');
  const [prevView, setPrevView] = useState('login'); // để quay lại từ privacy
  const [activeGameType, setActiveGameType] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [initialPin, setInitialPin] = useState('');
  const [showProfileRoadmap, setShowProfileRoadmap] = useState(false);
  const [showProfileXPLeaderboard, setShowProfileXPLeaderboard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Track fullscreen state
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = () => isFullscreen ? exitFullscreen() : enterFullscreen();

  // P2P crossword state
  const [opponentProgress, setOpponentProgress] = useState(null);   // real-time opponent data
  const [myP2PProfile, setMyP2PProfile] = useState(null);
  const [opponentP2PProfile, setOpponentP2PProfile] = useState(null);
  const p2pUnsubRef = useRef(null);

  const { setUser } = useUserStore();
  const { roomId, myRole, roomData, resetRoom } = useRoomStore();
  const playfabLogin = usePlayFabStore(state => state.login);
  const { nickname: myNickname, globalScore: myScore } = usePlayFabStore();

  // Tự động refund nếu còn pending bet từ session trước (disconnect)
  usePendingRefund();

  // ── Firebase Auth Watcher ──
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      exportSessionToPlayfab(user);
    });
    
    async function exportSessionToPlayfab(user) {
      if (user) {
        const pfState = usePlayFabStore.getState();

        // Nếu PlayFab đã đăng nhập bằng Google/Email/Restored → không can thiệp, giữ nguyên session
        if (pfState.isLoggedIn && (pfState.authMethod === 'google' || pfState.authMethod === 'email' || pfState.authMethod === 'restored')) {
          // Chỉ sync uid vào userStore nếu chưa có
          const { uid: storeUid } = useUserStore.getState();
          if (!storeUid) {
            setUser({ uid: user.uid, nickname: pfState.nickname || user.displayName || 'Người chơi' });
          }
          return;
        }

        // Kiểm tra guestSession để xem auth method
        const saved = localStorage.getItem('guestSession');
        let savedSession = null;
        try { savedSession = saved ? JSON.parse(saved) : null; } catch { /* ignore */ }
        const savedAuthMethod = savedSession?.authMethod;

        // Nếu session cũ là Google/Email nhưng PlayFab chưa restore (app reload)
        // → KHÔNG gọi playfabLogin() device. Google user phải đăng nhập lại đúng cách.
        if (savedAuthMethod === 'google' || savedAuthMethod === 'email') {
          setUser({ uid: user.uid, nickname: savedSession?.name || user.displayName || 'Người chơi' });
          // Thử restore PlayFab session từ cached token (nếu có)
          const restored = await usePlayFabStore.getState().restoreSession().catch(() => false);
          if (!restored) {
            // Token hết hạn → clear session, redirect về login
            localStorage.removeItem('guestSession');
            setCurrentView('login');
          }
          return;
        }

        // Guest / Anonymous login: lấy nickname từ guestSession
        let nickname = user.displayName || 'Khách Vô Danh';
        if (savedSession?.name) nickname = savedSession.name;
        setUser({ uid: user.uid, nickname });

        // Chỉ gọi playfabLogin() (device-based) nếu chưa đăng nhập PlayFab
        if (!pfState.isLoggedIn && !pfState.isLoading) {
          playfabLogin().catch(console.error);
        }
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    }
    
    return () => unsub();
  }, []);

  // ── Handlers ──
  const handleLogin = async (method, customName = null) => {
    const uid = auth.currentUser?.uid;

    let nickname;
    if (method === 'guest') {
      nickname = customName || 'Khách Vô Danh';
    } else if (method === 'google') {
      // Nickname comes from PlayFab store (set during Google login) or from LoginScreen
      nickname = customName || usePlayFabStore.getState().nickname || 'Người chơi Google';
    } else if (method === 'email') {
      nickname = usePlayFabStore.getState().nickname || 'Người chơi';
    } else {
      nickname = customName || 'Người chơi';
    }

    const mockUser = { isGuest: method === 'guest', name: nickname, score: 0, rank: getRankByScore(0), gameStats: {}, authMethod: method };

    localStorage.setItem('guestSession', JSON.stringify(mockUser));
    setUser({ uid, nickname });

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
  const handleGameStart = (startRoomData) => {
    const gameType = startRoomData?.gameType || activeGameType;
    setActiveGameType(gameType);

    // Nếu là crossword P2P — bắt đầu lắng nghe progress real-time
    if (gameType === 'crossword' && roomId) {
      const curRoomData = startRoomData ?? roomData;
      const players = curRoomData?.players ?? {};
      const uid = auth.currentUser?.uid;
      const opponentUid = Object.keys(players).find(k => k !== uid);

      // Build profiles — coins + avatarUrl included so matchSetup shows real avatar
      const myCoins = usePlayFabStore.getState().coins ?? 0;
      const myAvatarUrl = usePlayFabStore.getState().avatarUrl || null;
      setMyP2PProfile({
        nickname: myNickname || 'Bạn',
        uid,
        coins: myCoins,
        avatarUrl: myAvatarUrl,
      });
      setOpponentP2PProfile({
        nickname: players[opponentUid]?.nickname || 'Đối thủ',
        uid: opponentUid,
        // coins đối thủ không biết exact, hiển thị ? (chỉ biết họ đủ điều kiện vào phòng)
        coins: null,
        // Lấy avatarUrl của đối thủ từ Firebase room data (đã được sync khi join)
        avatarUrl: players[opponentUid]?.avatarUrl || null,
      });

      // Unsubscribe old listener
      p2pUnsubRef.current?.();

      // Watch opponent progress
      if (opponentUid) {
        const progRef = ref(db, `rooms/${roomId}/progress/${opponentUid}`);
        p2pUnsubRef.current = onValue(progRef, snap => {
          setOpponentProgress(snap.val() ?? null);
        });
      }
    }

    setCurrentView('playing');
  };

  // Gửi progress lên Firebase (P2P crossword)
  const handleCrosswordProgressUpdate = useCallback(async (progress) => {
    if (!roomId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await update(ref(db, `rooms/${roomId}/progress/${uid}`), progress);
    } catch (_) {}
  }, [roomId]);

  const handleLeaveGame = () => {
    p2pUnsubRef.current?.();
    p2pUnsubRef.current = null;
    setOpponentProgress(null);
    setMyP2PProfile(null);
    setOpponentP2PProfile(null);
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
    <div className="relative w-full overflow-hidden bg-[#020617]" style={{ height: '100dvh' }}>
      <SpeedInsights />
      <BackgroundAnimations />

      {/* ── Loading gate ── */}
      <AnimatePresence>
        {!preloadDone && (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[9999]"
          >
            <LoadingScreen progress={progress} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>

        {/* ── Login ── */}
        {currentView === 'login' && (
          <motion.div key="view-login"
            initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50">
            <LoginScreen
              onLogin={handleLogin}
              onOpenPrivacy={() => { setPrevView('login'); setCurrentView('privacy'); }}
            />
          </motion.div>
        )}

        {/* ── Menu ── */}
        {currentView === 'menu' && (
          <motion.div key="view-menu"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 overflow-hidden">
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
            className="absolute inset-0 z-10">
            <ProfileScreen
              user={user}
              onBack={() => setCurrentView('menu')}
              onOpenRoadmap={() => setShowProfileRoadmap(true)}
              onOpenLeaderboard={() => setShowProfileXPLeaderboard(true)}
            />
            {/* Roadmap overlay from Profile */}
            <AnimatePresence>
              {showProfileRoadmap && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-8">
                   <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                    className="bg-white w-full h-full md:h-[80vh] md:max-w-2xl md:rounded-3xl overflow-hidden">
                    <RankRoadmap currentScore={user?.score} onBack={() => setShowProfileRoadmap(false)} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showProfileXPLeaderboard && (
                <XPLeaderboardModal onClose={() => setShowProfileXPLeaderboard(false)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Create Room ── */}
        {currentView === 'create_room' && (
          <motion.div key="view-create-room"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10">
            <CreateRoom
              gameName={activeGameType}
              gameType={activeGameType}
              onBack={() => {
                // Reset cả activeGameType + activeMode để home hiển thị đúng
                setActiveGameType(null);
                setActiveMode(null);
                setCurrentView('menu');
              }}
              onRoomCreated={handleRoomCreated}
              onPlaySolo={() => {
                setActiveMode('solo');
                setCurrentView('playing');
              }}
            />
          </motion.div>
        )}

        {/* ── Join Room ── */}
        {currentView === 'join_room' && (
          <motion.div key="view-join-room"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10">
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
            className="absolute inset-0 z-10">
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
              className="absolute inset-0 z-10 overflow-y-auto">
              <PinnacleGame onLeaveGame={handleLeaveGame} onGameComplete={(xp) => handleGameComplete('millionaire', xp)} />
            </motion.div>
          ) : activeGameType === 'crossword' ? (
            <motion.div key="view-crossword"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 z-10">
              <CrosswordGame
                onLeaveGame={handleLeaveGame}
                onGameComplete={(xp) => handleGameComplete('crossword', xp)}
                opponentProgress={activeMode === 'solo' ? null : opponentProgress}
                myProfile={activeMode === 'solo' ? null : myP2PProfile}
                opponentProfile={activeMode === 'solo' ? null : opponentP2PProfile}
                onProgressUpdate={activeMode === 'solo' ? null : handleCrosswordProgressUpdate}
                onFinish={activeMode === 'solo' ? null : handleCrosswordProgressUpdate}
              />
            </motion.div>
          ) : null
        )}

        {/* ── Privacy Policy ── */}
        {currentView === 'privacy' && (
          <motion.div key="view-privacy"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 overflow-y-auto">
            <PrivacyPolicy onBack={() => setCurrentView(prevView)} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Global Fullscreen Toggle Button — visible on all screens ── */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        style={{
          position: 'fixed',
          bottom: 14,
          left: 14,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.42)',
          border: '1.5px solid rgba(255,255,255,0.22)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          zIndex: 99999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
          transition: 'background 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.42)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}

export default App;
