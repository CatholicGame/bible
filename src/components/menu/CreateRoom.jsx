import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Users, Globe, Lock, ChevronRight } from 'lucide-react';
import { useRoom } from '../../hooks/useRoom';
import { useUserStore } from '../../store/userStore';
import bgImage from '../../assets/common/common_background.png';
import { getBetOptions } from '../../utils/ranks';

/* ── Stagger animation ── */
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const ROOM_TYPES = [
    {
        id: 'private',
        icon: Lock,
        label: 'Phòng Riêng',
        desc: 'Dùng mã PIN để mời bạn bè',
        color: '#3b82f6',
        border: '#1e3a8a',
        shadow: '#1e3a8a',
        iconBg: '#bfdbfe',
        iconColor: '#1e40af',
    },
    {
        id: 'public',
        icon: Globe,
        label: 'Phòng Công Khai',
        desc: 'Ai cũng có thể tham gia',
        color: '#10b981',
        border: '#065f46',
        shadow: '#065f46',
        iconBg: '#a7f3d0',
        iconColor: '#065f46',
    },
];

const MAX_PLAYERS_OPTIONS = [2];  // Game này chỉ hỗ trợ 2 người

const CreateRoom = ({ gameName, gameType = 'quiz', onBack, onRoomCreated }) => {
    const { createRoom } = useRoom();
    const { coins: userCoins, globalScore } = useUserStore();
    const [roomType, setRoomType] = useState('private');
    const [loading, setLoading] = useState(false);

    // Bet system
    const minBet = 100;
    const [betCoins, setBetCoins] = useState(minBet);
    const [customBetInput, setCustomBetInput] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    // Mouse drag scroll for bet chips
    const betScrollRef = useRef(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const onMouseDown = useCallback((e) => {
        isDragging.current = true;
        startX.current = e.pageX - betScrollRef.current.offsetLeft;
        scrollLeft.current = betScrollRef.current.scrollLeft;
        betScrollRef.current.style.cursor = 'grabbing';
    }, []);
    const onMouseMove = useCallback((e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - betScrollRef.current.offsetLeft;
        betScrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
    }, []);
    const onMouseUp = useCallback(() => {
        isDragging.current = false;
        if (betScrollRef.current) betScrollRef.current.style.cursor = 'grab';
    }, []);

    const handlePresetBet = (coins) => {
        setBetCoins(coins);
        setIsCustom(false);
        setCustomBetInput('');
    };

    const handleCustomBetChange = (val) => {
        const num = val.replace(/[^0-9]/g, '');
        setCustomBetInput(num);
        const parsed = parseInt(num, 10);
        if (!isNaN(parsed) && parsed >= minBet) {
            setBetCoins(parsed);
        }
    };

    const handleCustomBetBlur = () => {
        const parsed = parseInt(customBetInput, 10);
        if (isNaN(parsed) || parsed < minBet) {
            setBetCoins(minBet);
            setCustomBetInput(String(minBet));
        } else {
            const capped = Math.min(parsed, userCoins || 0);
            const final = Math.max(minBet, capped);
            setBetCoins(final);
            setCustomBetInput(String(final));
        }
    };

    const handleCreate = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const pin = await createRoom(gameType);
            onRoomCreated?.(pin);
        } catch (e) {
            console.error('Tạo phòng thất bại:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blurred background image */}
            <div className="absolute inset-0 -z-10">
                <img src={bgImage} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(18px) brightness(0.3)', transform: 'scale(1.1)' }} />
            </div>

            <motion.div
                key="config"
                initial={{ opacity: 0, scale: 0.88, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -20 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="relative w-full max-w-sm overflow-hidden"
                style={{
                    borderRadius: 28,
                    background: '#2563eb',
                    border: '4px solid #1e3a8a',
                    boxShadow: '0 10px 0 #1e3a8a, 0 20px 40px rgba(0,0,0,0.5)',
                }}
            >
                        {/* Top shine */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/8 pointer-events-none rounded-t-3xl" />

                        {/* Header */}
                        <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9, x: -2 }}
                                onClick={onBack}
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    background: '#1d4ed8',
                                    border: '3px solid #1e3a8a',
                                    boxShadow: '0 4px 0 #1e3a8a',
                                }}
                            >
                                <ArrowLeft size={18} className="text-white" strokeWidth={3} />
                            </motion.button>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    background: '#f59e0b',
                                    border: '3px solid #b45309',
                                    boxShadow: '0 4px 0 #b45309',
                                }}
                            >
                                <Trophy size={18} className="text-amber-900" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="px-5 pb-5"
                        >
                            <motion.h2
                                variants={fadeUp}
                                className="text-center font-black text-3xl uppercase tracking-wider mb-1"
                                style={{
                                    color: '#fbbf24',
                                    textShadow: '0 2px 0 #b45309, 0 4px 10px rgba(180,83,9,0.3)',
                                }}
                            >
                                TẠO PHÒNG
                            </motion.h2>
                            <motion.p variants={fadeUp} className="text-center text-blue-200 text-xs font-semibold mb-4 tracking-wide">
                                {gameName}
                            </motion.p>

                            {/* White inner card */}
                            <motion.div
                                variants={fadeUp}
                                className="rounded-2xl p-4 space-y-4 mb-4"
                                style={{
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '3px solid #e2e8f0',
                                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,1), 0 4px 0 rgba(30,58,138,0.15)',
                                }}
                            >
                                {/* Room type selection */}
                                <div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                                        Loại phòng
                                    </p>
                                    <div className="flex gap-2">
                                        {ROOM_TYPES.map((rt) => {
                                            const Icon = rt.icon;
                                            const selected = roomType === rt.id;
                                            return (
                                                <motion.button
                                                    key={rt.id}
                                                    whileTap={{ scale: 0.96, y: 2 }}
                                                    onClick={() => setRoomType(rt.id)}
                                                    className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl relative overflow-hidden transition-all"
                                                    style={{
                                                        background: selected ? rt.color : '#f1f5f9',
                                                        border: `3px solid ${selected ? rt.border : '#e2e8f0'}`,
                                                        boxShadow: selected ? `0 4px 0 ${rt.shadow}` : '0 2px 0 #cbd5e1',
                                                        transform: selected ? 'translateY(-2px)' : 'none',
                                                    }}
                                                >
                                                    {selected && (
                                                        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                                                    )}
                                                    <div
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                        style={{
                                                            background: selected ? rt.iconBg : '#e2e8f0',
                                                            border: `2px solid ${selected ? rt.border + '55' : '#cbd5e1'}`,
                                                        }}
                                                    >
                                                        <Icon size={18} style={{ color: selected ? rt.iconColor : '#94a3b8' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span
                                                        className="text-[11px] font-black text-center leading-tight"
                                                        style={{ color: selected ? 'white' : '#64748b' }}
                                                    >
                                                        {rt.label}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Max players — locked at 2 for now */}
                                <div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                                        Số người chơi
                                    </p>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                        style={{ background: '#f1f5f9', border: '2px solid #e2e8f0' }}>
                                        <Users size={14} className="text-blue-400" />
                                        <span className="text-sm font-black text-slate-600">2 người chơi (1 vs 1)</span>
                                    </div>
                                </div>

                                {/* Bet coins selection */}
                                <div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                                        Cược Coin
                                        <span className="ml-auto text-[10px] font-bold text-amber-600 normal-case tracking-normal">💰 {(userCoins || 0).toLocaleString()} có sẵn</span>
                                    </p>

                                    {/* Preset bet chips — swipeable */}
                                    <div ref={betScrollRef}
                                        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                                        className="flex gap-2 mb-2 overflow-x-auto pt-1 pb-1.5 -mx-1 px-1"
                                        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab', userSelect: 'none' }}>
                                        {[100, 200, 300, 500, 700, 1000, 1500, 2000, 3000, 5000].map((amount) => {
                                            const selected = !isCustom && betCoins === amount;
                                            const canAfford = (userCoins || 0) >= amount;
                                            return (
                                                <button
                                                    key={amount}
                                                    onClick={() => handlePresetBet(amount)}
                                                    disabled={!canAfford}
                                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-sm transition-all ${!canAfford ? 'opacity-30 grayscale cursor-not-allowed line-through' : ''}`}
                                                    style={{
                                                        background: selected && canAfford ? '#f59e0b' : '#f1f5f9',
                                                        border: `2.5px solid ${selected && canAfford ? '#b45309' : '#e2e8f0'}`,
                                                        boxShadow: selected && canAfford ? '0 3px 0 #b45309' : '0 2px 0 #cbd5e1',
                                                        transform: selected && canAfford ? 'translateY(-1px)' : 'none',
                                                        color: selected && canAfford ? '#78350f' : '#334155',
                                                    }}
                                                >
                                                    💰 {amount.toLocaleString()}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom bet input */}
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isCustom ? 'ring-2 ring-amber-400' : ''}`}
                                            style={{ background: '#f1f5f9', border: '2px solid #e2e8f0' }}>
                                            <span className="text-sm">💰</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder={`Tối thiểu ${minBet}`}
                                                value={customBetInput}
                                                onFocus={() => setIsCustom(true)}
                                                onChange={(e) => handleCustomBetChange(e.target.value)}
                                                onBlur={handleCustomBetBlur}
                                                className="flex-1 bg-transparent outline-none text-sm font-black text-slate-700 placeholder:text-slate-400 placeholder:font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Room summary */}
                                <div className="rounded-xl p-3 flex items-center gap-3"
                                    style={{ background: '#f8fafc', border: '2px solid #e2e8f0' }}>
                                    <Users size={16} className="text-blue-400 flex-shrink-0" />
                                    <div className="flex-1 text-xs text-slate-600 font-semibold leading-snug">
                                        Phòng <strong className="text-blue-600">{ROOM_TYPES.find(r => r.id === roomType)?.label}</strong> — <strong className="text-blue-600">2 người</strong> · {gameType} · <strong className="text-amber-600">💰 {betCoins.toLocaleString()}</strong>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Create button */}
                            <motion.button
                                variants={fadeUp}
                                whileHover={!loading ? { scale: 1.03 } : {}}
                                whileTap={!loading ? { scale: 0.97, y: 4 } : {}}
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 font-black text-lg uppercase tracking-widest py-4 rounded-full relative overflow-hidden transition-all"
                                style={{
                                    background: loading ? '#e2e8f0' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    color: loading ? '#94a3b8' : '#1e3a8a',
                                    border: `4px solid ${loading ? '#cbd5e1' : '#b45309'}`,
                                    boxShadow: loading ? '0 4px 0 #cbd5e1' : '0 6px 0 #b45309, 0 10px 24px rgba(245,158,11,0.35)',
                                    WebkitTextStroke: loading ? 'none' : '0.5px #92400e',
                                }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/25 pointer-events-none" />
                                {loading
                                    ? <div className="w-5 h-5 border-3 border-slate-400 border-t-transparent rounded-full animate-spin relative z-10" />
                                    : <><Users size={20} strokeWidth={3} className="relative z-10" /><span className="relative z-10">TẠO PHÒNG NGAY</span></>}
                            </motion.button>
                        </motion.div>
                    </motion.div>

        </div>
    );
};

export default CreateRoom;
