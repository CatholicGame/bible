import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, RefreshCw, Medal, Calendar, CalendarDays, Infinity } from 'lucide-react';
import { usePlayFabStore } from '../../store/playfabStore';
import { getRankByScore, RANK_TIERS } from '../../utils/ranks';
import UserAvatar from '../common/UserAvatar';
import iconTrophy from '../../assets/common/trophy.png';

/* ── Period tabs ── */
const TABS = [
    { key: 'daily',   label: 'Hôm nay',  labelShort: 'Ngày',  icon: CalendarDays },
    { key: 'weekly',  label: 'Tuần này', labelShort: 'Tuần',  icon: Calendar },
    { key: 'monthly', label: 'Tháng',    labelShort: 'Tháng', icon: Calendar },
    { key: 'allTime', label: 'Tổng',     labelShort: 'Tổng',  icon: Infinity },
];

/* ── Rank color palette ── */
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

const MEDALS = [
    { emoji: '🥇', glow: '#fbbf24' },
    { emoji: '🥈', glow: '#94a3b8' },
    { emoji: '🥉', glow: '#fb923c' },
];

/* Individual row */
const LeaderboardRow = ({ entry, isMe, delay = 0 }) => {
    const color = getRankColor(entry.xp);
    const rankName = getRankByScore(entry.xp);
    const medal = entry.position <= 3 ? MEDALS[entry.position - 1] : null;
    const isTop3 = entry.position <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(delay, 0.4), duration: 0.22 }}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl overflow-hidden"
            style={{
                background: isMe
                    ? `linear-gradient(135deg, ${color.from}22, ${color.from}10)`
                    : isTop3
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(255,255,255,0.04)',
                border: isMe
                    ? `2px solid ${color.from}55`
                    : isTop3
                    ? `1.5px solid ${medal.glow}30`
                    : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isMe ? `0 0 12px ${color.glow}33` : 'none',
            }}
        >
            {/* Position */}
            <div className="flex-shrink-0 w-8 text-center">
                {medal ? (
                    <span className="text-xl leading-none">{medal.emoji}</span>
                ) : (
                    <span className="font-black text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        #{entry.position}
                    </span>
                )}
            </div>

            {/* Avatar */}
            <UserAvatar
                name={entry.displayName}
                photoURL={entry.avatarUrl}
                size={32}
                style={{ flexShrink: 0, border: `2px solid ${color.from}55` }}
            />

            {/* Name + rank */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm leading-tight truncate" style={{ color: isMe ? color.glow : '#f1f5f9' }}>
                        {entry.displayName}
                    </span>
                    {isMe && (
                        <span className="flex-shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                            style={{ background: color.from, color: '#fff', letterSpacing: '0.06em' }}>
                            Bạn
                        </span>
                    )}
                </div>
                <span className="text-[9px] font-semibold" style={{ color: color.from + 'cc' }}>
                    {rankName}
                </span>
            </div>

            {/* XP */}
            <div className="flex-shrink-0 flex items-center gap-1">
                <img src={iconTrophy} alt="XP" className="w-3.5 h-3.5 object-contain opacity-70" />
                <span className="font-black text-xs tabular-nums" style={{ color: '#fbbf24' }}>
                    {entry.xp.toLocaleString()}
                </span>
            </div>
        </motion.div>
    );
};

/* Skeleton row */
const SkeletonRow = ({ i }) => (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl animate-pulse"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="w-8 h-4 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded" style={{ width: `${55 + (i % 4) * 10}%`, background: 'rgba(255,255,255,0.07)' }} />
            <div className="h-2 rounded w-1/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="w-14 h-3 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
    </div>
);

/* ── Main modal ── */
const XPLeaderboardModal = ({ onClose }) => {
    const {
        xpLeaderboard, xpLeaderboardLoading, xpPlayerRank,
        xpActiveTab, loadXPLeaderboard, globalScore,
    } = usePlayFabStore();
    const myPlayFabId = usePlayFabStore(s => s.playFabId);

    const loadTab = useCallback((tab) => {
        loadXPLeaderboard(tab);
    }, [loadXPLeaderboard]);

    // Load default tab on mount
    useEffect(() => {
        loadTab('allTime');
    }, [loadTab]);

    const myRankColor = getRankColor(globalScore);
    const activeTabCfg = TABS.find(t => t.key === xpActiveTab) || TABS[3];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(14px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 40, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 40, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
                style={{
                    height: '85vh',
                    maxHeight: '88vh',
                    background: 'linear-gradient(165deg, #0d1829 0%, #1a2a40 100%)',
                    border: '1.5px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 -12px 50px rgba(0,0,0,0.7)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-4 pb-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                            border: '2.5px solid #b45309',
                            boxShadow: '0 3px 0 #92400e, 0 0 16px #fbbf2455',
                        }}>
                        <Trophy size={18} strokeWidth={2.5} color="#fff" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-black text-base leading-tight text-white">Bảng Xếp Hạng XP</h2>
                        <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            Top người chơi tích lũy XP cao nhất
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <motion.button whileTap={{ scale: 0.86 }}
                            onClick={() => loadTab(xpActiveTab)}
                            disabled={xpLeaderboardLoading}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                            <motion.div
                                animate={xpLeaderboardLoading ? { rotate: 360 } : {}}
                                transition={{ duration: 0.8, repeat: xpLeaderboardLoading ? Infinity : 0, ease: 'linear' }}>
                                <RefreshCw size={13} color="rgba(255,255,255,0.55)" />
                            </motion.div>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.86 }} onClick={onClose}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
                            <X size={15} color="rgba(239,68,68,0.75)" />
                        </motion.button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex-shrink-0 flex gap-1.5 px-3 pt-2.5 pb-0">
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
                                        ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                                        : 'rgba(255,255,255,0.06)',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
                                    border: isActive ? '1.5px solid #b45309' : '1.5px solid rgba(255,255,255,0.07)',
                                    boxShadow: isActive ? '0 2px 0 #92400e' : 'none',
                                }}
                            >
                                {tab.labelShort}
                            </motion.button>
                        );
                    })}
                </div>

                {/* ── My rank pill ── */}
                <AnimatePresence mode="wait">
                    {xpPlayerRank && !xpLeaderboardLoading && (
                        <motion.div
                            key={xpActiveTab + '-rank'}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex-shrink-0 flex items-center gap-2 mx-3 mt-2 px-3 py-2 rounded-2xl"
                            style={{
                                background: `${myRankColor.from}15`,
                                border: `1.5px solid ${myRankColor.from}30`,
                            }}
                        >
                            <Medal size={12} style={{ color: myRankColor.glow, flexShrink: 0 }} />
                            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.42)' }}>
                                Vị trí {activeTabCfg.label.toLowerCase()}:
                            </span>
                            <span className="font-black text-sm" style={{ color: myRankColor.glow }}>
                                #{xpPlayerRank.position}
                            </span>
                            <span className="ml-auto flex items-center gap-1 font-black text-xs" style={{ color: '#fbbf24' }}>
                                <img src={iconTrophy} alt="XP" className="w-3.5 h-3.5 object-contain" />
                                {xpPlayerRank.xp.toLocaleString()} XP
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

                    <AnimatePresence mode="wait">
                        {xpLeaderboardLoading ? (
                            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-1.5">
                                {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} i={i} />)}
                            </motion.div>
                        ) : xpLeaderboard.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col items-center justify-center py-14 gap-3">
                                <span className="text-5xl">🏆</span>
                                <div className="text-center">
                                    <p className="font-black" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                                        Chưa có dữ liệu
                                    </p>
                                    <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
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
                                        delay={i * 0.035}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-2.5 text-center"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.22)' }}>
                        XP tích lũy từ tất cả các game · Cập nhật theo thời gian thực
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default XPLeaderboardModal;
