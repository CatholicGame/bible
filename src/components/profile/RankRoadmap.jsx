import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import {
    Mountain, ChevronLeft, CheckCircle2,
    BookOpen, Footprints, Heart, Feather, Wine,
    Compass, HandHeart, BookMarked, Flame, Leaf,
    Megaphone, Crown, User,
} from 'lucide-react';
import { RANK_TIERS } from '../../utils/ranks';

/* ── Map layout ── */
const MAP_W = 1500;    // logical map width px
const MAP_H = 320;     // logical map height px

const NODE_POSITIONS = [
    { x: 80, y: 260 }, { x: 200, y: 220 }, { x: 320, y: 230 },
    { x: 440, y: 190 }, { x: 560, y: 170 }, { x: 680, y: 160 },
    { x: 800, y: 130 }, { x: 920, y: 110 }, { x: 1040, y: 90 },
    { x: 1160, y: 100 }, { x: 1280, y: 60 }, { x: 1400, y: 40 },
];

const RANK_ICONS = [
    BookOpen, Footprints, Heart, Feather, Wine, Compass,
    HandHeart, BookMarked, Flame, Leaf, Megaphone, Crown,
];

const RankRoadmap = ({ currentScore, onBack }) => {
    const containerRef = useRef(null);
    const [cw, setCw] = useState(0);   // container width
    const dragX = useMotionValue(0);

    /* Current rank index */
    const currentIdx = RANK_TIERS.reduce((best, tier, i) =>
        currentScore >= tier.minXP ? i : best, 0);

    /* Measure container → set bounds + centre active node */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            setCw(el.offsetWidth);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!cw) return;
        const pos = NODE_POSITIONS[currentIdx];
        // Centre the active node horizontally
        const targetX = Math.min(0, Math.max(-(MAP_W - cw), cw / 2 - pos.x));
        setTimeout(() => {
            animate(dragX, targetX, { type: 'spring', stiffness: 200, damping: 28 });
        }, 120);
    }, [cw, currentIdx, dragX]);

    /* Horizontal drag constraint only */
    const xLeft = cw ? -(MAP_W - cw) : 0;

    return (
        <div className="w-full h-full flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#0ea5e9 0%,#bfdbfe 100%)' }}>

            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 z-20 relative"
                style={{
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9, x: -2 }}
                    onClick={onBack}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <ChevronLeft size={20} />
                </motion.button>

                <div className="flex items-center gap-2">
                    <Mountain size={18} className="text-amber-400" />
                    <span className="font-cinzel font-black text-base tracking-wider"
                        style={{ background: 'linear-gradient(135deg,#fbbf24,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        HÀNH TRÌNH VƯƠN ĐỈNH
                    </span>
                </div>

                <div className="w-9" />
            </div>

            {/* ── Map area ── */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: 'grab' }}>

                {/* Magical floating light particles / Bokeh */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 25 }, (_, i) => (
                        <motion.div key={i}
                            className="absolute rounded-full bg-white"
                            style={{
                                left: `${(i * 37) % 100}%`,
                                top: `${(i * 59) % 70}%`,
                                width: 20 + (i % 30),
                                height: 20 + (i % 30),
                                opacity: 0.05 + (i % 5) * 0.05,
                                filter: 'blur(8px)'
                            }}
                            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
                            transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
                        />
                    ))}
                </div>

                {/* Draggable map — horizontal only */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: xLeft, right: 0 }}
                    dragElastic={0.05}
                    style={{ x: dragX, width: MAP_W, height: '100%', position: 'absolute', top: 0, touchAction: 'pan-y' }}
                >
                    {/* SVG landscape — fills container height via viewBox */}
                    <svg width={MAP_W} height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
                        {/* Gradient sky */}
                        <defs>
                            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#e0f2fe" />
                            </linearGradient>
                            <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4ade80" />
                                <stop offset="100%" stopColor="#16a34a" />
                            </linearGradient>
                            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="6" stdDeviation="4" floodOpacity="0.15" />
                            </filter>
                        </defs>

                        {/* Sky */}
                        <rect width={MAP_W} height={MAP_H} fill="url(#sky)" />

                        {/* Bright sun at top-right */}
                        <circle cx={1420} cy={60} r={120} fill="#fef08a" opacity="0.4" filter="blur(20px)" />
                        <circle cx={1420} cy={60} r={45} fill="#fde047" opacity="0.9" filter="url(#shadow)" />

                        {/* Far mountains — light blue layer */}
                        <path d="M 0,200 L 150,60 L 350,220 L 500,90 L 700,240 L 900,70 L 1100,260 L 1300,50 L 1500,200 L 1500,320 L 0,320 Z"
                            fill="#7dd3fc" filter="url(#shadow)" />
                        {/* Mid mountains — sky blue layer */}
                        <path d="M -50,260 L 250,130 L 450,280 L 650,150 L 850,300 L 1050,130 L 1250,290 L 1450,110 L 1550,260 L 1550,320 L 0,320 Z"
                            fill="#38bdf8" filter="url(#shadow)" />
                        {/* Ground — lush green */}
                        <path d="M -100,320 L 100,270 L 300,300 L 500,225 L 700,280 L 900,200 L 1100,260 L 1300,180 L 1500,240 L 1600,320 L -100,320 Z"
                            fill="url(#ground)" filter="url(#shadow)" />

                        {/* Road — warm dirt path */}
                        <path d="M 80,260 C 140,260 140,220 200,220 C 260,220 260,230 320,230 C 380,230 380,190 440,190 C 500,190 500,170 560,170 C 620,170 620,160 680,160 C 740,160 740,130 800,130 C 860,130 860,110 920,110 C 980,110 980,90 1040,90 C 1100,90 1100,100 1160,100 C 1220,100 1220,60 1280,60 C 1340,60 1340,40 1400,40"
                            fill="none" stroke="#b45309" strokeWidth="36" strokeLinecap="round" filter="url(#shadow)" opacity="0.6" />
                        {/* Road surface */}
                        <path d="M 80,260 C 140,260 140,220 200,220 C 260,220 260,230 320,230 C 380,230 380,190 440,190 C 500,190 500,170 560,170 C 620,170 620,160 680,160 C 740,160 740,130 800,130 C 860,130 860,110 920,110 C 980,110 980,90 1040,90 C 1100,90 1100,100 1160,100 C 1220,100 1220,60 1280,60 C 1340,60 1340,40 1400,40"
                            fill="none" stroke="#fcd34d" strokeWidth="28" strokeLinecap="round" />
                        {/* Road dashes */}
                        <path d="M 80,260 C 140,260 140,220 200,220 C 260,220 260,230 320,230 C 380,230 380,190 440,190 C 500,190 500,170 560,170 C 620,170 620,160 680,160 C 740,160 740,130 800,130 C 860,130 860,110 920,110 C 980,110 980,90 1040,90 C 1100,90 1100,100 1160,100 C 1220,100 1220,60 1280,60 C 1340,60 1340,40 1400,40"
                            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="4"
                            strokeDasharray="12 12" strokeLinecap="round" />
                    </svg>

                    {/* Rank nodes */}
                    {RANK_TIERS.map((tier, index) => {
                        const pos = NODE_POSITIONS[index];
                        const Icon = RANK_ICONS[index] || User;
                        const isUnlocked = currentScore >= tier.minXP;
                        const isCurrent = index === currentIdx;

                        return (
                            <div key={tier.level}
                                className="absolute flex flex-col items-center"
                                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)', zIndex: isCurrent ? 30 : 20 }}>

                                {/* "You are here" tooltip */}
                                {isCurrent && (
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
                                        className="absolute -top-14 whitespace-nowrap text-xs font-black px-3 py-1 rounded-full text-white"
                                        style={{
                                            background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                                            boxShadow: '0 4px 0 rgba(0,0,0,0.4), 0 6px 16px rgba(245,158,11,0.5)',
                                            border: '1.5px solid rgba(255,255,255,0.25)',
                                        }}>
                                        📍 Vị trí của bạn
                                    </motion.div>
                                )}

                                {/* Node bubble with 3D effect */}
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: isCurrent ? 1.25 : 1, opacity: 1 }}
                                    transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
                                    className="relative flex items-center justify-center w-12 h-12 rounded-full"
                                    style={isCurrent ? {
                                        background: 'linear-gradient(145deg,#fde68a,#f59e0b)',
                                        boxShadow: '0 0 0 3px rgba(251,191,36,0.4), 0 4px 0 #92400e, 0 8px 20px rgba(245,158,11,0.6)',
                                        border: '2px solid rgba(255,255,255,0.4)',
                                    } : isUnlocked ? {
                                        background: 'linear-gradient(145deg,#86efac,#22c55e)',
                                        boxShadow: '0 4px 0 #15803d, 0 6px 14px rgba(34,197,94,0.4)',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                    } : {
                                        background: 'linear-gradient(145deg,#f3f4f6,#d1d5db)',
                                        boxShadow: '0 3px 0 #9ca3af, 0 5px 10px rgba(0,0,0,0.2)',
                                        border: '2px solid rgba(255,255,255,0.6)',
                                    }}
                                >
                                    <Icon size={22}
                                        className={isCurrent ? 'text-amber-900' : isUnlocked ? 'text-green-900' : 'text-gray-400'}
                                    />

                                    {/* Check badge */}
                                    {isUnlocked && !isCurrent && (
                                        <div className="absolute -right-1.5 -bottom-1 bg-green-500 rounded-full flex items-center justify-center w-4 h-4 border-2 border-white/80">
                                            <CheckCircle2 size={9} strokeWidth={3} className="text-white" />
                                        </div>
                                    )}
                                </motion.div>

                                {/* Label */}
                                <div className="absolute top-14 flex flex-col items-center w-32 pointer-events-none">
                                    <span className="font-black text-[10px] text-center uppercase tracking-tight drop-shadow-lg whitespace-nowrap"
                                        style={{ color: isCurrent ? '#fde68a' : isUnlocked ? '#86efac' : '#94a3b8' }}>
                                        {tier.name}
                                    </span>
                                    <span className="text-[9px] font-bold mt-0.5 px-1.5 py-0.5 rounded"
                                        style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)' }}>
                                        {tier.minXP.toLocaleString()} XP
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
};

export default RankRoadmap;
