import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PinnacleLeaderboard from './PinnacleLeaderboard';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, ChevronLeft, CheckCircle2, XCircle, Play, Phone, Users, Shield, RefreshCcw, Flag, Star, UserCircle2, Settings, ThumbsUp, ThumbsDown } from 'lucide-react';
import { usePlayFabStore } from '../../store/playfabStore';
import { getRankByScore, getRankLevel } from '../../utils/ranks';
import { useSoundManager } from '../../utils/soundManager';
import SettingsModal from '../common/SettingsModal';
import AdBanner from '../ads/AdBanner';
import AdArticle from '../ads/AdArticle';
import pinnacleBackground from '../../assets/pinnacle/altp_bg_02.png';
import mcAvatar from '../../assets/pinnacle/MC.png';
import pointUpSfx from '../../assets/games/SFX/point_up.wav';
import fireworkSfx from '../../assets/games/SFX/sfx_firework_shot.wav';
import sfxLaunch from '../../assets/games/SFX/sfx_launch_game_altp.mp3';
import sfxClapShort from '../../assets/games/SFX/sfx_clap_short.mp3';
import sfxCorrect from '../../assets/games/SFX/sfx_correct_answer.mp3';
import sfxCheckpoint from '../../assets/games/SFX/sfx_checkpoint_altp.mp3';
import sfxIncorrect from '../../assets/games/SFX/sfx_incorrect_answer_altp.mp3';
import sfxClapEnd from '../../assets/games/SFX/sfx_clap_end.mp3';
import resultBanner from '../../assets/common/result_banner.png';
import iconCoin from '../../assets/common/coin.png';
import iconTrophy from '../../assets/common/trophy.png';

/* ─── Stage Spotlight overlay — 9 beams in 3 banks ─── */
// group: 'left' beams lean right toward center, 'right' leans left, 'center' near vertical
// swingDir: direction bias during milestone swing (+1 = sweep right, -1 = sweep left, 0 = cross)
const BEAMS = [
    // Left bank — clustered at 38%, beams fan out
    { left: '37%', baseAngle: 25,  orbitAmp: 3,  swingDir: -1, colorTop: 'rgba(251,191,36,0.92)',  colorMid: 'rgba(251,191,36,0.16)', period: 6.4, phase: 0    },
    { left: '38%', baseAngle: 15,  orbitAmp: 3,  swingDir: -1, colorTop: 'rgba(147,210,255,0.88)', colorMid: 'rgba(147,210,255,0.13)', period: 7.8, phase: 0.5  },
    { left: '39%', baseAngle:  5,  orbitAmp: 3,  swingDir: -1, colorTop: 'rgba(196,181,253,0.88)', colorMid: 'rgba(196,181,253,0.14)', period: 6.0, phase: 1.1  },
    // Center bank — clustered at 50%
    { left: '49%', baseAngle: -12, orbitAmp: 4,  swingDir:  1, colorTop: 'rgba(52,211,153,0.9)',   colorMid: 'rgba(52,211,153,0.13)',  period: 8.5, phase: 0.2  },
    { left: '50%', baseAngle:  0,  orbitAmp: 4,  swingDir: -1, colorTop: 'rgba(251,191,36,0.90)',  colorMid: 'rgba(251,191,36,0.14)', period: 7.2, phase: 0.8  },
    { left: '51%', baseAngle: 12,  orbitAmp: 4,  swingDir:  1, colorTop: 'rgba(147,210,255,0.88)', colorMid: 'rgba(147,210,255,0.13)', period: 9.0, phase: 1.4  },
    // Right bank — clustered at 62%, beams fan out
    { left: '61%', baseAngle:  -5, orbitAmp: 3,  swingDir:  1, colorTop: 'rgba(196,181,253,0.88)', colorMid: 'rgba(196,181,253,0.14)', period: 6.2, phase: 0.3  },
    { left: '62%', baseAngle: -15, orbitAmp: 3,  swingDir:  1, colorTop: 'rgba(52,211,153,0.9)',   colorMid: 'rgba(52,211,153,0.13)',  period: 7.5, phase: 0.9  },
    { left: '63%', baseAngle: -25, orbitAmp: 3,  swingDir:  1, colorTop: 'rgba(251,191,36,0.92)',  colorMid: 'rgba(251,191,36,0.16)', period: 8.2, phase: 1.6  },
];

const SWING_DURATION = 3.2; // seconds
const WRONG_DURATION = 2.5; // seconds

const SpotlightEffect = ({ flash, swing, wrong }) => {
    const [tick, setTick] = useState(0);
    const [swingT, setSwingT] = useState(null);
    const [wrongT, setWrongT] = useState(null);
    const [flickerOn, setFlickerOn] = useState(false);
    const startRef = useRef(performance.now());
    const flickerRef = useRef(null);
    const rafRef = useRef(null);

    // Unified RAF loop
    useEffect(() => {
        const loop = () => { setTick(performance.now()); rafRef.current = requestAnimationFrame(loop); };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Brief flicker on every correct answer
    useEffect(() => {
        if (!flash) return;
        const times = [0, 70, 140, 210, 310];
        times.forEach((t, i) => { setTimeout(() => setFlickerOn(i % 2 === 0), t); });
        setTimeout(() => setFlickerOn(false), 390);
    }, [flash]);

    // Full 3s swing on milestone pass
    useEffect(() => {
        if (!swing) return;
        setSwingT(performance.now());
        // Flicker cluster during swing
        const times = [0, 60, 130, 220, 330, 450, 580, 720];
        times.forEach((t, i) => { flickerRef.current = setTimeout(() => setFlickerOn(i % 2 === 0), t); });
        flickerRef.current = setTimeout(() => setFlickerOn(false), 820);
        // End swing
        flickerRef.current = setTimeout(() => setSwingT(null), SWING_DURATION * 1000);
    }, [swing]);

    // Wrong answer — dim converging monochrome shake
    useEffect(() => {
        if (!wrong) return;
        setWrongT(performance.now());
        setTimeout(() => setWrongT(null), WRONG_DURATION * 1000);
    }, [wrong]);

    const nowSec = (tick - startRef.current) / 1000;

    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-[2]">
            {BEAMS.map((b, i) => {
                const idleAngle = b.baseAngle + Math.sin((nowSec / b.period) * Math.PI * 2 + b.phase) * b.orbitAmp;

                let extraAngle = 0;
                let swingOpacityBoost = 1;
                if (swingT !== null) {
                    const elapsed = (tick - swingT) / 1000;
                    const progress = Math.min(elapsed / SWING_DURATION, 1);
                    const envelope = progress < 0.09 ? progress / 0.09
                        : progress > 0.84 ? (1 - progress) / 0.16
                        : 1;
                    const osc = Math.sin(elapsed * Math.PI * 2 * 1.3);
                    extraAngle = b.swingDir * osc * 32 * envelope;
                    swingOpacityBoost = 1 + 0.5 * envelope * Math.abs(osc);
                }

                const isWrong = wrongT !== null;

                // Wrong mode — beams converge and desaturate
                let wrongAngleMod = 0;
                let wrongOpacityMod = 1;
                let colorTopOverride = null;
                let colorMidOverride = null;
                if (isWrong) {
                    const wElapsed = (tick - wrongT) / 1000;
                    const wProg = Math.min(wElapsed / WRONG_DURATION, 1);
                    const wEnv = wProg < 0.1 ? wProg / 0.1 : wProg > 0.7 ? (1 - wProg) / 0.3 : 1;
                    const shake = Math.sin(wElapsed * Math.PI * 2 * 4.5) * 6 * wEnv;
                    wrongAngleMod = -b.baseAngle * 0.7 * wEnv + shake;
                    wrongOpacityMod = 0.35 + 0.25 * (1 - wEnv);
                    colorTopOverride = `rgba(180,200,220,${0.75 * wEnv})`;
                    colorMidOverride = `rgba(150,170,190,${0.10 * wEnv})`;
                }

                const angle = idleAngle + extraAngle + wrongAngleMod;
                const opacityBase = (0.55 + 0.28 * Math.sin((nowSec / (b.period * 0.6)) * Math.PI * 2 + b.phase * 1.3)) * swingOpacityBoost * wrongOpacityMod;
                const opacity = flickerOn ? Math.min(1, opacityBase * 1.8) : opacityBase;

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: -2,
                            left: b.left,
                            width: (swingT !== null && flickerOn) ? '13%' : '9%',
                            height: '80%',
                            background: `linear-gradient(180deg, ${colorTopOverride || b.colorTop} 0%, ${colorMidOverride || b.colorMid} 30%, transparent 100%)`,
                            clipPath: 'polygon(49.5% 0%, 50.5% 0%, 100% 100%, 0% 100%)',
                            transformOrigin: '50% 0%',
                            transform: `translateX(-50%) rotate(${angle}deg)`,
                            opacity: Math.min(1, opacity),
                            mixBlendMode: 'screen',
                            transition: wrongT !== null ? 'none' : 'width 0.06s',
                            willChange: 'transform, opacity',
                        }}
                    />
                );
            })}
        </div>
    );
};



// Coins earned per question level (cumulative, max 1000 coins at Q15).
const REWARDS = [5, 10, 20, 30, 50, 75, 100, 140, 190, 250, 350, 450, 600, 800, 1000];

// XP per question = question number (Q1=1, Q2=2, ... Q15=15, total 120 XP)
const XP_REWARDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const XP_CUMULATIVE = XP_REWARDS.map((_, i) => XP_REWARDS.slice(0, i + 1).reduce((a, b) => a + b, 0));

// Safe Milestone indices (0-indexed, so 4 is Question 5, 9 is Question 10)
const MILESTONES = [4, 9, 14];

// Messages based on state: 0=greeting, 1=correct, 2=wrong
const MC_MESSAGES = [
    { start: ["Câu hỏi đầu tiên đã xuất hiện. Chúc bạn khởi đầu thật tốt!", "Chúng ta bắt đầu hành trình tri thức với câu hỏi này. Chúc bạn may mắn!", "Xin Chúa chúc lành cho khởi đầu của bạn với câu hỏi đầu tiên."], correct: ["Chính xác! Rất dễ đúng không?", "Khởi đầu hoàn hảo!", "Tuyệt lắm!"], wrong: ["Ôi, một sự nhầm lẫn đáng tiếc!", "Không sao, làm lại nhé!", "Chưa đúng rồi!"] }, // Q1
    { start: ["Câu hỏi tiếp theo đã hiện ra. Hãy suy nghĩ thật kỹ nhé!", "Chúc bạn tiếp tục có một lựa chọn đúng.", "Xin Chúa soi sáng để bạn tìm ra đáp án đúng."], correct: ["Rất tự tin!", "Chính xác!", "Đúng rồi!"], wrong: ["Rất tiếc, sai rồi!", "Ôi không!", "Hơi vội vàng rồi!"] }, // Q2
    { start: ["Đây là câu hỏi thứ ba. Chúc bạn thêm một lần trả lời chính xác.", "Một câu hỏi mới dành cho bạn. Bình tĩnh và suy nghĩ nhé!", "Mong rằng kiến thức của bạn sẽ giúp bạn vượt qua câu hỏi này."], correct: ["Bạn trả lời rất tốt!", "Phong độ đang lên!", "Tốt lắm!"], wrong: ["Lại sai rồi!", "Tiếc quá!", "Chút nữa thì đúng!"] }, // Q3
    { start: ["Câu hỏi mới đã xuất hiện. Chúc bạn chọn đúng đáp án!", "Hãy suy nghĩ thật kỹ trước khi đưa ra lựa chọn.", "Xin Chúa soi sáng để bạn tìm thấy câu trả lời đúng."], correct: ["Hay quá!", "Tuyệt vời, sắp tới mốc an toàn!", "Đỉnh!"], wrong: ["Thật sự đáng tiếc!", "Rất tiếc!", "Thật không may!"] }, // Q4
    { start: ["Đây là câu hỏi thứ năm. Chúc bạn tiếp tục hành trình thật tốt.", "Một thử thách mới đang chờ bạn. Chúc bạn may mắn!", "Mong rằng bạn sẽ có thêm một đáp án chính xác."], correct: ["Tuyệt! Đã qua mốc đầu tiên!", "Cột mốc 5 an toàn nhé!", "Chúc mừng qua trạm 1!"], wrong: ["Mất cơ hội chốt mốc rồi!", "Tiếc quá đi!", "Sai ở mốc quan trọng!"] }, // Q5
    { start: ["Chúng ta bước sang câu hỏi tiếp theo. Hãy suy nghĩ thật cẩn thận.", "Câu hỏi mới đã xuất hiện. Chúc bạn lựa chọn đúng!", "Xin Chúa chúc lành cho quyết định của bạn."], correct: ["Rất kiên cường!", "Đúng rồi!", "Kiến thức vững đấy!"], wrong: ["Câu này cũng khá khó!", "Rất dễ nhầm lẫn!", "Đáp án chưa chính xác!"] }, // Q6
    { start: ["Đây là một câu hỏi không dễ. Chúc bạn bình tĩnh suy nghĩ.", "Câu hỏi tiếp theo đã xuất hiện. Hy vọng bạn sẽ tìm ra đáp án đúng.", "Xin Chúa soi sáng để bạn có lựa chọn chính xác."], correct: ["Tiếp tục duy trì nhé!", "Không tồi chút nào!", "Hay quá!"], wrong: ["Lựa chọn sai lầm!", "Rất tiếc!", "Không đúng rồi!"] }, // Q7
    { start: ["Chúng ta tiếp tục với một câu hỏi mới. Chúc bạn may mắn!", "Câu hỏi thứ tám đã hiện ra. Hãy suy nghĩ thật kỹ.", "Mong rằng bạn sẽ tiếp tục trả lời đúng câu hỏi này."], correct: ["Một nửa chặng đường vinh quang!", "Hay lắm, cố lên!", "Bạn thực sự am hiểu!"], wrong: ["Dừng chân ở đây sao?", "Thật đáng tiếc!", "Sai rồi!"] }, // Q8
    { start: ["Một câu hỏi mới đang chờ bạn. Chúc bạn thêm một lựa chọn chính xác.", "Hãy suy nghĩ thật cẩn thận trước khi chọn đáp án.", "Xin Chúa soi sáng để bạn tìm ra câu trả lời đúng."], correct: ["Chỉ một chút nữa thôi!", "Cố gắng lên!", "Đúng rồi, xuất sắc!"], wrong: ["Ôi tiếc quá, gần tới mốc 2 rồi!", "Sẩy chân đáng tiếc!", "Sai rồi!"] }, // Q9
    { start: ["Câu hỏi thứ mười đã xuất hiện. Chúc bạn tiếp tục thành công.", "Đây là một thử thách quan trọng. Hãy suy nghĩ thật kỹ.", "Mong rằng kiến thức của bạn sẽ dẫn bạn đến đáp án đúng."], correct: ["Xuất sắc! Mốc 10 an toàn!", "Bạn đã vượt qua trạm thứ hai!", "Đỉnh cao phong độ!"], wrong: ["Thật sự buồn cho bạn!", "Tiếc quá, mốc 10 vuột mất!", "Sai mất rồi!"] }, // Q10
    { start: ["Câu hỏi tiếp theo đã xuất hiện. Chúc bạn thật bình tĩnh.", "Một thử thách mới dành cho bạn. Chúc bạn may mắn!", "Xin Chúa soi sáng để bạn đưa ra lựa chọn đúng."], correct: ["Đẳng cấp là đây!", "Bạn là một đối thủ đáng gờm!", "Kiến thức quá khủng!"], wrong: ["Câu này khó thật sự!", "Dù sao cũng qua mốc 10 rồi!", "Tiếc quá!"] }, // Q11
    { start: ["Đây là một câu hỏi khó. Chúc bạn suy nghĩ thật sáng suốt.", "Câu hỏi mới đã xuất hiện. Hy vọng bạn sẽ tìm ra đáp án đúng.", "Mong rằng bạn sẽ vượt qua thử thách này."], correct: ["Quá siêu phàm!", "Không có gì làm khó được bạn!", "Kiến thức thật đáng nể!"], wrong: ["Dừng lại ở đây sao?", "Khó quá phải không!", "Rất tiếc!"] }, // Q12
    { start: ["Chúng ta đang tiến gần đến cuối hành trình. Chúc bạn may mắn!", "Câu hỏi tiếp theo đã hiện ra. Hãy suy nghĩ thật kỹ.", "Xin Chúa soi sáng để bạn tìm được câu trả lời đúng."], correct: ["Đừng run nhé!", "Tuyệt đỉnh trí tuệ!", "Thật không thể tin nổi!"], wrong: ["Sai ở những bước cuối cùng!", "Tiếc quá đi mất!", "Sai rồi!"] }, // Q13
    { start: ["Đây là một trong những câu hỏi cuối cùng. Chúc bạn lựa chọn chính xác.", "Câu hỏi mới đã xuất hiện. Mong rằng bạn sẽ trả lời đúng.", "Xin Chúa chúc lành cho quyết định của bạn."], correct: ["Cơ hội lịch sử đây rồi!", "Chạm một tay vào đỉnh cao!", "Cố lên, 1 câu nữa thôi!"], wrong: ["Trời ơi, đau quá!", "Không sao, bạn đã rất tuyệt!", "Tiếc quá!"] }, // Q14
    { start: ["Và đây là câu hỏi cuối cùng. Chúc bạn thành công!", "Câu hỏi cuối cùng đã xuất hiện. Hy vọng bạn sẽ chọn đúng đáp án.", "Xin Chúa soi sáng để bạn hoàn thành hành trình này."], correct: ["ĐỈNH CAO TRÍ TUỆ!", "Hoàn hảo 15/15!", "Huyền thoại là đây!", "Bạn đã lập kỷ lục mới!"], wrong: ["Ôi không! Câu cuối rồi mà!", "Thật sự quá tiếc!", "Gục ngã khoảnh khắc cuối!"] } // Q15
];

const MC_MESSAGES_AFTER_FINISH = [
    // Level 1 -> index 0
    [
        "Rất tiếc, đáp án đúng không phải lựa chọn của bạn lần này. Nhưng hành trình học hỏi vẫn còn phía trước.",
        "Không sao cả, đôi khi câu hỏi đầu tiên cũng khiến chúng ta bất ngờ. Hẹn gặp lại ở lần chơi tiếp theo!",
        "Đáp án đúng là một lựa chọn khác. Hy vọng lần sau bạn sẽ khởi đầu tốt hơn."
    ],
    // Level 2 -> index 1
    [
        "Rất tiếc, bạn đã chọn chưa đúng. Nhưng đây cũng là cơ hội để chúng ta học thêm một kiến thức mới.",
        "Đáp án đúng đã thuộc về một lựa chọn khác. Cảm ơn bạn đã tham gia!",
        "Không sao cả, mỗi câu hỏi đều là một bài học thú vị."
    ],
    // Level 3 -> index 2
    [
        "Rất tiếc, bạn đã dừng lại ở câu hỏi này.",
        "Đáp án đúng không phải lựa chọn của bạn. Nhưng bạn đã làm khá tốt!",
        "Không sao cả, hy vọng bạn sẽ quay lại thử sức lần nữa."
    ],
    // Level 4 -> index 3
    [
        "Đáng tiếc, câu trả lời này chưa chính xác.",
        "Đáp án đúng đã thuộc về phương án khác. Nhưng bạn đã tiến khá xa.",
        "Cảm ơn bạn đã tham gia. Hẹn gặp lại trong lần thử thách tiếp theo!"
    ],
    // Level 5 -> index 4
    [
        "Rất tiếc, bạn đã dừng bước ở câu hỏi này.",
        "Một chút thiếu may mắn trong lựa chọn của bạn lần này.",
        "Nhưng bạn đã đi được một chặng đường khá tốt!"
    ],
    // Level 6 -> index 5
    [
        "Đáp án đúng là một lựa chọn khác. Rất tiếc cho bạn.",
        "Bạn đã làm tốt cho đến câu hỏi này.",
        "Hãy xem đây là một cơ hội để học thêm kiến thức mới."
    ],
    // Level 7 -> index 6
    [
        "Thật đáng tiếc, câu trả lời này chưa chính xác.",
        "Bạn đã tiến khá sâu vào trò chơi. Rất tốt!",
        "Hy vọng lần sau bạn sẽ đi xa hơn nữa."
    ],
    // Level 8 -> index 7
    [
        "Rất tiếc, câu hỏi này đã dừng bước bạn.",
        "Đáp án đúng đã thuộc về phương án khác.",
        "Nhưng bạn đã làm rất tốt cho đến đây."
    ],
    // Level 9 -> index 8
    [
        "Một lựa chọn đáng tiếc ở câu hỏi này.",
        "Đáp án đúng là phương án khác. Nhưng bạn đã tiến rất xa.",
        "Chúc bạn may mắn hơn ở lần chơi tiếp theo!"
    ],
    // Level 10 -> index 9
    [
        "Rất tiếc, câu trả lời này chưa chính xác.",
        "Bạn đã đi được một chặng đường rất tốt trước khi dừng lại.",
        "Cảm ơn bạn đã tham gia thử thách hôm nay."
    ],
    // Level 11 -> index 10
    [
        "Đây là một câu hỏi khó và rất tiếc bạn đã chọn chưa đúng.",
        "Bạn đã tiến rất xa trong trò chơi.",
        "Hy vọng lần sau bạn sẽ chinh phục được câu hỏi này."
    ],
    // Level 12 -> index 11
    [
        "Một lựa chọn đáng tiếc ở câu hỏi khó này.",
        "Bạn đã gần chạm đến những câu hỏi cuối cùng.",
        "Cảm ơn bạn đã tham gia hành trình hôm nay."
    ],
    // Level 13 -> index 12
    [
        "Thật đáng tiếc khi dừng lại ở câu hỏi này.",
        "Bạn đã đi rất xa trong trò chơi.",
        "Chỉ còn vài bước nữa thôi, hy vọng lần sau bạn sẽ đạt được!"
    ],
    // Level 14 -> index 13
    [
        "Rất tiếc, câu hỏi áp chót đã làm khó bạn.",
        "Bạn đã tiến rất gần đến câu hỏi cuối cùng.",
        "Một hành trình rất ấn tượng!"
    ],
    // Level 15 -> index 14
    [
        "Thật đáng tiếc, câu trả lời cuối cùng chưa chính xác.",
        "Bạn đã đi trọn hành trình đến câu hỏi cuối cùng. Thật tuyệt vời!",
        "Cảm ơn bạn đã tham gia thử thách hôm nay."
    ]
];

const CartoonBox = ({ children, className = "", onClick, disabled, isActive, isCorrect, isWrong, isHidden }) => {
    // Outer = lighter "rim" gradient (the visible border/outline)
    // Inner = darker content fill (the depth inside)
    let outerBg = 'linear-gradient(180deg, #5b8cf8 0%, #2252c4 100%)';
    let innerBg = 'linear-gradient(180deg, #1a3076 0%, #0d1a52 100%)';
    let shadow  = '#091030';

    if (isActive) {
        outerBg = 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)';
        innerBg = 'linear-gradient(180deg, #92400e 0%, #6b3200 100%)';
        shadow  = '#4a1a00';
    }
    if (isCorrect) {
        outerBg = 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)';
        innerBg = 'linear-gradient(180deg, #14532d 0%, #0a2e18 100%)';
        shadow  = '#052010';
    }
    if (isWrong) {
        outerBg = 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)';
        innerBg = 'linear-gradient(180deg, #7f1d1d 0%, #5b0e0e 100%)';
        shadow  = '#3a0505';
    }

    // Sharp hexagon pointed on left + right
    const clip = 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)';
    const isInteractive = !disabled && !isHidden;

    return (
        <div
            className={`w-full transition-all duration-500 ${isHidden ? 'opacity-20 pointer-events-none' : ''}`}
            style={{ filter: `drop-shadow(0 5px 0 ${shadow})` }}
        >
            {/* Outer rim — lighter gradient = the "border" */}
            <div
                className={`w-full transition-all duration-300 ${isInteractive ? 'cursor-pointer hover:brightness-110 active:translate-y-[2px]' : 'cursor-default'} ${className}`}
                style={{ clipPath: clip, WebkitClipPath: clip, background: outerBg, padding: '3px 5px' }}
                onClick={isInteractive ? onClick : undefined}
            >
                {/* Inner content — darker fill = the "depth" */}
                <div
                    className="w-full relative"
                    style={{ clipPath: clip, WebkitClipPath: clip, background: innerBg, padding: '9px 28px 9px 20px' }}
                >
                    {/* Top shine overlay */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 pointer-events-none" />
                    <div className="relative z-10 w-full flex items-center">{children}</div>
                </div>
            </div>
        </div>
    );
};

const LifelineButton = ({ icon: Icon, text, isUsed, disabled, onClick, active }) => (
    <button
        onClick={onClick}
        disabled={isUsed || disabled}
        className={`relative flex items-center justify-center rounded-full transition-all
            ${
                isUsed
                    ? 'opacity-30 grayscale cursor-not-allowed'
                    : disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:brightness-110 active:translate-y-[2px] active:shadow-none cursor-pointer'
            }`}
        style={{
            width: 48, height: 44,
            background: isUsed
                ? 'linear-gradient(160deg,#374151,#1f2937)'
                : active
                ? 'linear-gradient(160deg,#f59e0b,#d97706)'
                : 'linear-gradient(160deg,#2563eb,#1e40af)',
            border: `3px solid ${isUsed ? '#4b5563' : active ? '#fde68a' : '#93c5fd'}`,
            boxShadow: isUsed ? '0 3px 0 #111827' : active ? '0 4px 0 #92400e' : '0 4px 0 #1e3a8a',
        }}
    >
        {/* Shine */}
        <span className="absolute top-0 left-0 w-full h-1/2 rounded-t-full bg-white/20 pointer-events-none" />
        {Icon && <Icon size={17} className="relative z-10 text-white drop-shadow" />}
        {text && <span className="relative z-10 font-black text-xs md:text-sm leading-none text-white">{text}</span>}
        {isUsed && <span className="absolute text-white/80 font-black text-xl select-none z-20">×</span>}
    </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Lobby Screen — shown first when player opens PinnacleGame
// ─────────────────────────────────────────────────────────────────────────────
// Lobby Screen
const LobbyScreen = ({ onPlay, onShowLeaderboard, onLeaveGame, onSettings, onPlayClick, nickname, giaoxu, tinhthanh, saveProfile, playerCount }) => {
    const { globalScore, coins } = usePlayFabStore();
    const answeredQuestions = usePlayFabStore(s => s.answeredQuestions);
    const myVote = usePlayFabStore(s => s.pinnacleMyVote);
    const submitVote = usePlayFabStore(s => s.submitPinnacleVote);
    const voteCounts = usePlayFabStore(s => s.pinnacleVoteCounts);
    const rankName = getRankByScore(globalScore || 0);
    const rankLevel = getRankLevel(globalScore || 0);

    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="m-auto max-w-sm w-full flex flex-col gap-3 my-auto"
        >
            {/* Game title card */}
            <div className="bg-[#1e3a8a]/80 backdrop-blur-sm rounded-2xl border-2 border-blue-400/40 p-5 text-center shadow-xl relative">
                {/* Settings gear — top right */}
                <button onClick={() => { onPlayClick?.(); onSettings?.(); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}
                    aria-label="Cài đặt">
                    <Settings size={14} color="#93c5fd" strokeWidth={2.5} />
                </button>
                <div className="text-4xl mb-1">🎓</div>
                <h1 className="text-2xl font-black text-yellow-300 uppercase tracking-widest mb-0.5"
                    style={{ textShadow: '0 3px 0 #78350f' }}>
                    Nhà Thần Học
                </h1>
                <p className="text-blue-200 text-xs font-semibold">Thử thách 15 câu hỏi về Kinh Thánh</p>

                {/* Player count + Like/Dislike */}
                <div className="flex items-center justify-center gap-3 mt-2">
                    {playerCount > 0 && (
                        <span className="text-[11px] font-bold text-blue-200/70 flex items-center gap-1">
                            <Users size={11} className="text-blue-300" />
                            {playerCount.toLocaleString()} người đã chơi
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => submitVote('like')}
                            title="Thích"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm transition-all active:scale-90 ${
                                myVote === 'like'
                                    ? 'bg-green-500 text-white border-2 border-green-300 shadow-[0_2px_0_#14532d] cursor-default'
                                    : 'bg-green-500/15 text-green-300 border border-green-400/40 hover:bg-green-500/30 cursor-pointer'
                            }`}>
                            <ThumbsUp size={13} fill={myVote === 'like' ? 'currentColor' : 'none'} />
                            <span>{voteCounts?.like ?? 0}</span>
                        </button>
                        <button
                            onClick={() => submitVote('dislike')}
                            title="Không thích"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm transition-all active:scale-90 ${
                                myVote === 'dislike'
                                    ? 'bg-red-500 text-white border-2 border-red-300 shadow-[0_2px_0_#7f1d1d] cursor-default'
                                    : 'bg-red-500/15 text-red-300 border border-red-400/40 hover:bg-red-500/30 cursor-pointer'
                            }`}>
                            <ThumbsDown size={13} fill={myVote === 'dislike' ? 'currentColor' : 'none'} />
                            <span>{voteCounts?.dislike ?? 0}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => { onPlayClick?.(); onPlay(); }}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-[#1e3a8a] font-black uppercase tracking-wider text-base py-4 rounded-2xl border-4 border-[#1e3a8a] shadow-[0_5px_0_rgba(30,58,138,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-xl" />
                    <Play fill="currentColor" size={18} className="relative z-10" />
                    <span className="relative z-10">Chơi ngay</span>
                </button>
                <button
                    onClick={() => { onPlayClick?.(); onShowLeaderboard(); }}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-base py-4 rounded-2xl border-4 border-purple-900 shadow-[0_5px_0_rgba(88,28,135,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/15 pointer-events-none rounded-t-xl" />
                    <Trophy size={18} className="relative z-10" />
                    <span className="relative z-10">Xếp hạng</span>
                </button>
            </div>

            {/* Player info card */}
            <div className="bg-[#1e40af]/70 backdrop-blur-sm rounded-2xl border-2 border-blue-400/30 p-3.5 shadow-lg flex items-center gap-3">
                <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center font-black text-white text-base border-2 border-blue-300">
                        {nickname?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-[#1e3a8a] flex items-center justify-center text-[9px] font-black text-white">
                        {rankLevel}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-white font-black text-sm leading-tight truncate">{nickname || 'Người chơi'}</p>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 shrink-0">{rankName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-blue-200 font-semibold">🏆 {(globalScore || 0).toLocaleString()} XP</span>
                        <span className="text-blue-400/60 text-[10px]">·</span>
                        <span className="text-[11px] text-blue-200 font-semibold">📚 {answeredQuestions?.length || 0} câu đã học</span>
                        {giaoxu && <><span className="text-blue-400/60 text-[10px]">·</span><span className="text-[11px] text-blue-200 font-semibold truncate">⛪ {giaoxu}</span></>}
                    </div>
                </div>
            </div>

            {/* Back to menu */}
            <button onClick={onLeaveGame}
                className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full text-white/80 hover:text-white font-bold text-xs transition-all active:translate-y-0.5"
                style={{
                    background: 'rgba(30,58,138,0.6)',
                    border: '2px solid rgba(96,165,250,0.3)',
                    boxShadow: '0 2px 0 rgba(15,23,42,0.5)',
                }}>
                <ChevronLeft size={16} strokeWidth={3} />
                Về trang chính
            </button>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const PinnacleGame = ({ onLeaveGame }) => {
    // PlayFab store — câu hỏi động từ 1500 câu
    const {
        currentQuestions, loadNewGame, markAnswered, saveAnsweredQuestions,
        savePinnacleCompositeScore,
        pinnacleLeaderboard, pinnaclePlayerRank, pinnacleLeaderboardLoading,
        pinnacleActiveTab, loadPinnacleLeaderboard,
        hallOfFame, hallOfFameLoading, loadHallOfFame,
        nickname, giaoxu, tinhthanh, saveProfile,
        trackPinnaclePlay, submitPinnacleVote, loadPinnacleVoteCounts,
        pinnaclePlayerCount, pinnacleMyVote, pinnacleVoteCounts,
    } = usePlayFabStore();
    const [gameState, setGameState] = useState('lobby');
    const [showSettings, setShowSettings] = useState(false); // settings modal
    const [leaderboardSource, setLeaderboardSource] = useState('lobby');
    const [introPhase, setIntroPhase] = useState(4); // 0=start, 1=ladder, 2=lifelines, 3=MC, 4=question/timer
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);

    // ── Ad overlays ──
    // showCheckpointAd: hiện Display Ad sau khi vượt checkpoint Q5/Q10
    const [showCheckpointAd, setShowCheckpointAd] = useState(false);
    const [checkpointAdCountdown, setCheckpointAdCountdown] = useState(6);
    // showGameOverAd: hiện Display Ad trước khi chuyển sang màn kết quả
    const [showGameOverAd, setShowGameOverAd] = useState(false);
    const [gameOverAdCountdown, setGameOverAdCountdown] = useState(6);
    // Pending end-game params khi đang hiện GameOver Ad
    const pendingEndRef = useRef(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [hiddenOptions, setHiddenOptions] = useState([]);
    const [encouragementMessage, setEncouragementMessage] = useState(null);
    const [answerStep, setAnswerStep] = useState('thinking'); // 'thinking' | 'explained'
    const [explanationTimeLeft, setExplanationTimeLeft] = useState(15);
    const [isSkipped, setIsSkipped] = useState(false);
    const [isVoluntaryStop, setIsVoluntaryStop] = useState(false); // true khi người chơi chủ động dừng
    const [earnedXP, setEarnedXP] = useState(0); // XP tích lũy khi dừng sớm

    const [confirmFiftyFifty, setConfirmFiftyFifty] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
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

    // Refs for XP animation start and end points
    const currentRowRef = useRef(null);
    const xpBadgeRef = useRef(null);
    const ladderScrollRef = useRef(null);

    // Lifelines state
    const [lifelines, setLifelines] = useState({
        fiftyFifty: false,
        phone: false,
        audience: false,
        swap: false
    });

    // Load vote counts when game opens
    useEffect(() => { loadPinnacleVoteCounts(); }, []); // eslint-disable-line

    // XP Particle animation
    const [xpParticles, setXpParticles] = useState([]);
    const [displayScore, setDisplayScore] = useState(0);  // animated coin display
    const [xpScore, setXpScore] = useState(0);             // current XP earned
    const [displayXpScore, setDisplayXpScore] = useState(0); // animated XP display
    const [spotlightFlash, setSpotlightFlash] = useState(0); // increments on correct answer → brief flicker
    const [spotlightSwing, setSpotlightSwing] = useState(0); // increments on milestone → 3s dramatic swing
    const [spotlightWrong, setSpotlightWrong] = useState(0); // increments on wrong answer → dim converge shake
    const [gameConfettiKey, setGameConfettiKey] = useState(0);
    const [showGameConfetti, setShowGameConfetti] = useState(false);

    // Auto-scroll the focused reward row on smaller screens
    useEffect(() => {
        if (gameState === 'playing' && introPhase >= 1 && currentRowRef.current) {
            const delay = introPhase === 1 ? 1500 : 600;
            const timer = setTimeout(() => {
                const row = currentRowRef.current;
                const container = ladderScrollRef.current;
                if (!row || !container) return;

                // Save outer scroll positions so scrollIntoView doesn't move them
                const mainScroller = container.closest('[class*="overflow-y-auto"]')?.parentElement;
                const savedScrolls = [];
                let el = container.parentElement;
                while (el) {
                    savedScrolls.push({ el, top: el.scrollTop, left: el.scrollLeft });
                    el = el.parentElement;
                }

                // Let the browser figure out the exact scroll position
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Restore outer scroll positions (prevent page jump)
                requestAnimationFrame(() => {
                    savedScrolls.forEach(({ el, top, left }) => {
                        if (el !== container) {
                            el.scrollTop = top;
                            el.scrollLeft = left;
                        }
                    });
                });
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, introPhase, gameState]);

    // MC Speech Bubble state
    const [mcMessage, setMcMessage] = useState("");
    const [showMcBubble, setShowMcBubble] = useState(false);
    const [endMessage, setEndMessage] = useState(null);
    const [showEndMessage, setShowEndMessage] = useState(true);

    // Prompt MC on level changes
    useEffect(() => {
        if (gameState === 'playing' && introPhase === 4 && !isAnswerRevealed && !isSwapping) {
            const pool = MC_MESSAGES[currentQuestionIndex].start;
            const msg = pool[Math.floor(Math.random() * pool.length)];
            // For Q1: wait for question + options to fully animate in before MC speaks
            const mcDelay = currentQuestionIndex === 0 ? 1500 : 0;
            const showTimer = setTimeout(() => {
                setMcMessage(msg);
                setShowMcBubble(true);
            }, mcDelay);
            const hideTimer = setTimeout(() => setShowMcBubble(false), mcDelay + 4000);
            return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
        }
    }, [currentQuestionIndex, gameState, introPhase, isAnswerRevealed, isSwapping]);

    // ── Sound Manager — wraps all game audio, respects settingsStore ──
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const sfxMap = useMemo(() => ({
        launch:     sfxLaunch,
        clapShort:  sfxClapShort,
        correct:    sfxCorrect,
        checkpoint: sfxCheckpoint,
        incorrect:  sfxIncorrect,
        clapEnd:    sfxClapEnd,
        pointUp:    pointUpSfx,
        firework:   fireworkSfx,
        click:      pointUpSfx,   // reuse point_up as subtle button-click SFX
    }), []);
    const { playSfx, playClick } = useSoundManager(null, sfxMap);

    // Generic fire-and-forget audio helper (respects sound setting via playSfx)
    const playAudio = useCallback((sfxKey, _vol, onDuration) => {
        playSfx(sfxKey);
        if (onDuration) {
            // Duration callback fallback — use a fixed map so checkpoint swing still works
            const durMap = { launch: 3200, checkpoint: 3200, clapEnd: 3000 };
            const ms = durMap[sfxKey] ?? 1000;
            setTimeout(() => onDuration(ms), 0);
        }
    }, [playSfx]);

    // playActiveSound used on game start (formerly pointUpSfx)
    const playActiveSound = useCallback(() => playSfx('pointUp'), [playSfx]);


    useEffect(() => {
        if (gameState === 'playing' && introPhase > 0 && introPhase < 4) {
            let phaseTimer;
            if (introPhase === 1) {
                // Play launch SFX + spotlight swing for its duration
                playAudio('launch', 0.75, (durationMs) => {
                    setSpotlightSwing(prev => prev + 1);
                });
                // Lifelines: start cascading after background
                phaseTimer = setTimeout(() => {
                    setIntroPhase(2);
                }, 500);
            } else if (introPhase === 2) {
                // MC
                phaseTimer = setTimeout(() => {
                    setIntroPhase(3);
                }, 350);
            } else if (introPhase === 3) {
                // Question + Options
                phaseTimer = setTimeout(() => {
                    setIntroPhase(4);
                }, 250);
            }
            return () => clearTimeout(phaseTimer);
        }
    }, [gameState, introPhase, playActiveSound]);

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

    // Count up displayXpScore toward xpScore
    useEffect(() => {
        if (xpScore <= displayXpScore) return;
        const diff = xpScore - displayXpScore;
        const steps = Math.min(diff, 20);
        const stepValue = Math.ceil(diff / steps);
        const interval = 400 / steps;
        let current = displayXpScore;
        const id = setInterval(() => {
            current = Math.min(current + stepValue, xpScore);
            setDisplayXpScore(current);
            if (current >= xpScore) clearInterval(id);
        }, interval);
        return () => clearInterval(id);
    }, [xpScore]);

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

    const spawnXPParticles = useCallback((questionIdx) => {
        const badge = xpBadgeRef.current?.getBoundingClientRect();
        const rowEl = document.querySelector(`[data-ladder-row="${questionIdx}"]`);
        const row = rowEl?.getBoundingClientRect();

        const targetX = badge ? badge.left + badge.width / 2 : window.innerWidth - 90;
        const targetY = badge ? badge.top + badge.height / 2 : 28;
        const originX = row ? row.left + row.width / 2 : window.innerWidth * 0.85;
        const originY = row ? row.top + row.height / 2 : window.innerHeight * 0.5;

        // Level 1 = 5 stars, each subsequent level adds 5 more
        const count = Math.max(5, 5 + (questionIdx) * 5);

        const particles = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            originX: originX + (Math.random() - 0.5) * 40,
            originY: originY + (Math.random() - 0.5) * 24,
            burstX: (Math.random() - 0.5) * 140,
            burstY: (Math.random() - 0.5) * 100,
            targetX,
            targetY,
            delay: i * 0.06,
            size: 10 + Math.random() * 8,
        }));
        setXpParticles(particles);

        // Timeout = last particle delay + fly duration (1600ms) + fade-out buffer (400ms)
        const lastDelayMs = (count - 1) * 60; // i * 0.06s → i * 60ms
        const cleanupMs = lastDelayMs + 1600 + 400;
        setTimeout(() => setXpParticles([]), cleanupMs);
    }, []);


    const handleStartGame = () => {
        loadNewGame(); // Rút 15 câu hỏi mới từ pool
        setGameState('playing');
        setTimeLeft(30);
        playActiveSound();
        setIntroPhase(1);
    };

    useEffect(() => {
        if (gameState !== 'playing' || introPhase < 4 || isAnswerRevealed || showStopConfirm || confirmFiftyFifty || confirmAudience || confirmPhone || confirmSwap || audienceState || phoneState || isSwapping) return;

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
    }, [gameState, introPhase, currentQuestionIndex, isAnswerRevealed, showStopConfirm, confirmFiftyFifty, confirmAudience, confirmPhone, confirmSwap, audienceState, phoneState]);

    // NOTE: Auto-advance đã bị tắt — user phải bấm "Tiếp tục" thủ công.
    // explanationTimeLeft giữ lại để tránh lỗi reference ở JSX render.
    useEffect(() => {
        if (answerStep === 'explained') {
            setExplanationTimeLeft(15);
            // Không còn auto-advance nữa — chỉ reset countdown về 15 để UI đẹp
        }
    }, [answerStep]);

    const handleTimeUp = () => {
        setIsAnswerRevealed(true);
        let milestoneScore = 0;
        for (let i = MILESTONES.length - 1; i >= 0; i--) {
            if (currentQuestionIndex > MILESTONES[i]) {
                milestoneScore = REWARDS[MILESTONES[i]];
                break;
            }
        }
        setTimeout(() => {
            triggerEndGame(currentQuestionIndex, false);
        }, 3000);
    };

    const handleOptionSelect = (index) => {
        if (isAnswerRevealed || hiddenOptions.includes(index) || isSwapping) return;

        setSelectedOption(index);
        setIsAnswerRevealed(true);

        const currentQuestion = currentQuestions[currentQuestionIndex];
        const isCorrect = index === currentQuestion.answer;

        if (isCorrect) {
            // Đánh dấu câu hỏi đã trả lời đúng
            if (currentQuestion.id) markAnswered(currentQuestion.id);
            const reward = REWARDS[currentQuestionIndex];
            setEncouragementMessage(getEncouragement(currentQuestionIndex));
            setSpotlightFlash(prev => prev + 1); // brief flicker

            // SFX: clap + correct tone together
            playAudio('clapShort', 0.6);
            playAudio('correct', 0.7);

            // Trigger confetti + dramatic spotlight swing at checkpoint milestones (Q5 = idx 4, Q10 = idx 9)
            if (currentQuestionIndex === 4 || currentQuestionIndex === 9) {
                // Checkpoint SFX
                playAudio('checkpoint', 0.8, (durationMs) => {
                    setSpotlightSwing(prev => prev + 1);
                });
                setShowGameConfetti(false);
                setTimeout(() => {
                    setGameConfettiKey(prev => prev + 1);
                    setShowGameConfetti(true);
                }, 300);
                setTimeout(() => setShowGameConfetti(false), 5000);

                // Hiện Checkpoint Ad sau 2.2s (đủ thời gian animation cheer)
                setTimeout(() => {
                    setCheckpointAdCountdown(6);
                    setShowCheckpointAd(true);
                }, 2200);
            }

            // Trigger MC correct logic
            const pool = MC_MESSAGES[currentQuestionIndex].correct;
            setMcMessage(pool[Math.floor(Math.random() * pool.length)]);
            setShowMcBubble(true);

            // Hide the reaction bubble shortly before the explanation
            setTimeout(() => {
                setShowMcBubble(false);
            }, 1800);

            // Fully prepare explanation and button, then pop out the bubble
            setTimeout(() => {
                setMcMessage(currentQuestions[currentQuestionIndex].explanation);
                setAnswerStep('explained');
                setEncouragementMessage(null); // Gỡ chữ Tuyệt vời
                setShowMcBubble(true);
            }, 2000);

            spawnXPParticles(currentQuestionIndex);

            // Delay score update to match first particle arrival (~1.36s)
            setTimeout(() => {
                setScore(reward);
                setXpScore(XP_CUMULATIVE[currentQuestionIndex]);
            }, 1360);
        } else {
            // SFX: incorrect answer
            playAudio('incorrect', 0.8);
            // Spotlight: dim monochromatic converge shake
            setSpotlightWrong(prev => prev + 1);

            // Compute milestone score now (captured in closure for async callbacks)
            let earnedMilestoneCoins = 0;
            for (let i = MILESTONES.length - 1; i >= 0; i--) {
                if (currentQuestionIndex > MILESTONES[i]) {
                    earnedMilestoneCoins = REWARDS[MILESTONES[i]];
                    break;
                }
            }
            
            // Farewell clap after a delay (2.5s)
            setTimeout(() => {
                playAudio('clapEnd', 0.65, (durationMs) => {
                    setTimeout(() => { saveAnsweredQuestions(); triggerEndGame(currentQuestionIndex, false); }, durationMs);
                });
            }, 2500);

            // Trigger MC wrong logic
            const pool = MC_MESSAGES[currentQuestionIndex].wrong;
            setMcMessage(pool[Math.floor(Math.random() * pool.length)]);
            setShowMcBubble(true);

            setTimeout(() => { setShowMcBubble(false); }, 1800);

            setTimeout(() => {
                setScore(earnedMilestoneCoins);
                setAnswerStep('explained');
            }, 2500);
        }
    };

    const triggerEndGame = (levelIndex, isQ15Complete = false) => {
        // Lưu params để dùng sau khi GameOver Ad đóng
        pendingEndRef.current = { levelIndex, isQ15Complete };
        // Hiện GameOver Ad overlay 6s trước khi vào màn kết quả
        setGameOverAdCountdown(6);
        setShowGameOverAd(true);
    };

    // Sau khi GameOver Ad kết thúc → thực sự chuyển sang finished
    const commitEndGame = useCallback(() => {
        const { levelIndex, isQ15Complete } = pendingEndRef.current || {};
        if (levelIndex === undefined) return;
        setShowGameOverAd(false);
        setGameState('finished');
        if (MC_MESSAGES_AFTER_FINISH[levelIndex]) {
            setEndMessage(MC_MESSAGES_AFTER_FINISH[levelIndex]);
            setShowEndMessage(true);
            setTimeout(() => setShowEndMessage(false), 8000);
        }
        savePinnacleCompositeScore(levelIndex, isQ15Complete);
        trackPinnaclePlay();
    }, [savePinnacleCompositeScore, trackPinnaclePlay]);

    const handleNextQuestion = () => {
        // Cho ẩn khung giải thích trước để UI reset layout về vị trí cũ một nhịp
        setAnswerStep('thinking');
        setEncouragementMessage(null);
        setShowMcBubble(false); // Hide MC bubble when moving to next question

        setTimeout(() => {
            const isCorrect = selectedOption === currentQuestions[currentQuestionIndex].answer;

            if (isCorrect || isSkipped) {
                if (currentQuestionIndex < currentQuestions.length - 1) {
                    setIsSwapping(true); // mượn lại hiệu ứng chuyển câu
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        resetTurnState();
                        setIsSwapping(false);
                    }, 500);
                } else {
                    // Q15 correct — perfect game!
                    triggerEndGame(currentQuestionIndex, true);
                }
            } else {
                triggerEndGame(currentQuestionIndex, false);
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
        // Enter fullscreen on replay
        try {
            const el = document.documentElement;
            const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
            if (rfs && !document.fullscreenElement) rfs.call(el).catch(() => {});
        } catch (_) {}
        loadNewGame(); // Rút 15 câu hỏi mới
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setDisplayScore(0);
        setXpScore(0);
        setDisplayXpScore(0);
        setXpParticles([]);
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
        setPhoneTimeLeft(30);
        setConfirmSwap(false);
        setIsSwapping(false);
        setLifelines({ fiftyFifty: false, phone: false, audience: false, swap: false });
        setTimeLeft(30);
        setMcMessage("");
        setShowMcBubble(false);
        setEncouragementMessage(null);
        setAnswerStep('thinking');
        setEndMessage(null);
        setShowEndMessage(false);
        setIsVoluntaryStop(false);
        setEarnedXP(0);
        playActiveSound();
        setIntroPhase(1);
    };

    // Người chơi chủ động dừng: tính XP đã kiếm rồi vào màn kết quả
    const handleVoluntaryStop = () => {
        const xp = currentQuestionIndex > 0 ? XP_CUMULATIVE[currentQuestionIndex - 1] : 0;
        setIsVoluntaryStop(true);
        setEarnedXP(xp);
        try { const a = new Audio(sfxClapShort); a.volume = 0.8; a.play().catch(() => {}); } catch (_) {}
        setGameState('finished');
    };

    // Khi user ấn nút "Dừng" — hỏi xác nhận trước
    const requestStop = () => setShowStopConfirm(true);

    // Lifeline handlers
    const useFiftyFifty = () => {
        if (lifelines.fiftyFifty || isScanningFiftyFifty) return;
        setConfirmFiftyFifty(true);
    };

    const confirmAndUseFiftyFifty = () => {
        setConfirmFiftyFifty(false);
        setLifelines(prev => ({ ...prev, fiftyFifty: true }));
        setIsScanningFiftyFifty(true);

        const currentAns = currentQuestions[currentQuestionIndex].answer;
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
            const currentAns = currentQuestions[currentQuestionIndex].answer;
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

            const currentAns = currentQuestions[currentQuestionIndex].answer;
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
            setMcMessage(currentQuestions[currentQuestionIndex].explanation);
            setAnswerStep('explained');
            setShowMcBubble(true);
        }, 1000);
    };

    const useLifelineMock = (type) => { // Generic click for others just to mark them used
        setLifelines(prev => ({ ...prev, [type]: true }));
    };

    // ── Checkpoint Ad countdown ──
    useEffect(() => {
        if (!showCheckpointAd) return;
        if (checkpointAdCountdown <= 0) { setShowCheckpointAd(false); return; }
        const t = setTimeout(() => setCheckpointAdCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [showCheckpointAd, checkpointAdCountdown]);

    // ── GameOver Ad countdown ──
    useEffect(() => {
        if (!showGameOverAd) return;
        if (gameOverAdCountdown <= 0) { commitEndGame(); return; }
        const t = setTimeout(() => setGameOverAdCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [showGameOverAd, gameOverAdCountdown, commitEndGame]);

    return (
        <div className="w-full min-h-full h-full relative flex flex-col items-center z-10 bg-[#020617] overflow-y-auto overflow-x-hidden font-sans text-slate-100">
            {/* ── Checkpoint Ad Overlay (Q5 / Q10) ── */}
            {createPortal(
                <AnimatePresence>
                    {showCheckpointAd && (
                        <motion.div
                            key="checkpoint-ad"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/75 backdrop-blur-md px-4"
                        >
                            <motion.div
                                initial={{ scale: 0.88, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.92, y: 20 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                className="w-full max-w-md"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🏆</span>
                                        <span className="font-black text-yellow-300 text-lg tracking-wide" style={{ textShadow: '0 2px 0 #78350f' }}>
                                            Vượt Mốc An Toàn!
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowCheckpointAd(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm text-white/70 hover:text-white transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}
                                    >
                                        Bỏ qua <span className="text-yellow-300">{checkpointAdCountdown}s</span>
                                    </button>
                                </div>
                                {/* Ad slot */}
                                <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.15)' }}>
                                    <AdBanner />
                                </div>
                                {/* Footer hint */}
                                <p className="text-center text-white/40 text-xs mt-2 font-semibold">
                                    Quảng cáo hỗ trợ phát triển ứng dụng · Tự đóng sau {checkpointAdCountdown}s
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ── Game Over Ad Overlay (trước màn kết quả) ── */}
            {createPortal(
                <AnimatePresence>
                    {showGameOverAd && (
                        <motion.div
                            key="gameover-ad"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-4"
                        >
                            <motion.div
                                initial={{ scale: 0.88, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.92, y: 20 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                className="w-full max-w-md"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">📊</span>
                                        <span className="font-black text-blue-200 text-lg tracking-wide">
                                            Đang tải kết quả...
                                        </span>
                                    </div>
                                    <button
                                        onClick={commitEndGame}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm text-white/70 hover:text-white transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}
                                    >
                                        Bỏ qua <span className="text-yellow-300">{gameOverAdCountdown}s</span>
                                    </button>
                                </div>
                                {/* Ad slot */}
                                <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.15)' }}>
                                    <AdBanner />
                                </div>
                                {/* Footer hint */}
                                <p className="text-center text-white/40 text-xs mt-2 font-semibold">
                                    Quảng cáo hỗ trợ phát triển ứng dụng · Tự đóng sau {gameOverAdCountdown}s
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Settings Modal — portal to body */}
            {createPortal(
                <AnimatePresence>
                    {showSettings && (
                        <SettingsModal onClose={() => setShowSettings(false)} />
                    )}
                </AnimatePresence>,
                document.body
            )}
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
                    <img src={iconCoin} alt="coin" style={{ width: p.size, height: p.size, filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.9))' }} />
                </motion.div>
            ))}
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${pinnacleBackground})` }}
            />
            {/* Subtle vignette — lighter so bg image shows through */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, rgba(2,6,23,0.35) 60%, rgba(2,6,23,0.75) 100%)',
                }}
            />
            {/* Bottom gradient for readability */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-[#020617]/70 via-transparent to-transparent" />

            <div className="w-full max-w-6xl flex-1 flex flex-col z-10 pt-2 pb-2 landscape:pt-1 landscape:pb-1 lg:pt-4 lg:pb-8 px-2 lg:px-4 relative min-h-0">
                <AnimatePresence mode="wait">

                    {/* ── LOBBY SCREEN ── */}
                    {gameState === 'lobby' && (
                        <LobbyScreen
                            onPlay={() => setGameState('rules')}
                            onShowLeaderboard={() => setGameState('leaderboard')}
                            onLeaveGame={onLeaveGame}
                            onSettings={() => setShowSettings(true)}
                            onPlayClick={playClick}
                            nickname={nickname}
                            giaoxu={giaoxu}
                            tinhthanh={tinhthanh}
                            saveProfile={saveProfile}
                            playerCount={pinnaclePlayerCount}
                        />
                    )}

                    {gameState === 'rules' && (
                        <motion.div
                            key="rules"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: 30 }}
                            className="bg-[#3b82f6] p-4 sm:p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-4 border-[#1e3a8a] shadow-[0_8px_0_rgba(30,58,138,1)] m-auto max-w-md w-full text-white relative z-10 my-auto max-h-[85dvh] overflow-y-auto scrollbar-hide"
                        >
                            {/* Header row: back + trophy */}
                            <div className="flex justify-between items-center mb-1">
                                <button onClick={() => setGameState('lobby')} className="text-white hover:text-yellow-400 transition-colors p-1.5 rounded-full bg-blue-700 border-3 border-[#1e3a8a] shadow-[0_3px_0_rgba(30,58,138,1)] active:translate-y-0.5 active:shadow-[0_0px_0_rgba(30,58,138,1)]">
                                    <ArrowLeft size={20} strokeWidth={3} />
                                </button>
                                <div className="w-12 h-12 border-3 border-[#1e3a8a] bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_3px_0_rgba(180,83,9,1)] overflow-hidden relative">
                                    <div className="absolute inset-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-full"></div>
                                    <Trophy className="text-amber-700 drop-shadow-md relative z-10" size={22} strokeWidth={2.5} />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-widest text-center text-yellow-300 uppercase" 
                                style={{ textShadow: '0 3px 0 #78350f, 1px 0 0 #78350f, -1px 0 0 #78350f, 0 1px 0 #78350f, 0 -1px 0 #78350f, 1px 1px 0 #78350f, -1px -1px 0 #78350f, 1px -1px 0 #78350f, -1px 1px 0 #78350f' }}>
                                HƯỚNG DẪN
                            </h2>

                            {/* Rules card */}
                            <div className="space-y-3 mb-5 text-blue-950 bg-white p-4 sm:p-5 rounded-xl border-3 border-blue-300 shadow-[inset_0_-4px_0_rgba(191,219,254,1),0_5px_0_rgba(30,58,138,0.5)] text-sm sm:text-base font-bold leading-relaxed">
                                <div className="flex gap-3 items-start"><span className="text-white bg-blue-500 rounded-full w-7 h-7 text-xs flex items-center justify-center shrink-0 border-2 border-blue-700 shadow-[0_2px_0_rgba(29,78,216,1)] font-black">1</span> <span className="pt-0.5">Bạn sẽ trải qua 15 câu hỏi liên tiếp từ dễ đến khó.</span></div>
                                <div className="flex gap-3 items-start"><span className="text-white bg-blue-500 rounded-full w-7 h-7 text-xs flex items-center justify-center shrink-0 border-2 border-blue-700 shadow-[0_2px_0_rgba(29,78,216,1)] font-black">2</span> <span className="pt-0.5 flex items-center gap-1 flex-wrap">Vượt qua mỗi câu hỏi, bạn sẽ tích lũy được <img src={iconCoin} alt="Coins" className="w-4 h-4 inline-block" /> Coins. Cuối trận sẽ nhận thêm <img src={iconTrophy} alt="XP" className="w-4 h-4 inline-block" /> XP.</span></div>
                                <div className="flex gap-3 items-start"><span className="text-white bg-blue-500 rounded-full w-7 h-7 text-xs flex items-center justify-center shrink-0 border-2 border-blue-700 shadow-[0_2px_0_rgba(29,78,216,1)] font-black">3</span> <span className="pt-0.5">Cột mốc an toàn: Câu 5 và Câu 10. Trả lời sai sau cột mốc sẽ giữ được điểm của cột mốc đó.</span></div>
                                <div className="flex gap-3 items-start"><span className="text-white bg-blue-500 rounded-full w-7 h-7 text-xs flex items-center justify-center shrink-0 border-2 border-blue-700 shadow-[0_2px_0_rgba(29,78,216,1)] font-black">4</span> <span className="pt-0.5">Bạn có 4 quyền trợ giúp để sử dụng một lần duy nhất.</span></div>
                            </div>

                            {/* Start button */}
                            <button
                                onClick={handleStartGame}
                                className="w-full bg-yellow-400 hover:bg-yellow-300 text-[#1e3a8a] font-black uppercase tracking-widest text-lg py-3.5 rounded-full border-4 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1)] active:translate-y-1.5 active:shadow-[0_0px_0_rgba(30,58,138,1)] transition-all flex justify-center items-center gap-2 relative overflow-hidden group hover:scale-[1.02]"
                            >
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 pointer-events-none"></div>
                                <Play fill="currentColor" size={22} className="group-hover:scale-110 transition-transform relative z-10" /> <span className="relative z-10">BẮT ĐẦU NGAY</span>
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex-1 flex flex-col min-h-0 relative"
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
                                            className="bg-blue-950 border-2 border-amber-500 rounded-3xl p-5 landscape:p-3 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(245,158,11,0.2)] text-center text-white relative overflow-y-auto max-h-[95vh]"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>
                                            <div className="w-16 h-16 landscape:w-12 landscape:h-12 md:w-20 md:h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 landscape:mb-2 md:mb-4 border border-amber-500/50">
                                                <Users size={40} className="text-amber-400" />
                                            </div>
                                            <h3 className="text-xl landscape:text-lg md:text-2xl font-black mb-1 landscape:mb-1 md:mb-2 text-amber-400 uppercase tracking-wide">Trợ giúp 50:50</h3>
                                            <p className="text-blue-200 mb-5 landscape:mb-3 md:mb-8 font-medium text-sm landscape:text-xs md:text-base">Bạn có muốn loại bỏ 2 phương án sai không?</p>
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
                            {/* Stage Spotlight — 9 beams, flickers on correct, swings on milestone */}
                            <SpotlightEffect flash={spotlightFlash} swing={spotlightSwing} wrong={spotlightWrong} />

                            {/* Checkpoint Confetti — fires when player passes Q5 or Q10 */}
                            {showGameConfetti && <Confetti key={gameConfettiKey} questionIndex={4} />}

                            {/* Top Bar: Lifelines */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={introPhase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                                transition={{ duration: 0.5, type: 'spring' }}
                                className="flex justify-between items-center mb-2 px-2 md:px-4 shrink-0 relative z-50"
                            >
                                {/* Exit Button — cartoon pill */}
                                <button onClick={onLeaveGame}
                                    className="flex items-center gap-1.5 font-black text-white text-sm px-3 py-2 rounded-full active:translate-y-0.5 transition-all"
                                    style={{ background: 'linear-gradient(160deg,#1d4ed8,#1e40af)', border: '3px solid #60a5fa', boxShadow: '0 4px 0 #1e3a8a' }}
                                >
                                    <ArrowLeft size={15} strokeWidth={3} /> Thoát
                                </button>

                                {/* Lifelines — visible only in landscape */}
                                <div className="hidden landscape:flex lg:flex gap-2">
                                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={introPhase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }} transition={{ delay: 0.1, duration: 0.4 }}>
                                        <LifelineButton text="50:50" isUsed={lifelines.fiftyFifty} disabled={isAnswerRevealed} onClick={useFiftyFifty} />
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={introPhase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }} transition={{ delay: 0.25, duration: 0.4 }}>
                                        <LifelineButton icon={Phone} isUsed={lifelines.phone} disabled={isAnswerRevealed} onClick={usePhone} />
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={introPhase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }} transition={{ delay: 0.4, duration: 0.4 }}>
                                        <LifelineButton icon={Users} isUsed={lifelines.audience} disabled={isAnswerRevealed} onClick={useAudience} />
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={introPhase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }} transition={{ delay: 0.55, duration: 0.4 }}>
                                        <LifelineButton icon={RefreshCcw} isUsed={lifelines.swap} disabled={isAnswerRevealed} onClick={useSwap} />
                                    </motion.div>
                                </div>

                                {/* Coin + XP badges group + Settings */}
                                <div className="flex items-center gap-1.5">
                                    {/* Coins badge */}
                                    <div ref={xpBadgeRef}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                                        style={{ background: 'linear-gradient(160deg,#92400e,#b45309)', border: '2.5px solid #f59e0b', boxShadow: '0 3px 0 #78350f' }}
                                    >
                                        <img src={iconCoin} alt="Coins" className="w-4 h-4 shrink-0" />
                                        <motion.span
                                            key={displayScore}
                                            initial={{ scale: 1.3 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="font-black text-xs text-yellow-100 tracking-wide"
                                        >
                                            {displayScore.toLocaleString()}
                                        </motion.span>
                                    </div>
                                    {/* XP badge */}
                                    <div
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                                        style={{ background: 'linear-gradient(160deg,#78350f,#92400e)', border: '2.5px solid #d97706', boxShadow: '0 3px 0 #451a03' }}
                                    >
                                        <img src={iconTrophy} alt="XP" className="w-4 h-4 shrink-0" />
                                        <motion.span
                                            key={displayXpScore}
                                            initial={{ scale: 1.3 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="font-black text-xs text-amber-100 tracking-wide"
                                        >
                                            {displayXpScore.toLocaleString()}
                                        </motion.span>
                                    </div>
                                    {/* ⚙️ Settings */}
                                    <button onClick={() => { playClick(); setShowSettings(true); }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}
                                        aria-label="Cài đặt">
                                        <Settings size={14} color="#93c5fd" strokeWidth={2.5} />
                                    </button>
                                </div>
                            </motion.div>

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
                                            className="bg-blue-950 border-2 border-emerald-500 rounded-3xl p-5 landscape:p-3 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(16,185,129,0.2)] text-center text-white relative overflow-y-auto max-h-[95vh]"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>
                                            <div className="w-16 h-16 landscape:w-12 landscape:h-12 md:w-20 md:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 landscape:mb-2 md:mb-4 border border-emerald-500/50">
                                                <Phone size={40} className="text-emerald-400" />
                                            </div>
                                            <h3 className="text-xl landscape:text-lg md:text-2xl font-black mb-1 landscape:mb-1 md:mb-2 text-emerald-400 uppercase tracking-wide">Gọi điện thoại</h3>
                                            <p className="text-blue-200 mb-5 landscape:mb-3 md:mb-8 font-medium text-sm landscape:text-xs md:text-base">Bạn muốn gọi điện nhờ người thân trợ giúp?</p>
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
                                            className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-4 landscape:p-3 md:p-8 max-w-md w-full shadow-[0_0_40px_rgba(16,185,129,0.3)] text-white relative overflow-y-auto max-h-[95vh]"
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
                                            className="bg-blue-950 border-2 border-indigo-500 rounded-3xl p-5 landscape:p-3 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(99,102,241,0.2)] text-center text-white relative overflow-y-auto max-h-[95vh]"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600"></div>
                                            <div className="w-16 h-16 landscape:w-12 landscape:h-12 md:w-20 md:h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3 landscape:mb-2 md:mb-4 border border-indigo-500/50">
                                                <Users size={40} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-xl landscape:text-lg md:text-2xl font-black mb-1 landscape:mb-1 md:mb-2 text-indigo-400 uppercase tracking-wide">Hỏi ý kiến khán giả</h3>
                                            <p className="text-blue-200 mb-5 landscape:mb-3 md:mb-8 font-medium text-sm landscape:text-xs md:text-base">Bạn muốn lấy ý kiến từ khán giả trong trường quay?</p>
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
                                            className="bg-blue-950/90 border-2 border-indigo-500 rounded-3xl p-4 landscape:p-3 md:p-8 max-w-md w-full shadow-[0_0_40px_rgba(99,102,241,0.3)] text-white relative overflow-y-auto max-h-[95vh]"
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
                                            className="bg-blue-950 border-2 border-sky-500 rounded-3xl p-5 landscape:p-3 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(14,165,233,0.2)] text-center text-white relative overflow-y-auto max-h-[95vh]"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-600 via-sky-400 to-sky-600"></div>
                                            <div className="w-16 h-16 landscape:w-12 landscape:h-12 md:w-20 md:h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-3 landscape:mb-2 md:mb-4 border border-sky-500/50">
                                                <RefreshCcw size={40} className="text-sky-400" />
                                            </div>
                                            <h3 className="text-xl landscape:text-lg md:text-2xl font-black mb-1 landscape:mb-1 md:mb-2 text-sky-400 uppercase tracking-wide">Đổi câu hỏi</h3>
                                            <p className="text-blue-200 mb-5 landscape:mb-3 md:mb-8 font-medium text-sm landscape:text-xs md:text-base">Bạn có chắc muốn bỏ qua câu hỏi này? Bạn sẽ không được quay lại câu hỏi này.</p>
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
                            <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto overflow-y-auto landscape:overflow-hidden lg:overflow-hidden overflow-x-hidden pb-2 px-1 lg:px-4 min-h-0 gap-0">

                                {/* Dừng cuộc chơi — full-width strip, portrait only */}
                                <div
                                    className="w-full flex justify-center shrink-0 py-1 landscape:hidden"
                                    style={{
                                        visibility: currentQuestionIndex >= 1 && !isAnswerRevealed ? 'visible' : 'hidden',
                                        pointerEvents: currentQuestionIndex >= 1 && !isAnswerRevealed ? 'auto' : 'none',
                                    }}
                                >
                                    <button
                                        onClick={requestStop}
                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-red-200 border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 transition-all"
                                    >
                                        <Flag size={12} />
                                        Dừng cuộc chơi
                                    </button>
                                </div>

                                {/* Inner columns wrapper — flex-row in landscape */}
                                <div className="flex-1 flex flex-col landscape:flex-row lg:flex-row gap-2 landscape:gap-3 lg:gap-8 min-h-0 overflow-y-auto landscape:overflow-hidden lg:overflow-hidden">

                                {/* Left Side: Timer & Question Board */}
                                <div className="flex-1 w-full order-3 landscape:order-1 lg:order-1 flex flex-col pt-1 pb-0 landscape:pb-1 lg:pb-8 min-h-0 landscape:min-h-0 lg:min-h-0 justify-between items-center z-20 relative overflow-visible landscape:overflow-hidden lg:overflow-hidden mt-auto md:mt-0">

                                    {/* MC Character */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={introPhase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.5, type: 'spring' }}
                                        className="absolute top-0 right-2 md:right-8 lg:right-12 flex flex-col items-end z-[100] mt-[39px] landscape:mt-[139px] md:mt-[47px] pointer-events-none"
                                    >
                                        {/* MC Avatar */}
                                    <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 relative z-[101] pointer-events-auto group">
                                            {/* Container background & clipped body */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-[1.5px] border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)] overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                                <img src={mcAvatar} alt="MC" className="absolute -bottom-[8%] left-1/2 -translate-x-1/2 translate-y-[5px] w-[115%] h-auto max-w-none object-bottom" />
                                            </div>
                                            {/* Popped out head */}
                                            <div className="absolute inset-0 pointer-events-none z-10 transition-transform duration-300 group-hover:scale-105" style={{ clipPath: 'polygon(-50% -50%, 150% -50%, 150% 40%, -50% 40%)' }}>
                                                <img src={mcAvatar} alt="MC" className="absolute -bottom-[8%] left-1/2 -translate-x-1/2 translate-y-[5px] w-[115%] h-auto max-w-none object-bottom drop-shadow-[0_-3px_5px_rgba(0,0,0,0.35)]" />
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {showMcBubble && (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                    transition={{
                                                        layout: { type: "spring", stiffness: 500, damping: 30 },
                                                        scale: { type: "spring", stiffness: 500, damping: 30 },
                                                        opacity: { duration: 0.15 }
                                                    }}
                                                    style={{ transformOrigin: 'calc(100% - 30px) 100%' }}
                                                    className="absolute bottom-full right-0 mb-[44px] landscape:bottom-auto landscape:top-full landscape:mb-0 landscape:mt-4 min-w-[340px] max-w-[calc(100vw-16px)] md:max-w-[500px] z-[100] flex flex-col items-end md:items-center"
                                                >
                                                    {/* Cartoon Speech Bubble */}
                                                    <motion.div layout className="relative text-sm md:text-base rounded-3xl text-left md:text-center font-semibold leading-relaxed pointer-events-auto flex flex-col items-start md:items-center w-full"
                                                        style={{
                                                            background: 'linear-gradient(180deg,#1e3a8a,#1e40af)',
                                                            border: '3px solid #60a5fa',
                                                            padding: '16px 20px',
                                                        }}
                                                    >
                                                        {/* Shine */}
                                                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/8 rounded-t-3xl pointer-events-none" />

                                                        {/* Tail pointing UP — landscape only (bubble is BELOW avatar) */}
                                                        <div className="hidden landscape:block absolute -top-[15px] right-[22px] md:right-[30px] w-0 h-0 pointer-events-none"
                                                            style={{ borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderBottom: '16px solid #60a5fa' }} />
                                                        <div className="hidden landscape:block absolute -top-[11px] right-[24px] md:right-[32px] w-0 h-0 pointer-events-none"
                                                            style={{ borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderBottom: '13px solid #1e40af' }} />

                                                        {/* Text Content */}
                                                        <motion.div layout className="w-full relative z-10 text-slate-100">
                                                            {mcMessage.includes('**') ? (
                                                                <span dangerouslySetInnerHTML={{ __html: mcMessage.replace(/\*\*(.*?)\*\*/g, '<span class="text-amber-300 font-bold">$1') }} />
                                                            ) : (
                                                                <span>{mcMessage}</span>
                                                            )}
                                                        </motion.div>

                                                        {/* In-article Ad — chỉ hiện khi đang ở bước giải thích */}
                                                        {answerStep === 'explained' && (
                                                            <div className="w-full mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(96,165,250,0.2)' }}>
                                                                <AdArticle />
                                                            </div>
                                                        )}

                                                        {/* Next / End button */}
                                                        {answerStep === 'explained' && currentQuestionIndex < currentQuestions.length - 1 && (
                                                            <button
                                                                onClick={handleNextQuestion}
                                                                className="mt-3 font-black text-white text-sm px-6 py-2.5 rounded-full transition-all active:translate-y-1 flex items-center gap-2 mx-auto relative z-10 hover:brightness-110"
                                                                style={{
                                                                    background: 'linear-gradient(160deg,#38bdf8,#0ea5e9,#0284c7)',
                                                                    border: '3px solid #7dd3fc',
                                                                    boxShadow: '0 5px 0 #0369a1, 0 0 18px rgba(14,165,233,0.55)',
                                                                }}
                                                            >
                                                                <span>{(!isSkipped && selectedOption !== currentQuestions[currentQuestionIndex].answer) ? 'Kết thúc' : 'Tiếp tục'}</span>
                                                                <ArrowLeft size={14} className="rotate-180" />
                                                            </button>
                                                        )}
                                                    </motion.div>

                                                    {/* Tail pointing DOWN — portrait only, OUTSIDE shadow-casting div */}
                                                    <div className="landscape:hidden relative w-full pointer-events-none" style={{ height: 0 }}>
                                                        <div className="absolute -top-[1px] right-[22px] md:right-[30px] w-0 h-0"
                                                            style={{ borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '18px solid #60a5fa' }} />
                                                        <div className="absolute top-[2px] right-[24px] md:right-[32px] w-0 h-0"
                                                            style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '15px solid #1e3a8a' }} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    {/* Timer */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={introPhase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.5, type: 'spring' }}
                                        className="w-full flex flex-col items-center justify-center shrink-0 relative landscape:mt-[100px]"
                                    >
                                        {/* Neon timer — outer wrapper handles circular glow via filter:drop-shadow */}
                                        <motion.div
                                            animate={timeLeft <= 10 ? {
                                                filter: [
                                                    'drop-shadow(0 0 8px rgba(236,72,153,0.7)) drop-shadow(0 0 22px rgba(236,72,153,0.35))',
                                                    'drop-shadow(0 0 20px rgba(236,72,153,1)) drop-shadow(0 0 50px rgba(236,72,153,0.55))',
                                                    'drop-shadow(0 0 8px rgba(236,72,153,0.7)) drop-shadow(0 0 22px rgba(236,72,153,0.35))',
                                                ],
                                                scale: [1, 1.04, 1],
                                            } : {
                                                filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.55)) drop-shadow(0 0 28px rgba(34,211,238,0.25))',
                                                scale: 1,
                                            }}
                                            transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }}
                                            className="relative w-40 h-40 landscape:w-40 landscape:h-40 md:w-[193px] md:h-[193px] lg:w-[225px] lg:h-[225px] rounded-full overflow-hidden"
                                            style={{
                                                background: 'radial-gradient(circle at 40% 30%, rgba(14,30,80,0.95) 0%, #020617 70%)',
                                                border: timeLeft <= 10
                                                    ? '2px solid rgba(236,72,153,0.5)'
                                                    : '2px solid rgba(34,211,238,0.3)',
                                            }}
                                        >
                                            {/* SVG arc — NO filter on elements, glow comes from outer container */}
                                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90" overflow="visible">
                                                {/* Track */}
                                                <circle cx="50" cy="50" r="44"
                                                    stroke="rgba(255,255,255,0.07)" strokeWidth="4" fill="transparent" />
                                                {/* Glow duplicate (wider, more transparent) */}
                                                <circle cx="50" cy="50" r="44"
                                                    stroke={timeLeft <= 10 ? 'rgba(236,72,153,0.4)' : 'rgba(34,211,238,0.3)'}
                                                    strokeWidth="8" fill="transparent"
                                                    strokeDasharray="276"
                                                    strokeDashoffset={276 - (timeLeft / 30) * 276}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke 0.5s, stroke-dashoffset 1s linear' }}
                                                />
                                                {/* Main progress arc */}
                                                <circle cx="50" cy="50" r="44"
                                                    stroke={timeLeft <= 10 ? '#ec4899' : '#22d3ee'}
                                                    strokeWidth="4" fill="transparent"
                                                    strokeLinecap="round"
                                                    strokeDasharray="276"
                                                    strokeDashoffset={276 - (timeLeft / 30) * 276}
                                                    style={{ transition: 'stroke 0.5s, stroke-dashoffset 1s linear' }}
                                                />
                                            </svg>
                                            {/* Timer content */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span
                                                    className="text-[2.9rem] landscape:text-[3.3rem] md:text-[3.5rem] lg:text-[4.6rem] font-black leading-none tracking-tight"
                                                    style={{
                                                        color: timeLeft <= 10 ? '#f9a8d4' : '#e0f9ff',
                                                        textShadow: timeLeft <= 10
                                                            ? '0 0 12px #ec4899, 0 0 28px rgba(236,72,153,0.7)'
                                                            : '0 0 10px #22d3ee, 0 0 24px rgba(34,211,238,0.5)',
                                                    }}
                                                >
                                                    {timeLeft}
                                                </span>
                                                <span
                                                    className="text-[10px] landscape:text-[13px] md:text-[13px] font-bold tracking-[0.2em] uppercase mt-1"
                                                    style={{ color: timeLeft <= 10 ? 'rgba(236,72,153,0.6)' : 'rgba(34,211,238,0.5)' }}
                                                >giây</span>
                                            </div>
                                        </motion.div>
                                    </motion.div>



                                    {/* Question & Options Area */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={introPhase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5, type: 'spring' }}
                                        className="w-full max-w-4xl mx-auto flex flex-col gap-3 md:gap-4 px-2 lg:px-0 pb-4 landscape:pb-3 relative"
                                    >
                                        {/* Dừng cuộc chơi — landscape only, top-right of question area */}
                                        {currentQuestionIndex >= 1 && !isAnswerRevealed && (
                                            <div className="hidden landscape:flex justify-end mb-0.5">
                                                <button
                                                    onClick={requestStop}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110 active:scale-95"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #991b1b, #b91c1c)',
                                                        border: '2px solid rgba(239,68,68,0.6)',
                                                        boxShadow: '0 3px 0 #450a0a, 0 0 12px rgba(239,68,68,0.3)',
                                                    }}
                                                >
                                                    <Flag size={12} />
                                                    Xin dừng cuộc chơi
                                                </button>
                                            </div>
                                        )}

                                        <AnimatePresence mode="wait">
                                            {!isSwapping && (
                                                <motion.div
                                                    key={currentQuestionIndex}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut", delay: introPhase >= 4 && currentQuestionIndex === 0 ? 0.2 : 0 }}
                                                    className="w-full flex flex-col gap-3 md:gap-4"
                                                >
                                                    {/* Question Box — pointed hexagon cartoon card */}
                                                    {(() => {
                                                        const qClip = 'polygon(2% 0%,98% 0%,100% 50%,98% 100%,2% 100%,0% 50%)';
                                                        return (
                                                            /* Outer: golden amber rim — same style as reference */
                                                            <div
                                                                className="w-full"
                                                                style={{
                                                                    clipPath: qClip,
                                                                    WebkitClipPath: qClip,
                                                                    background: 'linear-gradient(180deg,#f5c842 0%,#d4960a 100%)',
                                                                    filter: 'drop-shadow(0 6px 0 #7a4f00)',
                                                                    padding: '4px 6px',
                                                                }}
                                                            >
                                                                {/* Inner: dark content area */}
                                                                <div
                                                                    className="w-full flex items-center justify-center min-h-[44px] landscape:min-h-[36px] md:min-h-[112px] relative"
                                                                    style={{
                                                                        clipPath: qClip,
                                                                        WebkitClipPath: qClip,
                                                                        background: 'linear-gradient(180deg,#0e1e5a 0%,#090f36 100%)',
                                                                        padding: '10px 24px',
                                                                    }}
                                                                >
                                                                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/8 pointer-events-none" />
                                                                    <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-center leading-snug tracking-wide text-white drop-shadow-lg w-full relative z-10">
                                                                        {currentQuestions[currentQuestionIndex]?.question}
                                                                    </h3>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Options */}
                                                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-3 landscape:gap-y-1.5 landscape:gap-x-2 md:gap-y-4 md:gap-x-6 items-stretch">
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

                                                        {currentQuestions[currentQuestionIndex]?.options.map((option, idx) => {
                                                            const alphabet = ["A", "B", "C", "D"];
                                                            const isHidden = hiddenOptions.includes(idx);

                                                            let isSel = selectedOption === idx;
                                                            let isCorrectChoice = isAnswerRevealed && idx === currentQuestions[currentQuestionIndex].answer;
                                                            let isWrongChoice = isAnswerRevealed && isSel && !isCorrectChoice;

                                                            return (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={introPhase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                                                    transition={{ duration: 0.4, delay: (introPhase >= 4 && currentQuestionIndex === 0 ? 0.5 : 0) + idx * 0.15 }}
                                                                >
                                                                    <CartoonBox
                                                                        onClick={() => handleOptionSelect(idx)}
                                                                        disabled={isAnswerRevealed || isScanningFiftyFifty}
                                                                        isActive={isSel && !isAnswerRevealed}
                                                                        isCorrect={isCorrectChoice}
                                                                        isWrong={isWrongChoice}
                                                                        isHidden={isHidden}
                                                                        className="text-left h-full"
                                                                    >
                                                                        <div className="flex items-center gap-2 md:gap-3 w-full">
                                                                            {/* Letter badge */}
                                                                            <span
                                                                                className="font-black text-sm md:text-base shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                                                                                style={{
                                                                                    background: (isSel && !isAnswerRevealed) ? '#fde68a' : isCorrectChoice ? '#bbf7d0' : isWrongChoice ? '#fca5a5' : '#f59e0b',
                                                                                    color: '#1e3a8a',
                                                                                    border: '2px solid rgba(255,255,255,0.4)',
                                                                                    boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
                                                                                }}
                                                                            >{alphabet[idx]}</span>
                                                                            <span className="text-white text-xs sm:text-sm md:text-base font-semibold flex-1 break-words leading-tight">{option}</span>
                                                                        </div>
                                                                    </CartoonBox>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                </div>

                                {/* Right Side: Reward Ladder (No-Scroll — fits in full height) */}
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={introPhase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                                    transition={{ duration: 0.5, type: 'spring' }}
                                    className="w-full landscape:w-64 lg:w-72 flex flex-col shrink-0 order-1 landscape:order-2 lg:order-2 h-[20vh] landscape:h-full lg:h-full lg:max-h-full landscape:border-l lg:border-l landscape:border-slate-700/50 lg:border-slate-700/50 landscape:pl-4 lg:pl-4 overflow-hidden"
                                >
                                    <div ref={ladderScrollRef} className="flex-1 flex flex-col h-full overflow-y-auto landscape:overflow-hidden lg:overflow-hidden scrollbar-hide scroll-smooth pb-4 justify-between">
                                        <div className="flex flex-col-reverse gap-1 justify-end min-h-max">
                                            {REWARDS.map((reward, idx) => {
                                                const qNum = idx + 1;
                                                const isCurrent = idx === currentQuestionIndex;
                                                const isPassed = idx < currentQuestionIndex;
                                                const isMilestone = MILESTONES.includes(idx);

                                                // ── Two-layer colors: outer rim (lighter) + inner fill (darker) ──
                                                let rimBg   = 'linear-gradient(180deg,#2c3e60,#1e293b)';
                                                let fillBg  = 'linear-gradient(90deg,#0a0f1e,#111827,#0a0f1e)';
                                                let textColor = '#94a3b8';
                                                let opacity = 1;
                                                let shine = false;

                                                if (isMilestone && !isPassed && !isCurrent) {
                                                    if (idx === 4)  {
                                                        rimBg  = 'linear-gradient(180deg,#3b82f6,#1d4ed8)';
                                                        fillBg = 'linear-gradient(90deg,#0f2060,#1a3096,#0f2060)';
                                                        textColor = '#bfdbfe'; shine = true;
                                                    }
                                                    if (idx === 9)  {
                                                        rimBg  = 'linear-gradient(180deg,#a78bfa,#6d28d9)';
                                                        fillBg = 'linear-gradient(90deg,#2e1065,#4c1d95,#2e1065)';
                                                        textColor = '#ddd6fe'; shine = true;
                                                    }
                                                    if (idx === 14) {
                                                        rimBg  = 'linear-gradient(180deg,#fbbf24,#d97706)';
                                                        fillBg = 'linear-gradient(90deg,#3f1c00,#78350f,#3f1c00)';
                                                        textColor = '#fef08a'; shine = true;
                                                    }
                                                }

                                                if (isPassed) {
                                                    rimBg   = 'linear-gradient(180deg,#1a2030,#0f172a)';
                                                    fillBg  = 'linear-gradient(90deg,#060912,#0a0f1a,#060912)';
                                                    textColor = '#f59e0b66';
                                                    opacity = 0.45;
                                                }

                                                if (isCurrent) {
                                                    rimBg  = 'linear-gradient(180deg,#fde68a,#f59e0b)';
                                                    fillBg = 'linear-gradient(90deg,#92400e,#b45309,#92400e)';
                                                    textColor = '#fef3c7'; shine = true;
                                                }

                                                const cascadeDelay = (14 - idx) * 0.08;
                                                const hexClip = 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)';

                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        ref={isCurrent ? currentRowRef : undefined}
                                                        data-ladder-row={idx}
                                                        initial={{ opacity: 0, y: -20 }}
                                                        animate={introPhase >= 1 ? { opacity, y: 0 } : { opacity: 0, y: -20 }}
                                                        transition={{ duration: 0.3, delay: introPhase >= 1 ? cascadeDelay : 0 }}
                                                        style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.7))' }}
                                                    >
                                                        {/* Outer rim layer — lighter/brighter = the visible "gutter" */}
                                                        <div style={{
                                                            clipPath: hexClip, WebkitClipPath: hexClip,
                                                            background: rimBg,
                                                            padding: isMilestone ? '3px 4px' : '2px 3px',
                                                        }}>
                                                            {/* Inner content layer — darker = recessed depth */}
                                                            <div
                                                                className="relative flex items-center justify-between px-4 transition-all duration-300"
                                                                style={{
                                                                    clipPath: hexClip, WebkitClipPath: hexClip,
                                                                    background: fillBg,
                                                                    paddingTop: isMilestone ? '5px' : '3px',
                                                                    paddingBottom: isMilestone ? '5px' : '3px',
                                                                }}
                                                            >
                                                                {/* Top shine for highlighted rows */}
                                                                {shine && <div className="absolute inset-0 h-1/2 bg-white/10 pointer-events-none" />}
                                                                <div className="flex items-center gap-2 relative z-10">
                                                                    <span className="text-sm font-bold" style={{ color: textColor }}>{qNum}</span>
                                                                    {isMilestone && !isPassed && (
                                                                        <Flag size={11} className="shrink-0" style={{ color: textColor }} fill="currentColor" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 relative z-10">
                                                                    <span className={`text-xs ${isMilestone && !isCurrent ? 'font-bold' : 'font-semibold'} flex items-center gap-0.5`} style={{ color: textColor }}><img src={iconTrophy} alt="XP" className="w-3 h-3" />{XP_CUMULATIVE[idx]}</span>
                                                                    <span className={`text-sm ${isMilestone && !isCurrent ? 'font-bold' : 'font-semibold'} flex items-center gap-0.5`} style={{ color: textColor }}><img src={iconCoin} alt="Coins" className="w-3.5 h-3.5" />{reward.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Portrait-only lifelines row — between ladder and question */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={introPhase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex landscape:hidden lg:hidden justify-center gap-3 py-1.5 order-2 shrink-0"
                                >
                                    <LifelineButton text="50:50" isUsed={lifelines.fiftyFifty} disabled={isAnswerRevealed} onClick={useFiftyFifty} />
                                    <LifelineButton icon={Phone} isUsed={lifelines.phone} disabled={isAnswerRevealed} onClick={usePhone} />
                                    <LifelineButton icon={Users} isUsed={lifelines.audience} disabled={isAnswerRevealed} onClick={useAudience} />
                                    <LifelineButton icon={RefreshCcw} isUsed={lifelines.swap} disabled={isAnswerRevealed} onClick={useSwap} />
                                </motion.div>
                                </div>{/* end inner columns wrapper */}
                            </div>{/* end Main Game Area */}

                            {/* ── Popup xác nhận dừng cuộc chơi ── */}
                            <AnimatePresence>
                                {showStopConfirm && (
                                    <motion.div
                                        key="stop-confirm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                                        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.85, opacity: 0, y: 20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.85, opacity: 0, y: 20 }}
                                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                            className="relative w-[320px] max-w-[90vw] rounded-3xl overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(180deg,#1e2d6b 0%,#111c4e 100%)',
                                                border: '3px solid #3b5bdb',
                                                boxShadow: '0 8px 0 #0d1a6e, 0 0 40px rgba(59,91,219,0.45)',
                                            }}
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/8 rounded-t-3xl pointer-events-none" />
                                            <div className="relative z-10 flex flex-col items-center px-6 py-6 gap-4">
                                                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                                    style={{ background: 'linear-gradient(135deg,#7f1d1d,#991b1b)', border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 0 18px rgba(239,68,68,0.4)' }}>
                                                    <Flag size={24} className="text-red-200" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-white font-black text-lg leading-snug">Dừng cuộc chơi?</p>
                                                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">Bạn sẽ nhận phần thưởng tương ứng<br/>với số câu hỏi đã trả lời đúng.</p>
                                                </div>
                                                <div className="flex gap-3 w-full mt-1">
                                                    <button
                                                        onClick={() => setShowStopConfirm(false)}
                                                        className="flex-1 py-2.5 rounded-2xl font-black text-sm text-slate-200 transition-all hover:brightness-125 active:scale-95"
                                                        style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.18)' }}
                                                    >Tiếp tục chơi</button>
                                                    <button
                                                        onClick={() => { setShowStopConfirm(false); handleVoluntaryStop(); }}
                                                        className="flex-1 py-2.5 rounded-2xl font-black text-sm text-white transition-all hover:brightness-110 active:scale-95"
                                                        style={{ background: 'linear-gradient(135deg,#7f1d1d,#b91c1c)', border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 3px 0 #450a0a, 0 0 14px rgba(239,68,68,0.35)' }}
                                                    >Xác nhận dừng</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {gameState === 'finished' && (
                        <EndGameScreen
                            score={score}
                            handlePlayAgain={handlePlayAgain}
                            onLeaveGame={onLeaveGame}
                            currentQuestionIndex={currentQuestionIndex}
                            endMessage={endMessage}
                            showEndMessage={showEndMessage}
                            selectedOption={selectedOption}
                            questions={currentQuestions}
                            isVoluntaryStop={isVoluntaryStop}
                            earnedXP={earnedXP}
                            myVote={pinnacleMyVote}
                            voteCounts={pinnacleVoteCounts}
                            onVote={submitPinnacleVote}
                        />
                    )}
                    {gameState === 'leaderboard' && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 z-20"
                        >
                            <PinnacleLeaderboard onBack={() => setGameState(leaderboardSource)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};

// Confetti/Firework Component for high efficiency celebrations
const Confetti = ({ questionIndex = 14 }) => {
    const canvasRef = useRef(null);

    // Determine number of positions: 11->2, 12->3, 13->4, 15(index 14)->5
    const getNumPositions = (index) => {
        if (index >= 14) return 5; // Câu 15
        if (index >= 12) return 4; // Câu 13, 14
        if (index === 11) return 3; // Câu 12
        if (index === 10) return 2; // Câu 11
        return 1; // Default fallback if called elsewhere
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const numPositions = getNumPositions(questionIndex);
        const allParticles = [];
        let firedCount = 0;
        const totalFires = numPositions * 2 - 1; // e.g. 5 positions = 9 bursts (1->5 then 4->1)

        // Calculate sequence of x percentages
        const sequence = [];
        // L -> R
        for (let i = 0; i < numPositions; i++) {
            const pct = numPositions === 1 ? 0.5 : (i / (numPositions - 1)) * 0.8 + 0.1; // spread 10% to 90%
            sequence.push(pct);
        }
        // R -> L (excluding the last one already fired)
        for (let i = numPositions - 2; i >= 0; i--) {
            const pct = numPositions === 1 ? 0.5 : (i / (numPositions - 1)) * 0.8 + 0.1;
            sequence.push(pct);
        }

        const fireBurst = (index) => {
            if (index >= sequence.length || !canvas) return;

            // Play firework sound
            try {
                const audio = new Audio(fireworkSfx);
                audio.volume = 0.4;
                audio.play().catch(e => console.log('Audio play failed', e));
            } catch (_) { }

            const xPos = canvas.width * sequence[index];
            const yPos = canvas.height; // Shoot from bottom

            for (let i = 0; i < 60; i++) {
                // Shoot upwards in a cone
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
                // Reduce upward speed by 30%: old speed was 15 + random * 20
                const speed = 10.5 + Math.random() * 14;

                allParticles.push({
                    x: xPos,
                    y: yPos,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    // Substantially increase lifetime so they have time to fall down the whole screen
                    life: 250 + Math.random() * 100,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    size: Math.random() * 7 + 4 // slightly bigger particles look better when slow
                });
            }

            firedCount++;
            if (firedCount < totalFires) {
                setTimeout(() => fireBurst(firedCount), 300); // 300ms gap between bursts
            }
        };

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = allParticles.length - 1; i >= 0; i--) {
                const p = allParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // Decreased gravity for a slower, floaty fall

                // Add a tiny bit of air resistance to horizontal movement
                p.vx *= 0.99;

                p.life--;
                p.size *= 0.992; // Decay size much slower so they don't vanish mid-air

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2);
                ctx.fill();

                if (p.life <= 0) allParticles.splice(i, 1);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        fireBurst(0); // Start the chain

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [questionIndex]);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }} />;
};


const EndGameScreen = ({ score, handlePlayAgain, onLeaveGame, currentQuestionIndex, endMessage, showEndMessage, selectedOption, questions, isVoluntaryStop, earnedXP, myVote, voteCounts, onVote }) => {
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const { addXP, addCoins, globalScore, coins: profileCoins, nickname } = usePlayFabStore();
    const savedRef = useRef(false);

    const [displayScore, setDisplayScore] = useState(0);
    const [displayXP,    setDisplayXP]    = useState(0);
    const [coinsDone,    setCoinsDone]     = useState(false);
    const [xpDone,       setXpDone]        = useState(false);
    const [profileUpdated, setProfileUpdated] = useState(false);
    const [flyParticles,   setFlyParticles]   = useState([]);
    const [confettiKey,  setConfettiKey]   = useState(0);
    const [showConfetti, setShowConfetti]  = useState(score >= 500);
    const [testIndex,    setTestIndex]     = useState(currentQuestionIndex);
    const [visibleMessageIndex, setVisibleMessageIndex] = useState(0);
    const msgBoxRef  = useRef(null);   // fixed-height message box container
    const msgTextRef = useRef(null);   // text inside it, for font-shrink

    // Particle source refs (the reward pills)
    const coinPillRef   = useRef(null);
    const xpPillRef     = useRef(null);
    // Particle target refs (the profile stat chips)
    const coinTargetRef = useRef(null);
    const xpTargetRef   = useRef(null);

    // Calculate totals
    const lastAnswerCorrect = questions && selectedOption !== null && selectedOption === questions[currentQuestionIndex]?.answer;
    const correctCount = lastAnswerCorrect ? currentQuestionIndex + 1 : currentQuestionIndex;
    const totalXP    = isVoluntaryStop ? earnedXP : (correctCount > 0 ? XP_CUMULATIVE[correctCount - 1] : 0);
    const totalCoins = score;
    const rankName   = getRankByScore(globalScore || 0);

    // Auto-shrink font in fixed-height message box whenever message changes
    useEffect(() => {
        const box  = msgBoxRef.current;
        const text = msgTextRef.current;
        if (!box || !text) return;
        let size = 17;
        text.style.fontSize = size + 'px';
        while (text.scrollHeight > box.clientHeight && size > 11) {
            size -= 0.5;
            text.style.fontSize = size + 'px';
        }
    }, [visibleMessageIndex, endMessage, showEndMessage]);

    // Sequential dialog messages
    useEffect(() => {
        if (showEndMessage && Array.isArray(endMessage) && visibleMessageIndex < endMessage.length) {
            const t = setTimeout(() => setVisibleMessageIndex(p => p + 1), 2500);
            return () => clearTimeout(t);
        }
    }, [showEndMessage, endMessage, visibleMessageIndex]);

    // Dev hotkeys for confetti
    useEffect(() => {
        const fn = (e) => {
            const k = e.key.toLowerCase();
            let idx = null;
            if (k === 'e') idx = currentQuestionIndex;
            else if (k === '1') idx = 10; else if (k === '2') idx = 11;
            else if (k === '3') idx = 12; else if (k === '4') idx = 14;
            if (idx !== null) {
                setTestIndex(idx); setShowConfetti(false);
                setTimeout(() => { setConfettiKey(p => p + 1); setShowConfetti(true); }, 10);
            }
        };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [currentQuestionIndex]);

    // Coin sound
    const playCoinSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
            osc.frequency.setValueAtTime(1047, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1568, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
        } catch (_) {}
    }, []);

    // Spawn flying particles: count = actual reward capped at 9 (so 2XP → 2 particles)
    const spawnFly = useCallback((icon, sourceRef, targetRef, amount = 9) => {
        const count = Math.min(Math.max(1, amount), 9);
        const pill   = sourceRef.current?.getBoundingClientRect();
        const target = targetRef.current?.getBoundingClientRect();
        if (!pill || !target) return;
        const ox = pill.left + pill.width / 2,  oy = pill.top  + pill.height / 2;
        const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
        const items = Array.from({ length: count }, (_, i) => ({
            id: `${icon}-${Date.now()}-${i}`, icon,
            ox: ox + (Math.random() - 0.5) * 28, oy: oy + (Math.random() - 0.5) * 14,
            bx: (Math.random() - 0.5) * 90,      by: (Math.random() - 0.5) * 60,
            tx, ty, delay: i * 0.07,
        }));
        setFlyParticles(p => [...p, ...items]);
        setTimeout(() => setFlyParticles(p => p.filter(x => !items.find(pp => pp.id === x.id))), 2200);
    }, []);

    // Coin count-up — 2 s, starts immediately
    useEffect(() => {
        if (totalCoins <= 0) { setCoinsDone(true); return; }
        const STEPS = Math.min(totalCoins, 40), step = Math.ceil(totalCoins / STEPS), ms = 2000 / STEPS;
        let cur = 0;
        const id = setInterval(() => {
            cur = Math.min(cur + step, totalCoins);
            setDisplayScore(cur); playCoinSound();
            if (cur >= totalCoins) { clearInterval(id); setCoinsDone(true); }
        }, ms);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalCoins]);

    // After coins done → fly coins (count = totalCoins capped at 9) → addCoins
    useEffect(() => {
        if (!coinsDone || totalCoins <= 0) return;
        const t = setTimeout(() => {
            spawnFly('coin', coinPillRef, coinTargetRef, totalCoins);
            setTimeout(() => { if (!savedRef.current) addCoins(totalCoins); setProfileUpdated(true); }, 1400);
        }, 300);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coinsDone]);

    // XP count-up — 2 s, starts simultaneously with coin
    useEffect(() => {
        if (totalXP <= 0) { setXpDone(true); return; }
        const STEPS = Math.min(totalXP, 40), step = Math.ceil(totalXP / STEPS), ms = 2000 / STEPS;
        let cur = 0;
        const id = setInterval(() => {
            cur = Math.min(cur + step, totalXP); setDisplayXP(cur);
            if (cur >= totalXP) { clearInterval(id); setXpDone(true); }
        }, ms);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalXP]);

    // After XP done → fly XP (count = totalXP capped at 9) → addXP
    useEffect(() => {
        if (!xpDone || totalXP <= 0) return;
        const t = setTimeout(() => {
            spawnFly('xp', xpPillRef, xpTargetRef, totalXP);
            setTimeout(() => {
                if (!savedRef.current) { savedRef.current = true; addXP(totalXP); }
                setProfileUpdated(true);
            }, 1400);
        }, 300);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xpDone]);

    return createPortal(
        <>
            {showConfetti && <Confetti key={confettiKey} questionIndex={testIndex} />}

            {/* Flying icon particles — portal-level, above all UI */}
            {flyParticles.map((p) => (
                <motion.div key={p.id} className="fixed pointer-events-none" style={{ top: 0, left: 0, zIndex: 10100 }}
                    initial={{ x: p.ox, y: p.oy, opacity: 0, scale: 0 }}
                    animate={{ x: [p.ox, p.ox + p.bx, p.tx], y: [p.oy, p.oy + p.by, p.ty], opacity: [0, 1, 1, 0], scale: [0, 1.4, 1, 0] }}
                    transition={{ duration: 1.5, delay: p.delay, times: [0, 0.2, 0.85, 1] }}
                >
                    <img src={p.icon === 'coin' ? iconCoin : iconTrophy} alt={p.icon}
                        style={{ width: 20, height: 20, filter: p.icon === 'coin' ? 'drop-shadow(0 0 6px rgba(245,158,11,0.9))' : 'drop-shadow(0 0 6px rgba(251,191,36,0.9))' }} />
                </motion.div>
            ))}

            {/* Backdrop */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

            {/* ── Profile pill — gold champion, centered, no duplicate stats ── */}
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 26 }}
                style={{
                    position: 'fixed', top: 10, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', zIndex: 10001,
                    pointerEvents: 'none',
                }}
            >
                <div className="flex flex-col items-center gap-1.5 px-3 py-2 relative overflow-hidden mx-4"
                    style={{
                        background: 'linear-gradient(135deg, #3f1c00 0%, #78350f 55%, #3f1c00 100%)',
                        border: '3px solid #fbbf24',
                        boxShadow: '0 4px 0 #1c0a00, 0 6px 20px rgba(120,53,15,0.6)',
                        borderRadius: 20,
                        pointerEvents: 'auto',
                        maxWidth: 'calc(100vw - 32px)',
                    }}>
                    {/* Shine */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[17px] pointer-events-none"
                        style={{ background: 'rgba(255,255,255,0.08)' }} />
                    {/* Top row: Avatar + Name + Rank */}
                    <div className="flex items-center gap-2 relative z-10">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-amber-800 text-xs shrink-0"
                            style={{ background: 'linear-gradient(135deg,#fef3c7,#fbbf24)', border: '2px solid #fef08a', boxShadow: '0 2px 0 #1c0a00' }}>
                            {nickname?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-black text-sm leading-none shrink-0"
                            style={{ color: '#fef3c7', textShadow: '0 1px 0 #1c0a00' }}>
                            {nickname || 'Người chơi'}
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(251,191,36,0.2)', border: '1.5px solid #fbbf24', color: '#fde68a' }}>
                            {rankName}
                        </span>
                    </div>
                    {/* Bottom row: Coin + XP */}
                    <div className="flex items-center gap-2 relative z-10">
                        <div ref={coinTargetRef} className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0"
                            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: '2px solid #fef08a', boxShadow: '0 2px 0 #92400e' }}>
                            <img src={iconCoin} alt="" className="w-3.5 h-3.5" />
                            <motion.span key={profileUpdated ? 'uc' : 'bc'}
                                initial={{ scale: profileUpdated ? 1.4 : 1 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className="text-xs font-black text-white" style={{ textShadow: '0 1px 0 #92400e' }}>
                                {(profileCoins || 0).toLocaleString()}
                            </motion.span>
                        </div>
                        <div ref={xpTargetRef} className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0"
                            style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: '2px solid #fef08a', boxShadow: '0 2px 0 #92400e' }}>
                            <img src={iconTrophy} alt="" className="w-3.5 h-3.5" />
                            <motion.span key={profileUpdated ? 'ux' : 'bx'}
                                initial={{ scale: profileUpdated ? 1.4 : 1 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                                className="text-xs font-black text-white" style={{ textShadow: '0 1px 0 #92400e' }}>
                                {(globalScore || 0).toLocaleString()} XP
                            </motion.span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Centering wrapper */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999,
                width: 'min(560px, calc(100vw - 20px))', maxHeight: 'calc(100dvh - 20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'visible',
            }}>
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                >
                    {/* Trophy banner */}
                    <motion.img src={resultBanner} alt="Trophy"
                        initial={{ scale: 0, y: 30 }} animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                        style={{
                            width: 'clamp(236px, 47vw, 372px)', height: 'auto', flexShrink: 0,
                            position: 'relative', zIndex: 10,
                            marginBottom: 'clamp(-44px, -10vw, -73px)',
                            filter: 'drop-shadow(0 6px 10px rgba(30,58,138,0.7))', pointerEvents: 'none',
                        }}
                    />

                    {/* Blue card */}
                    <div style={{
                        background: '#3b82f6', border: '4px solid #1e3a8a', boxShadow: '0 8px 0 rgba(30,58,138,1)',
                        borderRadius: 24, width: '100%', flex: '0 0 auto',
                        minHeight: 'min(400px, calc(100dvh - 180px))',
                        maxHeight: 'calc(100dvh - 20px - clamp(60px, 11vw, 110px))',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div className="overflow-y-auto scrollbar-hide flex-1 flex flex-col items-center"
                            style={{ padding: 'clamp(56px, 10vw, 88px) 16px 16px' }}>

                            <h2 className="text-xl sm:text-2xl md:text-4xl landscape:text-xl font-black mb-4 landscape:mb-2 md:mb-8 tracking-widest text-center text-yellow-300 uppercase relative z-10 w-full"
                                style={{ textShadow: '0 4px 0 #78350f, 2px 0 0 #78350f, -2px 0 0 #78350f, 0 2px 0 #78350f, 0 -2px 0 #78350f' }}>
                                TRÒ CHƠI KẾT THÚC!
                            </h2>

                            {/* Dialog message box — fixed height ≈ 4 lines, font auto-shrinks to fit */}
                            <div ref={msgBoxRef}
                                className="w-full max-w-lg mb-4 landscape:mb-2 md:mb-5 flex items-center justify-center relative bg-white px-4 rounded-2xl border-4 border-blue-300 shadow-[inset_0_-4px_0_rgba(191,219,254,1),0_6px_0_rgba(30,58,138,0.5)] text-[#1e3a8a] font-bold overflow-hidden"
                                style={{ height: 'clamp(88px, 17vw, 120px)' }}>
                                <AnimatePresence mode="popLayout">
                                    {showEndMessage && Array.isArray(endMessage) && endMessage[visibleMessageIndex] ? (
                                        <motion.div key={`msg-${visibleMessageIndex}`}
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                            className="w-full px-1">
                                            <p ref={msgTextRef} className="font-bold leading-snug text-center w-full" style={{ lineHeight: 1.45 }}>
                                                {endMessage[visibleMessageIndex]}
                                            </p>
                                        </motion.div>
                                    ) : showEndMessage && endMessage ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                            className="w-full px-1">
                                            <p ref={msgTextRef} className="font-bold leading-snug text-center w-full" style={{ lineHeight: 1.45 }}>
                                                {endMessage}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full px-1">
                                            <p ref={msgTextRef} className="font-bold leading-snug text-center text-[#1e3a8a]/60 w-full" style={{ lineHeight: 1.45 }}>
                                                Hành trình học hỏi vẫn còn phía trước. Hãy sẵn sàng cho thử thách tiếp theo!
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Reward Pills — Coin + XP, both with +N badge, both animated simultaneously */}
                            <div className="flex items-end justify-center gap-4 landscape:gap-2 md:gap-6 mb-4 landscape:mb-2 md:mb-5 w-full max-w-md mx-auto">
                                {/* COIN */}
                                <div className="flex flex-col items-center gap-1">
                                    <div ref={coinPillRef}
                                        className="flex items-center justify-center bg-yellow-400 text-[#1e3a8a] rounded-full border-4 landscape:border-3 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1),inset_0_-4px_0_rgba(180,83,9,0.2)] py-1.5 landscape:py-1 md:py-2 px-4 landscape:px-3 md:px-6 relative overflow-hidden">
                                        <div className="absolute inset-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-full" />
                                        <img src={iconCoin} alt="Coins" className="w-6 h-6 md:w-7 md:h-7 relative z-10 mr-1.5" />
                                        <motion.span key={displayScore} initial={{ y: -4, opacity: 0.7 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.08 }}
                                            className="text-xl landscape:text-base md:text-3xl font-black relative z-10">
                                            {displayScore.toLocaleString()}
                                        </motion.span>
                                    </div>
                                </div>
                                {/* XP */}
                                <div className="flex flex-col items-center gap-1">
                                    <div ref={xpPillRef}
                                        className="flex items-center justify-center bg-amber-500 text-white rounded-full border-4 landscape:border-3 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1),inset_0_-4px_0_rgba(120,53,15,0.3)] py-1.5 landscape:py-1 md:py-2 px-4 landscape:px-3 md:px-6 relative overflow-hidden">
                                        <div className="absolute inset-0 w-full h-1/2 bg-white/25 pointer-events-none rounded-t-full" />
                                        <img src={iconTrophy} alt="XP" className="w-6 h-6 md:w-7 md:h-7 relative z-10 mr-1.5" />
                                        <motion.span key={displayXP} initial={{ y: -4, opacity: 0.7 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.08 }}
                                            className="text-xl landscape:text-base md:text-3xl font-black relative z-10">
                                            {displayXP.toLocaleString()}
                                        </motion.span>
                                        <span className="text-base md:text-lg font-black ml-1.5 relative z-10">XP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fake Stats — Q10+ only */}
                            {currentQuestionIndex >= 10 && (() => {
                                const passRates = [100, 88, 72, 58, 46, 36, 27, 20, 15, 11, 8, 5, 3, 2, 1];
                                const rate = passRates[Math.min(currentQuestionIndex, 14)];
                                const topLabel = currentQuestionIndex >= 14
                                    ? '🏆 Chỉ 2% người chơi hoàn thành cả 15 câu. Bạn thuộc nhóm tinh hoa!'
                                    : currentQuestionIndex >= 12
                                    ? `🔥 Bạn lọt vào top ${rate}% người chơi giỏi nhất!`
                                    : `⭐ Chỉ ${rate}% người chơi vượt qua được câu số ${currentQuestionIndex + 1}!`;
                                return (
                                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                        className="w-full max-w-lg mx-auto mb-4 rounded-2xl overflow-hidden"
                                        style={{ background: 'linear-gradient(180deg,#1e3a8a,#1e40af)', border: '3px solid #60a5fa' }}>
                                        <div className="px-4 py-2 text-center text-xs font-black tracking-widest uppercase text-blue-200 border-b border-blue-500/40">📊 Thống Kê Người Chơi</div>
                                        <div className="px-5 py-3 text-center">
                                            <p className="text-yellow-300 font-black text-sm md:text-base leading-snug" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}>{topLabel}</p>
                                        </div>
                                        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                                            {[{ q: 10, label: 'Câu 10', pct: passRates[9] }, { q: 12, label: 'Câu 12', pct: passRates[11] }, { q: 15, label: 'Câu 15', pct: passRates[14] }].map(({ q, label, pct }) => {
                                                const reached = currentQuestionIndex + 1 >= q;
                                                return (
                                                    <div key={q} className="flex flex-col items-center gap-1">
                                                        <div className="w-full h-1.5 rounded-full bg-blue-900 overflow-hidden">
                                                            <motion.div className="h-full rounded-full"
                                                                style={{ background: reached ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : '#3b82f6' }}
                                                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }} />
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${reached ? 'text-yellow-300' : 'text-blue-300'}`}>{label}</span>
                                                        <span className={`text-[10px] font-black ${reached ? 'text-yellow-200' : 'text-blue-400'}`}>{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })()}

                            {/* Buttons */}
                            <div className="flex flex-col gap-2 relative z-10 w-full max-w-md mx-auto mt-2 landscape:mt-1 pb-4 landscape:pb-2">
                                <div className="flex flex-row gap-2">
                                    <button onClick={handlePlayAgain}
                                        className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest text-base landscape:text-sm py-4 landscape:py-3 rounded-full border-4 landscape:border-3 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1),inset_0_-4px_0_rgba(29,78,216,0.5)] active:translate-y-1.5 active:shadow-[0_0px_0_rgba(30,58,138,1)] transition-all flex justify-center items-center relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 pointer-events-none rounded-t-full" />
                                        <span className="relative z-10 group-hover:scale-105 transition-transform">Chơi lại</span>
                                    </button>
                                    <button onClick={onLeaveGame}
                                        className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-[#1e3a8a] font-black uppercase tracking-widest text-base landscape:text-sm py-4 landscape:py-3 rounded-full border-4 landscape:border-3 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1),inset_0_-4px_0_rgba(180,83,9,0.3)] active:translate-y-1.5 active:shadow-[0_0px_0_rgba(30,58,138,1)] transition-all flex justify-center items-center relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-full" />
                                        <span className="relative z-10 group-hover:scale-105 transition-transform">Về Menu</span>
                                    </button>
                                </div>
                                <button onClick={() => setShowLeaderboard(true)}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-base landscape:text-sm py-3 landscape:py-2 rounded-full border-4 landscape:border-3 border-purple-900 shadow-[0_5px_0_rgba(88,28,135,1),inset_0_-4px_0_rgba(109,40,217,0.5)] active:translate-y-1.5 active:shadow-[0_0px_0_rgba(88,28,135,1)] transition-all flex justify-center items-center gap-2 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/15 pointer-events-none rounded-t-full" />
                                    <span className="relative z-10 group-hover:scale-105 transition-transform">🏆 Xem Xếp Hạng</span>
                                </button>
                            </div>
                        </div>{/* end scroll */}
                    </div>{/* end blue card */}
                </motion.div>{/* end animation wrapper */}
            </div>{/* end centering wrapper */}

            {/* Inline Leaderboard overlay — rendered as portal sibling so EndGameScreen stays mounted */}
            <AnimatePresence>
                {showLeaderboard && (
                    <motion.div
                        key="end-leaderboard"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 10200 }}
                    >
                        <PinnacleLeaderboard onBack={() => setShowLeaderboard(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
};

export default PinnacleGame;
