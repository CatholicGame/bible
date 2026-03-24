import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import {
    Mountain, ChevronLeft, CheckCircle2,
    BookOpen, Footprints, Heart, Feather, Wine,
    Compass, HandHeart, BookMarked, Flame, Leaf,
    Megaphone, Crown, User,
} from 'lucide-react';
import { RANK_TIERS } from '../../utils/ranks';

import imgActive from '../../assets/common/checkpoint_active.jpg';
import imgInactive from '../../assets/common/checkpoint_inactive.jpg';
import bgMap from '../../assets/common/bg_map.jpg';

/* ── Layout ── */
// Using proportional percentage positioning (py out of 100%) so nodes exactly stick to background features 
// regardless of native image aspect ratio and screen width.
const NODE_POSITIONS = [
    { px: 25, py: 92.6 }, // 0: Nguoi tim hieu (Bottom left start)
    { px: 65, py: 85.9 }, // 1: Du tong
    { px: 55, py: 77.0 }, // 2: Chien con
    { px: 25, py: 69.6 }, // 3: Thien than nho
    { px: 45, py: 61.5 }, // 4: Thieu nhi Thanh The
    { px: 75, py: 54.1 }, // 5: Len duong
    { px: 60, py: 45.9 }, // 6: Nguoi phuc vu
    { px: 30, py: 38.5 }, // 7: Mon de
    { px: 40, py: 30.4 }, // 8: Giao ly vien
    { px: 70, py: 22.2 }, // 9: Nguoi truyen giao
    { px: 55, py: 14.1 }, // 10: Nguoi huong dan
    { px: 35, py: 5.9  }, // 11: Chung nhan (Golgotha Peak)
];

const RANK_ICONS = [
    BookOpen, Footprints, Heart, Feather, Wine, Compass,
    HandHeart, BookMarked, Flame, Leaf, Megaphone, Crown,
];

const RankRoadmap = ({ currentScore, onBack }) => {
    const containerRef = useRef(null);
    const [ch, setCh] = useState(0);
    const [cw, setCw] = useState(0);
    const [imgAspect, setImgAspect] = useState(1); // Will be overwritten with native ratio
    const dragY = useMotionValue(0);

    // Load native image dimensions once to compute exact MAP_H with zero stretching
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            if (img.naturalWidth > 0) {
                setImgAspect(img.naturalHeight / img.naturalWidth);
            }
        };
        img.src = bgMap;
    }, []);

    const currentIdx = RANK_TIERS.reduce((best, tier, i) =>
        currentScore >= tier.minXP ? i : best, 0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            setCh(el.offsetHeight);
            setCw(el.offsetWidth);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // MAP_H: Derived from native image proportions so no pixel is ever stretched.
    // background-size: 100% 100% will fill exactly this area at native ratio.
    const MAP_H = cw > 0 ? cw * imgAspect : 0;
    const yBottom = (ch && MAP_H > ch) ? -(MAP_H - ch) : 0;

    useEffect(() => {
        if (!ch || MAP_H <= 0) return;
        const pos = NODE_POSITIONS[currentIdx];
        const actualY = (pos.py / 100) * MAP_H;
        
        let targetY = ch / 2 - actualY; // Center the node vertically
        targetY = Math.min(0, Math.max(yBottom, targetY)); // Clamp bounds
        
        setTimeout(() => animate(dragY, targetY, { type: 'spring', stiffness: 200, damping: 28 }), 120);
    }, [ch, cw, MAP_H, yBottom, currentIdx, dragY]);

    // Node width calculation: We map the 0-100 percentage (px)
    // not across the FULL container width, but across a padded safe-zone
    // so nodes at 10% or 90% don't clip off the edges of the screen.
    const getSafeX = (percentage, totalWidth) => {
        if (!totalWidth) return 0;
        // Padding: 40px left, 40px right (80px total safe space)
        const safeWidth = totalWidth - 80;
        return 40 + (percentage / 100) * safeWidth;
    };

    // Generate SVG path dynamically based on proportions
    const getPathString = (width, height) => {
        if (width === 0 || height === 0) return '';
        
        const getY = (py) => (py / 100) * height;
        
        // Start exactly at center of first node
        let d = `M ${getSafeX(NODE_POSITIONS[0].px, width)},${getY(NODE_POSITIONS[0].py)} `;
        
        for (let i = 1; i < NODE_POSITIONS.length; i++) {
            const prev = NODE_POSITIONS[i - 1];
            const curr = NODE_POSITIONS[i];
            const pX = getSafeX(prev.px, width);
            const pY = getY(prev.py);
            const cX = getSafeX(curr.px, width);
            const cY = getY(curr.py);
            
            // Đường cong Smooth liên tiếp (Cubic Bezier S-curve)
            const midY = (pY + cY) / 2;
            d += `C ${pX},${midY} ${cX},${midY} ${cX},${cY} `;
        }
        return d;
    };

    const roadPath = getPathString(cw, MAP_H);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden select-none"
            style={{ background: '#0f172a' }}>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 z-20 relative shadow-md"
                style={{ background: '#1e293b', borderBottom: '4px solid #0f172a' }}>
                <motion.button whileTap={{ y: 2 }} onClick={onBack}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-white"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)' }}>
                    <ChevronLeft size={20} strokeWidth={3} />
                </motion.button>
                <div className="flex items-center gap-2">
                    <Mountain size={18} className="text-amber-400" />
                    <span className="font-black text-base tracking-wider text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        ĐƯỜNG LÊN GOLGOTHA
                    </span>
                </div>
                <div className="w-9" />
            </div>

            {/* Map area */}
            <div className="flex-1 w-full relative overflow-hidden" style={{ cursor: 'grab' }}>
                <div ref={containerRef} className="h-full w-full relative overflow-hidden">
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: yBottom, bottom: 0 }}
                        dragElastic={0.05}
                        style={{ y: dragY, width: '100%', height: MAP_H, position: 'absolute', top: 0, touchAction: 'pan-x' }}
                    >
                        {/* Background: sized to exactly native aspect ratio — zero stretch */}
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ 
                                backgroundImage: `url(${bgMap})`,
                                // Force browser to use sharp rendering internally
                                imageRendering: '-webkit-optimize-contrast',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center top',
                                backgroundRepeat: 'no-repeat',
                            }}
                        />

                        {/* ── SVG Chart Line ── */}
                        {cw > 0 && MAP_H > 0 && (
                            <svg width="100%" height={MAP_H} viewBox={`0 0 ${cw} ${MAP_H}`}
                                className="absolute inset-0 pointer-events-none">
                                <defs>
                                    <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
                                        <feGaussianBlur stdDeviation="6" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Drop shadow */}
                                <path d={roadPath}
                                    fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="6" strokeLinecap="round"
                                    style={{ transform: 'translateY(4px)' }}
                                />
                                
                                {/* Glowing Chart Line */}
                                <path d={roadPath}
                                    fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"
                                    filter="url(#glow-line)"
                                />
                                
                                {/* Core Line */}
                                <path d={roadPath}
                                    fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round"
                                    strokeDasharray="6 8"
                                />
                            </svg>
                        )}

                        {/* Rank nodes */}
                        {cw > 0 && MAP_H > 0 && RANK_TIERS.map((tier, index) => {
                            const pos = NODE_POSITIONS[index];
                            
                            const xPx = getSafeX(pos.px, cw);
                            const yPx = (pos.py / 100) * MAP_H;
                            
                            const Icon = RANK_ICONS[index] || User;
                            const isUnlocked = currentScore >= tier.minXP;
                            const isCurrent = index === currentIdx;

                            return (
                                <div key={tier.level}
                                    className="absolute flex flex-col items-center"
                                    style={{ left: xPx, top: yPx, transform: 'translate(-50%,-50%)', zIndex: isCurrent ? 30 : 20 }}>

                                    {/* "You are here" floating tag */}
                                    {isCurrent && (
                                        <motion.div
                                            animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute whitespace-nowrap text-sm font-black text-white rounded-full px-4 py-1.5"
                                            style={{
                                                bottom: '100%', marginBottom: 6,
                                                background: 'linear-gradient(135deg,#d97706,#b45309)',
                                                border: '2px solid rgba(255,255,255,0.8)',
                                                boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
                                                fontSize: 'clamp(10px, 3vw, 13px)',
                                            }}>
                                            📍 Bạn đang ở đây
                                        </motion.div>
                                    )}

                                    {/* Custom Image Checkpoints — raw image, no mask */}
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: isCurrent ? 1.15 : 1, opacity: 1 }}
                                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                                        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}
                                    >
                                        <img 
                                            src={isUnlocked ? imgActive : imgInactive} 
                                            alt={tier.name} 
                                            style={{ 
                                                // Responsive: 15vw ≈ 60px on 400px screen, capped at 68px on larger screens 
                                                width: 'min(10.5vw, 48px)', 
                                                height: 'min(10.5vw, 48px)', 
                                                display: 'block', 
                                                objectFit: 'contain' 
                                            }}
                                        />
                                    </motion.div>

                                    {/* Labels below nodes */}
                                    <div className="absolute flex flex-col items-center pointer-events-none"
                                        style={{ top: 'min(10.5vw, 48px)', left: '50%', transform: 'translateX(-50%)', width: 'min(28vw, 130px)' }}>
                                        <span className="font-black text-center uppercase tracking-wide whitespace-nowrap"
                                            style={{
                                                fontSize: 'clamp(8.5px, 2vw, 10.5px)',
                                                color: isCurrent ? '#fde68a' : isUnlocked ? '#86efac' : '#cbd5e1',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)',
                                            }}>
                                            {tier.name}
                                        </span>
                                        <span className="font-bold mt-0.5 px-1.5 py-0.5 rounded-md"
                                            style={{ 
                                                fontSize: 'clamp(7.5px, 1.8vw, 9px)',
                                                background: 'rgba(0,0,0,0.75)', 
                                                color: 'rgba(255,255,255,0.9)', 
                                                backdropFilter: 'blur(4px)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                            🏆 {tier.minXP.toLocaleString()} XP
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default RankRoadmap;
