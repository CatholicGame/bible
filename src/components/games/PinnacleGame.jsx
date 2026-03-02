import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, CheckCircle2, XCircle, Play, Phone, Users, Shield, RefreshCcw, Flag, Star } from 'lucide-react';
import pinnacleBackground from '../../assets/pinnacle/altp_background.png';

const DUMMY_QUESTIONS = [
    { question: "Tên vị Giáo hoàng đầu tiên của Giáo hội Công giáo là gì?", options: ["Thánh Phêrô", "Thánh Phaolô", "Thánh Anrê", "Thánh Giacôbê"], answer: 0, explanation: "Chúa Giêsu đã trao chìa khóa Nước Trời cho **Thánh Phêrô**, đặt ngài làm nền tảng đầu tiên của Giáo hội." },
    { question: "Kinh Thánh Công giáo có bao nhiêu cuốn?", options: ["66", "73", "46", "27"], answer: 1, explanation: "Kinh Thánh Công giáo gồm **73 cuốn**, chia làm 46 cuốn Cựu Ước và 27 cuốn Tân Ước. Khác với Tin Lành chỉ công nhận 66 cuốn." },
    { question: "Truyền thống Kinh Mân Côi cổ điển (trước thời ĐGH Gioan Phaolô II) bao gồm bao nhiêu mầu nhiệm chính?", options: ["2", "3", "4", "5"], answer: 1, explanation: "Trước khi có Mầu nhiệm Sự Sáng, Kinh Mân Côi truyền thống chỉ gồm **3 mầu nhiệm** chính: Sự Vui, Sự Thương và Sự Mừng." },
    { question: "Trong Kinh Lạy Cha, câu tiếp theo của 'Xin tha nợ chúng con' là gì?", options: ["Như chúng con cũng tha", "Kẻ có nợ chúng con", "Xin chớ để chúng con", "Nhưng cứu chúng con cho khỏi"], answer: 0, explanation: "Câu đầy đủ là: 'Xin tha nợ chúng con, **như chúng con cũng tha** kẻ có nợ chúng con'." },
    { question: "Vị thánh nào được mệnh danh là 'Tiến sĩ Hội Thánh' và viết tác phẩm 'Tổng luận Thần học'?", options: ["Thánh Augustinô", "Thánh Tôma Aquinô", "Thánh Phanxicô Đen", "Thánh Bênađô"], answer: 1, explanation: "**Thánh Tôma Aquinô** là nhà thần học vĩ đại, tác giả của bộ 'Tổng luận Thần học' (Summa Theologica) đồ sộ và uyên bác." },
    { question: "Nơi Chúa Giêsu được sinh ra tên là gì?", options: ["Nazareth", "Jerusalem", "Bethlehem", "Galilee"], answer: 2, explanation: "Chúa Giêsu hạ sinh ra tại máng cỏ ở vùng **Bethlehem**, ứng nghiệm lời các ngôn sứ thời Cựu Ước." },
    { question: "Bí tích nào đánh dấu sự trưởng thành trong đời sống Kitô hữu?", options: ["Rửa Tội", "Thánh Thể", "Thêm Sức", "Hoà Giải"], answer: 2, explanation: "Bí tích **Thêm Sức** ban rẫy Chúa Thánh Thần, giúp người tín hữu trưởng thành và củng cố đức tin vững vàng hơn." },
    { question: "Ai là người đã làm phép thánh tẩy cho Chúa Giêsu?", options: ["Thánh Phêrô", "Gioan Tẩy Giả", "Thánh Giuse", "Thánh Giacôbê"], answer: 1, explanation: "**Thánh Gioan Tẩy Giả** là người đi trước dọn đường, cũng là người đã làm phép rửa cho Chúa Giêsu tại sông Giođan." },
    { question: "Núi nơi Chúa Giêsu chịu đóng đinh mọc lên có tên là gì?", options: ["Golgotha", "Tabor", "Sinai", "Moriah"], answer: 0, explanation: "Đồi Núi Sọ, hay còn gọi là đồi **Golgotha**, là nơi Chúa Giêsu chịu đóng đinh thánh giá." },
    { question: "Mùa Chay kéo dài bao nhiêu ngày?", options: ["30 ngày", "40 ngày", "50 ngày", "100 ngày"], answer: 1, explanation: "Mùa Chay kéo dài trong **40 ngày**, tưởng nhớ 40 đêm ngày Chúa Giêsu ăn chay cầu nguyện trong hoang địa." },
    { question: "Thiên Thần nào đã báo tin cho Đức Maria?", options: ["Michael", "Raphael", "Gabriel", "Uriel"], answer: 2, explanation: "Tổng Lãnh Thiên Thần **Gabriel** là sứ giả được Chúa sai đến báo tin vui cho Đức Maria." },
    { question: "Người môn đệ nào đã chối Chúa 3 lần trong cuộc thương khó?", options: ["Gioan", "Giuđa Iscariot", "Tôma", "Phêrô"], answer: 3, explanation: "Vì sợ hãi, **Thánh Phêrô** đã chối Chúa 3 lần trước khi gà gáy, đúng như lời Chúa Giêsu đã tiên báo." },
    { question: "Đức Mẹ hiện ra ở Fatima (Bồ Đào Nha) vào năm nào?", options: ["1858", "1917", "1933", "1981"], answer: 1, explanation: "Đức Mẹ đã hiện ra với 3 trẻ chăn chiên tại Fatima, Bồ Đào Nha vào năm **1917** cùng 3 mệnh lệnh thiêng liêng." },
    { question: "Lễ Chúa Giáng Sinh được Giáo hội Công giáo cử hành trọng thể vào ngày nào?", options: ["24/12", "25/12", "1/1", "6/1"], answer: 1, explanation: "Ngoại trừ đêm canh thức 24/12, Lễ Giáng Sinh chính thức và trọng thể nhất diễn ra vào ngày **25/12** hằng năm." },
    { question: "Vị ngôn sứ nào đã bị ném vào hang sư tử nhưng không bị ăn thịt?", options: ["Isaia", "Môse", "Đanien", "Giêrêmia"], answer: 2, explanation: "Dù bị ném vào hang sư tử vì giữ vững đức tin dâng lời cầu nguyện với Chúa, ngôn sứ **Đanien** vẫn được Thiên Thần bảo vệ bình an vô sự." }
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

    return (
        <div
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            className={`w-full transition-all duration-500 ${disabled && !isActive && !isCorrect && !isWrong ? 'cursor-default' : 'cursor-pointer'} ${isHidden ? 'opacity-30 grayscale pointer-events-none' : ''}`}
        >
            <button
                onClick={onClick}
                disabled={disabled || isHidden}
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

const LifelineButton = ({ icon: Icon, text, isUsed, onClick, active }) => (
    <button
        onClick={onClick}
        disabled={isUsed}
        className={`relative w-12 h-10 md:w-14 md:h-12 rounded-full border border-blue-400/50 flex items-center justify-center transition-all ${isUsed ? 'opacity-30 grayscale cursor-not-allowed border-red-500' : active ? 'bg-amber-600 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-[#0f172a]/80 hover:bg-slate-800 hover:border-blue-300 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
    >
        <span className="bg-gradient-to-b from-white/10 to-transparent absolute inset-0 rounded-full"></span>
        {Icon && <Icon size={18} className="relative z-10" />}
        {text && <span className="relative z-10 font-bold text-sm md:text-base leading-none text-blue-100">{text}</span>}
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
    const [encouragementMessage, setEncouragementMessage] = useState(null);
    const [answerStep, setAnswerStep] = useState('thinking'); // 'thinking' | 'explained'
    const [isSkipped, setIsSkipped] = useState(false);

    const [confirmFiftyFifty, setConfirmFiftyFifty] = useState(false);
    const [isScanningFiftyFifty, setIsScanningFiftyFifty] = useState(false);

    // Audience state
    const [confirmAudience, setConfirmAudience] = useState(false);
    const [audienceState, setAudienceState] = useState(null); // null | 'loading' | 'results'
    const [audienceVotes, setAudienceVotes] = useState([0, 0, 0, 0]);

    // Phone state
    const [confirmPhone, setConfirmPhone] = useState(false);
    const [phoneState, setPhoneState] = useState(null); // null | 'calling' | 'answering'
    const [phoneMessage, setPhoneMessage] = useState("");
    const [displayedPhoneMessage, setDisplayedPhoneMessage] = useState("");
    const [phoneTimeLeft, setPhoneTimeLeft] = useState(30);

    // Swap state
    const [confirmSwap, setConfirmSwap] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);

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

    const getEncouragement = (index) => {
        let text, colorClass;
        if (index < 5) {
            const pool = ["Trí nhớ rất tốt!", "Khởi đầu hoàn hảo!", "Chính xác!", "Làm tốt lắm!", "Tuyệt vời!"];
            text = pool[Math.floor(Math.random() * pool.length)];
            colorClass = "text-green-400";
        } else if (index < 10) {
            const pool = ["Xuất sắc!", "Tuyệt đỉnh!", "Đáng gờm đấy!", "Kiến thức vững vàng!", "Thật ấn tượng!"];
            text = pool[Math.floor(Math.random() * pool.length)];
            colorClass = "text-blue-400";
        } else {
            const pool = ["Không thể tin được!", "Trí tuệ siêu phàm!", "Đỉnh cao!", "Thật phi thường!", "Quá đẳng cấp!"];
            text = pool[Math.floor(Math.random() * pool.length)];
            colorClass = "text-yellow-400";
        }
        return { text, colorClass };
    };

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
        if (gameState !== 'playing' || isAnswerRevealed || confirmFiftyFifty || confirmAudience || confirmPhone || confirmSwap || audienceState || phoneState || isSwapping) return;

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
    }, [gameState, currentQuestionIndex, isAnswerRevealed, confirmFiftyFifty, confirmAudience, confirmPhone, audienceState, phoneState]);

    const handleTimeUp = () => {
        setIsAnswerRevealed(true);
        setTimeout(() => {
            setGameState('finished');
        }, 3000);
    };

    const handleOptionSelect = (index) => {
        if (isAnswerRevealed || hiddenOptions.includes(index) || isSwapping) return;

        setSelectedOption(index);
        setIsAnswerRevealed(true);

        const currentQuestion = DUMMY_QUESTIONS[currentQuestionIndex];
        const isCorrect = index === currentQuestion.answer;

        if (isCorrect) {
            const reward = REWARDS[currentQuestionIndex];
            setEncouragementMessage(getEncouragement(currentQuestionIndex));
            spawnXPParticles();

            // Delay score update to match first particle arrival (~1.36s)
            setTimeout(() => setScore(reward), 1360);

            // Chờ delay nhẹ 1.5s rồi hiện panel explains (auto next được gỡ bỏ)
            setTimeout(() => {
                setAnswerStep('explained');
                setEncouragementMessage(null); // Gỡ chữ Tuyệt vời khi hiện giải thích
            }, 1500);
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
                setAnswerStep('explained');
                // Người dùng phải ấn 'Kết thúc' ở panel giải thích để save change state finished.
            }, 1000); // Rút ngắn lại thành 1s để hiện explanation sớm thay vì 4s chìm
        }
    };

    const handleNextQuestion = () => {
        // Cho ẩn khung giải thích trước để UI reset layout về vị trí cũ một nhịp
        setAnswerStep('thinking');
        setEncouragementMessage(null);

        setTimeout(() => {
            if (currentQuestionIndex < DUMMY_QUESTIONS.length - 1 && selectedOption === DUMMY_QUESTIONS[currentQuestionIndex].answer) {
                setIsSwapping(true); // mượn lại hiệu ứng chuyển câu
                playMurmurSound(); // optional trang âm

                setTimeout(() => {
                    setCurrentQuestionIndex(prev => prev + 1);
                    resetTurnState();
                    setIsSwapping(false);
                }, 500);
            } else if (selectedOption !== DUMMY_QUESTIONS[currentQuestionIndex].answer && !isSkipped) {
                setGameState('finished');
            } else if (isSkipped) {
                // Trường hợp skip
                if (currentQuestionIndex < DUMMY_QUESTIONS.length - 1) {
                    setIsSwapping(true);
                    playMurmurSound();
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        resetTurnState();
                        setIsSwapping(false);
                    }, 500);
                } else {
                    setGameState('finished');
                }
            }
        }, 400); // Wait 400ms for the explanation panel to exit completely
    };

    const resetTurnState = () => {
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setHiddenOptions([]);
        setEncouragementMessage(null);
        setTimeLeft(30);
        setAnswerStep('thinking');
        setIsSkipped(false);
    };

    const handlePlayAgain = () => {
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        resetTurnState();

        setConfirmFiftyFifty(false);
        setIsScanningFiftyFifty(false);
        setConfirmAudience(false);
        setAudienceState(null);
        setAudienceVotes([0, 0, 0, 0]);
        setConfirmPhone(false);
        setPhoneState(null);
        setPhoneMessage("");
        setDisplayedPhoneMessage("");
        setConfirmSwap(false);
        setIsSwapping(false);
        setLifelines({ fiftyFifty: false, phone: false, audience: false, swap: false });
        setTimeLeft(30);
    };

    // Lifeline handlers
    const useFiftyFifty = () => {
        if (lifelines.fiftyFifty || isScanningFiftyFifty) return;
        setConfirmFiftyFifty(true);
    };

    const confirmAndUseFiftyFifty = () => {
        setConfirmFiftyFifty(false);
        setLifelines(prev => ({ ...prev, fiftyFifty: true }));
        setIsScanningFiftyFifty(true);

        const currentAns = DUMMY_QUESTIONS[currentQuestionIndex].answer;
        let incorrectOptions = [0, 1, 2, 3].filter(idx => idx !== currentAns);
        // shuffle and pick 2
        incorrectOptions.sort(() => 0.5 - Math.random());
        const toHide = [incorrectOptions[0], incorrectOptions[1]];

        // Play scan effect
        setTimeout(() => {
            setIsScanningFiftyFifty(false);
            setHiddenOptions(toHide);
        }, 1500);
    };

    const playMurmurSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, ctx.currentTime);
            filter.Q.setValueAtTime(1, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.4, ctx.currentTime + 2.0);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + 2.5);
        } catch (_) { /* ignore if audio not supported */ }
    }, []);

    const useAudience = () => {
        if (lifelines.audience || audienceState || confirmAudience) return;
        setConfirmAudience(true);
    };

    const confirmAndUseAudience = () => {
        setConfirmAudience(false);
        setAudienceState('loading');
        playMurmurSound();

        setTimeout(() => {
            const currentAns = DUMMY_QUESTIONS[currentQuestionIndex].answer;
            const difficulty = currentQuestionIndex;
            let pCorrect = 0;

            if (difficulty < 5) pCorrect = Math.floor(Math.random() * 21) + 70; // 70-90
            else if (difficulty < 10) pCorrect = Math.floor(Math.random() * 21) + 40; // 40-60
            else pCorrect = Math.floor(Math.random() * 21) + 30; // 30-50

            let availableIndices = [0, 1, 2, 3];
            if (hiddenOptions.length > 0) {
                availableIndices = availableIndices.filter(idx => !hiddenOptions.includes(idx));
            }

            let votes = [0, 0, 0, 0];
            if (availableIndices.includes(currentAns)) {
                votes[currentAns] = pCorrect;
            }

            let remainingP = 100 - pCorrect;
            let otherIndices = availableIndices.filter(idx => idx !== currentAns);

            if (otherIndices.length === 1) {
                votes[otherIndices[0]] = remainingP;
            } else if (otherIndices.length === 3) {
                let p1 = Math.floor(Math.random() * (remainingP + 1));
                let p2 = Math.floor(Math.random() * (remainingP - p1 + 1));
                let p3 = remainingP - p1 - p2;
                let parts = [p1, p2, p3];
                parts.sort(() => 0.5 - Math.random());
                votes[otherIndices[0]] = parts[0];
                votes[otherIndices[1]] = parts[1];
                votes[otherIndices[2]] = parts[2];
            } else if (otherIndices.length === 2) {
                let p1 = Math.floor(Math.random() * (remainingP + 1));
                let p2 = remainingP - p1;
                let parts = [p1, p2].sort(() => 0.5 - Math.random());
                votes[otherIndices[0]] = parts[0];
                votes[otherIndices[1]] = parts[1];
            }

            setAudienceVotes(votes);
            setAudienceState('results');
            setLifelines(prev => ({ ...prev, audience: true }));
        }, 2500);
    };

    const usePhone = () => {
        if (lifelines.phone || phoneState || confirmPhone) return;
        setConfirmPhone(true);
    };

    const confirmAndUsePhone = () => {
        setConfirmPhone(false);
        setPhoneState('calling');
        playMurmurSound(); // re-use sound for ringing effect

        setTimeout(() => {
            setPhoneState('answering');
            setPhoneTimeLeft(30);

            const currentAns = DUMMY_QUESTIONS[currentQuestionIndex].answer;
            const alphabet = ["A", "B", "C", "D"];
            let suggestedAns = currentAns;

            // Randomize wrong answer if question is hard (>10)
            if (currentQuestionIndex >= 10 && Math.random() > 0.6) {
                let options = [0, 1, 2, 3].filter(idx => idx !== currentAns && !hiddenOptions.includes(idx));
                if (options.length > 0) suggestedAns = options[Math.floor(Math.random() * options.length)];
            }

            const messages = [
                `Alo! Khó quá ha... nhưng theo trí nhớ của tôi thì đáp án là ${alphabet[suggestedAns]}. Bạn thử xem nhé!`,
                `Tôi vừa tra cứu nhanh, khả năng cao đáp án đúng là ${alphabet[suggestedAns]} đấy!`,
                `Chà, câu này quen lắm. Tôi tin chắc đáp án là ${alphabet[suggestedAns]}. Chốt đi!`,
                `Alo. Theo tôi thì bạn nên chọn ${alphabet[suggestedAns]}. Điểm cao đang chờ bạn!`,
            ];

            setPhoneMessage(messages[Math.floor(Math.random() * messages.length)]);
            setDisplayedPhoneMessage("");
            setLifelines(prev => ({ ...prev, phone: true }));
        }, 2000);
    };

    // Typewriter effect logic
    useEffect(() => {
        if (phoneState === 'answering' && phoneMessage) {
            let i = 0;
            setDisplayedPhoneMessage("");
            const intervalId = setInterval(() => {
                setDisplayedPhoneMessage(phoneMessage.substring(0, i + 1));
                i++;
                if (i >= phoneMessage.length) {
                    clearInterval(intervalId);
                }
            }, 50); // Mức độ gõ chữ

            return () => clearInterval(intervalId);
        }
    }, [phoneState, phoneMessage]);

    // Timer cho màn gọi điện thoại
    useEffect(() => {
        if (phoneState === 'answering') {
            const timer = setInterval(() => {
                setPhoneTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setPhoneState(null); // Tự đóng khi hết giờ
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phoneState]);

    const useSwap = () => {
        if (lifelines.swap || confirmSwap || isSwapping) return;
        setConfirmSwap(true);
    };

    const confirmAndUseSwap = () => {
        setConfirmSwap(false);
        setLifelines(prev => ({ ...prev, swap: true }));
        setIsSkipped(true);
        setIsAnswerRevealed(true); // Lật luôn đáp án hiện tại

        // Chờ 1s cho kịp lật đáp án xong show mục giải thích
        setTimeout(() => {
            setAnswerStep('explained');
        }, 1000);
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
                            className="w-full flex-1 flex flex-col h-full relative"
                        >
                            {/* 50:50 Confirmation Popup */}
                            <AnimatePresence>
                                {confirmFiftyFifty && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="bg-blue-950 border-2 border-amber-500 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(245,158,11,0.2)] text-center text-white relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>
                                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                                                <Users size={40} className="text-amber-400" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 text-amber-400 uppercase tracking-wide">Trợ giúp 50:50</h3>
                                            <p className="text-blue-200 mb-8 font-medium">Bạn có muốn loại bỏ 2 phương án sai không?</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmFiftyFifty(false)}
                                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-600"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={confirmAndUseFiftyFifty}
                                                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all uppercase"
                                                >
                                                    Dùng
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Top Bar: Lifelines */}
                            <div className="flex justify-between items-start mb-2 px-2 md:px-4 shrink-0 relative z-50">
                                <button onClick={onLeaveGame} className="text-slate-300 hover:text-white transition-all flex items-center gap-1 bg-slate-900/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-700/50 backdrop-blur-sm text-sm md:text-base">
                                    <ArrowLeft size={16} /> Thoát
                                </button>

                                <div className="flex gap-2 bg-slate-900/40 p-1 rounded-full backdrop-blur-sm border border-slate-700/30">
                                    <LifelineButton text="50:50" isUsed={lifelines.fiftyFifty} onClick={useFiftyFifty} />
                                    <LifelineButton icon={Phone} isUsed={lifelines.phone} onClick={usePhone} />
                                    <LifelineButton icon={Users} isUsed={lifelines.audience} onClick={useAudience} />
                                    <LifelineButton icon={RefreshCcw} isUsed={lifelines.swap} onClick={useSwap} />
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

                            {/* Phone Confirmation Popup */}
                            <AnimatePresence>
                                {confirmPhone && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="bg-blue-950 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(16,185,129,0.2)] text-center text-white relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>
                                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
                                                <Phone size={40} className="text-emerald-400" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 text-emerald-400 uppercase tracking-wide">Gọi điện thoại</h3>
                                            <p className="text-blue-200 mb-8 font-medium">Bạn muốn gọi điện nhờ người thân trợ giúp?</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmPhone(false)}
                                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-600"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={confirmAndUsePhone}
                                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase"
                                                >
                                                    Gọi ngay
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Phone Screen Modal */}
                            <AnimatePresence>
                                {phoneState && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_40px_rgba(16,185,129,0.3)] text-white relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>

                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="relative mb-6">
                                                    {phoneState === 'calling' && (
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                            className="absolute inset-0 bg-emerald-500/20 rounded-full"
                                                        />
                                                    )}
                                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 relative z-10 overflow-hidden">
                                                        <Users size={48} className="text-emerald-400" />
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-black text-emerald-400 mb-1">Người thân</h3>

                                                {phoneState === 'calling' ? (
                                                    <p className="text-emerald-200 animate-pulse mt-2">Đang đổ chuông...</p>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 mt-1 mb-6">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                            <span className="text-slate-300 font-mono text-lg">{phoneTimeLeft}s</span>
                                                        </div>

                                                        <div className="w-full bg-slate-800/80 p-5 rounded-2xl border border-slate-700 min-h-[120px] flex items-center justify-center relative">
                                                            {/* Audio wave animation */}
                                                            <div className="absolute top-2 right-3 flex items-end gap-1 h-4 opacity-50">
                                                                <motion.div animate={{ height: ['4px', '12px', '4px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-emerald-400 rounded-full" />
                                                                <motion.div animate={{ height: ['6px', '16px', '6px'] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-emerald-400 rounded-full" />
                                                                <motion.div animate={{ height: ['8px', '10px', '8px'] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1 bg-emerald-400 rounded-full" />
                                                            </div>
                                                            <p className="text-lg md:text-xl text-emerald-100 italic text-center leading-relaxed">
                                                                "{displayedPhoneMessage}"
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={() => setPhoneState(null)}
                                                            className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Phone size={20} className="rotate-[135deg]" /> Cúp máy
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Audience Confirmation Popup */}
                            <AnimatePresence>
                                {confirmAudience && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="bg-blue-950 border-2 border-indigo-500 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(99,102,241,0.2)] text-center text-white relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600"></div>
                                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/50">
                                                <Users size={40} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 text-indigo-400 uppercase tracking-wide">Hỏi ý kiến khán giả</h3>
                                            <p className="text-blue-200 mb-8 font-medium">Bạn muốn lấy ý kiến từ khán giả trong trường quay?</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmAudience(false)}
                                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-600"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={confirmAndUseAudience}
                                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all uppercase"
                                                >
                                                    Hỏi ngay
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Audience Poll Popup */}
                            <AnimatePresence>
                                {audienceState && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="bg-blue-950/90 border-2 border-indigo-500 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_40px_rgba(99,102,241,0.3)] text-white relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600"></div>

                                            {audienceState === 'loading' && (
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/50 relative">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                            className="absolute inset-0 border-t-2 border-indigo-400 rounded-full"
                                                        />
                                                        <Users size={36} className="text-indigo-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-indigo-400 uppercase tracking-wide mb-2 text-center">Hỏi ý kiến khán giả</h3>
                                                    <p className="text-indigo-200 text-center animate-pulse">Khán giả đang suy nghĩ và bình chọn...</p>
                                                </div>
                                            )}

                                            {audienceState === 'results' && (
                                                <div className="flex flex-col w-full py-2">
                                                    <h3 className="text-2xl font-black text-center text-indigo-400 uppercase tracking-wide mb-6">Kết quả bình chọn</h3>

                                                    <div className="flex items-end justify-center gap-4 md:gap-8 h-48 mb-8 border-b border-indigo-500/30 pb-2">
                                                        {['A', 'B', 'C', 'D'].map((lbl, idx) => {
                                                            const percent = audienceVotes[idx] || 0;
                                                            return (
                                                                <div key={idx} className="flex flex-col items-center justify-end h-full w-12 md:w-16">
                                                                    <span className="text-indigo-200 font-bold mb-2 text-lg">{percent}%</span>
                                                                    <div className="w-full bg-slate-800/50 rounded-t-md relative flex items-end justify-center h-full">
                                                                        <motion.div
                                                                            initial={{ height: 0 }}
                                                                            animate={{ height: `${percent}%` }}
                                                                            transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                                                                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                                                                        />
                                                                    </div>
                                                                    <span className="mt-3 font-black text-2xl text-amber-500 drop-shadow-md">{lbl}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <button
                                                        onClick={() => setAudienceState(null)}
                                                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all uppercase tracking-wider"
                                                    >
                                                        Cảm ơn khán giả
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Swap Confirmation Popup */}
                            <AnimatePresence>
                                {confirmSwap && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="bg-blue-950 border-2 border-sky-500 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(14,165,233,0.2)] text-center text-white relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-600 via-sky-400 to-sky-600"></div>
                                            <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-500/50">
                                                <RefreshCcw size={40} className="text-sky-400" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 text-sky-400 uppercase tracking-wide">Đổi câu hỏi</h3>
                                            <p className="text-blue-200 mb-8 font-medium">Bạn có chắc muốn bỏ qua câu hỏi này? Bạn sẽ không được quay lại câu hỏi này.</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmSwap(false)}
                                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-600"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={confirmAndUseSwap}
                                                    className="flex-1 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-black py-3 rounded-xl shadow-lg shadow-sky-500/20 transition-all uppercase"
                                                >
                                                    Đổi ngay
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Main Game Area */}
                            <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto overflow-hidden gap-2 lg:gap-8 pb-2 px-2 lg:px-4">

                                {/* Left Side: Timer & Question Board */}
                                <div className="flex-1 w-full order-2 lg:order-1 flex flex-col pt-2 pb-6 lg:pb-8 h-[75vh] lg:h-full justify-between items-center z-20 relative">

                                    {/* Encouragement Message Overlay */}
                                    <AnimatePresence>
                                        {encouragementMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: -20 }}
                                                exit={{ opacity: 0, scale: 1.1, y: -40 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                className="absolute left-0 right-0 top-[28%] md:top-[32%] flex items-center justify-center z-[100] pointer-events-none"
                                            >
                                                <div
                                                    className={`text-2xl md:text-3xl lg:text-4xl font-black uppercase text-center tracking-wider px-6 py-2 rounded-xl border-t border-b border-white/20 bg-black/40 backdrop-blur-sm ${encouragementMessage.colorClass}`}
                                                    style={{
                                                        textShadow: '0px 4px 10px rgba(0,0,0,0.8), 2px 2px 2px #000',
                                                        filter: `drop-shadow(0 0 10px currentColor)`
                                                    }}
                                                >
                                                    {encouragementMessage.text}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

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

                                        <AnimatePresence mode="wait">
                                            {!isSwapping && (
                                                <motion.div
                                                    key={currentQuestionIndex}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="w-full flex flex-col gap-3 md:gap-4"
                                                >
                                                    {/* Question Box */}
                                                    <HexagonBox className="min-h-[70px] md:min-h-[120px] flex items-center justify-center cursor-default">
                                                        <h3 className="text-base md:text-xl lg:text-3xl font-bold text-center leading-snug tracking-wide text-slate-100 drop-shadow-lg w-full px-2 md:px-6">
                                                            {DUMMY_QUESTIONS[currentQuestionIndex].question}
                                                        </h3>
                                                    </HexagonBox>

                                                    {/* Options */}
                                                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 md:gap-y-4 md:gap-x-6">
                                                        <AnimatePresence>
                                                            {isScanningFiftyFifty && (
                                                                <motion.div
                                                                    initial={{ top: '-10%', opacity: 0 }}
                                                                    animate={{ top: '110%', opacity: [0, 1, 1, 0] }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 1.5, ease: "linear" }}
                                                                    className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_5px_rgba(251,191,36,0.5)] z-50 pointer-events-none blur-[1px]"
                                                                />
                                                            )}
                                                        </AnimatePresence>

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
                                                                    disabled={isAnswerRevealed || isScanningFiftyFifty}
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
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Explanation Panel */}
                                        <AnimatePresence>
                                            {answerStep === 'explained' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                                                    className="w-full mt-2 lg:mt-4 z-50 mb-4"
                                                >
                                                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden">

                                                        {/* Dynamic Header */}
                                                        {isSkipped ? (
                                                            <div className="flex items-center gap-2 text-sky-400 mb-2 font-bold text-lg md:text-xl">
                                                                <RefreshCcw size={24} />
                                                                <span>Bạn đã bỏ qua câu hỏi này!</span>
                                                            </div>
                                                        ) : (
                                                            <div className={`flex items-center gap-2 mb-2 font-black text-lg md:text-xl ${selectedOption === DUMMY_QUESTIONS[currentQuestionIndex].answer ? 'text-green-500' : 'text-red-500'}`}>
                                                                {selectedOption === DUMMY_QUESTIONS[currentQuestionIndex].answer ? (
                                                                    <><CheckCircle2 size={24} /> <span>Chính xác!</span></>
                                                                ) : (
                                                                    <><XCircle size={24} /> <span>Chưa đúng! Đáp án là {["A", "B", "C", "D"][DUMMY_QUESTIONS[currentQuestionIndex].answer]}</span></>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Explanation Text */}
                                                        <div className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-3xl">
                                                            {/* Parse bold text **...** */}
                                                            {DUMMY_QUESTIONS[currentQuestionIndex].explanation.split(/(\*\*.*?\*\*)/).map((part, i) => {
                                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                                    return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                                                                }
                                                                return <span key={i}>{part}</span>;
                                                            })}
                                                        </div>

                                                        {/* Next Button */}
                                                        <button
                                                            onClick={handleNextQuestion}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                                        >
                                                            <span>{(!isSkipped && selectedOption !== DUMMY_QUESTIONS[currentQuestionIndex].answer) ? 'Kết thúc' : 'Tiếp tục'}</span>
                                                            <ArrowLeft size={18} className="rotate-180" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

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

