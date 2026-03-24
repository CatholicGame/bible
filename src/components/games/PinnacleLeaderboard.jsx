import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayFabStore } from '../../store/playfabStore';
import { ChevronLeft, ChevronRight, Trophy, Crown } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeScore(score) {
    if (score >= 1_000_000) {
        const q15 = Math.floor(score / 1_000_000);
        const rem  = score % 1_000_000;
        return { q15, q14: Math.floor(rem / 1_000), q13: rem % 1_000 };
    }
    if (score >= 1_000) return { q15: 0, q14: Math.floor(score / 1_000), q13: score % 1_000 };
    return { q15: 0, q14: 0, q13: score };
}

function ScoreLabel({ score }) {
    const { q15, q14, q13 } = decodeScore(score);
    if (q15 > 0) return (
        <span className="text-xs font-black text-yellow-400">
            {q15}× Q15 ✅{q14 > 0 && <span className="text-blue-200 font-bold"> +{q14}×Q14</span>}
        </span>
    );
    if (q14 > 0) return <span className="text-xs font-black text-sky-300">{q14}× Q14</span>;
    return <span className="text-xs font-bold text-emerald-300">{q13}× Q13</span>;
}

function gapMessage(myScore, targetScore) {
    if (!targetScore || myScore >= targetScore) return null;
    const diff = targetScore - myScore;
    if (diff >= 1_000_000) return `Cần thêm ${Math.ceil(diff / 1_000_000)} lần Q15 ✅ để vượt`;
    if (diff >= 1_000)     return `Cần thêm ${Math.ceil(diff / 1_000)} lần Q14 để vượt`;
    return `Cần thêm ${diff} lần Q13 để vượt`;
}

const AVATAR_COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#ec4899'];

// ── Hall of Fame Slider ───────────────────────────────────────────────────────

const HallOfFameSlider = ({ entries = [], loading }) => {
    const [idx, setIdx] = useState(0);
    const timerRef = useRef(null);
    const touchX = useRef(null);
    const count = entries.length;

    const next = useCallback(() => setIdx(i => (i + 1) % Math.max(count, 1)), [count]);
    const prev = useCallback(() => setIdx(i => (i - 1 + Math.max(count, 1)) % Math.max(count, 1)), [count]);

    const resetTimer = useCallback(() => {
        clearInterval(timerRef.current);
        if (count > 1) timerRef.current = setInterval(next, 3500);
    }, [count, next]);

    useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [resetTimer]);

    const onDragStart = (e) => { touchX.current = e.touches?.[0]?.clientX ?? e.clientX; };
    const onDragEnd   = (e) => {
        if (touchX.current == null) return;
        const dx = touchX.current - (e.changedTouches?.[0]?.clientX ?? e.clientX);
        if (Math.abs(dx) > 40) { dx > 0 ? next() : prev(); resetTimer(); }
        touchX.current = null;
    };

    if (loading) return (
        <div className="flex items-center justify-center gap-2 h-12">
            {[...Array(3)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full bg-blue-400/20 animate-pulse" />)}
        </div>
    );

    if (!count) return (
        <p className="text-center text-white/50 text-xs italic py-2">Chưa có ai. Bạn sẽ là người đầu tiên?</p>
    );

    const e = entries[idx];
    const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
    const rankBadge = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

    return (
        <div onMouseDown={onDragStart} onMouseUp={onDragEnd}
            onTouchStart={onDragStart} onTouchEnd={onDragEnd} className="select-none">
            <div className="flex items-center justify-center gap-1 mb-2">
                <Crown size={11} className="text-yellow-300 opacity-80" />
                <span className="text-[9px] font-black tracking-[0.15em] uppercase text-yellow-300/80">Bảng Danh Dự</span>
                <Crown size={11} className="text-yellow-300 opacity-80" />
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => { prev(); resetTimer(); }} disabled={count <= 1}
                    className="p-1.5 rounded-full bg-blue-950/50 border-2 border-blue-700 text-white/80 shrink-0 disabled:opacity-30 active:translate-y-px">
                    <ChevronLeft size={14} />
                </button>

                <AnimatePresence mode="wait">
                    <motion.div key={idx}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                        className="flex-1 flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
                        <div className="relative shrink-0">
                            {e.avatarUrl
                                ? <img src={e.avatarUrl} alt={e.displayName} className="w-9 h-9 rounded-full object-cover border-2 border-yellow-400" />
                                : <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm border-2 border-yellow-400/60"
                                    style={{ background: color }}>{e.displayName?.[0]?.toUpperCase() || '?'}</div>
                            }
                            <span className="absolute -bottom-1 -right-1 text-xs">{rankBadge}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-black text-sm truncate">{e.displayName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {e.giaoxu && <span className="text-[10px] text-blue-200 font-semibold truncate">⛪ {e.giaoxu}</span>}
                                <ScoreLabel score={e.score} />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <button onClick={() => { next(); resetTimer(); }} disabled={count <= 1}
                    className="p-1.5 rounded-full bg-blue-950/50 border-2 border-blue-700 text-white/80 shrink-0 disabled:opacity-30 active:translate-y-px">
                    <ChevronRight size={14} />
                </button>
            </div>

            {count > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                    {entries.map((_, i) => (
                        <button key={i} onClick={() => { setIdx(i); resetTimer(); }}
                            className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-yellow-400 w-4' : 'bg-white/25 w-1.5'}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Rank Row ──────────────────────────────────────────────────────────────────

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const RankRow = ({ entry, isPlayer }) => {
    const medal = MEDAL[entry.position];
    const color = AVATAR_COLORS[(entry.position - 1) % AVATAR_COLORS.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (entry.position - 1) * 0.05 }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border-2"
            style={{
                background: isPlayer
                    ? 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.1))'
                    : 'rgba(255,255,255,0.08)',
                borderColor: isPlayer ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.15)',
                boxShadow: isPlayer ? '0 0 10px rgba(251,191,36,0.2)' : '0 2px 0 rgba(0,0,0,0.15)',
            }}>
            <div className="w-8 shrink-0 text-center">
                {medal ? <span className="text-base">{medal}</span>
                    : <span className="text-sm font-black" style={{ color: isPlayer ? '#fbbf24' : 'rgba(255,255,255,0.45)' }}>
                        #{entry.position}
                    </span>}
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 border-2"
                style={{ background: isPlayer ? '#fbbf24' : color, borderColor: isPlayer ? '#d97706' : 'rgba(255,255,255,0.3)', color: isPlayer ? '#1e3a8a' : 'white' }}>
                {isPlayer ? '👤' : (entry.displayName?.[0]?.toUpperCase() || '?')}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate leading-tight"
                    style={{ color: isPlayer ? '#fcd34d' : '#ffffff' }}>
                    {isPlayer ? 'Bạn' : entry.displayName}
                </p>
                {entry.giaoxu && !isPlayer && (
                    <p className="text-[10px] font-semibold truncate text-sky-300/80">⛪ {entry.giaoxu}</p>
                )}
            </div>
            <div className="shrink-0"><ScoreLabel score={entry.score} /></div>
        </motion.div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
    { key: 'daily',   label: 'Hôm nay' },
    { key: 'weekly',  label: 'Tuần' },
    { key: 'monthly', label: 'Tháng' },
    { key: 'allTime', label: 'Mọi thời đại' },
];

const PinnacleLeaderboard = ({ onBack }) => {
    const hallOfFame = usePlayFabStore(s => s.hallOfFame);
    const hallOfFameLoading = usePlayFabStore(s => s.hallOfFameLoading);
    const loadHallOfFame = usePlayFabStore(s => s.loadHallOfFame);
    const pinnacleLeaderboard = usePlayFabStore(s => s.pinnacleLeaderboard);
    const pinnaclePlayerRank = usePlayFabStore(s => s.pinnaclePlayerRank);
    const pinnacleLeaderboardLoading = usePlayFabStore(s => s.pinnacleLeaderboardLoading);
    const pinnacleActiveTab = usePlayFabStore(s => s.pinnacleActiveTab);
    const loadPinnacleLeaderboard = usePlayFabStore(s => s.loadPinnacleLeaderboard);

    useEffect(() => {
        loadHallOfFame();
        loadPinnacleLeaderboard(pinnacleActiveTab);
    }, []); // eslint-disable-line

    const handleTabChange = (tab) => { if (tab !== pinnacleActiveTab) loadPinnacleLeaderboard(tab); };

    const playerScore  = pinnaclePlayerRank?.score ?? 0;
    const playerPos    = pinnaclePlayerRank?.position ?? null;
    const playerInList = pinnacleLeaderboard.some(e => e.position === playerPos);

    let gapMsg = null;
    if (playerPos && playerPos > 1) {
        const above = pinnacleLeaderboard.find(e => e.position === playerPos - 1);
        if (above) gapMsg = gapMessage(playerScore, above.score);
    }

    const isEmpty = !pinnacleLeaderboardLoading && pinnacleLeaderboard.length === 0;

    return (
        /* Full-screen container — game background shows through */
        <div className="absolute inset-0 flex flex-col p-3 pt-3">

            {/* ═══ SINGLE UNIFIED CARD — header + body share same container ═══ */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[1.5rem] border-[3px] border-[#1e3a8a] min-h-0"
                style={{
                    background: 'linear-gradient(180deg,#1e3a8a 0%,#1e40af 30%,#1d4ed8 100%)',
                    boxShadow: '0 6px 0 rgba(23,37,84,0.9), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}>

                {/* Card shine */}
                <div className="h-1.5 w-full rounded-t-[calc(1.5rem-2px)] bg-white/20 shrink-0" />

                {/* ─── HEADER area inside card ─── */}
                <div className="shrink-0 px-4 pt-3 pb-3 border-b-2 border-[#172554]">

                    {/* Title row */}
                    <div className="relative flex items-center justify-center mb-3">
                        <button onClick={onBack}
                            className="absolute left-1 w-10 h-10 rounded-full flex items-center justify-center text-white
                                       bg-blue-700 border-[3px] border-[#172554]
                                       shadow-[0_4px_0_rgba(23,37,84,1)]
                                       active:translate-y-1 active:shadow-none transition-all">
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-2 px-12">
                            <Trophy size={18} className="text-yellow-400 shrink-0" />
                            <h1 className="text-white font-black text-sm sm:text-base tracking-wide text-center leading-tight"
                                style={{ textShadow: '0 2px 0 #172554' }}>
                                BXH Ai là Nhà Thần Học
                            </h1>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 rounded-full bg-[#172554] border-[3px] border-[#0f172a]"
                        style={{ boxShadow: '0 3px 0 rgba(15,23,42,1), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => handleTabChange(t.key)}
                                className="flex-1 py-1.5 rounded-full text-xs font-black transition-all duration-200"
                                style={pinnacleActiveTab === t.key
                                    ? {
                                        background: 'linear-gradient(180deg,#fbbf24,#f59e0b)',
                                        color: '#1e3a8a',
                                        boxShadow: '0 2px 0 #d97706, inset 0 1px 0 rgba(255,255,255,0.4)',
                                    }
                                    : { color: 'rgba(255,255,255,0.55)' }
                                }>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hall of Fame */}
                <div className="shrink-0 px-4 pt-3 pb-3 border-b-2 border-[#172554]">
                    <HallOfFameSlider entries={hallOfFame} loading={hallOfFameLoading} />
                </div>

                {/* Rank list */}
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 scrollbar-hide min-h-0">
                    {pinnacleLeaderboardLoading ? (
                        <div className="flex flex-col gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-12 rounded-2xl animate-pulse bg-white/8"
                                    style={{ animationDelay: `${i * 0.09}s` }} />
                            ))}
                        </div>
                    ) : isEmpty ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}>
                                <Trophy size={88} className="text-yellow-400" strokeWidth={1.5}
                                    style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.7)) drop-shadow(0 4px 0 rgba(180,83,9,0.5))' }} />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                                className="text-center">
                                <p className="text-white font-black text-base mb-1" style={{ textShadow: '0 2px 0 #1e3a8a' }}>
                                    Chưa có ai lọt bảng xếp hạng.
                                </p>
                                <p className="text-yellow-400 font-black text-sm" style={{ textShadow: '0 1px 0 #d97706' }}>
                                    Hãy là người đầu tiên!
                                </p>
                            </motion.div>
                        </div>
                    ) : (
                        <>
                            {pinnacleLeaderboard.map(entry => (
                                <RankRow key={entry.position} entry={entry} isPlayer={entry.position === playerPos} />
                            ))}

                            {pinnaclePlayerRank && !playerInList && (
                                <>
                                    <div className="flex items-center gap-2 my-1">
                                        <div className="flex-1 h-px bg-white/15" />
                                        <span className="text-white/30 text-xs tracking-widest">···</span>
                                        <div className="flex-1 h-px bg-white/15" />
                                    </div>
                                    <RankRow
                                        entry={{ position: playerPos, displayName: 'Bạn', score: playerScore, giaoxu: null }}
                                        isPlayer
                                    />
                                </>
                            )}

                            {gapMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                    className="mt-1 px-4 py-2.5 rounded-2xl border-2 border-yellow-400/40 text-center"
                                    style={{ background: 'rgba(251,191,36,0.12)' }}>
                                    <p className="text-yellow-200 text-xs font-bold">💡 {gapMsg}</p>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

export default PinnacleLeaderboard;
