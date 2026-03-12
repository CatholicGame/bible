import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
    Users, User, Play, ArrowLeft, Trophy, Shield,
    LogOut, Map, ChevronRight, ArrowRight, Hash, ChevronLeft,
} from 'lucide-react';
import { getRankByScore } from '../../utils/ranks';
import RankRoadmap from '../profile/RankRoadmap';
import bgImage from '../../assets/common/common_background.png';

// Game thumbnail imports
import imgMillionaire from '../../assets/games/millionaire.png';
import imgSorting from '../../assets/games/thumb_secret_words.png';
import imgGolgotha from '../../assets/games/thumb_golgotha.png';

const GAMES = [
    { id: 'millionaire', title: 'Ai là nhà thần học', subtitle: '', image: imgMillionaire, from: '#9333ea', to: '#4c1d95', isSoloOnly: true },
    { id: 'sorting', title: 'Giải ô chữ', subtitle: 'Sự Kiện', image: imgSorting, from: '#d97706', to: '#92400e', isSoloOnly: false },
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
    return { scale, zIndex };
}

/* ─── Card ─── */
const GameCard = ({ game, idx, dragX, cwRef, isSnapped, onPress, stats, cardW, cardH, step }) => {
    const { scale, zIndex } = useCardTransform(dragX, idx, cwRef, cardW, step);
    const pointerDownX = useRef(0);
    const hasStats = stats && stats.plays > 0;

    // Scale font/spacing proportionally so cards look right at any size
    const titleSize   = Math.round(cardH * 0.082);
    const badgeSize   = Math.round(cardH * 0.030);
    const bottomOff   = Math.round(cardH * 0.088);
    const badgeOff    = Math.round(cardH * 0.300);
    const borderRad   = Math.round(cardH * 0.065); // ~24px at 364, ~14px at small

    return (
        <motion.div style={{ width: cardW, height: cardH, scale, zIndex, flexShrink: 0, position: 'relative' }}>
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
                    background: `linear-gradient(160deg,${game.from}ee,${game.to})`,
                    boxShadow: isSnapped
                        ? `inset 0 1px 0 rgba(255,255,255,0.28),
                           inset 0 -3px 0 rgba(0,0,0,0.4),
                           0 ${step < 200 ? 3 : 7}px 0 rgba(0,0,0,0.75),
                           0 ${step < 200 ? 6 : 12}px 24px ${game.from}88`
                        : `inset 0 1px 0 rgba(255,255,255,0.18),
                           inset 0 -3px 0 rgba(0,0,0,0.3),
                           0 ${step < 200 ? 2 : 5}px 0 rgba(0,0,0,0.7),
                           0 ${step < 200 ? 4 : 8}px 16px rgba(0,0,0,0.55)`,
                    userSelect: 'none',
                    cursor: 'grab',
                }}
            >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                {/* Top highlight stripe */}
                <div className="absolute top-0 left-0 right-0 h-px bg-white/30 rounded-t-3xl pointer-events-none" />
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
                    <span className="block font-black tracking-[0.1em] text-white/60 uppercase mb-0.5"
                        style={{ fontSize: badgeSize }}>
                        {game.subtitle}
                    </span>
                    <span className="block font-black leading-tight text-white drop-shadow-md px-1 truncate"
                        style={{ fontSize: titleSize }}>
                        {game.title}
                    </span>
                </div>

                {/* Stats badges: XP + plays */}
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 flex justify-center gap-1.5 pointer-events-none select-none"
                    style={{ bottom: badgeOff }}
                >
                    <span
                        className="flex items-center gap-0.5 font-black text-yellow-200 px-2 py-0.5 rounded-full"
                        style={{ fontSize: badgeSize, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,220,50,0.25)' }}
                    >
                        ⚡ {(stats?.xp || 0).toLocaleString()} XP
                    </span>
                    <span
                        className="flex items-center gap-0.5 font-black text-white/70 px-2 py-0.5 rounded-full"
                        style={{ fontSize: badgeSize, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                        🎮 {stats?.plays || 0} lần
                    </span>
                </motion.div>

                {isSnapped && (
                    <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-3 font-black text-white/80 bg-white/25 px-2.5 py-0.5 rounded-full uppercase tracking-widest"
                        style={{ fontSize: badgeSize, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 0 rgba(0,0,0,0.2)' }}>
                        Chơi
                    </motion.span>
                )}
            </motion.button>
        </motion.div>
    );
};

/* ══ MainMenu ══ */
const MainMenu = ({ user, onJoinRoom, onCreateGame, onLinkAccount, onUpdateName }) => {
    const containerRef = useRef(null);
    const cwRef = useRef(0);
    const dragX = useMotionValue(0);
    const cardDimsRef = useRef({ cardW: BASE_CARD_W, cardH: BASE_CARD_H, step: BASE_CARD_W + GAP });

    const [snapped, setSnapped] = useState(0);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showModes, setShowModes] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [pin, setPin] = useState('');
    const [pinFocused, setPinFocused] = useState(false);
    const [ready, setReady] = useState(false);
    const [cardDims, setCardDims] = useState({ cardW: BASE_CARD_W, cardH: BASE_CARD_H, step: BASE_CARD_W + GAP });
    const [isLandscape, setIsLandscape] = useState(false);
    const profileRef = useRef(null);

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
            const step = cardW + GAP;

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

    useEffect(() => {
        const h = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleSelect = (id) => {
        const g = GAMES.find(g => g.id === id);
        if (g?.isSoloOnly) onCreateGame(id, 'solo');
        else { setSelectedGame(id); setShowModes(true); }
    };
    const handleBack = () => { setShowModes(false); setTimeout(() => setSelectedGame(null), 300); };

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
                    style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.62)0%,rgba(0,0,0,0.04)42%,rgba(0,0,0,0.6)100%)' }} />
            </div>

            {/* HEADER */}
            {user && (
                <div className="relative z-20 flex-shrink-0 flex items-center h-14 px-4 md:px-6 gap-3"
                    style={{ background: '#2563eb', borderBottom: '4px solid #1e3a8a' }}>

                    {/* Logo */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center text-sm relative overflow-hidden flex-shrink-0"
                            style={{ border: '2px solid #b45309', boxShadow: '0 2px 0 #b45309' }}>
                            <div className="absolute inset-0 w-full h-1/2 bg-white/30 pointer-events-none" />
                            <span className="relative z-10">✝️</span>
                        </div>
                        <span className="font-black text-base text-white hidden sm:block" style={{ textShadow: '0 2px 0 #1e3a8a' }}>
                            Catholic <span className="text-yellow-300" style={{ textShadow: '0 2px 0 #b45309' }}>Quiz!</span>
                        </span>
                    </div>

                    <div className="flex-1 text-center hidden md:block">
                        <span className="text-blue-200/70 text-xs font-bold italic">Học hỏi Lời Chúa qua trò chơi</span>
                    </div>

                    {/* User button */}
                    <div ref={profileRef} className="relative flex-shrink-0">
                        <motion.button whileTap={{ y: 2 }}
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            style={{ border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 3px 0 rgba(30,58,138,0.6)' }}>
                            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center font-black text-amber-800 text-xs flex-shrink-0"
                                style={{ border: '2px solid #b45309' }}>
                                {(user.name || 'K')[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-black text-white text-xs leading-none">{user.name}</span>
                                <span className="text-yellow-300 text-[9px] flex items-center gap-0.5 mt-0.5 font-bold">
                                    <Trophy size={8} /> {(user.score || 0).toLocaleString()} XP
                                </span>
                            </div>
                            <ChevronRight size={11} className={`text-white/60 transition-transform ${profileOpen ? 'rotate-90' : ''}`} />
                        </motion.button>

                        <AnimatePresence>
                            {profileOpen && (
                                <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-full mt-2 right-0 w-52 z-50 rounded-2xl overflow-hidden"
                                    style={{ background: '#1e3a8a', border: '3px solid #1e40af', boxShadow: '0 6px 0 rgba(30,58,138,0.8)' }}>
                                    <div className="p-2.5 border-b border-white/10">
                                        {user.isGuest
                                            ? <span className="flex items-center gap-1.5 text-xs font-bold text-orange-300 bg-orange-400/20 px-2.5 py-1.5 rounded-lg"><User size={10} /> Khách</span>
                                            : <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-400/20 px-2.5 py-1.5 rounded-lg"><Shield size={10} /> Đã bảo vệ</span>}
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                        {user.isGuest && (
                                            <button onClick={onLinkAccount} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 rounded-xl text-left">
                                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-3.5 h-3.5" /> Liên kết Google
                                            </button>
                                        )}
                                        <button onClick={() => setShowRoadmap(true)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-yellow-300 hover:bg-yellow-400/10 rounded-xl text-left group">
                                            <span className="flex items-center gap-2"><Map size={12} /> Hành trình vươn đỉnh</span>
                                            <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                        {!user.isGuest && (
                                            <button onClick={() => window.location.reload()} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-400/10 rounded-xl text-left">
                                                Đăng xuất <LogOut size={11} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Roadmap */}
            <AnimatePresence>
                {showRoadmap && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-8">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden">
                            <RankRoadmap currentScore={user?.score} onBack={() => setShowRoadmap(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BODY */}
            <div className={`relative z-10 flex-1 min-h-0 flex flex-col items-center ${isLandscape ? 'pt-1 pb-0 gap-1' : 'pt-5 pb-3 gap-3'}`}>

                {/* PIN / Modes */}
                <AnimatePresence mode="wait">
                    {!showModes ? (
                        <motion.div key="pin" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex-shrink-0 w-full max-w-xs px-4 md:px-0">
                            <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{
                                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(14px)',
                                border: pinFocused ? '1.5px solid rgba(251,191,36,0.7)' : '1.5px solid rgba(255,255,255,0.15)',
                                boxShadow: pinFocused ? '0 0 24px rgba(245,158,11,0.3)' : '0 4px 20px rgba(0,0,0,0.4)',
                                transition: 'border-color .25s,box-shadow .25s',
                            }}>
                                <Hash size={13} className="text-white/35 shrink-0" />
                                <input type="text" value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    onFocus={() => setPinFocused(true)} onBlur={() => setPinFocused(false)}
                                    placeholder="Nhập PIN phòng..." maxLength={6}
                                    className="flex-1 bg-transparent text-white placeholder-white/25 font-bold tracking-[0.2em] text-sm outline-none" />
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => pin.length >= 4 && onJoinRoom(pin)} disabled={pin.length < 4}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={pin.length >= 4
                                        ? { background: 'linear-gradient(135deg,#fbbf24,#d97706)', boxShadow: '0 2px 12px rgba(217,119,6,0.5)' }
                                        : { background: 'rgba(255,255,255,0.08)', opacity: 0.35 }}>
                                    <ArrowRight size={13} className="text-white" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="modes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex-shrink-0 w-full max-w-sm px-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <motion.button whileHover={{ x: -2 }} onClick={handleBack}
                                    className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                                    <ArrowLeft size={12} /> Quay lại
                                </motion.button>
                                <span className="font-black text-white text-base drop-shadow">{GAMES.find(g => g.id === selectedGame)?.title}</span>
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                {[
                                    { icon: User, label: 'Chơi Đơn', desc: 'Tích lũy XP & rèn luyện', color: 'emerald', mode: 'solo' },
                                    ...(!GAMES.find(g => g.id === selectedGame)?.isSoloOnly ? [
                                        { icon: Users, label: 'Tạo Phòng', desc: 'Làm chủ phòng, thiết lập luật', color: 'blue', mode: 'host' },
                                        { icon: Play, label: 'Tìm Trận', desc: 'Ghép ngẫu nhiên online', color: 'amber', mode: 'p2p_public' },
                                    ] : [])
                                ].map(({ icon: Icon, label, desc, color, mode }) => {
                                    const colorStyles = {
                                        emerald: {
                                            bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
                                            border: 'border-emerald-500/30 hover:border-emerald-400/60',
                                            iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
                                            shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
                                            glow: 'bg-emerald-500'
                                        },
                                        blue: {
                                            bg: 'bg-blue-500/10 hover:bg-blue-500/20',
                                            border: 'border-blue-500/30 hover:border-blue-400/60',
                                            iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
                                            shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
                                            glow: 'bg-blue-500'
                                        },
                                        amber: {
                                            bg: 'bg-amber-500/10 hover:bg-amber-500/20',
                                            border: 'border-amber-500/30 hover:border-amber-400/60',
                                            iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
                                            shadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
                                            glow: 'bg-amber-500'
                                        }
                                    }[color];

                                    return (
                                        <motion.button key={mode}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onCreateGame(selectedGame, mode)}
                                            className={`relative overflow-hidden flex items-center gap-4 p-3.5 rounded-2xl w-full text-left backdrop-blur-md border transition-all duration-300 group ${colorStyles.bg} ${colorStyles.border} ${colorStyles.shadow}`}
                                        >
                                            <div className={`absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 ${colorStyles.glow} opacity-0 group-hover:opacity-20 blur-2xl rounded-full transition-opacity duration-500 pointer-events-none`}></div>

                                            <div className={`w-11 h-11 rounded-xl ${colorStyles.iconBg} flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative z-10`}>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <Icon size={20} className="text-white drop-shadow-md" />
                                            </div>

                                            <div className="flex-1 flex flex-col z-10">
                                                <span className="font-black text-white text-base tracking-wide drop-shadow-sm leading-tight">{label}</span>
                                                <span className="text-white/60 text-[11px] font-medium mt-0.5">{desc}</span>
                                            </div>

                                            <ChevronRight size={18} className="text-white/20 group-hover:text-white/70 transition-colors z-10" />
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Divider */}
                {!showModes && (
                    <div className="flex-shrink-0 flex items-center gap-3 w-full max-w-lg px-6">
                        <div className="flex-1 h-px bg-white/20" />
                        <span
                            className="text-white text-[10px] font-black tracking-[0.18em] uppercase px-3 py-1 rounded-full"
                            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                            Chọn game
                        </span>
                        <div className="flex-1 h-px bg-white/20" />
                    </div>
                )}

                {/* CAROUSEL */}
                {!showModes && (
                    <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-2">
                        <div ref={containerRef} className="relative w-full flex-1 min-h-0 flex items-center overflow-hidden">

                            {/* ← */}
                            <motion.button whileHover={{ scale: 1.12, x: -2 }} whileTap={{ scale: 0.9 }}
                                onClick={() => navigateTo(snapped - 1)} disabled={snapped === 0}
                                className="absolute left-3 md:left-5 z-20 w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(0,0,0,0.48)', border: '1px solid rgba(255,255,255,0.15)', opacity: snapped === 0 ? 0.18 : 0.85 }}>
                                <ChevronLeft size={18} className="text-white" />
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
                                style={{ background: 'rgba(0,0,0,0.48)', border: '1px solid rgba(255,255,255,0.15)', opacity: snapped === GAMES.length - 1 ? 0.18 : 0.85 }}>
                                <ChevronRight size={18} className="text-white" />
                            </motion.button>
                        </div>

                        {/* Dots */}
                        <div className="flex-shrink-0 flex gap-2 pb-2">
                            {GAMES.map((_, i) => (
                                <motion.button key={i} onClick={() => navigateTo(i)}
                                    animate={{ scale: i === snapped ? 1.6 : 1, opacity: i === snapped ? 1 : 0.28 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    className="w-1.5 h-1.5 rounded-full bg-white" />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainMenu;
