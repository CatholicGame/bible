import { useState, useEffect, useRef, useCallback } from 'react';
import coinImg from '../../assets/common/coin.png';
import trophyImg from '../../assets/common/trophy.png';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Trophy, Star, Award, Swords,
    User, Shield, Map, ChevronRight, TrendingUp, Crown, Pen,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { usePlayFabStore } from '../../store/playfabStore';
import UserAvatar from '../common/UserAvatar';
import {
    RANK_TIERS, getRankByScore, getRankLevel,
    getNextRank, getProgressToNextRank, formatNumber,
} from '../../utils/ranks';

/* ── Count-up hook: animates a number from 0 to target ── */
const useCountUp = (target, duration = 1200, delay = 400) => {
    const [count, setCount] = useState(0);
    const rafRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        const num = typeof target === 'number' ? target : parseFloat(target) || 0;
        if (num === 0) { setCount(0); return; }
        const timer = setTimeout(() => {
            startRef.current = performance.now();
            const animate = (now) => {
                const elapsed = now - startRef.current;
                const t = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
                setCount(Math.round(eased * num));
                if (t < 1) rafRef.current = requestAnimationFrame(animate);
            };
            rafRef.current = requestAnimationFrame(animate);
        }, delay);
        return () => { clearTimeout(timer); cancelAnimationFrame(rafRef.current); };
    }, [target, duration, delay]);
    return count;
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
};

const popIn = {
    hidden: { opacity: 0, scale: 0.7 },
    visible: (i) => ({
        opacity: 1, scale: 1,
        transition: { delay: i * 0.1 + 0.15, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
    }),
};

const ProfileScreen = ({ user, onBack, onOpenRoadmap }) => {
    const globalScore = useUserStore(state => state.globalScore);
    const coins = useUserStore(state => state.coins);
    const stats = useUserStore(state => state.stats);
    const avatarUrl = usePlayFabStore(state => state.avatarUrl);
    const giaoxu = usePlayFabStore(state => state.giaoxu);
    const hat = usePlayFabStore(state => state.hat);
    const giaophan = usePlayFabStore(state => state.giaophan);
    const tinhthanh = usePlayFabStore(state => state.tinhthanh);
    const saveProfile = usePlayFabStore(state => state.saveProfile);
    const saveDisplayName = usePlayFabStore(state => state.saveDisplayName);
    const nickname = usePlayFabStore(state => state.nickname);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    useEffect(() => {
        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const score = globalScore || user?.score || 0;
    const userCoins = coins || 0;
    const rankName = getRankByScore(score);
    const rankLevel = getRankLevel(score);
    const nextRank = getNextRank(score);
    const progress = getProgressToNextRank(score);
    const xpToNext = nextRank ? nextRank.minXP - score : 0;

    const solo = stats?.solo || { plays: 0, perfects: 0, totalCorrect: 0, totalQuestions: 0 };
    const p2p = stats?.p2p || { plays: 0, wins: 0, losses: 0, totalCorrect: 0, totalQuestions: 0 };
    const totalGames = solo.plays + p2p.plays;
    const avgCorrect = solo.plays > 0 ? (solo.totalCorrect / solo.plays).toFixed(1) : '0';
    const winRate = p2p.plays > 0 ? Math.round((p2p.wins / p2p.plays) * 100) : 0;

    const displayName = nickname || user?.name || 'Khách';
    const initial = displayName[0]?.toUpperCase() || 'K';

    /* ════ Shared sub-components ════ */
    const AvatarSection = () => (
        <div className={`flex ${isLandscape ? 'flex-row items-center gap-4' : 'flex-col items-center gap-2'}`}>
            <div className="relative flex-shrink-0">
                <UserAvatar
                    name={displayName}
                    photoURL={avatarUrl}
                    size={isLandscape ? 56 : 80}
                    ring={true}
                />
                <div className={`absolute -bottom-1 -right-1 ${isLandscape ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'} rounded-full bg-blue-600 flex items-center justify-center font-black text-white z-10`}
                    style={{ border: '3px solid #0f172a', boxShadow: '0 2px 0 #000' }}>
                    {rankLevel}
                </div>
            </div>
            <div className={isLandscape ? 'text-left' : 'text-center'}>
                <h2 className={`font-black ${isLandscape ? 'text-lg' : 'text-xl'} text-white drop-shadow-md`}>{displayName}</h2>
                <div className={`flex items-center gap-2 ${isLandscape ? '' : 'justify-center'} mt-1`}>
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#78350f',
                            border: '2px solid #b45309',
                            boxShadow: '0 2px 0 #92400e',
                        }}>
                        <Crown size={10} /> {rankName}
                    </span>
                    {user?.isGuest ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-orange-300 bg-orange-400/20 px-2 py-0.5 rounded-full border border-orange-400/30">
                            <User size={8} /> Khách
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <Shield size={8} /> Đã bảo vệ
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    const CurrencyCards = () => (
        <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, #f59e0b, #d97706)',
                    border: '3px solid #92400e',
                    boxShadow: '0 4px 0 #78350f, inset 0 1px 0 rgba(255,255,255,0.3)',
                }}>
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/15 pointer-events-none" />
                <img src={trophyImg} alt="trophy" className="w-8 h-8 relative z-10 drop-shadow-md object-contain" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                <span className="font-black text-2xl text-white relative z-10 drop-shadow-md"><AnimatedNumber value={score} /></span>
                <span className="text-yellow-100 text-[9px] font-bold tracking-wider uppercase relative z-10">XP</span>
            </div>
            <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, #eab308, #ca8a04)',
                    border: '3px solid #854d0e',
                    boxShadow: '0 4px 0 #713f12, inset 0 1px 0 rgba(255,255,255,0.3)',
                }}>
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/15 pointer-events-none" />
                <img src={coinImg} alt="coin" className="w-8 h-8 relative z-10 drop-shadow-md object-contain" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                <span className="font-black text-2xl text-white relative z-10 drop-shadow-md"><AnimatedNumber value={userCoins} /></span>
                <span className="text-yellow-100 text-[9px] font-bold tracking-wider uppercase relative z-10">Coins</span>
            </div>
        </div>
    );

    const RankProgress = () => (
        <div className="rounded-xl p-3 relative overflow-hidden"
            style={{
                background: 'rgba(0,0,0,0.35)',
                border: '2px solid rgba(255,255,255,0.08)',
            }}>
            <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-yellow-300 tracking-wider uppercase">
                    <TrendingUp size={11} /> Tiến trình
                </span>
                {nextRank && (
                    <span className="text-[9px] font-bold text-white/40">
                        Còn {formatNumber(xpToNext)} 🏆 XP
                    </span>
                )}
            </div>
            <div className="w-full h-4 rounded-full relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full relative"
                    style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', boxShadow: '0 0 10px rgba(251,191,36,0.4)' }}>
                    <div className="absolute inset-0 h-1/2 bg-white/25 rounded-full" />
                </motion.div>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-md">
                    <AnimatedPercent value={progress} />%
                </span>
            </div>
            <div className="flex justify-between mt-1.5">
                <span className="text-[9px] font-bold text-white/50">Lv.{rankLevel} · {rankName}</span>
                {nextRank ? (
                    <span className="text-[9px] font-bold text-yellow-300/60">→ Lv.{nextRank.level} · {nextRank.name}</span>
                ) : (
                    <span className="text-[9px] font-bold text-yellow-300">🏆 MAX RANK!</span>
                )}
            </div>
        </div>
    );

    const StatsSection = () => (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-0.5">
                <Award size={13} className="text-yellow-400" />
                <span className="font-black text-xs text-white/80 tracking-wider uppercase">Thống Kê</span>
                <span className="text-[9px] font-bold text-white/30 ml-auto">Tổng: {totalGames} trận</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                {/* Solo */}
                <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(155deg, #059669, #047857)',
                        border: '2.5px solid #064e3b',
                        boxShadow: '0 4px 0 #022c22',
                    }}>
                    <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/10 pointer-events-none" />
                    <div className="flex items-center gap-1.5 relative z-10">
                        <User size={11} strokeWidth={3} className="text-emerald-200" />
                        <span className="font-black text-[10px] text-white tracking-wider uppercase">Solo</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <StatRow icon="🎮" label="Trận" value={solo.plays} />
                        <StatRow icon="⭐" label="Perfect" value={solo.perfects} />
                        <StatRow icon="✅" label="TB đúng" value={`${avgCorrect}/15`} />
                    </div>
                </div>
                {/* P2P */}
                <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(155deg, #7c3aed, #6d28d9)',
                        border: '2.5px solid #4c1d95',
                        boxShadow: '0 4px 0 #3b0764',
                    }}>
                    <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/10 pointer-events-none" />
                    <div className="flex items-center gap-1.5 relative z-10">
                        <Swords size={11} strokeWidth={3} className="text-purple-200" />
                        <span className="font-black text-[10px] text-white tracking-wider uppercase">P2P</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <StatRow icon="⚔️" label="Trận" value={p2p.plays} />
                        <StatRow icon="🏆" label="Thắng" value={p2p.wins} highlight />
                        <StatRow icon="💀" label="Thua" value={p2p.losses} />
                        <StatRow icon="📊" label="Win%" value={`${winRate}%`} highlight />
                    </div>
                </div>
            </div>
        </div>
    );

    const QuickActions = () => (
        <div className={`flex ${isLandscape ? 'flex-row' : 'flex-col'} gap-2`}>
            <motion.button whileTap={{ scale: 0.97, y: 2 }} onClick={onOpenRoadmap}
                className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl group"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}>
                <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/20">
                        <Map size={14} className="text-amber-300" />
                    </span>
                    <span className="flex flex-col text-left">
                        <span className="font-black text-xs text-white">Hành trình vươn đỉnh</span>
                        <span className="text-[9px] text-white/30 font-semibold">Xem bản đồ Rank</span>
                    </span>
                </span>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white/60" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.97, y: 2 }}
                className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl group"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}>
                <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-400/20">
                        <Trophy size={14} className="text-purple-300" />
                    </span>
                    <span className="flex flex-col text-left">
                        <span className="font-black text-xs text-white">Bảng Xếp Hạng</span>
                        <span className="text-[9px] text-white/30 font-semibold">Coming soon</span>
                    </span>
                </span>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white/60" />
            </motion.button>
        </div>
    );

    const PersonalInfo = () => {
        const [editName, setEditName] = useState(nickname || displayName || '');
        const [editGiaoxu, setEditGiaoxu] = useState(giaoxu || '');
        const [editHat, setEditHat] = useState(hat || '');
        const [editGiaophan, setEditGiaophan] = useState(giaophan || '');
        const [editTinhthanh, setEditTinhthanh] = useState(tinhthanh || '');
        const [saving, setSaving] = useState(false);
        const [saved, setSaved] = useState(false);

        const nameDirty = editName.trim() !== '' && editName.trim() !== (nickname || displayName || '');
        const infoDirty = editGiaoxu.trim() !== (giaoxu || '') || editHat.trim() !== (hat || '') || editGiaophan.trim() !== (giaophan || '') || editTinhthanh.trim() !== (tinhthanh || '');
        const isDirty = nameDirty || infoDirty;

        const handleSave = async () => {
            setSaving(true);
            // Save display name if changed
            if (nameDirty && saveDisplayName) {
                await saveDisplayName(editName.trim());
            }
            // Save church info if changed
            if (infoDirty) {
                await saveProfile({
                    giaoxu: editGiaoxu.trim(),
                    hat: editHat.trim(),
                    giaophan: editGiaophan.trim(),
                    tinhthanh: editTinhthanh.trim(),
                });
            }
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        };

        return (
            <div className="rounded-xl p-3 flex flex-col gap-2.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                <span className="text-[10px] font-black text-white/60 tracking-widest uppercase flex items-center gap-1.5">
                    <Pen size={10} /> Chỉnh sửa thông tin
                </span>

                {/* Display Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Tên hiển thị</label>
                    <input
                        type="text"
                        placeholder="Nhập tên của bạn..."
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-colors font-bold"
                        maxLength={25}
                    />
                </div>

                {/* Giáo xứ */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">⛪ Giáo xứ</label>
                    <input
                        type="text"
                        placeholder="Giáo xứ của bạn..."
                        value={editGiaoxu}
                        onChange={e => setEditGiaoxu(e.target.value)}
                        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-colors font-medium"
                        maxLength={50}
                    />
                </div>

                {/* Hạt */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">✠ Hạt (Giáo hạt)</label>
                    <input
                        type="text"
                        placeholder="Giáo hạt của bạn..."
                        value={editHat}
                        onChange={e => setEditHat(e.target.value)}
                        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-colors font-medium"
                        maxLength={50}
                    />
                </div>

                {/* Giáo phận */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">✡ Giáo phận</label>
                    <input
                        type="text"
                        placeholder="Giáo phận của bạn..."
                        value={editGiaophan}
                        onChange={e => setEditGiaophan(e.target.value)}
                        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-colors font-medium"
                        maxLength={50}
                    />
                </div>

                {/* Tỉnh thành */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">📍 Tỉnh / Thành phố</label>
                    <input
                        type="text"
                        placeholder="Tỉnh / Thành phố..."
                        value={editTinhthanh}
                        onChange={e => setEditTinhthanh(e.target.value)}
                        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-colors font-medium"
                        maxLength={50}
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                        saved ? 'bg-green-500/80 text-white' :
                        isDirty ? 'bg-yellow-400 text-[#1e3a8a] hover:bg-yellow-300 shadow-lg shadow-yellow-400/20' :
                        'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                    style={isDirty && !saved ? { boxShadow: '0 3px 0 #b45309' } : {}}
                >
                    {saved ? '✓ Đã lưu!' : saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        );
    };

    /* ════ PORTRAIT LAYOUT ════ */
    const PortraitLayout = () => (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-md mx-auto px-4 pt-5 pb-8 flex flex-col gap-4">
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"><AvatarSection /></motion.div>
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"><CurrencyCards /></motion.div>
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"><RankProgress /></motion.div>
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"><StatsSection /></motion.div>
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"><QuickActions /></motion.div>
                <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"><PersonalInfo /></motion.div>
            </div>
        </div>
    );

    /* ════ LANDSCAPE LAYOUT — row-based grid ════ */
    const LandscapeLayout = () => (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-5xl mx-auto px-5 py-2 pb-6 flex flex-col gap-2">

                {/* ═══ ROW 1: Avatar + Assets ═══ */}
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                    className="flex gap-4 items-stretch">

                    {/* Left: Avatar + Name */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl px-6 py-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', minWidth: 180 }}>
                        <motion.div custom={0} variants={popIn} initial="hidden" animate="visible" className="relative">
                            <UserAvatar
                                name={displayName}
                                photoURL={avatarUrl}
                                size={64}
                                ring={true}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-black text-[10px] text-white z-10"
                                style={{ border: '2.5px solid #0f172a', boxShadow: '0 1px 0 #000' }}>
                                {rankLevel}
                            </div>
                        </motion.div>
                        <h2 className="font-black text-xl text-white leading-tight">{displayName}</h2>
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full"
                                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f', border: '2px solid #b45309', boxShadow: '0 2px 0 #92400e' }}>
                                <Crown size={11} /> {rankName}
                            </span>
                            {user?.isGuest ? (
                                <span className="flex items-center gap-0.5 text-[8px] font-bold text-orange-300 bg-orange-400/20 px-1.5 py-0.5 rounded-full border border-orange-400/30">
                                    <User size={7} /> Khách
                                </span>
                            ) : (
                                <span className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-300 bg-emerald-400/20 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                                    <Shield size={7} /> Đã bảo vệ
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Assets & Overview */}
                    <div className="flex-1 rounded-xl px-5 py-3 flex flex-col gap-2"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                        <span className="flex items-center gap-1.5 text-base font-black text-white/70 tracking-wider uppercase">
                            <span className="text-base">⭐</span> Assets & Overview
                        </span>
                        <div className="flex items-center gap-4 flex-1">
                            {/* XP */}
                            <motion.div custom={1} variants={popIn} initial="hidden" animate="visible"
                                className="rounded-xl px-5 py-2.5 flex flex-col items-center relative overflow-hidden"
                                style={{ background: 'linear-gradient(145deg, #f59e0b, #d97706)', border: '2.5px solid #92400e', boxShadow: '0 3px 0 #78350f', minWidth: 100 }}>
                                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/15 pointer-events-none" />
                                <img src={trophyImg} alt="trophy" className="w-9 h-9 relative z-10 object-contain" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
                                <span className="font-black text-3xl text-white relative z-10"><AnimatedNumber value={score} /></span>
                                <span className="text-yellow-100 text-[10px] font-bold tracking-wider uppercase relative z-10">XP</span>
                            </motion.div>
                            {/* Coins */}
                            <motion.div custom={2} variants={popIn} initial="hidden" animate="visible"
                                className="rounded-xl px-5 py-2.5 flex flex-col items-center relative overflow-hidden"
                                style={{ background: 'linear-gradient(145deg, #eab308, #ca8a04)', border: '2.5px solid #854d0e', boxShadow: '0 3px 0 #713f12', minWidth: 100 }}>
                                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/15 pointer-events-none" />
                                <img src={coinImg} alt="coin" className="w-9 h-9 relative z-10 object-contain" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
                                <span className="font-black text-3xl text-white relative z-10"><AnimatedNumber value={userCoins} /></span>
                                <span className="text-yellow-100 text-[10px] font-bold tracking-wider uppercase relative z-10">Coins</span>
                            </motion.div>
                            {/* Total Games */}
                            <div className="flex-1 flex flex-col items-center justify-center px-4">
                                <span className="font-black text-6xl text-white/90"><AnimatedNumber value={totalGames} /></span>
                                <span className="text-white/40 text-base font-bold mt-0.5">General Statistics:</span>
                                <span className="text-white/30 text-sm font-semibold">Total: {totalGames} games</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ ROW 2: Detailed Statistics ═══ */}
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
                    className="rounded-xl px-4 py-3 flex-1 flex flex-col"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Award size={18} className="text-yellow-400" />
                        <span className="font-black text-lg text-white/80 tracking-wider uppercase">Detailed Statistics</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        {/* Solo */}
                        <div className="rounded-xl px-5 py-3 flex flex-col gap-2.5 relative overflow-hidden"
                            style={{ background: 'linear-gradient(155deg, #059669, #047857)', border: '2.5px solid #064e3b', boxShadow: '0 3px 0 #022c22' }}>
                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/10 pointer-events-none" />
                            <div className="flex items-center gap-2 relative z-10">
                                <User size={18} strokeWidth={3} className="text-emerald-200" />
                                <span className="font-black text-xl text-white tracking-wider uppercase">SOLO Mode</span>
                            </div>
                            <div className="space-y-2.5 relative z-10 flex-1 flex flex-col justify-center">
                                <StatRowLg icon="🎮" label="Trận" value={solo.plays} animated />
                                <StatRowLg icon="⭐" label="Perfect" value={solo.perfects} animated />
                                <StatRowLg icon="✅" label="TB đúng" value={avgCorrect} suffix="/15" />
                            </div>
                        </div>
                        {/* P2P */}
                        <div className="rounded-xl px-5 py-3 flex flex-col gap-2.5 relative overflow-hidden"
                            style={{ background: 'linear-gradient(155deg, #7c3aed, #6d28d9)', border: '2.5px solid #4c1d95', boxShadow: '0 3px 0 #3b0764' }}>
                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/10 pointer-events-none" />
                            <div className="flex items-center gap-2 relative z-10">
                                <Swords size={18} strokeWidth={3} className="text-purple-200" />
                                <span className="font-black text-xl text-white tracking-wider uppercase">P2P Mode</span>
                            </div>
                            <div className="space-y-2.5 relative z-10 flex-1 flex flex-col justify-center">
                                <StatRowLg icon="⚔️" label="Trận" value={p2p.plays} animated />
                                <StatRowLg icon="🏆" label="Thắng" value={p2p.wins} highlight animated />
                                <StatRowLg icon="💀" label="Thua" value={p2p.losses} animated />
                                <StatRowLg icon="📊" label="Win%" value={winRate} suffix="%" highlight animated />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ ROW 3: Rank Progress ═══ */}
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                    className="rounded-xl px-3.5 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-base font-black text-yellow-300 tracking-wider uppercase">
                            <TrendingUp size={16} /> Rank Progress
                        </span>
                        {nextRank && <span className="text-sm font-bold text-white/40">Còn {formatNumber(xpToNext)} 🏆 XP</span>}
                    </div>
                    <div className="w-full h-6 rounded-full relative overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full relative"
                            style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', boxShadow: '0 0 12px rgba(251,191,36,0.5)' }}>
                            <div className="absolute inset-0 h-1/2 bg-white/25 rounded-full" />
                        </motion.div>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-md">
                            <AnimatedPercent value={progress} delay={600} />%
                        </span>
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-sm font-bold text-white/50">Lv.{rankLevel} · {rankName}</span>
                        {nextRank
                            ? <span className="text-sm font-bold text-yellow-300/60">→ Lv.{nextRank.level} · {nextRank.name}</span>
                            : <span className="text-sm font-bold text-yellow-300">🏆 MAX RANK!</span>}
                    </div>
                </motion.div>

                {/* ═══ ROW 4: Quick Actions ═══ */}
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                    className="grid grid-cols-2 gap-2.5">
                    <motion.button whileTap={{ scale: 0.97, y: 2 }} onClick={onOpenRoadmap}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl group"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}>
                        <span className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/20">
                                <Map size={14} className="text-amber-300" />
                            </span>
                            <span className="flex flex-col text-left">
                                <span className="font-black text-sm text-white">Hành trình vươn đỉnh</span>
                                <span className="text-[10px] text-white/30 font-semibold">Xem bản đồ Rank</span>
                            </span>
                        </span>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/60" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97, y: 2 }}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl group"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}>
                        <span className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-400/20">
                                <Trophy size={14} className="text-purple-300" />
                            </span>
                            <span className="flex flex-col text-left">
                                <span className="font-black text-sm text-white">Bảng Xếp Hạng</span>
                                <span className="text-[10px] text-white/30 font-semibold">Coming soon</span>
                            </span>
                        </span>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/60" />
                    </motion.button>
                </motion.div>

                {/* ═══ ROW 5: Personal Info ═══ */}
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                    <PersonalInfo />
                </motion.div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col overflow-hidden relative"
            style={{ background: '#0a0e1a' }}>

            {/* ── Dark textured background ── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Radial vignette */}
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(37,99,235,0.15) 0%, transparent 60%)' }} />
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 50%)' }} />
                {/* Dot pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }} />
            </div>

            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 pt-[env(safe-area-inset-top,12px)] z-20 relative rounded-b-2xl"
                style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '2px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <motion.button whileTap={{ y: 2 }} onClick={onBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                    <ChevronLeft size={18} strokeWidth={3} />
                </motion.button>
                <span className="font-black text-sm tracking-widest text-white/80 uppercase"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    Hồ Sơ
                </span>
                <div className="w-8" />
            </div>

            {/* ── Content — switches based on orientation ── */}
            {isLandscape ? <LandscapeLayout /> : <PortraitLayout />}
        </div>
    );
};

/* ── Tiny stat row (portrait) ── */
const StatRow = ({ icon, label, value, highlight = false }) => (
    <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-white/60 font-semibold">
            <span className="text-xs">{icon}</span> {label}
        </span>
        <span className={`text-sm font-black ${highlight ? 'text-yellow-300' : 'text-white/90'}`}>
            {value}
        </span>
    </div>
);

export default ProfileScreen;

/* ── Larger stat row for landscape with optional animation ── */
const StatRowLg = ({ icon, label, value, suffix = '', highlight = false, animated = false }) => {
    const numVal = useCountUp(animated ? (typeof value === 'number' ? value : parseFloat(value) || 0) : 0, 1000, 600);
    const displayVal = animated ? (numVal + suffix) : (typeof value === 'string' ? value : value + suffix);
    return (
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base text-white/65 font-semibold">
                <span className="text-base">{icon}</span> {label}
            </span>
            <span className={`text-lg font-black ${highlight ? 'text-yellow-300' : 'text-white'}`}>
                {displayVal}
            </span>
        </div>
    );
};

/* ── Animated number display ── */
const AnimatedNumber = ({ value, delay = 400 }) => {
    const count = useCountUp(value, 1200, delay);
    return <>{formatNumber(count)}</>;
};

/* ── Animated percentage ── */
const AnimatedPercent = ({ value, delay = 400 }) => {
    const count = useCountUp(value, 1200, delay);
    return <>{count}</>;
};
