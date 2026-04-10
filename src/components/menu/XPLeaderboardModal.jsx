import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Medal, Calendar, CalendarDays, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { usePlayFabStore } from '../../store/playfabStore';
import { getRankByScore, RANK_TIERS } from '../../utils/ranks';
import UserAvatar from '../common/UserAvatar';
import iconTrophy from '../../assets/common/trophy.webp';

/* ── Period tabs ── */
const TABS = [
    { key: 'daily',   label: 'Hôm nay',  labelShort: 'Ngày',  icon: CalendarDays },
    { key: 'weekly',  label: 'Tuần này', labelShort: 'Tuần',  icon: Calendar },
    { key: 'monthly', label: 'Tháng',    labelShort: 'Tháng', icon: Calendar },
    { key: 'allTime', label: 'Tổng',     labelShort: 'Tổng',  icon: InfinityIcon },
];

const RANK_COLORS = [
    { from: '#64748b', to: '#475569', glow: '#94a3b8' },
    { from: '#16a34a', to: '#15803d', glow: '#4ade80' },
    { from: '#0ea5e9', to: '#0284c7', glow: '#38bdf8' },
    { from: '#8b5cf6', to: '#7c3aed', glow: '#a78bfa' },
    { from: '#ec4899', to: '#db2777', glow: '#f472b6' },
    { from: '#f59e0b', to: '#d97706', glow: '#fbbf24' },
    { from: '#ef4444', to: '#dc2626', glow: '#f87171' },
    { from: '#06b6d4', to: '#0891b2', glow: '#22d3ee' },
    { from: '#f97316', to: '#ea580c', glow: '#fb923c' },
    { from: '#a855f7', to: '#9333ea', glow: '#c084fc' },
    { from: '#14b8a6', to: '#0d9488', glow: '#2dd4bf' },
    { from: '#d97706', to: '#b45309', glow: '#fbbf24' },
];

function getRankColor(xp) {
    const idx = RANK_TIERS.reduce((best, tier, i) => xp >= tier.minXP ? i : best, 0);
    return RANK_COLORS[idx] || RANK_COLORS[0];
}

/* Top-3 special config */
const TOP3 = [
    { bg: 'linear-gradient(135deg,#78350f 0%,#431407 100%)', border: '#fbbf24', glow: '#fbbf24', label: '#fbbf24', pos: '🥇', size: 36 },
    { bg: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)', border: '#94a3b8', glow: '#94a3b8', label: '#94a3b8', pos: '🥈', size: 34 },
    { bg: 'linear-gradient(135deg,#431407 0%,#1c0a04 100%)', border: '#fb923c', glow: '#fb923c', label: '#e2714a', pos: '🥉', size: 32 },
];

/* ── Individual row ── */
const LeaderboardRow = ({ entry, isMe, delay = 0, myAvatarUrl = null }) => {
    const color = getRankColor(entry.xp);
    const rankName = getRankByScore(entry.xp);
    const isTop3 = entry.position <= 3;
    const top3Cfg = isTop3 ? TOP3[entry.position - 1] : null;
    const avatarUrl = (isMe && myAvatarUrl) ? myAvatarUrl : entry.avatarUrl;

    return (
        <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: Math.min(delay, 0.45), type: 'spring', stiffness: 280, damping: 26 }}
            className="relative flex items-center gap-3 px-3 overflow-hidden"
            style={{
                paddingTop: isTop3 ? 11 : 9,
                paddingBottom: isTop3 ? 11 : 9,
                borderRadius: isTop3 ? 18 : 14,
                background: isMe
                    ? `linear-gradient(135deg,${color.from}28,${color.from}12)`
                    : isTop3
                    ? top3Cfg.bg
                    : 'rgba(255,255,255,0.04)',
                border: isMe
                    ? `2px solid ${color.from}66`
                    : isTop3
                    ? `2px solid ${top3Cfg.border}55`
                    : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isMe
                    ? `0 0 18px ${color.glow}25, inset 0 1px 0 rgba(255,255,255,0.07)`
                    : isTop3
                    ? `0 4px 20px ${top3Cfg.glow}22, inset 0 1px 0 rgba(255,255,255,0.09)`
                    : 'none',
            }}
        >
            {/* Top-3 glow orb */}
            {isTop3 && (
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
                     style={{ background: `radial-gradient(circle,${top3Cfg.glow}28 0%,transparent 70%)` }} />
            )}
            {/* Me glow */}
            {isMe && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: `linear-gradient(90deg,${color.from}08 0%,transparent 60%)` }} />
            )}
            {/* Shine strip top */}
            {(isTop3 || isMe) && (
                <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                     style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)' }} />
            )}

            {/* Position */}
            <div className="flex-shrink-0 w-8 text-center relative z-10">
                {isTop3 ? (
                    <motion.span
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: entry.position * 0.3 }}
                        style={{ fontSize: top3Cfg.size, lineHeight: 1 }}
                    >
                        {top3Cfg.pos}
                    </motion.span>
                ) : (
                    <span className="font-black text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                        #{entry.position}
                    </span>
                )}
            </div>

            {/* Avatar */}
            <div className="relative flex-shrink-0 z-10">
                <UserAvatar
                    name={entry.displayName}
                    photoURL={avatarUrl}
                    size={isTop3 ? 36 : 30}
                    style={{
                        border: isTop3
                            ? `2.5px solid ${top3Cfg.border}77`
                            : `2px solid ${color.from}44`,
                        boxShadow: isTop3 ? `0 0 8px ${top3Cfg.glow}44` : 'none',
                    }}
                />
            </div>

            {/* Name + rank */}
            <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5">
                    <span className="font-black leading-tight truncate"
                        style={{
                            fontSize: isTop3 ? 13 : 12,
                            color: isMe ? color.glow : isTop3 ? top3Cfg.label : '#e2e8f0',
                            textShadow: isTop3 ? `0 1px 6px ${top3Cfg.glow}66` : 'none',
                        }}>
                        {entry.displayName}
                    </span>
                    {isMe && (
                        <span className="flex-shrink-0 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full"
                            style={{ background: color.from, color: '#fff', letterSpacing: '0.08em',
                                     boxShadow: `0 0 6px ${color.glow}55` }}>
                            Bạn
                        </span>
                    )}
                </div>
                <span className="text-[9px] font-semibold" style={{ color: isTop3 ? top3Cfg.glow + 'aa' : color.from + 'bb' }}>
                    {rankName}
                </span>
            </div>

            {/* XP */}
            <div className="flex-shrink-0 flex items-center gap-1 relative z-10
                            px-2 py-1 rounded-xl"
                style={{
                    background: isTop3 ? `${top3Cfg.glow}18` : 'rgba(255,255,255,0.05)',
                    border: isTop3 ? `1px solid ${top3Cfg.glow}30` : '1px solid rgba(255,255,255,0.06)',
                }}>
                <img src={iconTrophy} alt="" className="object-contain" style={{ width: isTop3 ? 14 : 12, height: isTop3 ? 14 : 12 }} />
                <span className="font-black tabular-nums"
                    style={{ fontSize: isTop3 ? 12 : 11, color: isTop3 ? top3Cfg.glow : '#fbbf24' }}>
                    {entry.xp.toLocaleString()}
                </span>
            </div>
        </motion.div>
    );
};

/* Skeleton row */
const SkeletonRow = ({ i }) => (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl animate-pulse"
        style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.08}s` }}>
        <div className="w-8 h-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-lg" style={{ width: `${55 + (i % 4) * 10}%`, background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2 rounded-lg w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="w-16 h-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
);

/* ── Main modal ── */
const XPLeaderboardModal = ({ onClose }) => {
    const {
        xpLeaderboard, xpLeaderboardLoading, xpPlayerRank,
        xpActiveTab, loadXPLeaderboard, globalScore,
    } = usePlayFabStore();
    const myPlayFabId = usePlayFabStore(s => s.playFabId);
    const myAvatarUrl = usePlayFabStore(s => s.avatarUrl);

    const loadTab = useCallback((tab) => { loadXPLeaderboard(tab); }, [loadXPLeaderboard]);
    useEffect(() => { loadTab('allTime'); }, [loadTab]);

    const myRankColor = getRankColor(globalScore);
    const activeTabCfg = TABS.find(t => t.key === xpActiveTab) || TABS[3];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ background: 'rgba(4,8,20,0.92)', backdropFilter: 'blur(18px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 44, scale: 0.96, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 44, scale: 0.96, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col relative"
                style={{
                    height: '85vh',
                    maxHeight: '88vh',
                    background: 'linear-gradient(170deg,#0f1e35 0%,#0d1829 50%,#111827 100%)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Ambient top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse,#f59e0b22 0%,transparent 70%)', zIndex: 0 }} />

                {/* ── Header ── */}
                <div className="relative z-10 flex-shrink-0 px-4 pt-4 pb-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3">
                        {/* Trophy badge */}
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                            style={{
                                background: 'linear-gradient(145deg,#fbbf24,#d97706,#92400e)',
                                border: '2.5px solid #fbbf2488',
                                boxShadow: '0 4px 0 #78350f, 0 0 22px #fbbf2455, inset 0 1px 0 rgba(255,255,255,0.3)',
                            }}>
                            <img src={iconTrophy} alt="trophy" className="w-6 h-6 object-contain relative z-10" />
                        </motion.div>

                        <div className="flex-1">
                            <h2 className="font-black text-base leading-tight"
                                style={{ color: '#fff', textShadow: '0 1px 8px rgba(251,191,36,0.3)' }}>
                                Bảng Xếp Hạng XP
                            </h2>
                            <p className="text-[10px] font-semibold flex items-center gap-1"
                                style={{ color: 'rgba(255,255,255,0.35)' }}>
                                <Sparkles size={9} style={{ color: '#f59e0b' }} />
                                Top người chơi tích lũy XP cao nhất
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <motion.button whileTap={{ scale: 0.86 }}
                                onClick={() => loadTab(xpActiveTab)}
                                disabled={xpLeaderboardLoading}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                                <motion.div
                                    animate={xpLeaderboardLoading ? { rotate: 360 } : {}}
                                    transition={{ duration: 0.8, repeat: xpLeaderboardLoading ? Infinity : 0, ease: 'linear' }}>
                                    <RefreshCw size={13} color="rgba(255,255,255,0.5)" />
                                </motion.div>
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.86 }} onClick={onClose}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.22)' }}>
                                <X size={15} color="rgba(239,68,68,0.8)" />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="relative z-10 flex-shrink-0 flex gap-1.5 mx-3 mt-2.5 p-1 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {TABS.map(tab => {
                        const isActive = tab.key === xpActiveTab;
                        return (
                            <motion.button
                                key={tab.key}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => loadTab(tab.key)}
                                className="flex-1 py-1.5 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all"
                                style={{
                                    background: isActive
                                        ? 'linear-gradient(135deg,#fbbf24,#d97706)'
                                        : 'transparent',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                                    boxShadow: isActive ? '0 2px 8px #d9770655, 0 1px 0 #92400e' : 'none',
                                    textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
                                }}
                            >
                                {tab.labelShort}
                            </motion.button>
                        );
                    })}
                </div>

                {/* ── My rank pill ── */}
                <AnimatePresence mode="wait">
                    {xpPlayerRank && xpPlayerRank.xp > 0 && !xpLeaderboardLoading && (
                        <motion.div
                            key={xpActiveTab + '-rank'}
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex-shrink-0 flex items-center gap-2 mx-3 mt-2 px-3.5 py-2.5 rounded-2xl overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg,${myRankColor.from}22,${myRankColor.from}0a)`,
                                border: `1.5px solid ${myRankColor.from}44`,
                                boxShadow: `0 4px 16px ${myRankColor.glow}18, inset 0 1px 0 rgba(255,255,255,0.07)`,
                            }}
                        >
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: `linear-gradient(90deg,${myRankColor.from}10,transparent 60%)` }} />
                            <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                                style={{ background: `linear-gradient(90deg,transparent,${myRankColor.glow}40,transparent)` }} />
                            <Medal size={13} style={{ color: myRankColor.glow, flexShrink: 0 }} />
                            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Vị trí {activeTabCfg.label.toLowerCase()}:
                            </span>
                            <span className="font-black text-base" style={{ color: myRankColor.glow,
                                textShadow: `0 0 10px ${myRankColor.glow}66` }}>
                                #{xpPlayerRank.position}
                            </span>
                            <span className="ml-auto flex items-center gap-1 px-2 py-1 rounded-xl"
                                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
                                <img src={iconTrophy} alt="" className="w-3.5 h-3.5 object-contain" />
                                <span className="font-black text-xs tabular-nums" style={{ color: '#fbbf24' }}>
                                    {xpPlayerRank.xp.toLocaleString()} XP
                                </span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── List ── */}
                <div className="relative z-10 flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
                    <AnimatePresence mode="wait">
                        {xpLeaderboardLoading ? (
                            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-1.5">
                                {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} i={i} />)}
                            </motion.div>
                        ) : xpLeaderboard.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col items-center justify-center py-14 gap-4">
                                <motion.div
                                    animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                                    <img src={iconTrophy} alt="trophy" className="w-16 h-16 object-contain"
                                        style={{ filter: 'drop-shadow(0 8px 16px rgba(251,191,36,0.45))' }} />
                                </motion.div>
                                <div className="text-center">
                                    <p className="font-black text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                        Chưa có dữ liệu
                                    </p>
                                    <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                        Hãy chơi để tích lũy XP đầu tiên!
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key={xpActiveTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col gap-1.5">
                                {xpLeaderboard.map((entry, i) => (
                                    <LeaderboardRow
                                        key={entry.playFabId || entry.position}
                                        entry={entry}
                                        isMe={entry.playFabId === myPlayFabId}
                                        delay={i * 0.04}
                                        myAvatarUrl={myAvatarUrl}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex-shrink-0 px-4 py-2.5 text-center"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        XP tích lũy từ tất cả các game · Cập nhật theo thời gian thực
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default XPLeaderboardModal;
