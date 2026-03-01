import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, CheckCircle2, XCircle, Play, Phone, Users, Shield, RefreshCcw, Flag, Star } from 'lucide-react';
import pinnacleBackground from '../../assets/pinnacle/altp_background.png';

const DUMMY_QUESTIONS = [
    { question: "Tên vị Giáo hoàng đầu tiên của Giáo hội Công giáo là gì?", options: ["Thánh Phêrô", "Thánh Phaolô", "Thánh Anrê", "Thánh Giacôbê"], answer: 0 },
    { question: "Kinh Thánh Công giáo có bao nhiêu cuốn?", options: ["66", "73", "46", "27"], answer: 1 },
    { question: "Truyền thống Kinh Mân Côi cổ điển (trước thời ĐGH Gioan Phaolô II) bao gồm bao nhiêu mầu nhiệm chính?", options: ["2", "3", "4", "5"], answer: 1 },
    { question: "Trong Kinh Lạy Cha, câu tiếp theo của 'Xin tha nợ chúng con' là gì?", options: ["Như chúng con cũng tha", "Kẻ có nợ chúng con", "Xin chớ để chúng con", "Nhưng cứu chúng con cho khỏi"], answer: 0 },
    { question: "Vị thánh nào được mệnh danh là 'Tiến sĩ Hội Thánh' và viết tác phẩm 'Tổng luận Thần học'?", options: ["Thánh Augustinô", "Thánh Tôma Aquinô", "Thánh Phanxicô Đen", "Thánh Bênađô"], answer: 1 },
    { question: "Nơi Chúa Giêsu được sinh ra tên là gì?", options: ["Nazareth", "Jerusalem", "Bethlehem", "Galilee"], answer: 2 },
    { question: "Bí tích nào đánh dấu sự trưởng thành trong đời sống Kitô hữu?", options: ["Rửa Tội", "Thánh Thể", "Thêm Sức", "Hoà Giải"], answer: 2 },
    { question: "Ai là người đã làm phép thánh tẩy cho Chúa Giêsu?", options: ["Thánh Phêrô", "Gioan Tẩy Giả", "Thánh Giuse", "Thánh Giacôbê"], answer: 1 },
    { question: "Núi nơi Chúa Giêsu chịu đóng đinh mọc lên có tên là gì?", options: ["Golgotha", "Tabor", "Sinai", "Moriah"], answer: 0 },
    { question: "Mùa Chay kéo dài bao nhiêu ngày?", options: ["30 ngày", "40 ngày", "50 ngày", "100 ngày"], answer: 1 },
    { question: "Thiên Thần nào đã báo tin cho Đức Maria?", options: ["Michael", "Raphael", "Gabriel", "Uriel"], answer: 2 },
    { question: "Người môn đệ nào đã chối Chúa 3 lần trong cuộc thương khó?", options: ["Gioan", "Giuđa Iscariot", "Tôma", "Phêrô"], answer: 3 },
    { question: "Đức Mẹ hiện ra ở Fatima (Bồ Đào Nha) vào năm nào?", options: ["1858", "1917", "1933", "1981"], answer: 1 },
    { question: "Lễ Chúa Giáng Sinh được Giáo hội Công giáo cử hành trọng thể vào ngày nào?", options: ["24/12", "25/12", "1/1", "6/1"], answer: 1 },
    { question: "Vị ngôn sứ nào đã bị ném vào hang sư tử nhưng không bị ăn thịt?", options: ["Isaia", "Môse", "Đanien", "Giêrêmia"], answer: 2 }
];

// Balanced points so ranking correctly requires dedication (Max 5,000 XP per 15-question run).
const REWARDS = [10, 20, 30, 40, 50, 100, 150, 200, 300, 500, 800, 1200, 2000, 3000, 5000];

// Safe Milestone indices (0-indexed, so 4 is Question 5, 9 is Question 10)
const MILESTONES = [4, 9, 14];

const HexagonBox = ({ children, className = "", onClick, disabled, isActive, isCorrect, isWrong, isHidden }) => {
    let bg = 'rgba(15,23,42,0.82)';         // default: very dark navy, semi-transparent
    let sideColor = '#1e40af';               // blue-700 for side wedges
    let glowColor = 'rgba(59,130,246,0.5)';  // blue glow
    let borderTop = 'rgba(99,179,237,0.35)';

    if (isActive) {
        bg = 'rgba(146,64,14,0.9)';
        sideColor = '#d97706';
        glowColor = 'rgba(245,158,11,0.7)';
        borderTop = 'rgba(253,230,138,0.5)';
    }
    if (isCorrect) {
        bg = 'rgba(20,83,45,0.9)';
        sideColor = '#16a34a';
        glowColor = 'rgba(34,197,94,0.7)';
        borderTop = 'rgba(134,239,172,0.5)';
    }
    if (isWrong) {
        bg = 'rgba(127,29,29,0.9)';
        sideColor = '#dc2626';
        glowColor = 'rgba(239,68,68,0.7)';
        borderTop = 'rgba(252,165,165,0.5)';
    }
    if (isHidden) return <div className="opacity-0 pointer-events-none w-full" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}>&nbsp;</div>;

    return (
        <div
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            className={`w-full ${disabled && !isActive && !isCorrect && !isWrong ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full relative px-6 md:px-12 py-3 outline-none transition-all duration-300 ${className}`}
                style={{
                    clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
                    WebkitClipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
                }}
            >
                {/* Main fill */}
                <div className="absolute inset-0" style={{ background: bg, borderTop: `1px solid ${borderTop}`, borderBottom: `1px solid ${borderTop}`, zIndex: -1 }} />
                {/* Left angled accent */}
                <div className="absolute left-0 top-0 bottom-0 w-[5%]" style={{ background: sideColor, clipPath: 'polygon(0 50%, 100% 0, 100% 100%)', zIndex: -2 }} />
                {/* Right angled accent */}
                <div className="absolute right-0 top-0 bottom-0 w-[5%]" style={{ background: sideColor, clipPath: 'polygon(100% 50%, 0 0, 0 100%)', zIndex: -2 }} />
                <div className="relative z-10 w-full flex items-center">{children}</div>
            </button>
        </div>
    );
};

const LifelineButton = ({ icon: Icon, isUsed, onClick, active }) => (
    <button
        onClick={onClick}
        disabled={isUsed}
        className={`relative w-12 h-10 md:w-14 md:h-12 rounded-full border border-blue-400/50 flex items-center justify-center transition-all ${isUsed ? 'opacity-30 grayscale cursor-not-allowed border-red-500' : active ? 'bg-amber-600 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-[#0f172a]/80 hover:bg-slate-800 hover:border-blue-300 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
    >
        <span className="bg-gradient-to-b from-white/10 to-transparent absolute inset-0 rounded-full"></span>
        <Icon size={18} className="relative z-10" />
        {isUsed && <span className="absolute text-red-500 font-bold text-2xl select-none z-20">×</span>}
    </button>
);

const PinnacleGame = ({ onLeaveGame }) => {
    const [gameState, setGameState] = useState('rules'); // 'rules', 'playing', 'finished'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [hiddenOptions, setHiddenOptions] = useState([]);

    // Timer
    const [timeLeft, setTimeLeft] = useState(30);

    // Lifelines state
    const [lifelines, setLifelines] = useState({
        fiftyFifty: false,
        phone: false,
        audience: false,
        swap: false
    });

    // XP Particle animation
    const [xpParticles, setXpParticles] = useState([]);
    const [displayScore, setDisplayScore] = useState(0);  // animated display value
    const xpBadgeRef = useRef(null);
    const currentRowRef = useRef(null);

    // Web Audio: coin ping sound
    const playCoinSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1047, ctx.currentTime);           // C6
            osc.frequency.exponentialRampToValueAtTime(1568, ctx.currentTime + 0.12); // G6
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        } catch (_) { /* ignore if audio not supported */ }
    }, []);

    // Count up displayScore toward score when score changes
    useEffect(() => {
        if (score <= displayScore) return;
        const diff = score - displayScore;
        const steps = Math.min(diff, 30);
        const stepValue = Math.ceil(diff / steps);
        const interval = 600 / steps;  // spread over 600ms
        let current = displayScore;
        let count = 0;
        const id = setInterval(() => {
            count++;
            current = Math.min(current + stepValue, score);
            setDisplayScore(current);
            if (count === 1) playCoinSound();
            if (current >= score) clearInterval(id);
        }, interval);
        return () => clearInterval(id);
    }, [score]);

    const spawnXPParticles = useCallback(() => {
        const badge = xpBadgeRef.current?.getBoundingClientRect();
        const row = currentRowRef.current?.getBoundingClientRect();

        const targetX = badge ? badge.left + badge.width / 2 : window.innerWidth - 90;
        const targetY = badge ? badge.top + badge.height / 2 : 28;
        const originX = row ? row.left + row.width / 2 : window.innerWidth * 0.85;
        const originY = row ? row.top + row.height / 2 : window.innerHeight * 0.5;

        const particles = Array.from({ length: 9 }, (_, i) => ({
            id: Date.now() + i,
            originX: originX + (Math.random() - 0.5) * 30,
            originY: originY + (Math.random() - 0.5) * 20,
            burstX: (Math.random() - 0.5) * 120,
            burstY: (Math.random() - 0.5) * 80,
            targetX,
            targetY,
            delay: i * 0.07,
            size: 10 + Math.random() * 8,
        }));
        setXpParticles(particles);
        setTimeout(() => setXpParticles([]), 2500);
    }, []);

    const handleStartGame = () => {
        setGameState('playing');
        setTimeLeft(30);
    };

    useEffect(() => {
        if (gameState !== 'playing' || isAnswerRevealed) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, currentQuestionIndex, isAnswerRevealed]);

    const handleTimeUp = () => {
        setIsAnswerRevealed(true);
        setTimeout(() => {
            setGameState('finished');
        }, 3000);
    };

    const handleOptionSelect = (index) => {
        if (isAnswerRevealed || hiddenOptions.includes(index)) return;

        setSelectedOption(index);
        setIsAnswerRevealed(true);

        const currentQuestion = DUMMY_QUESTIONS[currentQuestionIndex];
        const isCorrect = index === currentQuestion.answer;

        if (isCorrect) {
            const reward = REWARDS[currentQuestionIndex];
            spawnXPParticles();
            // Delay score update to match first particle arrival (~1.36s)
            setTimeout(() => setScore(reward), 1360);

            setTimeout(() => {
                if (currentQuestionIndex < DUMMY_QUESTIONS.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setSelectedOption(null);
                    setIsAnswerRevealed(false);
                    setHiddenOptions([]);
                    setTimeLeft(30);
                } else {
                    setGameState('finished');
                }
            }, 3000);
        } else {
            setTimeout(() => {
                // Find last milestone reached logic
                let earnedScore = 0;
                for (let i = MILESTONES.length - 1; i >= 0; i--) {
                    if (currentQuestionIndex > MILESTONES[i]) {
                        earnedScore = REWARDS[MILESTONES[i]];
                        break;
                    }
                }
                setScore(earnedScore);
                setGameState('finished');
            }, 4000);
        }
    };

    const handlePlayAgain = () => {
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setHiddenOptions([]);
        setLifelines({ fiftyFifty: false, phone: false, audience: false, swap: false });
        setTimeLeft(30);
    };

    // Lifeline handlers
    const useFiftyFifty = () => {
        if (lifelines.fiftyFifty) return;
        setLifelines(prev => ({ ...prev, fiftyFifty: true }));
        const currentAns = DUMMY_QUESTIONS[currentQuestionIndex].answer;
        let incorrectOptions = [0, 1, 2, 3].filter(idx => idx !== currentAns);
        // shuffle and pick 2
        incorrectOptions.sort(() => 0.5 - Math.random());
        setHiddenOptions([incorrectOptions[0], incorrectOptions[1]]);
    };

    const useLifelineMock = (type) => { // Generic click for others just to mark them used
        setLifelines(prev => ({ ...prev, [type]: true }));
    };

    return (
        <div className="w-full h-full relative flex flex-col items-center z-10 bg-[#020617] overflow-hidden font-sans text-slate-100">
            {/* XP Comet Particles */}
            {xpParticles.map((p) => (
                <motion.div
                    key={p.id}
                    className="fixed pointer-events-none z-[9999]"
                    style={{ top: 0, left: 0 }}
                    initial={{ x: p.originX, y: p.originY, opacity: 0, scale: 0 }}
                    animate={{
                        x: [p.originX, p.originX + p.burstX, p.targetX],
                        y: [p.originY, p.originY + p.burstY, p.targetY],
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1.5, 1, 0],
                    }}
                    transition={{
                        duration: 1.6,
                        delay: p.delay,
                        times: [0, 0.2, 0.85, 1],
                        ease: ['easeOut', 'easeIn', 'easeIn'],
                    }}
                >
                    <Star size={p.size} fill="#f59e0b" className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,1)]" />
                </motion.div>
            ))}
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${pinnacleBackground})` }}
            />
            {/* Vignette: edges dark, center clear */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(2,6,23,0.55) 60%, rgba(2,6,23,0.92) 100%)',
                }}
            />
            {/* Subtle bottom shadow so UI text stays readable */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-[#020617]/80 via-transparent to-[#020617]/40" />

            <div className="w-full max-w-6xl flex-1 flex flex-col z-10 pt-4 pb-8 px-4 relative">
                <AnimatePresence mode="wait">

                    {gameState === 'rules' && (
                        <motion.div
                            key="rules"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="bg-blue-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-blue-500 m-auto max-w-2xl w-full text-white"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={onLeaveGame} className="text-gray-300 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-blue-800">
                                    <ArrowLeft size={24} />
                                </button>
                                <div className="w-12 h-12 border-2 border-yellow-400 bg-blue-950 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                    <Trophy className="text-yellow-400" size={24} />
                                </div>
                            </div>

                            <h2 className="text-3xl font-black mb-4 tracking-tight text-center text-yellow-400 uppercase drop-shadow-md">Đỉnh Cao Hiểu Biết</h2>

                            <div className="space-y-4 mb-8 text-blue-100 bg-blue-950/50 p-6 rounded-2xl border border-blue-600/50">
                                <p className="flex gap-3 items-start"><span className="text-yellow-400 font-bold">1.</span> Bạn sẽ trải qua 15 câu hỏi liên tiếp từ dễ đến khó.</p>
                                <p className="flex gap-3 items-start"><span className="text-yellow-400 font-bold">2.</span> Vượt qua mỗi câu hỏi, bạn sẽ tích lũy được điểm XP vô cùng giá trị.</p>
                                <p className="flex gap-3 items-start"><span className="text-yellow-400 font-bold">3.</span> Cột mốc an toàn: Câu 5 và Câu 10. Trả lời sai sau cột mốc sẽ giữ được điểm của cột mốc đó.</p>
                                <p className="flex gap-3 items-start"><span className="text-yellow-400 font-bold">4.</span> Bạn có 4 quyền trợ giúp để sử dụng một lần duy nhất.</p>
                            </div>

                            <button
                                onClick={handleStartGame}
                                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black uppercase text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex justify-center items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Play fill="currentColor" size={24} /> Bắt đầu ngay
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex-1 flex flex-col h-full"
                        >
                            {/* Top Bar: Lifelines */}
                            <div className="flex justify-between items-start mb-2 px-2 md:px-4 shrink-0">
                                <button onClick={onLeaveGame} className="text-slate-300 hover:text-white transition-all flex items-center gap-1 bg-slate-900/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-700/50 backdrop-blur-sm text-sm md:text-base">
                                    <ArrowLeft size={16} /> Thoát
                                </button>

                                <div className="flex gap-2 bg-slate-900/40 p-1 rounded-full backdrop-blur-sm border border-slate-700/30">
                                    <LifelineButton icon={Users} isUsed={lifelines.fiftyFifty} onClick={useFiftyFifty} />
                                    <LifelineButton icon={Phone} isUsed={lifelines.phone} onClick={() => useLifelineMock('phone')} />
                                    <LifelineButton icon={Shield} isUsed={lifelines.audience} onClick={() => useLifelineMock('audience')} />
                                    <LifelineButton icon={RefreshCcw} isUsed={lifelines.swap} onClick={() => useLifelineMock('swap')} />
                                </div>

                                <div ref={xpBadgeRef} className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <Star size={14} fill="currentColor" className="text-amber-400 shrink-0" />
                                    <motion.span
                                        key={displayScore}
                                        initial={{ scale: 1.4, color: '#fbbf24' }}
                                        animate={{ scale: 1, color: '#f59e0b' }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="font-black text-sm tracking-wide"
                                    >
                                        {displayScore.toLocaleString()} XP
                                    </motion.span>
                                </div>
                            </div>

                            {/* Main Game Area */}
                            <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto overflow-hidden gap-2 lg:gap-8 pb-2 px-2 lg:px-4">

                                {/* Left Side: Timer & Question Board */}
                                <div className="flex-1 w-full order-2 lg:order-1 flex flex-col pt-2 pb-6 lg:pb-8 h-[75vh] lg:h-full justify-between items-center z-20">

                                    {/* Timer */}
                                    <div className="w-full flex justify-center shrink-0">
                                        <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-slate-700/50 flex flex-col items-center justify-center bg-[#020617]/80 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90">
                                                <circle cx="50" cy="50" r="46" className="stroke-slate-700/30" strokeWidth="6" fill="transparent" />
                                                <circle cx="50" cy="50" r="46" className={`${timeLeft <= 10 ? 'stroke-red-500' : 'stroke-amber-500'} transition-all duration-1000 ease-linear`} strokeWidth="6" fill="transparent" strokeDasharray="289" strokeDashoffset={289 - (timeLeft / 30) * 289} />
                                            </svg>
                                            <span className={`text-3xl md:text-4xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>{timeLeft}</span>
                                        </div>
                                    </div>

                                    {/* Question & Options Area */}
                                    <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 md:gap-4 px-2 lg:px-0">
                                        {/* Question Box */}
                                        <HexagonBox className="min-h-[70px] md:min-h-[120px] flex items-center justify-center cursor-default">
                                            <h3 className="text-base md:text-xl lg:text-3xl font-bold text-center leading-snug tracking-wide text-slate-100 drop-shadow-lg w-full px-2 md:px-6">
                                                {DUMMY_QUESTIONS[currentQuestionIndex].question}
                                            </h3>
                                        </HexagonBox>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 md:gap-y-4 md:gap-x-6">
                                            {DUMMY_QUESTIONS[currentQuestionIndex].options.map((option, idx) => {
                                                const alphabet = ["A", "B", "C", "D"];
                                                const isHidden = hiddenOptions.includes(idx);

                                                let isSel = selectedOption === idx;
                                                let isCorrectChoice = isAnswerRevealed && idx === DUMMY_QUESTIONS[currentQuestionIndex].answer;
                                                let isWrongChoice = isAnswerRevealed && isSel && !isCorrectChoice;

                                                return (
                                                    <HexagonBox
                                                        key={idx}
                                                        onClick={() => handleOptionSelect(idx)}
                                                        disabled={isAnswerRevealed || isHidden}
                                                        isActive={isSel && !isAnswerRevealed}
                                                        isCorrect={isCorrectChoice}
                                                        isWrong={isWrongChoice}
                                                        isHidden={isHidden}
                                                        className="text-left py-2 md:py-4"
                                                    >
                                                        <div className="flex items-center gap-2 md:gap-4 w-full pr-2">
                                                            <span className="text-amber-500 font-black text-lg md:text-2xl drop-shadow-sm">{alphabet[idx]}:</span>
                                                            <span className="text-slate-200 text-sm md:text-lg font-medium flex-1 break-words leading-tight">{option}</span>
                                                        </div>
                                                    </HexagonBox>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Reward Ladder (No-Scroll — fits in full height) */}
                                <div className="w-full lg:w-72 flex flex-col shrink-0 order-1 lg:order-2 h-[20vh] lg:h-full lg:border-l lg:border-slate-700/50 lg:pl-4">
                                    <div className="flex-1 flex flex-col h-full overflow-hidden justify-between">
                                        <div className="flex flex-col-reverse gap-1 h-full justify-end">
                                            {REWARDS.map((reward, idx) => {
                                                const qNum = idx + 1;
                                                const isCurrent = idx === currentQuestionIndex;
                                                const isPassed = idx < currentQuestionIndex;
                                                const isMilestone = MILESTONES.includes(idx);

                                                // Determine background, text styles per state
                                                let bg = '#1E293B';          // default: dark slate
                                                let textColor = '#94a3b8';   // slate-400
                                                let shadow = '0 1px 4px rgba(0,0,0,0.4)';
                                                let opacity = 1;

                                                if (isMilestone && !isPassed && !isCurrent) {
                                                    if (idx === 4) { bg = '#1e3a5f'; textColor = '#93c5fd'; shadow = '0 2px 8px rgba(59,130,246,0.3)'; }   // blue-900
                                                    if (idx === 9) { bg = '#3b0764'; textColor = '#c4b5fd'; shadow = '0 2px 8px rgba(139,92,246,0.4)'; }   // purple-950
                                                    if (idx === 14) { bg = '#78350f'; textColor = '#fde68a'; shadow = '0 2px 8px rgba(245,158,11,0.4)'; }   // amber-900
                                                }

                                                if (isPassed) {
                                                    bg = '#0f172a';
                                                    textColor = '#f59e0b88';
                                                    opacity = 0.5;
                                                }

                                                if (isCurrent) {
                                                    bg = '#f59e0b';
                                                    textColor = '#020617';
                                                    shadow = '0 0 16px rgba(245,158,11,0.7)';
                                                }

                                                return (
                                                    <div
                                                        key={idx}
                                                        ref={isCurrent ? currentRowRef : undefined}
                                                        className="relative flex items-center justify-between px-5 transition-all duration-300"
                                                        style={{
                                                            clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
                                                            WebkitClipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
                                                            background: bg,
                                                            boxShadow: shadow,
                                                            opacity,
                                                            paddingTop: isMilestone ? '5px' : '3px',
                                                            paddingBottom: isMilestone ? '5px' : '3px',
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold" style={{ color: textColor }}>{qNum}</span>
                                                            {isMilestone && !isPassed && (
                                                                <Flag size={11} className="shrink-0" style={{ color: isCurrent ? '#020617' : textColor }} fill="currentColor" />
                                                            )}
                                                        </div>
                                                        <span className={`text-sm ${isMilestone && !isCurrent ? 'font-bold' : 'font-semibold'}`} style={{ color: textColor }}>{reward.toLocaleString()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'finished' && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-900/95 p-10 rounded-3xl shadow-[0_0_40px_rgba(30,58,138,0.8)] text-center border-4 border-yellow-500 m-auto max-w-2xl w-full text-white backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                                className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-yellow-400"
                            >
                                <Trophy className="text-yellow-400" size={48} />
                            </motion.div>

                            <h2 className="text-4xl font-black mb-2 text-yellow-400 drop-shadow-lg uppercase tracking-wider">Trò chơi kết thúc!</h2>
                            <p className="text-blue-200 mb-8 text-lg">Bạn đã hoàn thành chặng đường đỉnh cao.</p>

                            <div className="bg-black/50 rounded-3xl p-8 mb-8 border border-blue-500/50">
                                <div className="text-gray-400 mb-2 uppercase text-sm font-bold tracking-widest">Phần thưởng giành được</div>
                                <div className="text-6xl font-black text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center gap-3">
                                    {score.toLocaleString()} <span className="text-3xl text-yellow-200">XP</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handlePlayAgain}
                                    className="flex-1 bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 rounded-xl border border-blue-500 transition-colors"
                                >
                                    Chơi lại
                                </button>
                                <button
                                    onClick={onLeaveGame}
                                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black uppercase py-4 rounded-xl shadow-lg shadow-yellow-500/30 transition-colors"
                                >
                                    Về Menu chính
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PinnacleGame;

