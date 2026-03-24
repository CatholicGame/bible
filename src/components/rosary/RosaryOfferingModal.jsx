import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe } from 'lucide-react';
import WheelPicker from './WheelPicker';
import './RosaryOfferingModal.css';

import motherMaryImg from '../../assets/common/mother_mary.png';
import iconCoin from '../../assets/common/coin.png';

const DAILY_MAX = 150; // hạt
const COIN_PER_HAT = 1;

// Items for pickers
const TRANG_ITEMS = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
];

const CHUC_ITEMS = [
    { value: 0, label: '0' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 40, label: '40' },
    { value: 50, label: '50' },
];

// Particle emojis
const PARTICLE_TYPES = ['🌹', '🌸', '🌺', '💐', '✨', '⭐'];

/**
 * RosaryOfferingModal
 * Props:
 *   onClose: () => void
 *   coins: number — current user coins
 *   rosaryToday: number — hạt đã dâng hôm nay
 *   rosaryGlobal: number — tổng hạt toàn cầu
 *   onSubmit: (hatCount, coinReward) => Promise<void>
 */
const RosaryOfferingModal = ({ onClose, coins, rosaryToday, rosaryGlobal, onSubmit }) => {
    const [trangIdx, setTrangIdx] = useState(0);
    const [chucIdx, setChucIdx] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [particles, setParticles] = useState([]);
    const [showCoinPopup, setShowCoinPopup] = useState(false);
    const [lastReward, setLastReward] = useState(0);
    const [animCoins, setAnimCoins] = useState(coins);
    const [animToday, setAnimToday] = useState(rosaryToday);
    const [animGlobal, setAnimGlobal] = useState(rosaryGlobal);
    const submitBtnRef = useRef(null);
    const maryRef = useRef(null);

    // Track landscape query to update WheelPicker itemHeight mathematically
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const query = window.matchMedia("(min-width: 700px) and (orientation: landscape)");
        setIsLandscape(query.matches);
        const listener = (e) => setIsLandscape(e.matches);
        query.addEventListener("change", listener);
        return () => query.removeEventListener("change", listener);
    }, []);

    useEffect(() => { setAnimCoins(coins); }, [coins]);
    useEffect(() => { setAnimToday(rosaryToday); }, [rosaryToday]);
    useEffect(() => { setAnimGlobal(rosaryGlobal); }, [rosaryGlobal]);

    const trang = TRANG_ITEMS[trangIdx].value;
    const chuc = CHUC_ITEMS[chucIdx].value;
    const totalHat = trang * 50 + chuc;
    const remaining = Math.max(0, DAILY_MAX - animToday);
    const effectiveHat = Math.min(totalHat, remaining);
    const estimatedCoins = effectiveHat * COIN_PER_HAT;
    const isOver = totalHat > remaining && totalHat > 0;
    const canSubmit = effectiveHat > 0 && !isSubmitting;
    const isDailyComplete = remaining <= 0;

    // Format large numbers
    const formatNum = (n) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return n.toLocaleString();
    };

    // Spawn particles
    const spawnParticles = useCallback(() => {
        const btn = submitBtnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top;

        const maryRect = maryRef.current?.getBoundingClientRect();
        const targetY = maryRect ? maryRect.top + maryRect.height / 2 : 100;

        const newParticles = [];
        for (let i = 0; i < 18; i++) {
            newParticles.push({
                id: Date.now() + i,
                emoji: PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)],
                startX: startX + (Math.random() - 0.5) * 80,
                startY: startY,
                targetX: startX + (Math.random() - 0.5) * 200,
                targetY: targetY + (Math.random() - 0.5) * 60,
                delay: i * 50,
                duration: 800 + Math.random() * 400,
            });
        }
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 2500);
    }, []);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);

        // Spawn particles
        spawnParticles();

        // Show coin popup after particles start
        const reward = estimatedCoins;
        setLastReward(reward);

        try {
            await onSubmit(effectiveHat, reward);
        } catch (e) {
            console.error('[Rosary] Submit failed', e);
        }

        // Animate counters
        setTimeout(() => {
            setAnimCoins(prev => prev + reward);
            setAnimToday(prev => prev + effectiveHat);
            setAnimGlobal(prev => prev + effectiveHat);
            setShowCoinPopup(true);
        }, 600);

        setTimeout(() => {
            setShowCoinPopup(false);
        }, 2200);

        setTimeout(() => {
            setIsSubmitting(false);
            setTrangIdx(0);
            setChucIdx(0);
        }, 2500);
    };

    const progressPercent = Math.min(100, (animToday / DAILY_MAX) * 100);

    return (
        <motion.div
            className="rosary-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="rosary-header">
                <div className="rosary-global-badge">
                    <Globe size={14} />
                    <span>Global: {formatNum(animGlobal)}</span>
                </div>

                <button className="rosary-close-btn" onClick={onClose} title="Đóng">
                    <X size={16} />
                </button>

                <div className="rosary-wallet-badge">
                    <img src={iconCoin} alt="Coin" style={{ width: 16, height: 16 }} />
                    <span>Ví: {animCoins.toLocaleString()} Coin</span>
                </div>
            </div>

            {/* Mary Image */}
            <div className="rosary-mary-container" ref={maryRef}>
                <div className="rosary-mary-glow" />
                <img src={motherMaryImg} alt="Đức Mẹ Maria" className="rosary-mary-img" />
            </div>

            {/* Controls Area */}
            <div className="rosary-controls">
                {/* Pledge Banner */}
                <div className="rosary-pledge">
                    <span className="rosary-pledge-icon">🙏</span>
                    <span>
                        Kinh Mân Côi là <strong>vũ khí mạnh nhất</strong> để chống lại ma quỷ
                        và mang lại bình an. Hãy ghi nhận những tràng hạt bạn <strong>đã thực sự cầu nguyện</strong>.
                    </span>
                </div>

                {isDailyComplete ? (
                    /* Completed for today */
                    <div className="rosary-completed">
                        <span className="rosary-completed-icon">🌹</span>
                        <p className="rosary-completed-text">
                            Bạn đã hoàn thành dâng hoa hôm nay!
                        </p>
                        <p className="rosary-completed-sub">
                            Đã dâng {DAILY_MAX} hạt · Hẹn gặp lại ngày mai
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Picker Card */}
                        <div className="rosary-picker-card">
                            <h3 className="rosary-picker-title">Chọn Mức Dâng Hoa</h3>

                            {/* Info row */}
                            <div className="rosary-picker-info" style={{ justifyContent: 'space-between', display: 'flex' }}>
                                <span className="rosary-picker-selected">
                                    Đã chọn: {trang} Tràng : {chuc / 10} Chục
                                </span>
                                {/* Mockup has coin estimate floating here */}
                                <span className="rosary-picker-coins-inline" style={{ fontWeight: 700, color: '#a05020' }}>
                                    +{estimatedCoins} Coins
                                </span>
                            </div>

                            {/* Dual Wheel */}
                            <div className="rosary-wheels" style={{ position: 'relative' }}>
                                {/* Active row highlight spanning behind both pickers */}
                                <div className="rosary-wheels-active-bg" />
                                
                                <WheelPicker
                                    items={TRANG_ITEMS}
                                    selectedIndex={trangIdx}
                                    onChange={setTrangIdx}
                                    itemHeight={isLandscape ? 50 : 40}
                                />
                                <span className="rosary-wheels-label-trang">Tràng :</span>
                                <WheelPicker
                                    items={CHUC_ITEMS.map(item => ({
                                        ...item,
                                        label: String(item.value / 10),
                                    }))}
                                    selectedIndex={chucIdx}
                                    onChange={setChucIdx}
                                    itemHeight={isLandscape ? 50 : 40}
                                />
                                <span className="rosary-wheels-label-chuc">Chục</span>
                            </div>

                            {/* Over-limit warning */}
                            {isOver && totalHat > 0 && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#e65100',
                                        textAlign: 'center',
                                        marginTop: 6,
                                    }}
                                >
                                    ⚠️ Còn lại {remaining} hạt cho hôm nay · Sẽ dâng {effectiveHat} hạt
                                </motion.p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            ref={submitBtnRef}
                            className="rosary-submit-btn"
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                            whileTap={canSubmit ? { y: 3 } : {}}
                        >
                            {isSubmitting ? (
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    style={{ display: 'inline-block' }}
                                >
                                    🌸
                                </motion.span>
                            ) : (
                                <>
                                    <span className="rosary-submit-pearls-left" />
                                    <span className="rosary-submit-text">Dâng Lên</span>
                                    <span className="rosary-submit-pearls-right" />
                                </>
                            )}
                        </motion.button>
                    </>
                )}
            </div>

            {/* Progress Footer */}
            <div className="rosary-progress-container">
                <div className="rosary-progress-card">
                    <p className="rosary-progress-label">
                        Hôm nay: Đã dâng {animToday} / {DAILY_MAX} hạt (tối đa)
                    </p>
                    <div className="rosary-progress-bar">
                        <motion.div
                            className="rosary-progress-fill"
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        />
                    </div>
                </div>
            </div>

            {/* Floating Particles */}
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="rosary-particle"
                        initial={{
                            x: p.startX,
                            y: p.startY,
                            opacity: 1,
                            scale: 0.3,
                        }}
                        animate={{
                            x: p.targetX,
                            y: p.targetY,
                            opacity: [1, 1, 0],
                            scale: [0.3, 1.2, 0.6],
                        }}
                        transition={{
                            duration: p.duration / 1000,
                            delay: p.delay / 1000,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    >
                        {p.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Coin Popup */}
            <AnimatePresence>
                {showCoinPopup && (
                    <motion.div
                        className="rosary-coin-popup"
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <img src={iconCoin} alt="coin" />
                        +{lastReward} Coins
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav Decor */}
            <div className="rosary-bottom-nav">
                <div className="rosary-bottom-nav-curve" />
                <div className="rosary-bottom-nav-content">
                    <svg className="rosary-bottom-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {/* Rosary beads loop */}
                        <circle cx="12" cy="7" r="4.5" strokeDasharray="1 3" strokeWidth="2.5" />
                        {/* Hanging cross */}
                        <path d="M12 11.5v8.5 M9.5 17h5" />
                    </svg>
                    <span className="rosary-bottom-nav-text">Dâng Hoa</span>
                </div>
            </div>
        </motion.div>
    );
};

export default RosaryOfferingModal;
