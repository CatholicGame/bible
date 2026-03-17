import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, KeyRound, ChevronRight } from 'lucide-react';

/* ── Stagger parent ── */
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const LandingScreen = () => {
    const [pin, setPin] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [focused, setFocused] = useState(false);

    const ready = pin.length >= 4 && !isJoining;

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!ready) return;
        setIsJoining(true);
        
        // Request fullscreen on web interaction
        try {
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.log("Fullscreen request failed:", err);
        }

        setTimeout(() => {
            setIsJoining(false);
            alert('Kết nối phòng thành công: ' + pin);
        }, 1500);
    };

    /* Split PIN into individual boxes for visual flair */
    const boxes = Array.from({ length: 6 }, (_, i) => pin[i] || '');

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden bg-[#2563eb]">

            {/* ── Cartoon background decorations ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('/src/assets/common/common_background.png')" }} />
                <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-300/30 blur-2xl flex items-center justify-center shadow-[inset_0_-8px_0_rgba(191,219,254,0.3)]" />
                <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-blue-400/20 blur-xl" />
                <div className="absolute top-1/4 right-10 w-24 h-24 rounded-full bg-yellow-400/20 blur-2xl" />
                <div className="absolute bottom-1/3 left-8 w-16 h-16 rounded-full bg-white/10" />
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {/* ── Main card ── */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-sm px-5 flex flex-col items-center gap-6"
            >
                {/* Logo */}
                <motion.div variants={fadeUp} className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
                            className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center relative overflow-hidden"
                            style={{ border: '4px solid #b45309', boxShadow: '0 5px 0 #b45309' }}
                        >
                            <div className="absolute inset-0 w-full h-1/2 bg-white/30 pointer-events-none" />
                            <Sparkles size={30} className="text-amber-800 drop-shadow-sm relative z-10" />
                        </motion.div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-center text-white drop-shadow-[0_4px_0_rgba(30,58,138,1)] uppercase" style={{ WebkitTextStroke: '1px #1e3a8a' }}>
                        Catholic{' '}
                        <span className="text-yellow-300 drop-shadow-[0_4px_0_rgba(180,83,9,1)]" style={{ WebkitTextStroke: '1px #78350f' }}>
                            Quiz!
                        </span>
                    </h1>
                    <p className="text-blue-100 text-sm font-bold">
                        Học hỏi Lời Chúa qua trò chơi tương tác
                    </p>
                </motion.div>

                {/* PIN Entry — cartoon card */}
                <motion.div variants={fadeUp} className="w-full">
                    <form onSubmit={handleJoin} className="flex flex-col gap-4">

                        {/* Cartoon card wrapper — deep blue card style */}
                        <div
                            className="bg-[#3b82f6] p-4 sm:p-5 rounded-[1.5rem] md:rounded-[2rem] border-4 border-[#1e3a8a] shadow-[0_8px_0_rgba(30,58,138,1)] relative z-10 w-full"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/6 rounded-t-3xl pointer-events-none" />

                            {/* Label */}
                            <div className="flex items-center justify-center gap-2 text-yellow-300 text-sm font-black tracking-widest uppercase mb-4 drop-shadow-[0_2px_0_rgba(180,83,9,1)]">
                                <KeyRound size={16} strokeWidth={3} className="text-yellow-300 drop-shadow-[0_2px_0_rgba(180,83,9,1)]" />
                                <span style={{ WebkitTextStroke: '0.5px #78350f' }}>NHẬP GAME PIN</span>
                            </div>

                            {/* PIN boxes */}
                            <motion.div
                                animate={focused ? { scale: 1.02 } : { scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="relative flex gap-2"
                            >
                                {boxes.map((char, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 h-12 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl font-black transition-all duration-200"
                                        style={{
                                            border: '3px solid #1e3a8a',
                                            background: char ? '#fbbf24' : (focused && i === pin.length ? '#fef3c7' : '#ffffff'),
                                            color: char ? '#1e3a8a' : '#94a3b8',
                                            boxShadow: char
                                                ? 'inset 0 -3px 0 rgba(180,83,9,0.3), 0 4px 0 rgba(30,58,138,1)'
                                                : (focused && i === pin.length ? 'inset 0 -3px 0 rgba(191,219,254,1), 0 4px 0 rgba(30,58,138,1)' : 'inset 0 -3px 0 rgba(226,232,240,1), 0 4px 0 rgba(30,58,138,0.5)'),
                                            transform: char ? 'translateY(-2px)' : 'none',
                                        }}
                                    >
                                        {char || (i === pin.length && focused ? (
                                            <motion.span
                                                animate={{ opacity: [1, 0] }}
                                                transition={{ duration: 0.8, repeat: Infinity }}
                                                className="w-0.5 h-5 bg-blue-500 block rounded-full"
                                            />
                                        ) : '·')}
                                    </div>
                                ))}

                                {/* Hidden real input */}
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    maxLength={6}
                                    className="absolute inset-0 opacity-0 cursor-text"
                                    autoComplete="off"
                                    autoFocus
                                />
                            </motion.div>
                        </div>

                        {/* Submit button — cartoon pill */}
                        <motion.button
                            type="submit"
                            disabled={!ready}
                            className="w-full bg-yellow-400 disabled:bg-slate-300 disabled:opacity-70 disabled:hover:bg-slate-300 hover:bg-yellow-300 text-[#1e3a8a] disabled:text-slate-500 font-black uppercase tracking-widest text-lg py-4 rounded-full border-4 border-[#1e3a8a] disabled:border-slate-500 shadow-[0_6px_0_rgba(30,58,138,1)] disabled:shadow-[0_4px_0_rgba(100,116,139,1)] active:translate-y-1.5 active:shadow-[0_0px_0_rgba(30,58,138,1)] transition-all flex justify-center items-center gap-2 relative overflow-hidden group hover:scale-[1.02] mt-2"
                        >
                            {ready && <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 pointer-events-none" />}
                            <AnimatePresence mode="wait">
                                {isJoining ? (
                                    <motion.div
                                        key="spinner"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="w-5 h-5 rounded-full animate-spin relative z-10"
                                        style={{ border: '3px solid #1e3a8a', borderTopColor: 'transparent' }}
                                    />
                                ) : (
                                    <motion.span
                                        key="label"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-center gap-2 relative z-10"
                                    >
                                        <Play size={18} fill="currentColor" />
                                        Vào phòng
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </form>
                </motion.div>

                {/* Footer hint */}
                <motion.p
                    variants={fadeUp}
                    className="text-blue-200 text-xs text-center leading-relaxed font-bold opacity-60"
                >
                    Nhập mã PIN 6 chữ số do Quản trò cung cấp
                </motion.p>
            </motion.div>
        </div>
    );
};

export default LandingScreen;
