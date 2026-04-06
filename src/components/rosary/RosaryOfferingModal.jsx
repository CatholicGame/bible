import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe } from 'lucide-react';
import WheelPicker from './WheelPicker';
import UserAvatar from '../common/UserAvatar';
import { usePlayFabStore } from '../../store/playfabStore';
import './RosaryOfferingModal.css';

import rosaryBgLandscape from '../../assets/rosary/rosary_bg_landscape.jpg';
import rosaryBgPortrait from '../../assets/rosary/rosary_bg_potrait.jpg';
import rosaryBgMusic from '../../assets/rosary/rosary_bg_music.mp3';
import iconCoin from '../../assets/common/coin.png';
import { useSoundManager } from '../../utils/soundManager';
import rose1 from '../../assets/rosary/rose1.png';
import rose2 from '../../assets/rosary/rose2.png';
import rose3 from '../../assets/rosary/rose3.png';
import roseRed  from '../../assets/rosary/rose_red.png';
import rosePink from '../../assets/rosary/rose_pink.png';
import roseGold from '../../assets/rosary/rose_gold.png';
import iconInfo from '../../assets/rosary/icon_info.png';

const DAILY_MAX = 150;      // số hạt tối đa mỗi ngày
const COIN_PER_HAT = 1;     // 1 hạt = 1 Coin
const BONUS_PER_TRANG = 10; // +10 Coin cho mỗi tràng hoàn chỉnh (50 hạt)

// Hook: đếm số trườt tới target khi value thay đổi
const useCountUp = (target, duration = 800) => {
    const [display, setDisplay] = useState(target);
    const prevRef = useRef(target);
    useEffect(() => {
        const from = prevRef.current;
        const to = target;
        prevRef.current = to;
        if (from === to) return;
        const diff = to - from;
        const steps = Math.min(Math.abs(diff), 40);
        if (steps === 0) { setDisplay(to); return; }
        const stepVal = diff / steps;
        const ms = duration / steps;
        let cur = from;
        let count = 0;
        const id = setInterval(() => {
            count++;
            cur = count >= steps ? to : Math.round(from + stepVal * count);
            setDisplay(cur);
            if (count >= steps) clearInterval(id);
        }, ms);
        return () => clearInterval(id);
    }, [target, duration]);
    return display;
};

// Mỗi tràng Mân Côi → 1 bông hồng (màu khác nhau)
const TRANG_ROSES = [
    { src: null, color: '#ff4d6d', glow: 'rgba(255,60,100,0.60)', label: 'Hồng Đỏ' },    // placeholder until import resolved
    { src: null, color: '#ff85c2', glow: 'rgba(255,130,190,0.60)', label: 'Hồng Hồng' },
    { src: null, color: '#ffd700', glow: 'rgba(255,210,60,0.60)',  label: 'Hồng Vàng' },
];

const TRANG_ITEMS = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
];

const CHUC_ITEMS = [
    { value: 0, label: '0' },
    { value: 10, label: '1' },
    { value: 20, label: '2' },
    { value: 30, label: '3' },
    { value: 40, label: '4' },
    { value: 50, label: '5' },
];

const PARTICLE_ROSES = [rose1, rose2, rose3];

const POLLEN_COLORS = [
    'rgba(255,220,80,0.85)',
    'rgba(255,200,120,0.75)',
    'rgba(255,240,200,0.90)',
    'rgba(240,180,200,0.80)',
    'rgba(200,230,255,0.70)',
];

const ROSARY_QUOTES = [
    'Mẹ ơi, xin nhận lấy những bông hồng con dâng lên từ tấm lòng thành.',
    'Mỗi tràng Mân Côi là một vòng hoa yêu dâng lên Trái Tim Vô Nhiễm Mẹ.',
    'Nhờ lời Mẹ chuyển cầu, Thiên Chúa sẽ thương xót và đáp lời con.',
    'Hủ hoa Mân Côi mà con dâng, Mẹ sẽ giữ gìn và phù hộ con suốt đời.',
    'Xin Mẹ nhận lòng sốt mến của con, nhỏ bé nhưng chân thành.',
];

const RosaryOfferingModal = ({ onClose, coins, rosaryToday, rosaryGlobal, onSubmit, user, avatarUrl }) => {
    const [trangIdx, setTrangIdx] = useState(0);
    const [chucIdx, setChucIdx] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [particles, setParticles] = useState([]);
    const [showBloom, setShowBloom] = useState(false);
    const [showQuote, setShowQuote] = useState(false);
    const [quoteText, setQuoteText] = useState('');
    const [showCoinPopup, setShowCoinPopup] = useState(false);
    const [lastReward, setLastReward] = useState(0);
    const [animCoins, setAnimCoins] = useState(coins);
    const [animToday, setAnimToday] = useState(rosaryToday);
    const [animGlobal, setAnimGlobal] = useState(rosaryGlobal);
    const submitBtnRef = useRef(null);
    const overlayRef = useRef(null);
    const pollenIntervalRef = useRef(null);
    const coinBadgeRef = useRef(null);
    const profileCoinRef = useRef(null);
    const [isLandscape, setIsLandscape] = useState(false);
    const [livePollen, setLivePollen] = useState([]);
    const [flyingCoins, setFlyingCoins] = useState([]);
    const rosesActiveRef = useRef(false);
    const haloRef = useRef({ x: 0, y: 0, r: 80 });

    // ── Background music — loops while modal is open ──
    const { setBgVolume, stopBg } = useSoundManager(rosaryBgMusic, {});

    // Wrapper: tắt nhạc TRƯỚC khi đóng modal (tránh delay do AnimatePresence exit animation)
    const handleClose = () => {
        stopBg();
        onClose();
    };

    // ── Real-time global rosary count from Firebase ──
    const subscribeRosaryGlobal = usePlayFabStore(s => s.subscribeRosaryGlobal);
    const refreshRosaryData = usePlayFabStore(s => s.refreshRosaryData);
    useEffect(() => {
        if (!subscribeRosaryGlobal) return;
        const unsub = subscribeRosaryGlobal(); // starts onValue listener
        return () => unsub?.();               // cleanup on modal close
    }, [subscribeRosaryGlobal]);

    // ── Cross-device sync: re-fetch rosary data from PlayFab on mount ──
    useEffect(() => {
        refreshRosaryData?.();
    }, []);


    useEffect(() => {
        const query = window.matchMedia("(min-width: 700px) and (orientation: landscape)");
        setIsLandscape(query.matches);
        const listener = (e) => setIsLandscape(e.matches);
        query.addEventListener("change", listener);
        return () => query.removeEventListener("change", listener);
    }, []);

    // Guard: khi đang submit, không cho store update reset animation display
    // (submitRosary set store.coins / store.rosaryToday sau khi PlayFab save xong,
    //  nhưng animation coin/today đang chạy qua setTimeout — không được interrupt)
    const isSubmittingRef = useRef(false);
    useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);

    useEffect(() => { if (!isSubmittingRef.current) setAnimCoins(coins); }, [coins, isSubmitting]);
    useEffect(() => { if (!isSubmittingRef.current) setAnimToday(rosaryToday); }, [rosaryToday, isSubmitting]);
    useEffect(() => { if (!isSubmittingRef.current) setAnimGlobal(rosaryGlobal); }, [rosaryGlobal, isSubmitting]);

    // Count-up displays (trượt số khi giá trị thay đổi)
    const displayGlobal = useCountUp(animGlobal, 1200);
    const displayToday  = useCountUp(animToday, 800);
    const displayCoins  = useCountUp(animCoins, 800);

    const trang = TRANG_ITEMS[trangIdx].value;
    const chuc = CHUC_ITEMS[chucIdx].value;
    const totalHat = trang * 50 + chuc;
    const remaining = Math.max(0, DAILY_MAX - animToday);
    const effectiveHat = Math.min(totalHat, remaining);

    // Reward calculation: base + tràng bonus
    const baseCoin = effectiveHat * COIN_PER_HAT;
    const trangComplete = Math.floor(effectiveHat / 50);
    const bonusCoin = trangComplete * BONUS_PER_TRANG;
    const estimatedCoins = baseCoin + bonusCoin;

    const isOver = totalHat > remaining && totalHat > 0;
    const canSubmit = effectiveHat > 0 && !isSubmitting;
    const isDailyComplete = remaining <= 0;
    const progressPercent = Math.min(100, (animToday / DAILY_MAX) * 100);

    const formatNum = (n) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return n.toLocaleString();
    };

    // Continuous pollen interval — runs while roses are alive
    useEffect(() => {
        pollenIntervalRef.current = setInterval(() => {
            if (!rosesActiveRef.current) return;
            const { x: hx, y: hy, r: hr } = haloRef.current;
            const t = Date.now();
            const batch = Array.from({ length: 5 }, (_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const dist  = hr * (0.5 + Math.random() * 0.9);
                return {
                    id: t + i,
                    type: 'pollen',
                    startX: hx + Math.sin(angle) * dist,
                    startY: hy + Math.cos(angle) * dist,
                    targetX: hx + Math.sin(angle) * (dist + 40 + Math.random() * 50),
                    targetY: hy + Math.cos(angle) * (dist + 40 + Math.random() * 50) - 20,
                    delay: 0,
                    duration: 1200 + Math.random() * 800,
                    size: 4 + Math.random() * 6,
                    color: POLLEN_COLORS[Math.floor(Math.random() * POLLEN_COLORS.length)],
                    blur: 0,
                };
            });
            setLivePollen(prev => [...prev.slice(-40), ...batch]); // keep max 60
        }, 700);
        return () => clearInterval(pollenIntervalRef.current);
    }, []);


    const spawnParticles = useCallback(() => {
        const btn = submitBtnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const now = Date.now();
        const all = [];

        // ── Halo circle around Mary's head ──
        const haloX  = window.innerWidth  * 0.50 - 10;  // slightly left
        const haloY  = window.innerHeight * 0.26 - 35;  // higher (Mary's halo)
        const haloR  = Math.min(window.innerWidth, window.innerHeight) * 0.16; // ~80-100px
        const N      = 10;                           // number of roses on circle
        const rotArc = Math.PI * 0.75;              // orbit ~135° clockwise

        // Layer 1: Rose images — 4-phase animation
        const roses = [];
        for (let i = 0; i < N; i++) {
            const src = PARTICLE_ROSES[i % PARTICLE_ROSES.length];
            const size = 28 + Math.random() * 18;

            const a0 = (2 * Math.PI / N) * i;
            const a1 = a0 + rotArc;
            const a2 = a1 + Math.PI * 0.3;

            const circleX = (a) => haloX + haloR * Math.sin(a);
            const circleY = (a) => haloY - haloR * Math.cos(a);
            const scatterDist = haloR * 2.4 + Math.random() * haloR;

            const xs = [
                cx + (Math.random() - 0.5) * 40,
                circleX(a0),
                circleX(a0),
                circleX(a1),
                haloX + Math.sin(a2) * scatterDist,
            ];
            const ys = [
                cy,
                circleY(a0),
                circleY(a0),
                circleY(a1),
                haloY - Math.cos(a2) * scatterDist,
            ];

            roses.push({ id: now + i, type: 'rose', src, size, xs, ys,
                delay: i * 60, duration: 16800 + Math.random() * 3200,
                rotate: (Math.random() - 0.5) * 180 });
        }
        roses.forEach(r => all.push(r));

        // Save halo coords for continuous pollen
        haloRef.current = { x: haloX, y: haloY, r: haloR };

        // Layer 2: Pollen dots — initial burst (light to avoid lag spike)
        for (let i = 0; i < 20; i++) {
            const spread = 80 + Math.random() * 100;
            const upDist = 100 + Math.random() * 220;
            all.push({
                id: now + 200 + i,
                type: 'pollen',
                startX: cx + (Math.random() - 0.5) * spread,
                startY: cy + (Math.random() - 0.5) * 20,
                targetX: cx + (Math.random() - 0.5) * (spread * 2),
                targetY: cy - upDist,
                delay: i * 30,
                duration: 1200 + Math.random() * 900,
                size: 4 + Math.random() * 7,
                color: POLLEN_COLORS[Math.floor(Math.random() * POLLEN_COLORS.length)],
                blur: 0,
            });
        }

        // Layer 3: Trail ghosts — 2 per rose, start 150ms / 280ms after
        roses.forEach((rose) => {
            [150, 290].forEach((trailDelay, ti) => {
                all.push({
                    id: now + 500 + rose.id * 10 + ti,
                    type: 'rose',
                    src: rose.src,
                    size: rose.size * (ti === 0 ? 0.60 : 0.38),
                    xs: rose.xs,
                    ys: rose.ys,
                    delay: rose.delay + trailDelay,
                    duration: rose.duration,
                    rotate: rose.rotate,
                    opacity: ti === 0 ? 0.45 : 0.25,
                    blurTrail: ti === 0 ? 3 : 5,
                });
            });
        });

        setParticles(all);
        setShowBloom(true);
        rosesActiveRef.current = true;
        setQuoteText(ROSARY_QUOTES[Math.floor(Math.random() * ROSARY_QUOTES.length)]);
        setShowQuote(true);
        setTimeout(() => setShowBloom(false), 700);
        setTimeout(() => {
            rosesActiveRef.current = false;
            setParticles([]);
            setLivePollen([]);
            setShowQuote(false);
        }, 21000);
    }, []);

    // ── Flying coin effect: badge → profile ──
    const spawnCoinFly = useCallback((reward) => {
        const badge = coinBadgeRef.current?.getBoundingClientRect();
        const target = profileCoinRef.current?.getBoundingClientRect();
        if (!badge || !target) return;
        const sx = badge.left + badge.width / 2;
        const sy = badge.top + badge.height / 2;
        const ex = target.left + target.width / 2;
        const ey = target.top + target.height / 2;
        const coins = Array.from({ length: 7 }, (_, i) => ({
            id: Date.now() + i,
            sx: sx + (Math.random() - 0.5) * 20,
            sy: sy + (Math.random() - 0.5) * 10,
            ex, ey,
            delay: i * 70,
        }));
        setFlyingCoins(coins);
        // Increment coin value after last coin lands (~0.7s per coin + last delay 420ms)
        setTimeout(() => {
            setAnimCoins(prev => prev + reward);
            setFlyingCoins([]);
        }, 1300);
    }, []);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        const reward = estimatedCoins;
        setLastReward(reward);
        spawnParticles();
        spawnCoinFly(reward);
        try { await onSubmit(effectiveHat, reward); }
        catch (e) { console.error('[Rosary] Submit failed', e); }
        setTimeout(() => {
            setAnimToday(prev => prev + effectiveHat);
            setAnimGlobal(prev => prev + effectiveHat);
        }, 600);
        setTimeout(() => {
            setIsSubmitting(false);
            setTrangIdx(0);
            setChucIdx(0);
        }, 2800);
    };

    return (
        <motion.div
            className="ro-overlay"
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ backgroundImage: `url(${isLandscape ? rosaryBgLandscape : rosaryBgPortrait})` }}
        >
            {/* ── Header: close + guide button ── */}
            <div className="ro-header">
                <button className="ro-guide-btn"
                    onClick={() => setShowGuide(true)}
                    aria-label="Hướng dẫn"
                    style={{
                        position: 'fixed',
                        top: 12, left: 12,
                        width: 40, height: 40,
                        borderRadius: '50%',
                        background: '#0a0a0a',
                        border: '2px solid rgba(212,175,80,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 9999,
                        boxShadow: '0 4px 14px rgba(200,160,40,0.3)',
                        padding: 0,
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <img src={iconInfo} alt="Info" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>

                {/* Close button — position fixed top-right, always visible */}
                <button
                    onClick={handleClose}
                    aria-label="Đóng"
                    style={{
                        position: 'fixed',
                        top: 12, right: 12,
                        width: 40, height: 40,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.55)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer', zIndex: 9999,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                        transition: 'background 0.2s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <X size={18} strokeWidth={2.5} />
                </button>
            </div>

            {/* ── Global counter — bottom left ── */}
            <div className="ro-global-counter">
                <Globe size={12} strokeWidth={2.5} />
                <div className="ro-global-counter-text">
                    <span className="ro-global-counter-label">Số tràng hạt giáo dân Việt Nam đã dâng lên Mẹ</span>
                    <span className="ro-global-counter-num">{formatNum(displayGlobal)} hạt</span>
                </div>
            </div>

            {/* ── Floating coin badge near profile ── */}
            <AnimatePresence>
                {estimatedCoins > 0 && !showQuote && (
                    <motion.div
                        ref={coinBadgeRef}
                        key="coin-badge"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                        style={{
                            position: 'fixed',
                            ...(isLandscape
                                ? { bottom: 72, right: 16 }
                                : { top: 68, right: 16 }),
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'rgba(255,248,210,0.92)',
                            border: '1.5px solid rgba(201,168,76,0.8)',
                            borderRadius: 50,
                            padding: '5px 12px 5px 8px',
                            boxShadow: '0 3px 14px rgba(200,160,40,0.35)',
                            zIndex: 9998,
                            pointerEvents: 'none',
                            color: '#8a6010',
                            fontFamily: "'Playfair Display', serif",
                        }}
                    >
                        <img src={iconCoin} alt="" style={{ width: 20, height: 20 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>+{estimatedCoins}</span>
                            {bonusCoin > 0 && (
                                <span style={{ fontSize: 10, color: '#b8820a', fontWeight: 600 }}>
                                    {baseCoin} + ✨{bonusCoin} bonus
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Profile card ── */}
            {user && (
                <div className="ro-profile-card">
                    <UserAvatar
                        name={user.name || 'K'}
                        photoURL={avatarUrl}
                        size={36}
                        style={{ border: '2px solid rgba(201,168,76,0.6)', flexShrink: 0 }}
                    />
                    <div className="ro-profile-info">
                        <span className="ro-profile-name">{user.name}</span>
                        <span className="ro-profile-coins" ref={profileCoinRef}>
                            <img src={iconCoin} alt="" />
                            {displayCoins.toLocaleString()} Coin
                        </span>
                    </div>
                </div>
            )}

            {/* ── Guide Popup ── */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        key="guide-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 10100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(8,4,20,0.82)', backdropFilter: 'blur(8px)',
                            padding: 20,
                        }}
                        onClick={() => setShowGuide(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.88, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 16 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: 380,
                                background: 'linear-gradient(160deg, rgba(22,10,48,0.98) 0%, rgba(35,16,62,0.98) 100%)',
                                border: '1.5px solid rgba(212,175,80,0.4)',
                                borderRadius: 22,
                                padding: '24px 22px 20px',
                                boxShadow: '0 12px 50px rgba(0,0,0,0.6), inset 0 0 40px rgba(200,140,50,0.06)',
                                position: 'relative',
                            }}
                        >
                            {/* Close */}
                            <button
                                onClick={() => setShowGuide(false)}
                                style={{
                                    position: 'absolute', top: 12, right: 12,
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                                }}
                            >
                                <X size={13} />
                            </button>

                            {/* Title */}
                            <div style={{ textAlign: 'center', marginBottom: 18 }}>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>📿</div>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: 18, fontWeight: 700,
                                    color: 'rgba(212,175,80,0.95)',
                                    textShadow: '0 0 16px rgba(212,175,80,0.4)',
                                    margin: 0,
                                }}>Hướng Dẫn Dâng Hoa</h3>
                                <div style={{ fontSize: 10, color: 'rgba(212,175,80,0.5)', letterSpacing: '0.35em', marginTop: 4 }}>✦ — Ave Maria — ✦</div>
                            </div>

                            {/* Section: Rosary structure */}
                            <div style={{
                                background: 'rgba(212,175,80,0.06)',
                                border: '1px solid rgba(212,175,80,0.18)',
                                borderRadius: 14, padding: '14px 16px', marginBottom: 12,
                            }}>
                                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'rgba(212,175,80,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>📿 Cấu Trúc Chuỗi Mân Côi</p>
                                {[
                                    ['1 Hạt', '1 Kinh Kính Mừng'],
                                    ['1 Chục', '10 hạt (Kính Mừng × 10 + Lạy Cha + Sáng Danh)'],
                                    ['1 Tràng', '5 Chục = 50 hạt'],
                                    ['Tối đa/ngày', '3 Tràng = 150 hạt'],
                                ].map(([label, desc]) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: 'rgba(255,220,120,0.9)',
                                            minWidth: 80, flexShrink: 0,
                                            paddingTop: 1,
                                        }}>{label}</span>
                                        <span style={{ fontSize: 12, color: 'rgba(255,240,200,0.75)', lineHeight: 1.5 }}>{desc}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Section: Rewards */}
                            <div style={{
                                background: 'rgba(255,200,60,0.06)',
                                border: '1px solid rgba(255,200,60,0.2)',
                                borderRadius: 14, padding: '14px 16px',
                            }}>
                                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'rgba(255,200,80,0.85)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>💰 Phần Thưởng</p>
                                {[
                                    ['1 hạt dâng', '+1 Coin'],
                                    ['1 tràng (50 hạt)', '+10 Coin bonus'],
                                    ['2 tràng (100 hạt)', '+20 Coin bonus'],
                                    ['3 tràng (150 hạt)', '+30 Coin bonus'],
                                    ['Tối đa mỗi ngày', '180 Coin (150 + 30 bonus)'],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                                        <span style={{ fontSize: 12, color: 'rgba(255,240,200,0.75)' }}>{label}</span>
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            color: label.includes('Tối đa') ? 'rgba(255,180,50,0.95)' : 'rgba(255,215,80,0.9)',
                                            background: 'rgba(255,200,60,0.12)',
                                            padding: '2px 9px', borderRadius: 20,
                                            border: '1px solid rgba(255,200,60,0.2)',
                                        }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            <p style={{
                                fontSize: 11, color: 'rgba(255,240,200,0.4)',
                                textAlign: 'center', margin: '14px 0 0',
                                fontStyle: 'italic',
                                fontFamily: "'Playfair Display', serif",
                            }}>"Mỗi Kinh Kính Mừng là một bông hồng dâng lên Đức Mẹ"</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Fixed Background Roses ── */}
            {(() => {
                const completedTrang = Math.min(3, Math.max(0, Math.floor(animToday / 50)));
                if (completedTrang === 0) return null;
                const ROSES = [
                    { img: roseRed,  color: '#ff4d6d' },
                    { img: rosePink, color: '#ff85c2' },
                    { img: roseGold, color: '#ffd700' },
                ];
                const activeRoses = ROSES.slice(0, completedTrang);
                return (
                    <div style={{ 
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: isLandscape ? -60 : 0,
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        pointerEvents: 'none',
                        zIndex: 2,
                    }}>
                        {activeRoses.map((rose, i) => (
                            <motion.div key={i}
                                initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.15 }}
                                style={{ position: 'relative', textAlign: 'center', margin: isLandscape ? 0 : '0 -20px' }}
                            >
                                {/* Phấn hương bay lên */}
                                {[0, 1, 2].map(j => (
                                    <motion.div key={j}
                                        animate={{ y: [-4, -80 - j * 20], x: [(j-1)*16, (j-1)*40], opacity: [0.85, 0], scale: [0.9, 0.2] }}
                                        transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4 + j * 0.55, ease: 'easeOut' }}
                                        style={{
                                            position: 'absolute', bottom: '85%', left: '50%', transform: 'translateX(-50%)',
                                            width: 14, height: 14, borderRadius: '50%',
                                            background: rose.color, pointerEvents: 'none',
                                            filter: `blur(4px) drop-shadow(0 0 10px ${rose.color})`,
                                        }}
                                    />
                                ))}
                                {/* ảnh bông hồng thật */}
                                <img
                                    src={rose.img}
                                    alt={`Tràng ${i + 1}`}
                                    style={{
                                        height: isLandscape ? 400 : '55vh', // Responsive to viewport — occupies lower half
                                        width: 'auto',
                                        objectFit: 'contain',
                                        filter: `drop-shadow(0 4px 10px rgba(0,0,0,0.25))`,
                                        display: 'block',
                                        transformOrigin: 'bottom center',
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                );
            })()}

            {/* ── Controls — direct overlay, no panel ── */}
            <div className="ro-controls" style={{ position: 'relative', zIndex: 10 }}>
                {isDailyComplete ? (
                    <motion.div className="ro-completed"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        style={{ background: 'none', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none', padding: 0 }}
                    >
                        {/* Dark box chỉ bao quanh phần text */}
                            <div style={{
                                background: 'rgba(20,10,5,0.65)',
                                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                                borderRadius: 16, border: '1px solid rgba(201,168,76,0.30)',
                                padding: '14px 18px', width: '100%',
                            }}>
                                <p className="ro-completed-title">Tuyệt vời! Đã dâng trọn hôm nay!</p>
                                <p style={{ fontSize: 13, color: 'rgba(255,240,210,0.95)', margin: '6px 0', lineHeight: 1.55 }}>
                                    Mẹ Maria chắc chắn đã vui nhận<br />
                                    <strong style={{ color: '#ffd54f' }}>{DAILY_MAX} hạt Mân Côi</strong> bạn dâng lên hôm nay 💛
                                </p>
                                <p style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(255,225,170,0.78)', lineHeight: 1.5, margin: 0 }}>
                                    ✨ Hẹn gặp lại ngày mai — mỗi ngày một tràng chuỗi<br />là sợi dây kết nối bạn với Trái Tim Vô Nhiễm Mẹ ✨
                                </p>
                            </div>
                        </motion.div>
                ) : (
                    <>
                        {/* Section title */}
                        <div className="ro-title-row">
                            <span className="ro-ornament">✦</span>
                            <h2 className="ro-title">Dâng Hoa Đức Mẹ</h2>
                            <span className="ro-ornament">✦</span>
                        </div>

                        {/* Picker ↔ Quote: smooth transition with AnimatePresence */}
                        <AnimatePresence mode="wait">
                            {!showQuote ? (
                                <motion.div
                                    key="pickers"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {/* Pickers row */}
                                    <div className="ro-pickers-row">
                                        <div className="ro-picker-group">
                                            <WheelPicker items={TRANG_ITEMS} selectedIndex={trangIdx} onChange={setTrangIdx} itemHeight={isLandscape ? 52 : 48} />
                                            <span className="ro-picker-label">Tràng</span>
                                        </div>
                                        <div className="ro-picker-sep">
                                            <div className="ro-picker-sep-line" />
                                            <span className="ro-picker-sep-dot">·</span>
                                            <div className="ro-picker-sep-line" />
                                        </div>
                                        <div className="ro-picker-group">
                                            <WheelPicker items={CHUC_ITEMS} selectedIndex={chucIdx} onChange={setChucIdx} itemHeight={isLandscape ? 52 : 48} />
                                            <span className="ro-picker-label">Chục</span>
                                        </div>
                                        {/* Coin badge removed from here — shown near profile */}
                                    </div>
                                    <AnimatePresence>
                                        {isOver && (
                                            <motion.p className="ro-warning" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                ⚠️ Còn lại {remaining} hạt hôm nay — sẽ ghi {effectiveHat} hạt
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="quote"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    style={{ willChange: 'opacity', padding: '2px' }}
                                >
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(212,175,80,0.7), rgba(180,100,160,0.4), rgba(212,175,80,0.7))',
                                        borderRadius: 18,
                                        padding: '2px',
                                    }}>
                                        <div style={{
                                            background: 'linear-gradient(160deg, rgba(18,8,38,0.93) 0%, rgba(35,15,55,0.92) 50%, rgba(22,8,35,0.93) 100%)',
                                            borderRadius: 16,
                                            padding: '14px 18px 16px',
                                            textAlign: 'center',
                                            boxShadow: 'inset 0 0 30px rgba(200,150,60,0.08), 0 4px 24px rgba(0,0,0,0.3)',
                                        }}>
                                            <div style={{ fontSize: 11, color: 'rgba(212,175,80,0.7)', letterSpacing: '0.4em', marginBottom: 8 }}>❖ ❖ ❖</div>
                                            <p style={{
                                                fontFamily: "'Playfair Display', serif",
                                                fontStyle: 'italic',
                                                fontSize: 15,
                                                lineHeight: 1.75,
                                                color: 'rgba(255,242,200,0.97)',
                                                textShadow: '0 0 14px rgba(220,160,55,0.55)',
                                                margin: 0,
                                            }}>❝ {quoteText} ❞</p>
                                            <div style={{ fontSize: 10, color: 'rgba(212,175,80,0.55)', letterSpacing: '0.35em', marginTop: 8 }}>— Ave Maria —</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Nhắc nhở lương tâm */}
                        <div style={{
                            textAlign: 'center',
                            padding: '10px 14px',
                            margin: '0 0 6px',
                            borderRadius: 12,
                            background: 'rgba(20,10,5,0.68)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                            border: '1.5px solid rgba(200,150,80,0.35)',
                        }}>
                            <p style={{
                                fontSize: 12,
                                color: 'rgba(255,245,220,0.97)',
                                lineHeight: 1.65,
                                margin: 0,
                                fontWeight: 600,
                            }}>
                                🙏 Chỉ dâng khi bạn <strong style={{ color: '#ffd54f', fontWeight: 900 }}>thật sự đã lần chuỗi Mân Côi</strong> hôm nay.
                            </p>
                            <p style={{
                                fontSize: 11,
                                color: 'rgba(255,220,160,0.78)',
                                lineHeight: 1.5,
                                margin: '5px 0 0',
                                fontStyle: 'italic',
                            }}>
                                — Đây là việc đạo đức. Đừng dâng để lấy Coin khi chưa thực sự cầu nguyện —
                            </p>
                        </div>

                        {/* Submit */}
                        <motion.button
                            ref={submitBtnRef}
                            className={`ro-submit${canSubmit ? '' : ' ro-submit--disabled'}`}
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                            whileTap={canSubmit ? { scale: 0.97 } : {}}
                            whileHover={canSubmit ? { scale: 1.02 } : {}}
                        >
                            {isSubmitting ? (
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                    style={{ display: 'inline-block', fontSize: 22 }}
                                >🌸</motion.span>
                            ) : (
                                <span>🌹 Dâng Lên Đức Mẹ 🌹</span>
                            )}
                        </motion.button>
                    </>
                )}

                {/* Progress */}
                <div className="ro-progress">
                    <div className="ro-progress-info">
                        <span>Hôm nay</span>
                        <span><strong>{displayToday}</strong> / {DAILY_MAX} hạt</span>
                    </div>
                    <div className="ro-progress-track">
                        <motion.div
                            className="ro-progress-fill"
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Bloom ring — expands from button on submit ── */}
            <AnimatePresence>
                {showBloom && (() => {
                    const btn = submitBtnRef.current;
                    const r = btn?.getBoundingClientRect();
                    if (!r) return null;
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    return (
                        <motion.div
                            key="bloom"
                            style={{
                                position: 'fixed',
                                left: cx, top: cy,
                                width: 0, height: 0,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,200,80,0.35) 0%, rgba(255,150,100,0.12) 50%, transparent 75%)',
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                                zIndex: 9998,
                            }}
                            initial={{ width: 0, height: 0, opacity: 0.9 }}
                            animate={{ width: 420, height: 420, opacity: 0 }}
                            exit={{}}
                            transition={{ duration: 0.65, ease: [0.2, 0.8, 0.4, 1] }}
                        />
                    );
                })()}
            </AnimatePresence>

            {/* ── Particles: roses + pollen ── */}
            <AnimatePresence>
                {particles.map((p) => p.type === 'rose' ? (
                    // Rose — slow ascent → gather → orbit → scatter+fade
                    <motion.div
                        key={p.id}
                        className="ro-particle"
                        initial={{ x: p.xs[0], y: p.ys[0], opacity: 0, scale: 0.2, rotate: 0 }}
                        animate={{
                            x: p.xs,
                            y: p.ys,
                            // fade in 0→4s, hold 4→12.5s, fade out
                            opacity: [0,    p.opacity ?? 1,  p.opacity ?? 1,  p.opacity ?? 1,  0],
                            scale:   [0.2,  0.90,            0.90,            0.88,            0.5],
                            rotate:  [0, p.rotate * 0.3, p.rotate * 0.8, p.rotate, p.rotate],
                        }}
                        transition={{
                            duration: p.duration / 1000,
                            delay:    p.delay / 1000,
                            // per-segment easing: rise|gather|orbit(fast)|scatter(slow)
                            ease: ['easeInOut', 'easeInOut', 'easeIn', 'easeOut'],
                            //   0s   2s     gather  orbit-end  21s
                            times: [0, 0.11,  0.39,   0.49,     1],
                        }}
                    >
                        <img
                            src={p.src}
                            alt=""
                            style={{
                                width: p.size, height: p.size,
                                objectFit: 'contain', display: 'block',
                                filter: p.blurTrail
                                    ? `blur(${p.blurTrail}px) drop-shadow(0 0 8px rgba(220,100,120,0.5))`
                                    : 'drop-shadow(0 2px 10px rgba(200,80,100,0.45))',
                            }}
                        />
                    </motion.div>
                ) : (
                    // Pollen dot particle
                    <motion.div
                        key={p.id}
                        className="ro-particle"
                        initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 0 }}
                        animate={{
                            x: [p.startX, p.targetX + (Math.random()-0.5)*40, p.targetX],
                            y: [p.startY, p.startY - (p.startY - p.targetY) * 0.5, p.targetY],
                            opacity: [0, 0.9, 0.7, 0],
                            scale: [0, 1, 1, 0.4],
                        }}
                        transition={{
                            duration: p.duration / 1000,
                            delay: p.delay / 1000,
                            ease: 'easeOut',
                            times: [0, 0.2, 0.7, 1],
                        }}
                        style={{
                            width: p.size,
                            height: p.size,
                            borderRadius: '50%',
                            background: p.color,
                            filter: p.blur ? `blur(${p.blur}px)` : 'none',
                            boxShadow: `0 0 ${p.size}px ${p.color}`,
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* ── Continuous ambient pollen (while roses alive) ── */}
            <AnimatePresence>
                {livePollen.map((p) => (
                    <motion.div
                        key={p.id}
                        className="ro-particle"
                        initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 0 }}
                        animate={{
                            x: p.targetX, y: p.targetY,
                            opacity: [0, 0.85, 0.6, 0],
                            scale:   [0, 1, 1, 0.4],
                        }}
                        transition={{ duration: p.duration / 1000, ease: 'easeOut', times: [0, 0.2, 0.7, 1] }}
                        style={{
                            width: p.size, height: p.size,
                            borderRadius: '50%',
                            background: p.color,
                            filter: `blur(${p.blur}px)`,
                            boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
                        }}
                    />
                ))}
            </AnimatePresence>



            {/* ── Flying coins badge → profile ── */}
            {flyingCoins.map(c => (
                <motion.img
                    key={c.id}
                    src={iconCoin}
                    className="ro-particle"
                    initial={{ x: c.sx, y: c.sy, opacity: 1, scale: 1 }}
                    animate={{ x: c.ex, y: c.ey, opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.65, delay: c.delay / 1000, ease: 'easeIn' }}
                    style={{ width: 22, height: 22 }}
                />
            ))}

            {/* ── Coin Popup (near profile, top-right) ── */}
            <AnimatePresence>
                {showCoinPopup && (
                    <motion.div
                        className="ro-coin-popup"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    >
                        <img src={iconCoin} alt="coin" />
                        <span>+{lastReward} Coins</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default RosaryOfferingModal;
