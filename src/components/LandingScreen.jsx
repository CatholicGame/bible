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
        <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden bg-[#020617]">

            {/* ── Ambient background glows ── */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-700 blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.2, 0.12] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-600 blur-[140px]"
                />
                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* ── Main card ── */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-sm px-5 flex flex-col items-center gap-8"
            >
                {/* Logo */}
                <motion.div variants={fadeUp} className="text-center space-y-3">
                    {/* Icon cluster */}
                    <div className="flex justify-center mb-2">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.5)]"
                        >
                            <Sparkles size={32} className="text-white drop-shadow" />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
                        Catholic{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                            Quiz!
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Học hỏi Lời Chúa qua trò chơi tương tác
                    </p>
                </motion.div>

                {/* PIN Entry */}
                <motion.div variants={fadeUp} className="w-full">
                    <form onSubmit={handleJoin} className="flex flex-col gap-4">

                        {/* Label */}
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold tracking-widest uppercase">
                            <KeyRound size={14} />
                            <span>Nhập Game PIN</span>
                        </div>

                        {/* PIN boxes */}
                        <motion.div
                            animate={focused ? { scale: 1.02 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`relative flex gap-2 p-3 rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm
                                ${focused
                                    ? 'border-amber-500/70 bg-slate-900/80 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                                    : 'border-slate-700/60 bg-slate-900/50'}`}
                        >
                            {boxes.map((char, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all duration-200
                                        ${char
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                            : 'bg-slate-800/60 text-slate-600 border border-slate-700/50'}`}
                                >
                                    {char || (i === pin.length && focused ? (
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="w-0.5 h-5 bg-amber-400 block"
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

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            disabled={!ready}
                            whileHover={ready ? { scale: 1.03, y: -1 } : {}}
                            whileTap={ready ? { scale: 0.97 } : {}}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-base font-black uppercase tracking-wider transition-all duration-300
                                ${ready
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-[0_6px_30px_rgba(245,158,11,0.45)] hover:shadow-[0_8px_40px_rgba(245,158,11,0.6)]'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'}`}
                        >
                            <AnimatePresence mode="wait">
                                {isJoining ? (
                                    <motion.div
                                        key="spinner"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"
                                    />
                                ) : (
                                    <motion.span
                                        key="label"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Play size={18} fill="currentColor" />
                                        Vào phòng
                                        <ChevronRight size={16} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </form>
                </motion.div>

                {/* Footer hint */}
                <motion.p
                    variants={fadeUp}
                    className="text-slate-600 text-xs text-center leading-relaxed"
                >
                    Nhập mã PIN 6 chữ số do Quản trò cung cấp
                </motion.p>
            </motion.div>
        </div>
    );
};

export default LandingScreen;
