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

    const handleJoin = (e) => {
        e.preventDefault();
        if (!ready) return;
        setIsJoining(true);
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
                <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-400/30" />
                <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-blue-400/20" />
                <div className="absolute top-1/4 right-10 w-20 h-20 rounded-full bg-yellow-400/20" />
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

                    <h1 className="text-3xl font-black tracking-tight text-white" style={{ textShadow: '0 3px 0 #1e3a8a' }}>
                        Catholic{' '}
                        <span className="text-yellow-300" style={{ textShadow: '0 3px 0 #b45309' }}>
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

                        {/* Cartoon card wrapper */}
                        <div
                            className="bg-white rounded-2xl p-4"
                            style={{ border: '4px solid #1e3a8a', boxShadow: '0 6px 0 #1e3a8a' }}
                        >
                            {/* Label */}
                            <div className="flex items-center gap-2 text-blue-800 text-xs font-black tracking-widest uppercase mb-3">
                                <KeyRound size={14} strokeWidth={3} />
                                <span>Nhập Game PIN</span>
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
                                        className="flex-1 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all duration-200"
                                        style={{
                                            border: char
                                                ? '2px solid #f59e0b'
                                                : (focused && i === pin.length ? '2px solid #3b82f6' : '2px solid #cbd5e1'),
                                            background: char ? '#fef3c7' : (focused && i === pin.length ? '#eff6ff' : '#f1f5f9'),
                                            color: char ? '#b45309' : '#94a3b8',
                                            boxShadow: char
                                                ? '0 3px 0 rgba(180,83,9,0.4)'
                                                : (focused && i === pin.length ? '0 3px 0 rgba(59,130,246,0.3)' : '0 2px 0 rgba(148,163,184,0.3)'),
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
                            whileTap={ready ? { y: 4 } : {}}
                            className="w-full py-4 rounded-full flex items-center justify-center gap-2 text-base font-black uppercase tracking-widest transition-all duration-200 relative overflow-hidden"
                            style={ready ? {
                                background: '#facc15',
                                color: '#1e3a8a',
                                border: '4px solid #1e3a8a',
                                boxShadow: '0 6px 0 #1e3a8a',
                            } : {
                                background: '#cbd5e1',
                                color: '#94a3b8',
                                border: '4px solid #94a3b8',
                                boxShadow: '0 4px 0 #94a3b8',
                                cursor: 'not-allowed',
                            }}
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
