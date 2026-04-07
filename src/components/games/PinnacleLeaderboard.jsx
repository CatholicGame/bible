import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RefreshCw, Medal, CalendarDays, Calendar, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePlayFabStore } from '../../store/playfabStore';
import UserAvatar from '../common/UserAvatar';
import iconTrophy from '../../assets/common/trophy.png';

/* ── Period tabs ── */
const TABS = [
    { key: 'daily',   labelShort: 'Ngày',  icon: CalendarDays },
    { key: 'weekly',  labelShort: 'Tuần',  icon: Calendar },
    { key: 'monthly', labelShort: 'Tháng', icon: Calendar },
    { key: 'allTime', labelShort: 'Tổng',  icon: InfinityIcon },
];

/* ── Score display ── */
function decodeScore(score) {
    if (score >= 1_000_000) {
        const q15 = Math.floor(score / 1_000_000);
        const rem  = score % 1_000_000;
        return { q15, q14: Math.floor(rem / 1_000), q13: rem % 1_000 };
    }
    if (score >= 1_000) return { q15: 0, q14: Math.floor(score / 1_000), q13: score % 1_000 };
    return { q15: 0, q14: 0, q13: score };
}

function ScoreText({ score }) {
    const { q15, q14, q13 } = decodeScore(score);
    if (q15 > 0) return <span className="font-black text-xs tabular-nums" style={{ color: '#fbbf24' }}>{q15}×Q15{q14 > 0 && <span className="text-sky-300"> +{q14}×Q14</span>}</span>;
    if (q14 > 0) return <span className="font-black text-xs tabular-nums" style={{ color: '#fbbf24' }}>{q14}×Q14</span>;
    return <span className="font-black text-xs tabular-nums" style={{ color: '#fbbf24' }}>{q13}×Q13</span>;
}

/* Top-3 special config */
const TOP3 = [
    { bg: 'linear-gradient(135deg,#78350f 0%,#431407 100%)', border: '#fbbf24', glow: '#fbbf24', label: '#fbbf24', pos: '🥇', size: 34 },
    { bg: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)', border: '#94a3b8', glow: '#94a3b8', label: '#cbd5e1', pos: '🥈', size: 32 },
    { bg: 'linear-gradient(135deg,#431407 0%,#1c0a04 100%)', border: '#fb923c', glow: '#fb923c', label: '#fdba74', pos: '🥉', size: 30 },
];

/* ── Individual row ── */
const LeaderboardRow = ({ entry, isMe, delay = 0 }) => {
    const isTop3 = entry.position <= 3;
    const top3Cfg = isTop3 ? TOP3[entry.position - 1] : null;

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
                    ? 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.08))'
                    : isTop3
                    ? top3Cfg.bg
                    : 'rgba(255,255,255,0.04)',
                border: isMe
                    ? '2px solid rgba(245,158,11,0.5)'
                    : isTop3
                    ? `2px solid ${top3Cfg.border}55`
                    : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isMe
                    ? '0 0 18px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.07)'
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
            {/* Shine strip */}
            {(isTop3 || isMe) && (
                <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                    style={{ background: `linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)` }} />
            )}

            {/* Position */}
            <div className="flex-shrink-0 w-8 text-center relative z-10">
                {isTop3 ? (
                    <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
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
                    photoURL={entry.avatarUrl}
                    size={isTop3 ? 36 : 30}
                    style={{
                        border: isTop3 ? `2.5px solid ${top3Cfg.border}66` : '2px solid rgba(255,255,255,0.12)',
                        boxShadow: isTop3 ? `0 0 8px ${top3Cfg.glow}44` : 'none',
                    }}
                />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5">
                    <span className="font-black leading-tight truncate"
                        style={{
                            fontSize: isTop3 ? 13 : 12,
                            color: isMe ? '#fbbf24' : isTop3 ? top3Cfg.label : '#e2e8f0',
                            textShadow: isTop3 ? `0 1px 6px ${top3Cfg.glow}55` : 'none',
                        }}>
                        {entry.displayName}
                    </span>
                    {isMe && (
                        <span className="flex-shrink-0 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full"
                            style={{ background: '#f59e0b', color: '#fff', letterSpacing: '0.08em',
                                     boxShadow: '0 0 6px rgba(245,158,11,0.5)' }}>
                            Bạn
                        </span>
                    )}
                </div>
                {entry.giaoxu && (
                    <span className="text-[9px] font-semibold"
                        style={{ color: isTop3 ? `${top3Cfg.glow}99` : 'rgba(186,230,253,0.5)' }}>
                        ⛪ {entry.giaoxu}
                    </span>
                )}
            </div>

            {/* Score */}
            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-xl relative z-10"
                style={{
                    background: isTop3 ? `${top3Cfg.glow}18` : 'rgba(255,255,255,0.05)',
                    border: isTop3 ? `1px solid ${top3Cfg.glow}30` : '1px solid rgba(255,255,255,0.06)',
                }}>
                <img src={iconTrophy} alt="" className="object-contain"
                    style={{ width: isTop3 ? 14 : 12, height: isTop3 ? 14 : 12 }} />
                <ScoreText score={entry.score} />
            </div>
        </motion.div>
    );
};

/* ── Skeleton row ── */
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

/* ── Main Component ── */
const PinnacleLeaderboard = ({ onBack }) => {
    const pinnacleLeaderboard = usePlayFabStore(s => s.pinnacleLeaderboard);
    const pinnaclePlayerRank  = usePlayFabStore(s => s.pinnaclePlayerRank);
    const pinnacleLeaderboardLoading = usePlayFabStore(s => s.pinnacleLeaderboardLoading);
    const pinnacleActiveTab   = usePlayFabStore(s => s.pinnacleActiveTab);
    const loadPinnacleLeaderboard = usePlayFabStore(s => s.loadPinnacleLeaderboard);
    const myPlayFabId = usePlayFabStore(s => s.playFabId);
    const myAvatarUrl = usePlayFabStore(s => s.avatarUrl);

    const loadTab = useCallback((tab) => {
        loadPinnacleLeaderboard(tab);
    }, [loadPinnacleLeaderboard]);

    useEffect(() => { loadTab('allTime'); }, []); // eslint-disable-line

    const playerPos    = pinnaclePlayerRank?.position ?? null;
    const playerScore  = pinnaclePlayerRank?.score ?? 0;
    const playerInList = pinnacleLeaderboard.some(e => e.position === playerPos);

    const activeTab = TABS.find(t => t.key === pinnacleActiveTab) || TABS[3];

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(14px)' }}
            onClick={onBack}
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
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Ambient top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse,#f59e0b1e 0%,transparent 70%)', zIndex: 0 }} />
                {/* ── Header ── */}
                <div className="relative z-10 flex-shrink-0 flex items-center gap-3 px-4 pt-4 pb-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <motion.button whileTap={{ scale: 0.86 }} onClick={onBack}
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                        <ChevronLeft size={16} color="rgba(255,255,255,0.65)" />
                    </motion.button>
                    <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: 'linear-gradient(145deg,#fbbf24,#d97706,#92400e)',
                            border: '2.5px solid #fbbf2488',
                            boxShadow: '0 4px 0 #78350f, 0 0 22px #fbbf2455, inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}>
                        <img src={iconTrophy} alt="trophy" className="w-6 h-6 object-contain" />
                    </motion.div>
                    <div className="flex-1">
                        <h2 className="font-black text-base leading-tight"
                            style={{ color: '#fff', textShadow: '0 1px 8px rgba(251,191,36,0.3)' }}>
                            AI Arena Ranking
                        </h2>
                        <p className="text-[10px] font-semibold flex items-center gap-1"
                            style={{ color: 'rgba(255,255,255,0.35)' }}>
                            <Sparkles size={9} style={{ color: '#f59e0b' }} />
                            Top người chơi xuất sắc nhất
                        </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.86 }}
                        onClick={() => loadTab(pinnacleActiveTab)}
                        disabled={pinnacleLeaderboardLoading}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                        <motion.div
                            animate={pinnacleLeaderboardLoading ? { rotate: 360 } : {}}
                            transition={{ duration: 0.8, repeat: pinnacleLeaderboardLoading ? Infinity : 0, ease: 'linear' }}>
                            <RefreshCw size={13} color="rgba(255,255,255,0.5)" />
                        </motion.div>
                    </motion.button>
                </div>

                {/* ── Tabs ── */}
                <div className="relative z-10 flex-shrink-0 flex gap-1.5 mx-3 mt-2.5 p-1 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {TABS.map(tab => {
                        const isActive = tab.key === pinnacleActiveTab;
                        return (
                            <motion.button
                                key={tab.key}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => loadTab(tab.key)}
                                className="flex-1 py-1.5 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all"
                                style={{
                                    background: isActive ? 'linear-gradient(135deg,#fbbf24,#d97706)' : 'transparent',
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

                {/* ── My rank pill ── — only when score > 0 */}
                <AnimatePresence mode="wait">
                    {pinnaclePlayerRank && playerScore > 0 && !pinnacleLeaderboardLoading && (
                        <motion.div
                            key={pinnacleActiveTab + '-rank'}
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex-shrink-0 flex items-center gap-2 mx-3 mt-2 px-3.5 py-2.5 rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.08))',
                                border: '1.5px solid rgba(245,158,11,0.4)',
                                boxShadow: '0 4px 16px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.07)',
                            }}
                        >
                            <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                                style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)' }} />
                            <Medal size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
                            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Vị trí {activeTab.labelShort.toLowerCase()}:
                            </span>
                            <span className="font-black text-base" style={{ color: '#fbbf24',
                                textShadow: '0 0 10px rgba(251,191,36,0.55)' }}>
                                #{playerPos}
                            </span>
                            <span className="ml-auto flex items-center gap-1 px-2 py-1 rounded-xl"
                                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)' }}>
                                <img src={iconTrophy} alt="" className="w-3.5 h-3.5 object-contain" />
                                <ScoreText score={playerScore} />
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

                    <AnimatePresence mode="wait">
                        {pinnacleLeaderboardLoading ? (
                            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-1.5">
                                {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} i={i} />)}
                            </motion.div>
                        ) : pinnacleLeaderboard.length === 0 ? (
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
                                        Hãy chơi để trở thành người đầu tiên!
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key={pinnacleActiveTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col gap-1.5">
                                {pinnacleLeaderboard.map((entry, i) => (
                                    <LeaderboardRow
                                        key={entry.playFabId || entry.position}
                                        entry={entry}
                                        isMe={entry.playFabId === myPlayFabId}
                                        delay={i * 0.035}
                                    />
                                ))}

                                {/* Player not in top list — only when has real score */}
                                {pinnaclePlayerRank && playerScore > 0 && !playerInList && (
                                    <>
                                        <div className="flex items-center gap-2 my-1">
                                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                                            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>vị trí của bạn</span>
                                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                        <LeaderboardRow
                                            entry={{ position: playerPos, displayName: 'Bạn', score: playerScore, playFabId: myPlayFabId, avatarUrl: myAvatarUrl }}
                                            isMe={true}
                                            delay={0}
                                        />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-2.5 text-center"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.22)' }}>
                        Bảng xếp hạng game Ai Là Nhà Thần Học · Cập nhật thời gian thực
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default PinnacleLeaderboard;
