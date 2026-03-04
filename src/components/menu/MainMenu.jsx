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
import imgQuiz from '../../assets/games/quiz.png';
import imgTrueFalse from '../../assets/games/true_false.png';
import imgSorting from '../../assets/games/thumb_secret_words.png';
import imgGolgotha from '../../assets/games/thumb_golgotha.png';

const GAMES = [
    { id: 'millionaire', title: 'Ai là nhà thần học', subtitle: '', image: imgMillionaire, from: '#9333ea', to: '#4c1d95', isSoloOnly: true },
    { id: 'quiz', title: 'Trắc Nghiệm', subtitle: '4 Đáp Án', image: imgQuiz, from: '#e8294c', to: '#9b1c32', isSoloOnly: false },
    { id: 'true_false', title: 'Đúng / Sai', subtitle: 'Nhận Định', image: imgTrueFalse, from: '#16a34a', to: '#14532d', isSoloOnly: false },
    { id: 'sorting', title: 'Giải ô chữ', subtitle: 'Sự Kiện', image: imgSorting, from: '#d97706', to: '#92400e', isSoloOnly: false },
    { id: 'golgotha', title: 'Đỉnh Golgotha', subtitle: 'Đường Lên', image: imgGolgotha, from: '#0ea5e9', to: '#0369a1', isSoloOnly: false },
];

const CARD_W = 259;
const CARD_H = 364;
const GAP = 28;           // tighter spacing
const STEP = CARD_W + GAP; // 213px between card origins
const MAX_SC = 1.12;         // center card ~12% bigger
const MIN_SC = 0.80;         // far cards ~20% smaller
const SC_RANGE = 1.6;          // cards within 1.6×STEP of center get gradient

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
function useCardTransform(dragX, idx, cwRef) {
    const scale = useTransform(dragX, (xv) => {
        const cw = cwRef.current;
        if (!cw) return MIN_SC;
        const cardCenterX = xv + idx * STEP + CARD_W / 2;
        const distPx = Math.abs(cardCenterX - cw / 2);
        const t = Math.min(distPx / (STEP * SC_RANGE), 1);
        return MAX_SC - (MAX_SC - MIN_SC) * t;
    });
    const zIndex = useTransform(dragX, (xv) => {
        const cw = cwRef.current;
        if (!cw) return 1;
        const cardCenterX = xv + idx * STEP + CARD_W / 2;
        const distPx = Math.abs(cardCenterX - cw / 2);
        return Math.max(1, Math.round(20 - distPx / STEP * 4));
    });
    return { scale, zIndex };
}

/* ─── Card ─── */
const GameCard = ({ game, idx, dragX, cwRef, isSnapped, onPress, stats }) => {
    const { scale, zIndex } = useCardTransform(dragX, idx, cwRef);
    const pointerDownX = useRef(0);
    const hasStats = stats && stats.plays > 0;
    return (
        <motion.div style={{ width: CARD_W, height: CARD_H, scale, zIndex, flexShrink: 0, position: 'relative' }}>
            <motion.button
                onPointerDown={(e) => { pointerDownX.current = e.clientX; }}
                onPointerUp={(e) => {
                    const moved = Math.abs(e.clientX - pointerDownX.current);
                    if (moved < 8) onPress();
                }}
                whileTap={{ y: 3 }}
                className="w-full h-full rounded-3xl overflow-hidden flex flex-col justify-between p-4 relative"
                style={{
                    background: `linear-gradient(160deg,${game.from}ee,${game.to})`,
                    boxShadow: isSnapped
                        ? `inset 0 1px 0 rgba(255,255,255,0.28),
                           inset 0 -3px 0 rgba(0,0,0,0.4),
                           0 7px 0 rgba(0,0,0,0.75),
                           0 12px 36px ${game.from}88`
                        : `inset 0 1px 0 rgba(255,255,255,0.18),
                           inset 0 -3px 0 rgba(0,0,0,0.3),
                           0 5px 0 rgba(0,0,0,0.7),
                           0 8px 22px rgba(0,0,0,0.55)`,
                    userSelect: 'none',
                    cursor: 'grab',
                }}
            >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                {/* Top highlight stripe */}
                <div className="absolute top-0 left-0 right-0 h-px bg-white/30 rounded-t-3xl pointer-events-none" />
                {/* 3D Image Thumbnail */}
                <div className="absolute inset-x-0 top-[8%] bottom-[30%] flex justify-center pointer-events-none drop-shadow-2xl">
                    <img
                        src={game.image}
                        alt={game.title}
                        className={`${game.id === 'millionaire' ? 'w-[80%]' : 'w-[210px]'} object-contain`}
                    />
                </div>

                {/* Subtitle / Title at bottom */}
                <div className="absolute bottom-8 left-0 right-0 text-center select-none pointer-events-none">
                    <span className="block text-xs font-black tracking-[0.16em] text-white/60 uppercase mb-1">
                        {game.subtitle}
                    </span>
                    <span className="block font-black text-3xl leading-tight text-white drop-shadow-md">
                        {game.title}
                    </span>
                </div>

                {/* Stats badges: XP + plays */}
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-[108px] left-0 right-0 flex justify-center gap-2 pointer-events-none select-none"
                >
                    <span
                        className="flex items-center gap-1 text-xs font-black text-yellow-200 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,220,50,0.25)' }}
                    >
                        ⚡ {(stats?.xp || 0).toLocaleString()} XP
                    </span>
                    <span
                        className="flex items-center gap-1 text-xs font-black text-white/70 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                        🎮 {stats?.plays || 0} lần
                    </span>
                </motion.div>

                {isSnapped && (
                    <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 right-4 text-xs font-black text-white/80 bg-white/25 px-3 py-1 rounded-full uppercase tracking-widest"
                        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 0 rgba(0,0,0,0.2)' }}>
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

    const [snapped, setSnapped] = useState(0);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showModes, setShowModes] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [pin, setPin] = useState('');
    const [pinFocused, setPinFocused] = useState(false);
    const [ready, setReady] = useState(false);   // show strip only after cw known
    const profileRef = useRef(null);

    /* Measure → set cwRef + initial dragX so card-0 is centred */
    useEffect(() => {
        const measure = () => {
            const w = containerRef.current?.offsetWidth;
            if (w && w > 0) {
                cwRef.current = w;
                const centerX = w / 2 - CARD_W / 2;   // dragX that centres card-0
                dragX.set(centerX);
                setReady(true);
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [dragX]);

    /* navigate: dragX = centerX - idx*STEP */
    const navigateTo = useCallback((idx) => {
        const i = Math.max(0, Math.min(GAMES.length - 1, idx));
        setSnapped(i);
        const centerX = cwRef.current / 2 - CARD_W / 2;
        animate(dragX, centerX - i * STEP, { type: 'spring', stiffness: 300, damping: 30 });
    }, [dragX]);

    /* snap on drag end with velocity bias */
    const handleDragEnd = useCallback((_, info) => {
        const xv = dragX.get();
        const centerX = cwRef.current / 2 - CARD_W / 2;
        const rawIdx = (centerX - xv) / STEP;
        const vBias = -info.velocity.x / (STEP * 6);
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

    // Drag boundaries: card-0 centred (max right) ↔ last card centred (max left)
    const centerX = cwRef.current / 2 - CARD_W / 2;
    const dragLeft = centerX - (GAMES.length - 1) * STEP;
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
                <div className="relative z-20 flex-shrink-0 flex items-center h-16 px-5 md:px-8 gap-4"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xl">✝️</span>
                        <span className="font-cinzel font-black text-xl"
                            style={{ background: 'linear-gradient(135deg,#fbbf24,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 1px 4px rgba(245,158,11,0.5))' }}>
                            Catholic Quiz!
                        </span>
                    </div>

                    <div className="flex-1 text-center hidden md:block">
                        <span className="text-white/45 text-sm italic">Học hỏi Lời Chúa qua trò chơi</span>
                    </div>

                    <div ref={profileRef} className="relative flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.13)' }}>
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white text-xs">
                                {(user.name || 'K')[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-bold text-white text-xs leading-none">{user.name}</span>
                                <span className="text-amber-300 text-[9px] flex items-center gap-1 mt-0.5">
                                    <Trophy size={8} /> {rankName} · {(user.score || 0).toLocaleString()} XP
                                </span>
                            </div>
                            <ChevronRight size={11} className={`text-white/25 transition-transform ${profileOpen ? 'rotate-90' : ''}`} />
                        </motion.button>

                        <AnimatePresence>
                            {profileOpen && (
                                <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-full mt-2 right-0 w-52 z-50 rounded-2xl shadow-2xl overflow-hidden"
                                    style={{ background: 'rgba(8,5,35,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="p-2.5 border-b border-white/5">
                                        {user.isGuest
                                            ? <span className="flex items-center gap-1.5 text-xs font-bold text-orange-300 bg-orange-400/10 px-2.5 py-1.5 rounded-lg"><User size={10} /> Khách</span>
                                            : <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-400/10 px-2.5 py-1.5 rounded-lg"><Shield size={10} /> Đã bảo vệ</span>}
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                        {user.isGuest && (
                                            <button onClick={onLinkAccount} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/8 rounded-xl text-left">
                                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-3.5 h-3.5" /> Liên kết Google
                                            </button>
                                        )}
                                        <button onClick={() => setShowRoadmap(true)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/10 rounded-xl text-left group">
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
            <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center pt-5 pb-3 gap-3">

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
                            <div className={`grid gap-3 ${GAMES.find(g => g.id === selectedGame)?.isSoloOnly ? 'grid-cols-1 max-w-[150px]' : 'grid-cols-3'}`}>
                                {[
                                    { icon: User, label: 'Solo', desc: 'Tích lũy XP', from: '#22c55e', to: '#15803d', mode: 'solo' },
                                    ...(!GAMES.find(g => g.id === selectedGame)?.isSoloOnly ? [
                                        { icon: Users, label: 'Tạo Phòng', desc: 'Chia sẻ PIN', from: '#3b82f6', to: '#1d4ed8', mode: 'host' },
                                        { icon: Play, label: 'Tìm Trận', desc: 'Ghép ngẫu nhiên', from: '#f59e0b', to: '#d97706', mode: 'p2p_public' },
                                    ] : [])
                                ].map(({ icon: Icon, label, desc, from, to, mode }) => (
                                    <motion.button key={mode} whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => onCreateGame(selectedGame, mode)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl text-white text-center"
                                        style={{ background: `linear-gradient(135deg,${from},${to})`, boxShadow: `0 6px 18px ${from}55` }}>
                                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Icon size={18} /></div>
                                        <div><div className="font-black text-sm">{label}</div><div className="text-white/60 text-[10px]">{desc}</div></div>
                                    </motion.button>
                                ))}
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
