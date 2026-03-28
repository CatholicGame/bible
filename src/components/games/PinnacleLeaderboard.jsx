import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayFabStore } from '../../store/playfabStore';
import { createPortal } from 'react-dom';
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

function ScoreLabel({ score, inheritColor }) {
    const { q15, q14, q13 } = decodeScore(score);
    if (q15 > 0) return (
        <span className={inheritColor ? "" : "text-xs font-black text-yellow-400"}>
            {q15}× Q15 ✅{q14 > 0 && <span className={inheritColor ? "opacity-90" : "text-blue-200 font-bold"}> +{q14}×Q14</span>}
        </span>
    );
    if (q14 > 0) return <span className={inheritColor ? "" : "text-xs font-black text-sky-300"}>{q14}× Q14</span>;
    return <span className={inheritColor ? "" : "text-xs font-bold text-emerald-300"}>{q13}× Q13</span>;
}

function gapMessage(myScore, targetScore) {
    if (!targetScore || myScore >= targetScore) return null;
    const diff = targetScore - myScore;
    if (diff >= 1_000_000) return `Cần thêm ${Math.ceil(diff / 1_000_000)} lần Q15 ✅ để vượt`;
    if (diff >= 1_000)     return `Cần thêm ${Math.ceil(diff / 1_000)} lần Q14 để vượt`;
    return `Cần thêm ${diff} lần Q13 để vượt`;
}

const AVATAR_COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#ec4899','#06b6d4','#84cc16'];
function seedColor(name) { let h = 0; for (const c of (name || '?')) h += c.charCodeAt(0); return AVATAR_COLORS[h % AVATAR_COLORS.length]; }

// ── Hall of Fame Slider ───────────────────────────────────────────────────────

const HallOfFameSlider = ({ entries = [], loading }) => {
    const [idx, setIdx] = useState(0);
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef(null);
    const touchX = useRef(null);
    const count = entries.length;

    const goTo = useCallback((newIdx) => {
        setAnimating(true);
        setTimeout(() => {
            setIdx(newIdx);
            setAnimating(false);
        }, 180);
    }, []);

    const next = useCallback(() => goTo((idx + 1) % Math.max(count, 1)), [goTo, idx, count]);
    const prev = useCallback(() => goTo((idx - 1 + Math.max(count, 1)) % Math.max(count, 1)), [goTo, idx, count]);

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

                <div className="flex-1 flex items-center justify-between px-3 rounded-full h-[54px]"
                    style={{
                        background: 'linear-gradient(180deg, rgba(30,58,138,0.9) 0%, rgba(23,37,84,0.95) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                        opacity: animating ? 0 : 1,
                        transform: animating ? 'translateX(8px)' : 'translateX(0)',
                        transition: 'opacity 0.18s ease, transform 0.18s ease',
                    }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative shrink-0">
                            <NormalAvatar name={e.displayName} avatarUrl={e.avatarUrl} />
                            <span className="absolute -bottom-1 -right-1 text-lg drop-shadow-lg z-30">{rankBadge}</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-white font-black text-[13px] leading-tight mt-0.5 break-words" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{e.displayName}</p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                                {e.giaoxu && <span className="text-[10px] text-blue-200 font-semibold truncate">⛪ {e.giaoxu}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 relative z-20 font-black ml-1 pr-1" style={{ fontSize: '16px', color: '#fcd34d', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        <ScoreLabel score={e.score} inheritColor={true} />
                    </div>
                </div>

                <button onClick={() => { next(); resetTimer(); }} disabled={count <= 1}
                    className="p-1.5 rounded-full bg-blue-950/50 border-2 border-blue-700 text-white/80 shrink-0 disabled:opacity-30 active:translate-y-px">
                    <ChevronRight size={14} />
                </button>
            </div>

            {count > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                    {entries.map((_, i) => (
                        <button key={i} onClick={() => { goTo(i); resetTimer(); }}
                            className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-yellow-400 w-4' : 'bg-white/25 w-1.5'}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Medal & Avatar Components ───────────────────────────────────────────────────

const MedalIcon = ({ pos }) => {
    const isGold = pos === 1;
    const isSilver = pos === 2;
    const isBronze = pos === 3;
    const colors = isGold ? ['#fde047', '#eab308', '#a16207', '#78350f'] :
                   isSilver ? ['#f1f5f9', '#cbd5e1', '#64748b', '#334155'] :
                   isBronze ? ['#fed7aa', '#f97316', '#c2410c', '#7c2d12'] : null;

    if (!colors) return (
         <div className="w-10 h-10 rounded-full border-[1.5px] border-white/20 bg-white/5 flex items-center justify-center shadow-inner">
             <span className="font-black text-white/50 text-sm">#{pos}</span>
         </div>
    );

    return (
        <div className="relative flex justify-center items-start w-14 h-16 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
            {/* Ribbons */}
            <div className="absolute top-8 flex gap-1 z-0">
                <div className="w-3.5 h-8" style={{ background: `linear-gradient(180deg, ${colors[2]}, ${colors[3]})`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: 'rotate(15deg) translateX(3px)' }} />
                <div className="w-3.5 h-8" style={{ background: `linear-gradient(180deg, ${colors[2]}, ${colors[3]})`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: 'rotate(-15deg) translateX(-3px)' }} />
            </div>

            {/* Seal / Rosette base via CSS rotation */}
            <div className="relative z-10 w-[46px] h-[46px] mt-0.5 flex items-center justify-center">
                {/* 3 rotated squares to make 12-point star */}
                {[0, 30, 60].map(deg => (
                    <div key={deg} className="absolute inset-0 rounded-[4px]" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})`, transform: `rotate(${deg}deg)`, boxShadow: '0 0 2px rgba(0,0,0,0.3)' }} />
                ))}
                {/* Inner raised circle */}
                <div className="absolute w-[36px] h-[36px] rounded-full flex items-center justify-center border-[2px]"
                     style={{ background: `linear-gradient(135deg, ${colors[1]}, ${colors[2]})`, borderColor: colors[0] }}>
                     <span className="font-black text-[22px] drop-shadow-md" style={{ color: colors[0], WebkitTextStroke: `0.5px ${colors[3]}` }}>{pos}</span>
                </div>
            </div>
        </div>
    );
};

const PlayerAvatar = ({ name, avatarUrl, sizeClass = "w-16 h-16", textClass = "text-2xl" }) => (
    <div className={`relative z-10 ${sizeClass} rounded-full p-[2px] shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0`}
         style={{ background: 'linear-gradient(135deg, #fef08a 0%, #ca8a04 50%, #78350f 100%)' }}>
        <div className="w-full h-full rounded-full border-[2px] border-[#fef08a]/60 bg-gradient-to-br from-[#b45309] via-[#eab308] to-[#fef08a] flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] overflow-hidden">
             {avatarUrl ? (
                 <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
             ) : (
                 <span className={`font-black ${textClass} text-[#78350f] drop-shadow-sm`}>{(name || '?')[0].toUpperCase()}</span>
             )}
        </div>
    </div>
);

const NormalAvatar = ({ name, avatarUrl, sizeClass = "w-14 h-14", textClass = "text-xl" }) => {
    const col = seedColor(name);
    return (
        <div className={`relative z-10 ${sizeClass} rounded-full p-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0`}
             style={{ background: `linear-gradient(135deg, ${col}cc 0%, ${col} 60%, ${col}99 100%)` }}>
            <div className="w-full h-full rounded-full border-[2px] border-white/30 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] overflow-hidden"
                 style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.25) 100%), ${col}` }}>
                 {avatarUrl ? (
                     <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                 ) : (
                    <span className={`font-black ${textClass} text-white drop-shadow-md`} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{(name || '?')[0].toUpperCase()}</span>
                 )}
            </div>
            {/* Tiny crown */}
            <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 flex items-center justify-center drop-shadow-md">
                <span style={{ fontSize: '1.25rem' }}>👑</span>
            </div>
        </div>
    );
};

// ── Rank Content ────────────────────────────────────────────────────────────

const HeroCard = ({ entry, isPlayer, myAvatarUrl }) => {
    const { q15, q14, q13 } = decodeScore(entry.score);
    // Build pills based on counts
    const pills = [];
    if (q15 > 0) pills.push({ label: `Q15 ×${q15}`, color: 'text-red-400' });
    if (q14 > 0) pills.push({ label: `Q14 ×${q14}`, color: 'text-yellow-400' });
    if (q13 > 0) pills.push({ label: `Q13 ×${q13}`, color: 'text-sky-400' });
    if (pills.length === 0) pills.push({ label: `${entry.score} XP`, color: 'text-emerald-400' });

    // Mock banner text based on top score
    let bannerText = "Vượt qua thử thách xuất sắc trong tuần!";
    if (q15 > 0) bannerText = `Chinh phục Level 15 ${q15} lần trong tuần!`;
    else if (q14 > 0) bannerText = `Vượt qua Level 14 ${q14} lần trong tuần!`;
    else if (q13 > 0) bannerText = `Vượt qua Level 13 ${q13} lần trong tuần!`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border-[2px] relative overflow-hidden mb-4 mt-1 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            style={{
                background: 'linear-gradient(135deg, #b45309 0%, #422006 100%)', // gold to dark brown
                borderColor: '#fde047',
                zIndex: 20
            }}
        >
            {/* Ambient glows */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-600/20 blur-2xl rounded-full pointer-events-none" />
            
            <div className="flex gap-2 items-center px-1 sm:px-2 py-3 relative z-10 w-full min-w-0">
                <div className="shrink-0 relative z-20 flex justify-center transform scale-100 sm:scale-105">
                    <MedalIcon pos={1} />
                </div>

                <div className="shrink-0 relative ml-0.5 sm:ml-1 flex justify-center items-center z-20">
                    <div className="absolute inset-0 bg-yellow-400/40 blur-xl rounded-full scale-125" />
                    <PlayerAvatar 
                        name={entry.displayName} 
                        avatarUrl={isPlayer ? myAvatarUrl : entry.avatarUrl} 
                        sizeClass="w-[62px] h-[62px] sm:w-[72px] sm:h-[72px]" 
                        textClass="text-3xl sm:text-4xl"
                    />
                </div>

                <div className="flex-1 flex flex-col justify-center ml-1 z-20 min-w-0">
                    <div className="text-sm sm:text-base font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide uppercase mb-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {isPlayer ? 'Bạn' : entry.displayName}
                    </div>
                    
                </div>

                <div className="flex flex-col gap-1.5 items-end ml-1 mr-1 shrink-0 z-20">
                    {pills.slice(0, 2).map((p, idx) => (
                         <div key={idx} className="bg-black/30 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 border border-white/10 flex items-center gap-1 sm:gap-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                             <span className={p.color + " text-[10px] sm:text-[12px]"}>⚡</span>
                             <span className="text-white text-[10px] sm:text-[11px] font-bold whitespace-nowrap">{p.label}</span>
                         </div>
                    ))}
                </div>
            </div>

            <div className="bg-black/40 w-full py-1.5 px-2 text-center mt-auto border-t border-white/10 relative z-10">
                <span className="text-yellow-300 text-[9px] sm:text-[10px] font-bold tracking-wide">🏆 Thành tích: {bannerText}</span>
            </div>
        </motion.div>
    );
};

const PlayerCard = ({ entry, isPlayer, targetEntry, myAvatarUrl }) => {
    const pos = entry.position;
    const bg = isPlayer 
        ? 'linear-gradient(135deg, #0284c7 0%, #4338ca 100%)' // xanh -> tím
        : 'linear-gradient(180deg, rgba(30,58,138,0.7) 0%, rgba(23,37,84,0.8) 100%)';
    const border = isPlayer ? '#38bdf8' : 'rgba(255,255,255,0.1)';
    const shadow = isPlayer ? '0 0 15px rgba(56,189,248,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.1)';

    const { q15, q14, q13 } = decodeScore(entry.score);
    let scoreStrParts = [];
    if (q15 > 0) scoreStrParts.push(`${q15}x Q15`);
    if (q14 > 0) scoreStrParts.push(`${q14}x Q14`);
    if (q13 > 0) scoreStrParts.push(`${q13}x Q13`);
    const scoreStr = scoreStrParts.join(' | ') || `${entry.score} XP`;

    let progressEl = null;
    if (isPlayer && targetEntry) {
        // Calculate rough percentage (minimum 5%)
        let percent = 5;
        if (targetEntry.score > 0) {
            percent = Math.floor(Math.max(5, Math.min(100, (entry.score / targetEntry.score) * 100)));
        }
        const gap = gapMessage(entry.score, targetEntry.score);
        progressEl = gap ? (
            <div className="mt-3 pt-2.5 border-t border-white/10 w-full relative z-30">
                <div className="flex justify-between items-center text-[10px] font-bold text-sky-200 mb-1.5 px-0.5">
                    <span className="flex items-center gap-1">
                        <span className="text-yellow-400">⚡</span> Đuổi Top #{targetEntry.position}
                    </span>
                    <span>{percent}%</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/5 relative">
                    <div className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                        style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #facc15 0%, #4ade80 100%)' }}>
                        <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 skew-x-12 translate-x-2 blur-[1px]" />
                    </div>
                </div>
                <div className="text-center mt-1.5 text-[10px] text-sky-200 italic font-semibold">
                    → {gap}
                </div>
            </div>
        ) : null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min((pos - 1) * 0.07, 0.5), type: 'spring', stiffness: 210, damping: 20 }}
            className={`rounded-xl border-2 p-3 relative mb-2 flex flex-col`}
            style={{ background: bg, borderColor: border, boxShadow: shadow, zIndex: isPlayer ? 10 : 1 }}>
            
            {isPlayer && <div className="absolute inset-0 bg-white/5 rounded-xl pointer-events-none" />}

            <div className="flex items-center gap-2 relative z-20">
                <div className={`shrink-0 flex items-center justify-center relative z-20 ml-1 sm:ml-0`}>
                    <MedalIcon pos={pos} />
                </div>

                <div className="shrink-0 relative flex items-center justify-center z-20 ml-1">
                    {isPlayer
                        ? <PlayerAvatar name={entry.displayName} avatarUrl={myAvatarUrl} sizeClass="w-12 h-12" textClass="text-xl" />
                        : <NormalAvatar name={entry.displayName} avatarUrl={entry.avatarUrl} sizeClass="w-12 h-12" textClass="text-xl" />
                    }
                </div>

                <div className="flex-1 min-w-0 z-20 flex flex-col justify-center gap-0.5 ml-2">
                    <div className="flex justify-between items-center pr-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <p className={`${isPlayer ? 'text-base text-sky-50' : 'text-sm text-white'} font-black drop-shadow-md break-words`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                {isPlayer ? 'Bạn' : entry.displayName}
                            </p>
                            {isPlayer && <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/30 text-sky-200 border border-sky-400/30">YOU</span>}
                        </div>
                    </div>
                    <div className="text-xs font-bold text-yellow-300 drop-shadow-sm flex items-center gap-1.5">
                        <span className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-white/80 border border-white/5">Score</span>
                        {scoreStr}
                    </div>
                </div>
            </div>

            {progressEl}
        </motion.div>
    );
};

const RankRow = ({ entry, isPlayer, targetEntry, myAvatarUrl }) => {
    if (entry.position === 1) {
        return <HeroCard entry={entry} isPlayer={isPlayer} myAvatarUrl={myAvatarUrl} />;
    }
    return <PlayerCard entry={entry} isPlayer={isPlayer} targetEntry={targetEntry} myAvatarUrl={myAvatarUrl} />;
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

    const isEmpty = !pinnacleLeaderboardLoading && pinnacleLeaderboard.length === 0;
    const myAvatarUrl = usePlayFabStore(s => s.avatarUrl);

    const modalContent = (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex flex-col p-3 pt-3 bg-black/65 backdrop-blur-md z-[99999]"
        >

            {/* ═══ SINGLE UNIFIED CARD — header + body share same container ═══ */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[1.5rem] border-[3px] border-[#1e3a8a] min-h-0 landscape:max-w-[36%] landscape:mx-auto landscape:w-full"
                style={{
                    background: 'linear-gradient(180deg,#1e3a8a 0%,#1e40af 30%,#1d4ed8 100%)',
                    boxShadow: '0 6px 0 rgba(23,37,84,0.9), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}>

                {/* Card shine */}
                <div className="h-1.5 w-full rounded-t-[calc(1.5rem-2px)] bg-white/20 shrink-0" />

                {/* ─── HEADER area inside card ─── */}
                <div className="shrink-0 px-4 pt-3 pb-3 border-b-2 border-[#172554]">

                    {/* Title row */}
                    <div className="relative flex flex-col items-center justify-center mb-3">
                        <button onClick={onBack}
                            className="absolute left-1 top-0 w-10 h-10 rounded-full flex items-center justify-center text-white
                                       bg-blue-700 border-[3px] border-[#172554]
                                       shadow-[0_4px_0_rgba(23,37,84,1)]
                                       active:translate-y-1 active:shadow-none transition-all">
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-2 px-12 pb-1">
                            <h1 className="text-yellow-400 font-black text-lg sm:text-xl tracking-wide text-center leading-tight uppercase"
                                style={{ textShadow: '0 2px 0 #172554, 0 0 10px rgba(250, 204, 21, 0.5)' }}>
                                🏆 AI ARENA RANKING
                            </h1>
                        </div>
                        <div className="flex justify-center -mt-1 mb-1">
                             <div className="text-sky-200 text-[11px] sm:text-xs font-semibold px-3 py-0.5 rounded-full border border-sky-400/30 bg-sky-900/40">
                                 "Bạn đang chiến đấu để leo top"
                             </div>
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
                                        color: '#ffffff',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
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
                <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 scrollbar-hide min-h-0">
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
                            {pinnacleLeaderboard.map((entry, index) => {
                                let target = null;
                                if (entry.position === playerPos && playerPos > 1) {
                                    target = pinnacleLeaderboard.find(e => e.position === playerPos - 1) || pinnacleLeaderboard[index - 1];
                                }
                                return <RankRow key={entry.position} entry={entry} isPlayer={entry.position === playerPos} targetEntry={target} myAvatarUrl={myAvatarUrl} />;
                            })}

                            {pinnaclePlayerRank && !playerInList && (
                                <>
                                    <div className="flex items-center gap-2 my-2">
                                        <div className="flex-1 h-px bg-white/15" />
                                        <span className="text-white/30 text-[10px] tracking-widest uppercase font-bold">Vị trí của bạn</span>
                                        <div className="flex-1 h-px bg-white/15" />
                                    </div>
                                    <RankRow
                                        entry={{ position: playerPos, displayName: 'Bạn', score: playerScore, giaoxu: null }}
                                        isPlayer
                                        targetEntry={pinnacleLeaderboard.length > 0 ? pinnacleLeaderboard[pinnacleLeaderboard.length - 1] : null}
                                        myAvatarUrl={myAvatarUrl}
                                    />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default PinnacleLeaderboard;
