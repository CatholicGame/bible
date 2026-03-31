import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
    Users, User, ArrowLeft, Trophy, Shield,
    LogOut, Map, ChevronRight, ChevronLeft, Power, Maximize
} from 'lucide-react';
import { getRankByScore } from '../../utils/ranks';
import { usePlayFabStore } from '../../store/playfabStore';
import UserAvatar from '../common/UserAvatar';
import RankRoadmap from '../profile/RankRoadmap';
import SettingsModal from '../common/SettingsModal';
import RosaryOfferingModal from '../rosary/RosaryOfferingModal';
import AdBanner from '../ads/AdBanner';
import bgImage from '../../assets/common/common_background.png';
import iconCoin from '../../assets/common/coin.png';
import iconTrophy from '../../assets/common/trophy.png';
import roseIcon from '../../assets/rosary/rose1.png';

// Game thumbnail imports
import imgMillionaire from '../../assets/games/millionaire.png';
import imgSorting from '../../assets/games/thumb_secret_words.png';
import imgGolgotha from '../../assets/games/thumb_golgotha.png';

const GAMES = [
    { id: 'millionaire', title: 'Nhà Thần Học?', subtitle: 'Ai Là', image: imgMillionaire, from: '#8b5cf6', to: '#5b21b6', isSoloOnly: true },
    { id: 'crossword', title: 'Giải ô chữ', subtitle: 'Ô Chữ', image: imgSorting, from: '#d97706', to: '#92400e', isSoloOnly: false },
    { id: 'golgotha', title: 'Đỉnh Golgotha', subtitle: 'Đường Lên', image: imgGolgotha, from: '#0ea5e9', to: '#0369a1', isSoloOnly: false },
];

// Default card proportions: portrait baseline
const BASE_CARD_W = 259;
const BASE_CARD_H = 364;
const CARD_RATIO = BASE_CARD_W / BASE_CARD_H; // ~0.71 (portrait)
const GAP = 28;
const MAX_SC = 1.12;
const MIN_SC = 0.80;
const SC_RANGE = 1.6;

/*
 * Correct formula (no paddingLeft needed):
 *   dragX is initialized to   CENTER_X = cw/2 - CARD_W/2   → card-0 at screen centre
 *   navigateTo(i)  →  dragX = CENTER_X - i*STEP
 *
 *   card-i screen centre = dragX + i*STEP + CARD_W/2
 *   dist from screen centre = |(dragX + i*STEP + CARD_W/2) - cw/2|
 *
 *   We pass cwRef so the transform always reads the live width.
 */
function useCardTransform(dragX, idx, cwRef, cardW, step) {
    const scale = useTransform(dragX, (xv) => {
        const cw = cwRef.current;
        if (!cw) return MIN_SC;
        const cardCenterX = xv + idx * step + cardW / 2;
        const distPx = Math.abs(cardCenterX - cw / 2);
        const t = Math.min(distPx / (step * SC_RANGE), 1);
        return MAX_SC - (MAX_SC - MIN_SC) * t;
    });
    const zIndex = useTransform(dragX, (xv) => {
        const cw = cwRef.current;
        if (!cw) return 1;
        const cardCenterX = xv + idx * step + cardW / 2;
        const distPx = Math.abs(cardCenterX - cw / 2);
        return Math.max(1, Math.round(20 - distPx / step * 4));
    });
    const x = useTransform(dragX, (xv) => {
        const cw = cwRef.current;
        if (!cw) return 0;
        
        const rawIdx = (cw / 2 - cardW / 2 - xv) / step;
        
        const getScale = (i) => {
            const cardCenterX = xv + i * step + cardW / 2;
            const distPx = Math.abs(cardCenterX - cw / 2);
            const t = Math.min(distPx / (step * SC_RANGE), 1);
            return MAX_SC - (MAX_SC - MIN_SC) * t;
        };
        
        const N = GAMES.length;
        const widths = [];
        for (let i = 0; i < N; i++) widths.push(cardW * getScale(i));
        
        const layouts = [0];
        for (let i = 1; i < N; i++) {
            layouts[i] = layouts[i-1] + widths[i-1]/2 + GAP + widths[i]/2;
        }
        
        let cameraLayout = 0;
        if (rawIdx <= 0) {
            cameraLayout = layouts[0] + rawIdx * (widths[0] + GAP);
        } else if (rawIdx >= N - 1) {
            cameraLayout = layouts[N-1] + (rawIdx - (N-1)) * (widths[N-1] + GAP);
        } else {
            const floor = Math.floor(rawIdx);
            const frac = rawIdx - floor;
            cameraLayout = layouts[floor] + frac * (layouts[floor+1] - layouts[floor]);
        }
        
        const targetScreenCenter = cw / 2 - cameraLayout + layouts[idx];
        const currentScreenCenter = xv + idx * (cardW + GAP) + cardW / 2;
        
        return targetScreenCenter - currentScreenCenter;
    });
    return { scale, zIndex, x };
}

/* ─── Card ─── */
const GameCard = ({ game, idx, dragX, cwRef, isSnapped, onPress, stats, cardW, cardH, step }) => {
    const { scale, zIndex, x } = useCardTransform(dragX, idx, cwRef, cardW, step);
    const pointerDownX = useRef(0);
    const hasStats = stats && stats.plays > 0;

    // Scale font/spacing proportionally so cards look right at any size
    const titleSize   = Math.round(cardH * 0.082);
    const badgeSize   = Math.round(cardH * 0.039);
    const bottomOff   = Math.round(cardH * 0.088);
    const badgeOff    = Math.round(cardH * 0.300);
    const borderRad   = Math.round(cardH * 0.065); // ~24px at 364, ~14px at small

    return (
        <motion.div style={{ width: cardW, height: cardH, scale, zIndex, x, flexShrink: 0, position: 'relative' }}>
            <motion.button
                onPointerDown={(e) => { pointerDownX.current = e.clientX; }}
                onPointerUp={(e) => {
                    const moved = Math.abs(e.clientX - pointerDownX.current);
                    if (moved < 8) onPress();
                }}
                whileTap={{ y: 3 }}
                className="w-full h-full overflow-hidden flex flex-col justify-between relative"
                style={{
                    borderRadius: borderRad,
                    padding: Math.round(cardH * 0.055),
                    background: `linear-gradient(145deg, ${game.from}28, rgba(255,255,255,0.92))`,
                    border: `3px solid ${game.from}55`,
                    boxShadow: isSnapped
                        ? `0 ${step < 200 ? 4 : 8}px 0 ${game.from}55, 0 ${step < 200 ? 6 : 12}px 24px ${game.from}33`
                        : `0 ${step < 200 ? 2 : 5}px 0 ${game.from}44, 0 ${step < 200 ? 4 : 8}px 16px rgba(0,80,120,0.18)`,
                    userSelect: 'none',
                    cursor: 'grab',
                }}
            >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none" style={{ background: game.from + '18' }} />
                {/* 3D Image Thumbnail */}
                <div className="absolute inset-x-0 top-[8%] bottom-[30%] flex justify-center pointer-events-none drop-shadow-2xl px-[5px]">
                    <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Subtitle / Title at bottom */}
                <div className="absolute left-0 right-0 text-center select-none pointer-events-none overflow-hidden"
                    style={{ bottom: bottomOff }}>
                    <span className="block font-black tracking-[0.1em] uppercase mb-0.5"
                        style={{ fontSize: badgeSize, color: '#7fb3cc' }}>
                        {game.subtitle}
                    </span>
                    <span className="block font-black leading-tight px-1 truncate"
                        style={{ fontSize: titleSize, color: '#1e3a5f' }}>
                        {game.title}
                    </span>
                </div>

                {/* Stats badges: XP + Coins + plays */}
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 flex justify-center gap-1 pointer-events-none select-none"
                    style={{ bottom: badgeOff }}
                >
                    <span
                        className="flex items-center gap-0.5 font-black px-1.5 py-0.5 rounded-full"
                        style={{ fontSize: badgeSize, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,150,200,0.2)', color: '#f59e0b' }}
                    >
                        <img src={iconTrophy} alt="XP" className="w-3.5 h-3.5 object-contain" /> {(stats?.xp || 0).toLocaleString()}
                    </span>
                    <span
                        className="flex items-center gap-0.5 font-black px-1.5 py-0.5 rounded-full"
                        style={{ fontSize: badgeSize, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,150,200,0.2)', color: '#06d6a0' }}
                    >
                        <img src={iconCoin} alt="Coins" className="w-3.5 h-3.5 object-contain" /> {(stats?.coins || 0).toLocaleString()}
                    </span>
                    <span
                        className="flex items-center gap-0.5 font-black px-1.5 py-0.5 rounded-full"
                        style={{ fontSize: badgeSize, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,150,200,0.2)', color: '#4a7fa5' }}
                    >
                        🎮 {stats?.plays || 0}
                    </span>
                </motion.div>

                {isSnapped && (
                    <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-3 font-black text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest"
                        style={{ fontSize: badgeSize, background: game.from, boxShadow: `0 2px 0 ${game.to}` }}>
                        Chơi
                    </motion.span>
                )}
            </motion.button>
        </motion.div>
    );
};

/* ══ MainMenu ══ */
const MainMenu = ({ user, returnToGame, returnToMode, onClearReturn, onJoinRoom, onCreateGame, onLinkAccount, onUpdateName, onOpenProfile, onLogout, onExit }) => {
    const containerRef = useRef(null);
    const cwRef = useRef(0);
    const dragX = useMotionValue(0);
    const cardDimsRef = useRef({ cardW: BASE_CARD_W, cardH: BASE_CARD_H, step: Math.round(BASE_CARD_W * MAX_SC) + GAP });

    const [snapped, setSnapped] = useState(0);
    const [selectedGame, setSelectedGame] = useState(returnToGame || null);
    // modeView: 'home' | 'p2p'
    const [modeView, setModeView] = useState(
        returnToMode && (returnToMode.startsWith('p2p') || returnToMode === 'join_pin' || returnToMode === 'host') ? 'p2p' : 'home'
    );
    const [showModes, setShowModes] = useState(!!returnToGame);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showRosary, setShowRosary] = useState(false);
    const [ready, setReady] = useState(false);
    const [cardDims, setCardDims] = useState({ cardW: BASE_CARD_W, cardH: BASE_CARD_H, step: Math.round(BASE_CARD_W * MAX_SC) + GAP });
    const [isLandscape, setIsLandscape] = useState(false);

    const { coins, globalScore, rosaryToday, rosaryGlobal, submitRosary } = usePlayFabStore();
    const avatarUrl = usePlayFabStore(state => state.avatarUrl);

    /* Measure → set cwRef + card dims based on available height, then centre card-0 */
    useEffect(() => {
        const measure = () => {
            const el = containerRef.current;
            if (!el) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            if (!w || !h) return;

            // In landscape (h < 380px) shrink cards so they actually fit in the area.
            // Divide by MAX_SC so even the center card (scaled up 12%) doesn't overflow.
            const usableH = h - 28;
            const maxCardH = Math.min(BASE_CARD_H, Math.floor((usableH * 0.95) / MAX_SC));
            const cardH = maxCardH;
            const cardW = Math.round(cardH * CARD_RATIO);
            const step = Math.round(cardW * MAX_SC) + GAP;

            cwRef.current = w;
            cardDimsRef.current = { cardW, cardH, step };
            setCardDims({ cardW, cardH, step });
            setIsLandscape(h < 420);

            const centerX = w / 2 - cardW / 2;
            dragX.set(centerX);
            setReady(true);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [dragX]);

    /* navigate: dragX = centerX - idx*step */
    const navigateTo = useCallback((idx) => {
        const i = Math.max(0, Math.min(GAMES.length - 1, idx));
        const { cardW, step } = cardDimsRef.current;
        setSnapped(i);
        const centerX = cwRef.current / 2 - cardW / 2;
        animate(dragX, centerX - i * step, { type: 'spring', stiffness: 300, damping: 30 });
    }, [dragX]);

    /* snap on drag end with velocity bias */
    const handleDragEnd = useCallback((_, info) => {
        const { cardW, step } = cardDimsRef.current;
        const xv = dragX.get();
        const centerX = cwRef.current / 2 - cardW / 2;
        const rawIdx = (centerX - xv) / step;
        const vBias = -info.velocity.x / (step * 6);
        navigateTo(Math.round(rawIdx + vBias));
    }, [dragX, navigateTo]);



    /* ── Fullscreen Helper ── */
    const enterFullscreen = () => {
        try {
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (err) { /* ignore */ }
    };

    const handleSelect = (id) => {
        enterFullscreen();
        const g = GAMES.find(g => g.id === id);
        if (g?.isSoloOnly) onCreateGame(id, 'solo');
        else { setSelectedGame(id); setShowModes(true); setModeView('home'); }
    };
    const handleBack = () => {
        if (modeView === 'p2p') { setModeView('home'); }
        else { setShowModes(false); onClearReturn?.(); setTimeout(() => setSelectedGame(null), 300); }
    };
    const handleModeSelect = (mode) => {
        if (mode === 'host') onCreateGame(selectedGame, 'p2p_private');
        else if (mode === 'auto_match') onCreateGame(selectedGame, 'p2p_public');
        else if (mode === 'join_pin') onJoinRoom('', selectedGame);
        else onCreateGame(selectedGame, mode);
    };

    const rankName = user ? getRankByScore(user.score || 0) : 'Người Tìm Hiểu';

    const { cardW, cardH, step } = cardDims;
    const centerX = cwRef.current / 2 - cardW / 2;
    const dragLeft = centerX - (GAMES.length - 1) * step;
    const dragRight = centerX;

    return (
        <div className="w-full h-full flex flex-col overflow-hidden relative select-none">

            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img src={bgImage} alt="" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom,rgba(0,80,120,0.38) 0%,rgba(0,180,216,0.04) 45%,rgba(0,80,120,0.32) 100%)' }} />
            </div>

            {/* HEADER */}
            {user && (
                <div className="relative z-20 flex-shrink-0 flex items-center h-14 px-4 md:px-6 gap-3"
                    style={{ background: 'rgba(255,255,255,0.88)', borderBottom: '3px solid rgba(0,180,216,0.22)', backdropFilter: 'blur(16px)' }}>

                    {/* Exit button */}
                    {onExit && (
                        <motion.button
                            whileTap={{ scale: 0.9, y: 2 }}
                            onClick={onExit}
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-500/30 transition-colors"
                            style={{ background: 'rgba(239,68,68,0.2)', border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 2px 0 rgba(127,29,29,0.6)' }}
                            title="Thoát"
                        >
                            <Power size={16} strokeWidth={3} className="text-red-300" />
                        </motion.button>
                    )}

                    {/* Logo — hidden on portrait */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center text-sm relative overflow-hidden flex-shrink-0"
                            style={{ border: '2px solid #b45309', boxShadow: '0 2px 0 #b45309' }}>
                            <div className="absolute inset-0 w-full h-1/2 bg-white/30 pointer-events-none" />
                            <span className="relative z-10">✝️</span>
                        </div>
                        <span className="font-black text-base hidden sm:block" style={{ color: '#1e3a5f' }}>
                            Catholic <span style={{ color: '#1b9aaa' }}>Quiz!</span>
                        </span>
                    </div>

                    <div className="flex-1 text-center hidden md:block">
                        <span className="text-xs font-bold italic" style={{ color: '#4a7fa5' }}>Học hỏi Lời Chúa qua trò chơi</span>
                    </div>

                    {/* Dâng Hoa button — hidden on portrait, visible on landscape/desktop */}
                    <motion.button whileTap={{ scale: 0.93, y: 2 }}
                        onClick={() => setShowRosary(true)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ml-auto"
                        style={{
                            background: 'linear-gradient(135deg, rgba(236,64,122,0.12), rgba(233,30,99,0.18))',
                            border: '2px solid rgba(233,30,99,0.3)',
                            boxShadow: '0 2px 0 rgba(136,14,79,0.15)',
                        }}
                        title="Dâng Hoa Đức Mẹ"
                    >
                        <span style={{ fontSize: 16 }}>🌸</span>
                        <span className="font-black text-[10px] tracking-wider uppercase" style={{ color: '#c2185b' }}>Dâng Hoa</span>
                    </motion.button>

                    {/* Fullscreen button — ml-auto on portrait to push right */}
                    <motion.button whileTap={{ scale: 0.9, y: 2 }}
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen().catch(() => {});
                            } else {
                                document.exitFullscreen().catch(() => {});
                            }
                        }}
                        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors ml-auto sm:ml-0 mr-[-4px]"
                        style={{ background: 'rgba(0,180,216,0.12)', border: '2px solid rgba(0,180,216,0.28)', boxShadow: '0 2px 0 rgba(0,100,150,0.15)' }}
                        title="Toàn màn hình"
                    >
                        <Maximize size={18} strokeWidth={2.5} style={{ color: '#1b9aaa' }} />
                    </motion.button>

                    {/* User button — opens quick profile menu */}
                    <div className="relative flex-shrink-0">
                        <motion.button whileTap={{ y: 2 }}
                            onClick={() => setShowProfileMenu(v => !v)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-colors"
                            style={{ background: 'rgba(0,180,216,0.1)', border: '2px solid rgba(0,180,216,0.28)', boxShadow: '0 2px 0 rgba(0,100,150,0.15)' }}>
                            <UserAvatar
                                name={user.name || 'K'}
                                photoURL={avatarUrl}
                                size={24}
                                style={{ border: '2px solid #b45309', flexShrink: 0 }}
                            />
                            <div className="flex flex-col text-left">
                                <span className="font-black text-xs leading-none" style={{ color: '#1e3a5f' }}>{user.name}</span>
                                <span className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] flex items-center gap-0.5 font-bold" style={{ color: '#f59e0b' }}>
                                        <img src={iconTrophy} alt="XP" className="w-3 h-3 object-contain" /> {(globalScore || 0).toLocaleString()}
                                    </span>
                                    <span className="text-[9px] flex items-center gap-0.5 font-bold" style={{ color: '#06d6a0' }}>
                                        <img src={iconCoin} alt="Coins" className="w-3 h-3 object-contain" /> {(coins || 0).toLocaleString()}
                                    </span>
                                </span>
                            </div>
                            <ChevronRight size={11} className={`transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} style={{ color: '#4a7fa5' }} />
                        </motion.button>

                        {/* Profile Quick Menu Dropdown */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <>
                                    {/* Backdrop */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[90]"
                                        onClick={() => setShowProfileMenu(false)}
                                    />
                                    {/* Dropdown */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 z-[100] w-56 rounded-2xl overflow-hidden"
                                        style={{ background: 'rgba(255,255,255,0.96)', border: '2px solid rgba(0,180,216,0.25)', boxShadow: '0 8px 24px rgba(0,80,120,0.2)', backdropFilter: 'blur(12px)' }}
                                    >
                                        {/* Quick stats */}
                                        <div className="px-4 py-3" style={{ borderBottom: '1.5px solid rgba(0,180,216,0.15)' }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <UserAvatar
                                                    name={user.name || 'K'}
                                                    photoURL={avatarUrl}
                                                    size={32}
                                                    style={{ border: '2px solid #b45309', flexShrink: 0 }}
                                                />
                                                <div>
                                                    <p className="font-black text-sm leading-none" style={{ color: '#1e3a5f' }}>{user.name}</p>
                                                    <p className="text-[10px] font-bold mt-0.5" style={{ color: '#4a7fa5' }}>{getRankByScore(user.score || 0)?.title || 'Người Tìm Hiểu'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#f59e0b' }}><img src={iconTrophy} alt="XP" className="w-4 h-4 object-contain" /> {(globalScore || 0).toLocaleString()} XP</span>
                                                <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#06d6a0' }}><img src={iconCoin} alt="Coins" className="w-4 h-4 object-contain" /> {(coins || 0).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Menu items */}
                                        <div className="py-1">
                                            <button
                                                onClick={() => { enterFullscreen(); setShowProfileMenu(false); onOpenProfile(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 transition-colors text-left"
                                                style={{ color: '#1e3a5f' }}
                                            >
                                                <User size={16} className="text-sky-500 shrink-0" />
                                                <span className="font-bold text-sm">Xem chi tiết</span>
                                            </button>
                                            <button
                                                onClick={() => { enterFullscreen(); setShowProfileMenu(false); setShowRoadmap(true); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 transition-colors text-left"
                                                style={{ color: '#1e3a5f' }}
                                            >
                                                <Map size={16} className="text-emerald-500 shrink-0" />
                                                <span className="font-bold text-sm">Xem Roadmap</span>
                                            </button>
                                            <button
                                                onClick={() => { setShowProfileMenu(false); setShowSettings(true); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 transition-colors text-left"
                                                style={{ color: '#1e3a5f' }}
                                            >
                                                <span className="text-base">⚙️</span>
                                                <span className="font-bold text-sm">Cài đặt</span>
                                            </button>
                                            <div className="my-1" style={{ height: 1.5, background: 'rgba(0,180,216,0.15)' }} />
                                            <button
                                                onClick={() => { setShowProfileMenu(false); if (onLogout) onLogout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-left"
                                            >
                                                <LogOut size={16} className="shrink-0" />
                                                <span className="font-bold text-sm">Đăng xuất</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            </AnimatePresence>

            {/* Rosary Offering Modal */}
            <AnimatePresence>
                {showRosary && (
                    <RosaryOfferingModal
                        onClose={() => setShowRosary(false)}
                        coins={coins}
                        rosaryToday={rosaryToday}
                        rosaryGlobal={rosaryGlobal}
                        onSubmit={submitRosary}
                        user={user}
                        avatarUrl={avatarUrl}
                    />
                )}
            </AnimatePresence>

            {/* Roadmap */}
            <AnimatePresence>
                {showRoadmap && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-8">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white w-full h-full md:h-[80vh] md:max-w-2xl md:rounded-3xl overflow-hidden">
                            <RankRoadmap currentScore={user?.score} onBack={() => setShowRoadmap(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AdBanner — chỉ hiện ở portrait/desktop menu, ẩn trên landscape */}
            {!isLandscape && !showModes && (
                <div className="relative z-10 flex-shrink-0 w-full">
                    <AdBanner style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }} />
                </div>
            )}

            {/* BODY */}
            <motion.div layout className={`relative z-10 flex-1 min-h-0 flex flex-col items-center ${isLandscape ? 'pt-1 pb-0 gap-1' : 'pt-5 pb-3 gap-3'}`}>

                {/* PIN / Modes */}
                <AnimatePresence mode="wait">
                    {!showModes ? (
                        /* ── Khi chưa chọn game ── */
                        <motion.div key="pin" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
                            className="flex-shrink-0 w-full max-w-xs px-4 md:px-0">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => onJoinRoom('', null)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                                style={{
                            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)',
                            border: '1.5px solid rgba(0,180,216,0.25)',
                            boxShadow: '0 4px 12px rgba(0,100,150,0.12)',
                        }}>
                                <span className="shrink-0 text-xs" style={{ color: '#7fb3cc' }}>#</span>
                                <span className="flex-1 font-bold tracking-[0.15em] text-sm text-left" style={{ color: '#7fb3cc' }}>Nhập PIN phòng bạn bè...</span>
                                <span className="text-xs" style={{ color: '#7fb3cc' }}>→</span>
                            </motion.button>
                        </motion.div>
                    ) : modeView === 'home' ? (
                        /* ── TẦNG 1: Solo vs P2P ── */
                        <motion.div key="modes-home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
                            className="flex-shrink-0 w-full max-w-sm px-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <motion.button whileHover={{ x: -2 }} onClick={handleBack}
                                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.8)', color: '#1e3a5f', border: '1px solid rgba(0,180,216,0.2)' }}>
                                    <ArrowLeft size={12} /> Quay lại
                                </motion.button>
                                <span className="font-black text-base" style={{ color: '#1e3a5f' }}>{GAMES.find(g => g.id === selectedGame)?.title}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {/* SOLO */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 3 }}
                                    onClick={() => { enterFullscreen(); handleModeSelect('solo'); }}
                                    className="relative flex items-center gap-4 p-4 rounded-2xl w-full text-left group overflow-hidden"
                                    style={{ background: '#10b981', border: '2px solid #065f46', boxShadow: '0 5px 0 #065f46' }}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-14 h-14 rounded-xl bg-emerald-300 flex items-center justify-center shrink-0 border-2 border-black/20">
                                        <User size={26} strokeWidth={2.5} className="text-emerald-900" />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <p className="font-black text-2xl text-white" style={{ textShadow: '0 2px 0 #065f46' }}>Chơi Đơn</p>
                                        <p className="text-emerald-100 text-sm font-semibold mt-0.5">Tích lũy XP &amp; rèn luyện kỹ năng</p>
                                    </div>
                                    <ChevronRight size={26} strokeWidth={3} className="text-white/60 group-hover:text-white z-10" />
                                </motion.button>

                                {/* P2P */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 3 }}
                                    onClick={() => { enterFullscreen(); setModeView('p2p'); }}
                                    className="relative flex items-center gap-4 p-4 rounded-2xl w-full text-left group overflow-hidden"
                                    style={{ background: '#2563eb', border: '2px solid #1e3a8a', boxShadow: '0 5px 0 #1e3a8a' }}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-14 h-14 rounded-xl bg-blue-300 flex items-center justify-center shrink-0 border-2 border-black/20">
                                        <Users size={26} strokeWidth={2.5} className="text-blue-900" />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <p className="font-black text-2xl text-white" style={{ textShadow: '0 2px 0 #1e3a8a' }}>Đấu Online</p>
                                        <p className="text-blue-100 text-sm font-semibold mt-0.5">Thi đấu với người chơi khác</p>
                                    </div>
                                    <ChevronRight size={26} strokeWidth={3} className="text-white/60 group-hover:text-white z-10" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        /* ── TẦNG 2: P2P Sub-menu ── */
                        <motion.div key="modes-p2p" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}
                            className="flex-shrink-0 w-full max-w-sm px-4 flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                                <motion.button whileHover={{ x: -2 }} onClick={handleBack}
                                    className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                                    <ArrowLeft size={12} /> Quay lại
                                </motion.button>
                                <span className="font-black text-white/80 text-sm">Đấu Online · {GAMES.find(g => g.id === selectedGame)?.title}</span>
                            </div>

                            {/* AUTO MATCH */}
                            <motion.button
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 2 }}
                                onClick={() => { enterFullscreen(); handleModeSelect('auto_match'); }}
                                className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-left group overflow-hidden"
                                style={{ background: '#d97706', border: '2px solid #92400e', boxShadow: '0 4px 0 #92400e' }}>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-11 h-11 rounded-xl bg-amber-300 flex items-center justify-center shrink-0 border-2 border-black/20 text-xl">🎯</div>
                                <div className="flex-1 z-10">
                                    <p className="font-black text-lg text-white" style={{ textShadow: '0 2px 0 #92400e' }}>Auto Match</p>
                                    <p className="text-amber-100 text-xs font-semibold">Tự động tìm đối thủ · Bot nếu không có ai</p>
                                </div>
                                <ChevronRight size={20} strokeWidth={3} className="text-white/60 group-hover:text-white z-10" />
                            </motion.button>

                            {/* DIVIDER */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                                className="flex items-center gap-2 px-1">
                                <div className="flex-1 h-px bg-white/15" />
                                <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">hoặc</span>
                                <div className="flex-1 h-px bg-white/15" />
                            </motion.div>

                            {/* JOIN WITH PIN */}
                            <motion.button
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 2 }}
                                onClick={() => { enterFullscreen(); handleModeSelect('join_pin'); }}
                                className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-left group overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 3px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border-2 border-white/20 text-xl">🔑</div>
                                <div className="flex-1 z-10">
                                    <p className="font-black text-lg text-white">Join With PIN</p>
                                    <p className="text-white/50 text-xs font-semibold">Nhập mã PIN 6 số để vào phòng bạn bè</p>
                                </div>
                                <ChevronRight size={20} strokeWidth={3} className="text-white/30 group-hover:text-white/70 z-10" />
                            </motion.button>

                            {/* CREATE ROOM */}
                            <motion.button
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 2 }}
                                onClick={() => { enterFullscreen(); handleModeSelect('host'); }}
                                className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-left group overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 3px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border-2 border-white/20 text-xl">🏠</div>
                                <div className="flex-1 z-10">
                                    <p className="font-black text-lg text-white">Create Room</p>
                                    <p className="text-white/50 text-xs font-semibold">Tạo phòng riêng · Chia sẻ PIN cho bạn bè</p>
                                </div>
                                <ChevronRight size={20} strokeWidth={3} className="text-white/30 group-hover:text-white/70 z-10" />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Divider */}
                {!showModes && (
                    <motion.div layout className="flex-shrink-0 flex items-center gap-3 w-full max-w-lg px-6">
                        <div className="flex-1 h-px bg-sky-200/60" />
                        <span
                            className="text-[10px] font-black tracking-[0.18em] uppercase px-3 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,180,216,0.2)', color: '#1e3a5f' }}
                        >
                            Chọn game
                        </span>
                        <div className="flex-1 h-px bg-sky-200/60" />
                    </motion.div>
                )}

                {/* CAROUSEL */}
                {!showModes && (
                    <motion.div layout className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-2">
                        <div ref={containerRef} className="relative w-full flex-1 min-h-0 flex items-center overflow-hidden">

                            {/* ← */}
                            <motion.button whileHover={{ scale: 1.12, x: -2 }} whileTap={{ scale: 0.9 }}
                                onClick={() => navigateTo(snapped - 1)} disabled={snapped === 0}
                                className="absolute left-3 md:left-5 z-20 w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(0,180,216,0.3)', backdropFilter: 'blur(8px)', opacity: snapped === 0 ? 0.3 : 1 }}>
                                <ChevronLeft size={18} style={{ color: '#1b9aaa' }} />
                            </motion.button>

                            {/* Draggable strip — no paddingLeft, dragX itself offsets */}
                            {ready && (
                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: dragLeft, right: dragRight }}
                                    dragElastic={0.07}
                                    dragTransition={{ power: 0.25, timeConstant: 160 }}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        x: dragX,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: GAP,
                                        cursor: 'grab',
                                        touchAction: 'none',
                                        willChange: 'transform',
                                    }}
                                >
                                    {GAMES.map((game, i) => (
                                        <GameCard
                                            key={game.id}
                                            game={game}
                                            idx={i}
                                            dragX={dragX}
                                            cwRef={cwRef}
                                            isSnapped={i === snapped}
                                            onPress={() => { if (i !== snapped) navigateTo(i); else handleSelect(game.id); }}
                                            stats={(user?.gameStats || {})[game.id]}
                                            cardW={cardW}
                                            cardH={cardH}
                                            step={step}
                                        />
                                    ))}
                                </motion.div>
                            )}

                            {/* → */}
                            <motion.button whileHover={{ scale: 1.12, x: 2 }} whileTap={{ scale: 0.9 }}
                                onClick={() => navigateTo(snapped + 1)} disabled={snapped === GAMES.length - 1}
                                className="absolute right-3 md:right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(0,180,216,0.3)', backdropFilter: 'blur(8px)', opacity: snapped === GAMES.length - 1 ? 0.3 : 1 }}>
                                <ChevronRight size={18} style={{ color: '#1b9aaa' }} />
                            </motion.button>
                        </div>

                        {/* Dots */}
                        <div className="flex-shrink-0 flex gap-2 pb-2">
                            {GAMES.map((_, i) => (
                                <motion.button key={i} onClick={() => navigateTo(i)}
                                    animate={{ scale: i === snapped ? 1.6 : 1, opacity: i === snapped ? 1 : 0.28 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    className="w-1.5 h-1.5 rounded-full" style={{ background: '#1b9aaa' }} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Floating Dâng Hoa FAB — portrait only */}
            <motion.button
                className="sm:hidden fixed bottom-6 right-4 z-30 flex flex-col items-center gap-1"
                onClick={() => setShowRosary(true)}
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.06 }}
                style={{
                    background: 'linear-gradient(145deg, rgba(255,240,245,0.95), rgba(255,220,235,0.92))',
                    border: '2px solid rgba(220,120,160,0.45)',
                    boxShadow: '0 6px 24px rgba(180,60,100,0.25), 0 2px 0 rgba(200,80,120,0.3)',
                    borderRadius: 20,
                    padding: '10px 16px',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <img src={roseIcon} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    color: '#b03060',
                    textTransform: 'uppercase',
                }}>Hoa Mân Côi</span>
            </motion.button>

        </div>
    );
};

export default MainMenu;
