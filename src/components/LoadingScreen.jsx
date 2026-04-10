import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Critical assets to preload ──
// Chỉ preload ảnh xuất hiện ngay khi app khởi động
import bgSrc from '../assets/common/common_background.webp';
import coinSrc from '../assets/common/coin.webp';
import trophySrc from '../assets/common/trophy.webp';
import millionaireSrc from '../assets/games/millionaire.webp';
import crosswordSrc from '../assets/games/thumb_secret_words.webp';
import golgothaSrc from '../assets/games/thumb_golgotha.webp';

const CRITICAL_ASSETS = [
    bgSrc,
    coinSrc,
    trophySrc,
    millionaireSrc,
    crosswordSrc,
    golgothaSrc,
];

// Preload a single image, resolves even on error (never blocks)
const preloadImage = (src) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // fail gracefully
        img.src = src;
    });

/* ══ Hook: usePreload ══
   Returns { done, progress } once all critical assets are loaded.
   Also enforces a minimum display time so the screen isn't a flash. */
export const usePreload = (minMs = 1200) => {
    const [done, setDone] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let loaded = 0;
        const total = CRITICAL_ASSETS.length;
        const start = Date.now();

        const tick = () => {
            loaded++;
            setProgress(Math.round((loaded / total) * 100));
            if (loaded === total) {
                const elapsed = Date.now() - start;
                const wait = Math.max(0, minMs - elapsed);
                setTimeout(() => setDone(true), wait);
            }
        };

        CRITICAL_ASSETS.forEach((src) =>
            preloadImage(src).then(tick)
        );
    }, [minMs]);

    return { done, progress };
};

/* ══ LoadingScreen component ══ */
const LoadingScreen = ({ progress }) => (
    <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #caf0f8 0%, #ade8f4 50%, #90e0ef 100%)' }}
    >
        {/* Dot pattern — same as ProfileScreen */}
        <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,150,200,0.8) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
            }}
        />
        <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,180,216,0.18) 0%, transparent 55%)' }} />

        {/* Logo card */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex flex-col items-center gap-5"
        >
            {/* Icon */}
            <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl relative overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, #ffd166, #f4a261)',
                    border: '4px solid #e9952a',
                    boxShadow: '0 6px 0 #c77a1a, 0 12px 32px rgba(244,162,97,0.4)',
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-2/5 bg-white/25 pointer-events-none rounded-t-2xl" />
                <span className="relative z-10">✝️</span>
            </div>

            {/* Title */}
            <div className="text-center">
                <h1 className="font-black text-3xl" style={{ color: '#1e3a5f', textShadow: 'none' }}>
                    Catholic <span style={{ color: '#1b9aaa' }}>Quiz!</span>
                </h1>
                <p className="text-sm font-semibold mt-1" style={{ color: '#4a7fa5' }}>
                    Học hỏi Lời Chúa qua trò chơi
                </p>
            </div>

            {/* Progress bar */}
            <div className="w-56 flex flex-col items-center gap-2 mt-2">
                <div
                    className="w-full h-3 rounded-full overflow-hidden"
                    style={{
                        background: 'rgba(0,0,0,0.08)',
                        border: '1.5px solid rgba(0,180,216,0.2)',
                    }}
                >
                    <motion.div
                        className="h-full rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.3 }}
                        style={{
                            background: 'linear-gradient(90deg, #06d6a0, #4cc9f0)',
                            boxShadow: '0 0 10px rgba(6,214,160,0.5)',
                        }}
                    />
                </div>
                <span className="text-xs font-bold" style={{ color: '#4a7fa5' }}>
                    Đang tải... {progress}%
                </span>
            </div>
        </motion.div>
    </div>
);

export default LoadingScreen;
