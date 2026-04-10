import { useState, useEffect, useRef, useCallback } from 'react';
import coinImg from '../../assets/common/coin.webp';
import trophyImg from '../../assets/common/trophy.webp';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Trophy, Star, Award, Swords,
    User, Shield, Map, ChevronRight, TrendingUp, Crown, Pen, HelpCircle
} from 'lucide-react';
import { usePlayFabStore } from '../../store/playfabStore';
import UserAvatar from '../common/UserAvatar';
import DeveloperContactModal from '../common/DeveloperContactModal';
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

/* ── Design tokens ── */
const C = {
    bg: 'linear-gradient(160deg, #caf0f8 0%, #ade8f4 50%, #90e0ef 100%)',
    card: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(0,180,216,0.22)',
    cardBorderSolid: '#b2e8f7',
    xpCard: { bg: 'linear-gradient(145deg, #ffd166, #f4a261)', border: '#e9952a', shadow: '#c77a1a' },
    coinCard: { bg: 'linear-gradient(145deg, #06d6a0, #1b9aaa)', border: '#0e7490', shadow: '#0c6478' },
    soloCard: { bg: 'linear-gradient(155deg, #06d6a0, #1b9aaa)', border: '#0e7490', shadow: '#0c5f73' },
    p2pCard: { bg: 'linear-gradient(155deg, #9b5de5, #7b2d8b)', border: '#6b21a8', shadow: '#4a1772' },
    textPrimary: '#1e3a5f',
    textSecondary: '#4a7fa5',
    textMuted: '#7fb3cc',
    rankBadge: { bg: 'linear-gradient(135deg, #ffd166, #f4a261)', color: '#7c2d12', border: '#e9952a', shadow: '#c77a1a' },
};

const ProfileScreen = ({ user, onBack, onOpenRoadmap, onOpenLeaderboard }) => {
    const globalScore = usePlayFabStore(state => state.globalScore);
    const coins = usePlayFabStore(state => state.coins);
    const stats = usePlayFabStore(state => state.stats);
    const avatarUrl = usePlayFabStore(state => state.avatarUrl);
    const giaoxu = usePlayFabStore(state => state.giaoxu);
    const hat = usePlayFabStore(state => state.hat);
    const giaophan = usePlayFabStore(state => state.giaophan);
    const tinhthanh = usePlayFabStore(state => state.tinhthanh);
    const saveProfile = usePlayFabStore(state => state.saveProfile);
    const saveDisplayName = usePlayFabStore(state => state.saveDisplayName);
    const nickname = usePlayFabStore(state => state.nickname);
    const xpPlayerRank = usePlayFabStore(state => state.xpPlayerRank);
    const loadXPLeaderboard = usePlayFabStore(state => state.loadXPLeaderboard);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Load XP leaderboard rank on mount
    useEffect(() => { loadXPLeaderboard('allTime'); }, []); // eslint-disable-line

    const score = globalScore || user?.score || 0;
    const userCoins = coins || 0;
    const rankName = getRankByScore(score);
    const rankLevel = getRankLevel(score);
    const nextRank = getNextRank(score);
    const progress = getProgressToNextRank(score);
    const xpToNext = nextRank ? nextRank.minXP - score : 0;

    const p2p = stats?.p2p || { plays: 0, wins: 0, losses: 0, forfeits: 0, totalCorrect: 0, totalQuestions: 0 };
    const totalGames = p2p.plays;
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
                <div className={`absolute -bottom-1 -right-1 ${isLandscape ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'} rounded-full bg-[#06d6a0] flex items-center justify-center font-black text-white z-10`}
                    style={{ border: '3px solid #e0f7fa', boxShadow: '0 2px 0 #0e7490' }}>
                    {rankLevel}
                </div>
            </div>
            <div className={isLandscape ? 'text-left' : 'text-center'}>
                <h2 className={`font-black ${isLandscape ? 'text-lg' : 'text-xl'} drop-shadow-sm`} style={{ color: C.textPrimary }}>{displayName}</h2>
                <div className={`flex items-center gap-2 ${isLandscape ? '' : 'justify-center'} mt-1`}>
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full"
                        style={{
                            background: C.rankBadge.bg,
                            color: C.rankBadge.color,
                            border: `2px solid ${C.rankBadge.border}`,
                            boxShadow: `0 2px 0 ${C.rankBadge.shadow}`,
                        }}>
                        <Crown size={10} /> {rankName}
                    </span>
                    {user?.isGuest ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                            <User size={8} /> Khách
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Shield size={8} /> Đã bảo vệ
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    const CurrencyCards = () => (
        <div className="grid grid-cols-2 gap-2.5">
            {/* XP */}
            <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
                style={{
                    background: C.xpCard.bg,
                    border: `3px solid ${C.xpCard.border}`,
                    boxShadow: `0 4px 0 ${C.xpCard.shadow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                }}>
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 pointer-events-none" />
                <img src={trophyImg} alt="trophy" className="w-8 h-8 relative z-10 object-contain" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }} />
                <span className="font-black text-2xl text-white relative z-10 drop-shadow-md"><AnimatedNumber value={score} /></span>
                <span className="text-amber-900/70 text-[9px] font-bold tracking-wider uppercase relative z-10">XP</span>
            </div>
            {/* Coins */}
            <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
                style={{
                    background: C.coinCard.bg,
                    border: `3px solid ${C.coinCard.border}`,
                    boxShadow: `0 4px 0 ${C.coinCard.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                }}>
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 pointer-events-none" />
                <img src={coinImg} alt="coin" className="w-8 h-8 relative z-10 drop-shadow-md object-contain" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }} />
                <span className="font-black text-2xl text-white relative z-10 drop-shadow-md"><AnimatedNumber value={userCoins} /></span>
                <span className="text-teal-900/60 text-[9px] font-bold tracking-wider uppercase relative z-10">Coins</span>
            </div>
        </div>
    );

    const RankProgress = () => (
        <div className="rounded-xl p-3 relative overflow-hidden"
            style={{
                background: C.card,
                border: `2px solid ${C.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,150,200,0.1)',
            }}>
            <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase" style={{ color: '#f4a261' }}>
                    <TrendingUp size={11} /> Tiến trình
                </span>
                {nextRank && (
                    <span className="text-[9px] font-bold" style={{ color: C.textMuted }}>
                        Còn {formatNumber(xpToNext)} 🏆 XP
                    </span>
                )}
            </div>
            <div className="w-full h-4 rounded-full relative overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.08)', border: '1.5px solid rgba(0,150,200,0.15)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full relative"
                    style={{ background: 'linear-gradient(90deg, #f4a261, #ffd166)', boxShadow: '0 0 10px rgba(244,162,97,0.5)' }}>
                    <div className="absolute inset-0 h-1/2 bg-white/30 rounded-full" />
                </motion.div>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black drop-shadow-md" style={{ color: C.textPrimary }}>
                    <AnimatedPercent value={progress} />%
                </span>
            </div>
            <div className="flex justify-between mt-1.5">
                <span className="text-[9px] font-bold" style={{ color: C.textSecondary }}>Lv.{rankLevel} · {rankName}</span>
                {nextRank ? (
                    <span className="text-[9px] font-bold text-amber-500">→ Lv.{nextRank.level} · {nextRank.name}</span>
                ) : (
                    <span className="text-[9px] font-bold text-amber-500">🏆 MAX RANK!</span>
                )}
            </div>
        </div>
    );

    const StatsSection = () => (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-0.5">
                <Award size={13} className="text-amber-400" />
                <span className="font-black text-xs tracking-wider uppercase" style={{ color: C.textPrimary }}>Thống Kê P2P</span>
                <span className="text-[9px] font-bold ml-auto" style={{ color: C.textMuted }}>Tổng: {totalGames} trận</span>
            </div>
            <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
                style={{
                    background: C.p2pCard.bg,
                    border: `2.5px solid ${C.p2pCard.border}`,
                    boxShadow: `0 4px 0 ${C.p2pCard.shadow}`,
                }}>
                <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/15 pointer-events-none" />
                <div className="flex items-center gap-1.5 relative z-10">
                    <Swords size={11} strokeWidth={3} className="text-white" />
                    <span className="font-black text-[10px] text-white tracking-wider uppercase">P2P Crossword</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 relative z-10">
                    <StatRow icon="⚔️" label="Trận" value={p2p.plays} />
                    <StatRow icon="🏆" label="Thắng" value={p2p.wins} highlight />
                    <StatRow icon="💀" label="Thua" value={p2p.losses} />
                    <StatRow icon="🏼" label="Bỏ cuộc" value={p2p.forfeits || 0} />
                    <StatRow icon="📊" label="Win%" value={`${winRate}%`} highlight />
                </div>
            </div>
        </div>
    );

    const QuickActions = () => (
        <div className={`flex ${isLandscape ? 'flex-row' : 'flex-col'} gap-2`}>
            <motion.button whileTap={{ scale: 0.97, y: 2 }} onClick={onOpenRoadmap}
                className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl group"
                style={{
                    background: C.card,
                    border: `1.5px solid ${C.cardBorder}`,
                    boxShadow: '0 3px 0 rgba(0,150,200,0.15)',
                }}>
                <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                        <Map size={14} className="text-amber-500" />
                    </span>
                    <span className="flex flex-col text-left">
                        <span className="font-black text-xs" style={{ color: C.textPrimary }}>Hành trình vươn đỉnh</span>
                        <span className="text-[9px] font-semibold" style={{ color: C.textMuted }}>Xem bản đồ Rank</span>
                    </span>
                </span>
                <ChevronRight size={14} className="text-sky-300 group-hover:text-sky-500 transition-colors" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.97, y: 2 }} onClick={onOpenLeaderboard}
                className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl group"
                style={{
                    background: C.card,
                    border: `1.5px solid ${C.cardBorder}`,
                    boxShadow: '0 3px 0 rgba(0,150,200,0.15)',
                }}
            >
                <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                        <Trophy size={14} className="text-amber-500" />
                    </span>
                    <span className="flex flex-col text-left">
                        <span className="font-black text-xs" style={{ color: C.textPrimary }}>Bảng Xếp Hạng XP</span>
                        <span className="text-[9px] font-semibold" style={{ color: C.textMuted }}>
                            {xpPlayerRank ? `Hạng #${xpPlayerRank.position} · ${(xpPlayerRank.xp || 0).toLocaleString()} XP` : 'Xem vị trí của bạn'}
                        </span>
                    </span>
                </span>
                <ChevronRight size={14} className="text-amber-400 group-hover:text-amber-500 transition-colors" />
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
            if (nameDirty && saveDisplayName) {
                await saveDisplayName(editName.trim());
            }
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
                style={{
                    background: C.card,
                    border: `1.5px solid ${C.cardBorder}`,
                    boxShadow: '0 2px 8px rgba(0,150,200,0.08)',
                }}>
                <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5" style={{ color: '#1b9aaa' }}>
                    <Pen size={10} /> Chỉnh sửa thông tin
                </span>

                {/* Display Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.textSecondary }}>Tên hiển thị</label>
                    <input
                        type="text"
                        placeholder="Nhập tên của bạn..."
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs placeholder-slate-300 focus:outline-none transition-colors font-bold"
                        style={{
                            background: '#f0f9ff',
                            border: '1.5px solid #bae6fd',
                            color: C.textPrimary,
                        }}
                        onFocus={e => e.target.style.borderColor = '#06d6a0'}
                        onBlur={e => e.target.style.borderColor = '#bae6fd'}
                        maxLength={25}
                    />
                </div>

                {/* Giáo xứ */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.textSecondary }}>⛪ Giáo xứ</label>
                    <input
                        type="text"
                        placeholder="Giáo xứ của bạn..."
                        value={editGiaoxu}
                        onChange={e => setEditGiaoxu(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs placeholder-slate-300 focus:outline-none transition-colors font-medium"
                        style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', color: C.textPrimary }}
                        onFocus={e => e.target.style.borderColor = '#06d6a0'}
                        onBlur={e => e.target.style.borderColor = '#bae6fd'}
                        maxLength={50}
                    />
                </div>

                {/* Hạt */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.textSecondary }}>✠ Hạt (Giáo hạt)</label>
                    <input
                        type="text"
                        placeholder="Giáo hạt của bạn..."
                        value={editHat}
                        onChange={e => setEditHat(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs placeholder-slate-300 focus:outline-none transition-colors font-medium"
                        style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', color: C.textPrimary }}
                        onFocus={e => e.target.style.borderColor = '#06d6a0'}
                        onBlur={e => e.target.style.borderColor = '#bae6fd'}
                        maxLength={50}
                    />
                </div>

                {/* Giáo phận */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.textSecondary }}>✡ Giáo phận</label>
                    <input
                        type="text"
                        placeholder="Giáo phận của bạn..."
                        value={editGiaophan}
                        onChange={e => setEditGiaophan(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs placeholder-slate-300 focus:outline-none transition-colors font-medium"
                        style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', color: C.textPrimary }}
                        onFocus={e => e.target.style.borderColor = '#06d6a0'}
                        onBlur={e => e.target.style.borderColor = '#bae6fd'}
                        maxLength={50}
                    />
                </div>

                {/* Tỉnh thành */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.textSecondary }}>📍 Tỉnh / Thành phố</label>
                    <input
                        type="text"
                        placeholder="Tỉnh / Thành phố..."
                        value={editTinhthanh}
                        onChange={e => setEditTinhthanh(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs placeholder-slate-300 focus:outline-none transition-colors font-medium"
                        style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', color: C.textPrimary }}
                        onFocus={e => e.target.style.borderColor = '#06d6a0'}
                        onBlur={e => e.target.style.borderColor = '#bae6fd'}
                        maxLength={50}
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all`}
                    style={
                        saved
                            ? { background: '#22c55e', color: '#fff', boxShadow: '0 3px 0 #16a34a' }
                            : isDirty
                                ? { background: 'linear-gradient(180deg, #06d6a0, #1b9aaa)', color: '#fff', boxShadow: '0 3px 0 #0e7490' }
                                : { background: '#e0f2f1', color: '#94a3b8', cursor: 'not-allowed' }
                    }
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
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">{AvatarSection()}</motion.div>
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">{CurrencyCards()}</motion.div>
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">{RankProgress()}</motion.div>
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">{QuickActions()}</motion.div>
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">{StatsSection()}</motion.div>
                <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">{PersonalInfo()}</motion.div>
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
                        style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, boxShadow: '0 2px 8px rgba(0,150,200,0.1)', minWidth: 180 }}>
                        <motion.div custom={0} variants={popIn} initial="hidden" animate="visible" className="relative">
                            <UserAvatar
                                name={displayName}
                                photoURL={avatarUrl}
                                size={64}
                                ring={true}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#06d6a0] flex items-center justify-center font-black text-[10px] text-white z-10"
                                style={{ border: '2.5px solid #e0f7fa', boxShadow: '0 1px 0 #0e7490' }}>
                                {rankLevel}
                            </div>
                        </motion.div>
                        <h2 className="font-black text-xl leading-tight" style={{ color: C.textPrimary }}>{displayName}</h2>
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full"
                                style={{ background: C.rankBadge.bg, color: C.rankBadge.color, border: `2px solid ${C.rankBadge.border}`, boxShadow: `0 2px 0 ${C.rankBadge.shadow}` }}>
                                <Crown size={11} /> {rankName}
                            </span>
                            {user?.isGuest ? (
                                <span className="flex items-center gap-0.5 text-[8px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full border border-orange-200">
                                    <User size={7} /> Khách
                                </span>
                            ) : (
                                <span className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                    <Shield size={7} /> Đã bảo vệ
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Assets & Overview */}
                    <div className="flex-1 rounded-xl px-5 py-3 flex flex-col gap-2"
                        style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, boxShadow: '0 2px 8px rgba(0,150,200,0.1)' }}>
                        <span className="flex items-center gap-1.5 text-base font-black tracking-wider uppercase" style={{ color: C.textSecondary }}>
                            <span className="text-base">⭐</span> Assets & Overview
                        </span>
                        <div className="flex items-center gap-4 flex-1">
                            {/* XP */}
                            <motion.div custom={1} variants={popIn} initial="hidden" animate="visible"
                                className="rounded-xl px-5 py-2.5 flex flex-col items-center relative overflow-hidden flex-1"
                                style={{ background: C.xpCard.bg, border: `2.5px solid ${C.xpCard.border}`, boxShadow: `0 3px 0 ${C.xpCard.shadow}`, minWidth: 100 }}>
                                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 pointer-events-none" />
                                <img src={trophyImg} alt="trophy" className="w-9 h-9 relative z-10 object-contain" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }} />
                                <span className="font-black text-3xl text-white relative z-10"><AnimatedNumber value={score} /></span>
                                <span className="text-amber-900/70 text-[10px] font-bold tracking-wider uppercase relative z-10">XP</span>
                            </motion.div>
                            {/* Coins */}
                            <motion.div custom={2} variants={popIn} initial="hidden" animate="visible"
                                className="rounded-xl px-5 py-2.5 flex flex-col items-center relative overflow-hidden flex-1"
                                style={{ background: C.coinCard.bg, border: `2.5px solid ${C.coinCard.border}`, boxShadow: `0 3px 0 ${C.coinCard.shadow}`, minWidth: 100 }}>
                                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 pointer-events-none" />
                                <img src={coinImg} alt="coin" className="w-9 h-9 relative z-10 object-contain" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }} />
                                <span className="font-black text-3xl text-white relative z-10"><AnimatedNumber value={userCoins} /></span>
                                <span className="text-teal-900/60 text-[10px] font-bold tracking-wider uppercase relative z-10">Coins</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ ROW 2: Detailed Statistics ═══ */}
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
                    className="rounded-xl px-4 py-3 flex-1 flex flex-col"
                    style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, boxShadow: '0 2px 8px rgba(0,150,200,0.1)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Award size={18} className="text-amber-400" />
                        <span className="font-black text-lg tracking-wider uppercase" style={{ color: C.textPrimary }}>Thống Kê P2P</span>
                    </div>
                    {/* P2P full-width */}
                    <div className="rounded-xl px-5 py-3 flex flex-col gap-2.5 relative overflow-hidden flex-1"
                        style={{ background: C.p2pCard.bg, border: `2.5px solid ${C.p2pCard.border}`, boxShadow: `0 3px 0 ${C.p2pCard.shadow}` }}>
                        <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/15 pointer-events-none" />
                        <div className="flex items-center gap-2 relative z-10">
                            <Swords size={18} strokeWidth={3} className="text-purple-200" />
                            <span className="font-black text-xl text-white tracking-wider uppercase">P2P Mode</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 relative z-10 flex-1 content-center">
                            <StatRowLg icon="⚔️" label="Trận" value={p2p.plays} animated />
                            <StatRowLg icon="🏆" label="Thắng" value={p2p.wins} highlight animated />
                            <StatRowLg icon="💀" label="Thua" value={p2p.losses} animated />
                            <StatRowLg icon="🏼" label="Bỏ cuộc" value={p2p.forfeits || 0} animated />
                            <StatRowLg icon="📊" label="Win%" value={winRate} suffix="%" highlight animated />
                        </div>
                    </div>
                </motion.div>

                {/* ═══ ROW 3: Rank Progress ═══ */}
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                    className="rounded-xl px-3.5 py-2.5"
                    style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, boxShadow: '0 2px 8px rgba(0,150,200,0.1)' }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-base font-black tracking-wider uppercase" style={{ color: '#f4a261' }}>
                            <TrendingUp size={16} /> Rank Progress
                        </span>
                        {nextRank && <span className="text-sm font-bold" style={{ color: C.textMuted }}>Còn {formatNumber(xpToNext)} 🏆 XP</span>}
                    </div>
                    <div className="w-full h-6 rounded-full relative overflow-hidden"
                        style={{ background: 'rgba(0,0,0,0.08)', border: '1.5px solid rgba(0,150,200,0.15)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full relative"
                            style={{ background: 'linear-gradient(90deg, #f4a261, #ffd166)', boxShadow: '0 0 12px rgba(244,162,97,0.5)' }}>
                            <div className="absolute inset-0 h-1/2 bg-white/30 rounded-full" />
                        </motion.div>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black drop-shadow-md" style={{ color: C.textPrimary }}>
                            <AnimatedPercent value={progress} delay={600} />%
                        </span>
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-sm font-bold" style={{ color: C.textSecondary }}>Lv.{rankLevel} · {rankName}</span>
                        {nextRank
                            ? <span className="text-sm font-bold text-amber-500">→ Lv.{nextRank.level} · {nextRank.name}</span>
                            : <span className="text-sm font-bold text-amber-500">🏆 MAX RANK!</span>}
                    </div>
                </motion.div>

                {/* ═══ ROW 4: Quick Actions ═══ */}
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                    className="grid grid-cols-2 gap-2.5">
                    <motion.button whileTap={{ scale: 0.97, y: 2 }} onClick={onOpenRoadmap}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl group"
                        style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, boxShadow: '0 3px 0 rgba(0,150,200,0.15)' }}>
                        <span className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                                <Map size={14} className="text-amber-500" />
                            </span>
                            <span className="flex flex-col text-left">
                                <span className="font-black text-sm" style={{ color: C.textPrimary }}>Hành trình vươn đỉnh</span>
                                <span className="text-[10px] font-semibold" style={{ color: C.textMuted }}>Xem bản đồ Rank</span>
                            </span>
                        </span>
                        <ChevronRight size={14} className="text-sky-300 group-hover:text-sky-500 transition-colors" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97, y: 2 }} onClick={onOpenLeaderboard}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl group"
                        style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, boxShadow: '0 3px 0 rgba(0,150,200,0.15)' }}>
                        <span className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                                <Trophy size={14} className="text-amber-500" />
                            </span>
                            <span className="flex flex-col text-left">
                                <span className="font-black text-sm" style={{ color: C.textPrimary }}>Bảng Xếp Hạng XP</span>
                                <span className="text-[10px] font-semibold" style={{ color: C.textMuted }}>
                                    {xpPlayerRank ? `Hạng #${xpPlayerRank.position} · ${(xpPlayerRank.xp || 0).toLocaleString()} XP` : 'Xem vị trí của bạn'}
                                </span>
                            </span>
                        </span>
                        <ChevronRight size={14} className="text-amber-400 group-hover:text-amber-500 transition-colors" />
                    </motion.button>
                </motion.div>

                {/* ═══ ROW 5: Personal Info ═══ */}
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                    {PersonalInfo()}
                </motion.div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col overflow-hidden relative"
            style={{ background: C.bg }}>

            {/* ── Decorative background bubbles ── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 20% 15%, rgba(0,180,216,0.18) 0%, transparent 55%)' }} />
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 80% 85%, rgba(6,214,160,0.15) 0%, transparent 50%)' }} />
                {/* Bubble dots */}
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(0,150,200,0.8) 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                    }} />
            </div>

            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 pt-[env(safe-area-inset-top,12px)] z-20 relative rounded-b-2xl"
                style={{
                    background: 'rgba(255,255,255,0.85)',
                    borderBottom: `2px solid ${C.cardBorder}`,
                    boxShadow: '0 4px 12px rgba(0,150,200,0.12)',
                }}>
                <motion.button whileTap={{ y: 2 }} onClick={onBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                    style={{ background: 'rgba(0,180,216,0.1)', border: '1.5px solid rgba(0,180,216,0.25)' }}>
                    <ChevronLeft size={18} strokeWidth={3} style={{ color: '#1b9aaa' }} />
                </motion.button>
                <span className="font-black text-sm tracking-widest uppercase"
                    style={{ color: C.textPrimary, textShadow: 'none' }}>
                    Hồ Sơ
                </span>
                <motion.button whileTap={{ y: 2 }} onClick={() => setShowHelp(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                    style={{ background: 'rgba(0,180,216,0.1)', border: '1.5px solid rgba(0,180,216,0.25)' }}>
                    <HelpCircle size={18} strokeWidth={3} style={{ color: '#1b9aaa' }} />
                </motion.button>
            </div>

            {/* ── Content — switches based on orientation ── */}
            {isLandscape ? LandscapeLayout() : PortraitLayout()}

            {/* Trợ giúp Nhà phát triển Modal */}
            {showHelp && <DeveloperContactModal onClose={() => setShowHelp(false)} />}
        </div>
    );
};

/* ── Tiny stat row (portrait) ── */
const StatRow = ({ icon, label, value, highlight = false }) => (
    <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-white/70 font-semibold">
            <span className="text-xs">{icon}</span> {label}
        </span>
        <span className={`text-sm font-black ${highlight ? 'text-yellow-200' : 'text-white'}`}>
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
            <span className="flex items-center gap-2 text-base text-white/70 font-semibold">
                <span className="text-base">{icon}</span> {label}
            </span>
            <span className={`text-lg font-black ${highlight ? 'text-yellow-200' : 'text-white'}`}>
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
