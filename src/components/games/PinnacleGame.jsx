import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, CheckCircle2, XCircle, Play, Phone, Users, Shield, RefreshCcw, Flag, Star, UserCircle2 } from 'lucide-react';
import pinnacleBackground from '../../assets/pinnacle/altp_bg_02.png';
import mcAvatar from '../../assets/pinnacle/MC.png';

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

const LifelineButton = ({ icon: Icon, text, isUsed, disabled, onClick, active }) => (
    <button
        onClick={onClick}
        disabled={isUsed || disabled}
        className={`relative w-12 h-10 md:w-14 md:h-12 rounded-full border border-blue-400/50 flex items-center justify-center transition-all ${(isUsed || disabled) ? 'opacity-30 grayscale cursor-not-allowed border-red-500' : active ? 'bg-amber-600 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-[#0f172a]/80 hover:bg-slate-800 hover:border-blue-300 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
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
    const [explanationTimeLeft, setExplanationTimeLeft] = useState(15);
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

    // MC Speech Bubble state
    const [mcMessage, setMcMessage] = useState("");
    const [showMcBubble, setShowMcBubble] = useState(false);
    const [endMessage, setEndMessage] = useState(null);
    const [showEndMessage, setShowEndMessage] = useState(true);

    // Prompt MC on level changes
    useEffect(() => {
        if (gameState === 'playing' && !isAnswerRevealed && !isSwapping) {
            const pool = MC_MESSAGES[currentQuestionIndex].start;
            const msg = pool[Math.floor(Math.random() * pool.length)];
            setMcMessage(msg);
            setShowMcBubble(true);
            const timer = setTimeout(() => setShowMcBubble(false), 4000); // 4 secs display
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, gameState, isAnswerRevealed, isSwapping]);

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
    }, [gameState, currentQuestionIndex, isAnswerRevealed, confirmFiftyFifty, confirmAudience, confirmPhone, confirmSwap, audienceState, phoneState]);

    useEffect(() => {
        if (answerStep === 'explained') {
            setExplanationTimeLeft(15);
            const timer = setInterval(() => {
                setExplanationTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleNextQuestion();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [answerStep]);

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
                setMcMessage(DUMMY_QUESTIONS[currentQuestionIndex].explanation);
                setAnswerStep('explained');
                setEncouragementMessage(null); // Gỡ chữ Tuyệt vời
                setShowMcBubble(true);
            }, 2000);

            spawnXPParticles();

            // Delay score update to match first particle arrival (~1.36s)
            setTimeout(() => setScore(reward), 1360);
        } else {
            // Trigger MC wrong logic
            const pool = MC_MESSAGES[currentQuestionIndex].wrong;
            setMcMessage(pool[Math.floor(Math.random() * pool.length)]);
            setShowMcBubble(true);

            // Hide the reaction bubble shortly before the explanation
            setTimeout(() => {
                setShowMcBubble(false);
            }, 1800);

            // Fully prepare explanation and button, then pop out the bubble
            setTimeout(() => {
                setMcMessage(DUMMY_QUESTIONS[currentQuestionIndex].explanation);
                setAnswerStep('explained');
                setShowMcBubble(true);
            }, 2000);

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
            }, 2500); // Rút ngắn lại thành 1s để hiện explanation sớm thay vì 4s chìm
        }
    };

    const triggerEndGame = (levelIndex) => {
        setGameState('finished');
        if (MC_MESSAGES_AFTER_FINISH[levelIndex]) {
            setEndMessage(MC_MESSAGES_AFTER_FINISH[levelIndex]);
            setShowEndMessage(true);
            setTimeout(() => setShowEndMessage(false), 8000); // Tăng thời gian hiển thị lên 8s
        }
    };

    const handleNextQuestion = () => {
        // Cho ẩn khung giải thích trước để UI reset layout về vị trí cũ một nhịp
        setAnswerStep('thinking');
        setEncouragementMessage(null);
        setShowMcBubble(false); // Hide MC bubble when moving to next question

        setTimeout(() => {
            const isCorrect = selectedOption === DUMMY_QUESTIONS[currentQuestionIndex].answer;

            if (isCorrect || isSkipped) {
                if (currentQuestionIndex < DUMMY_QUESTIONS.length - 1) {
                    setIsSwapping(true); // mượn lại hiệu ứng chuyển câu
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        resetTurnState();
                        setIsSwapping(false);
                    }, 500);
                } else {
                    triggerEndGame(currentQuestionIndex);
                }
            } else {
                triggerEndGame(currentQuestionIndex);
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
            setMcMessage(DUMMY_QUESTIONS[currentQuestionIndex].explanation);
            setAnswerStep('explained');
            setShowMcBubble(true);
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
                            className="bg-gradient-to-b from-[#1e3a8a]/95 to-[#0f172a]/95 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(30,58,138,0.3)] border-2 border-blue-400/30 m-auto max-w-2xl w-full text-white relative z-10"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <button onClick={onLeaveGame} className="text-gray-300 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10 mt-1">
                                    <ArrowLeft size={24} />
                                </button>
                                {/* Top Right Trophy Badge */}
                                <div className="absolute top-6 right-6 md:top-8 md:right-8 w-14 h-14 md:w-16 md:h-16 border-2 border-yellow-400 bg-blue-950/80 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)] z-20">
                                    <Trophy className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" size={24} />
                                </div>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black mt-2 mb-8 tracking-wider text-center text-yellow-400 drop-shadow-md">ĐỈNH CAO HIỂU BIẾT</h2>

                            <div className="space-y-6 mb-10 text-slate-200 bg-blue-950/40 p-6 md:p-8 rounded-2xl border border-blue-400/20 text-base md:text-lg leading-relaxed shadow-inner font-medium">
                                <p className="flex gap-4 items-start"><span className="text-yellow-400 font-bold shrink-0">1.</span> <span>Bạn sẽ trải qua 15 câu hỏi liên tiếp từ dễ đến khó.</span></p>
                                <p className="flex gap-4 items-start"><span className="text-yellow-400 font-bold shrink-0">2.</span> <span>Vượt qua mỗi câu hỏi, bạn sẽ tích lũy được điểm XP vô cùng giá trị.</span></p>
                                <p className="flex gap-4 items-start"><span className="text-yellow-400 font-bold shrink-0">3.</span> <span>Cột mốc an toàn: Câu 5 và Câu 10. Trả lời sai sau cột mốc sẽ giữ được điểm của cột mốc đó.</span></p>
                                <p className="flex gap-4 items-start"><span className="text-yellow-400 font-bold shrink-0">4.</span> <span>Bạn có 4 quyền trợ giúp để sử dụng một lần duy nhất.</span></p>
                            </div>

                            <button
                                onClick={handleStartGame}
                                className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black uppercase tracking-wider text-xl py-4 rounded-xl shadow-[0_4px_15px_rgba(234,179,8,0.4)] transition-all flex justify-center items-center gap-2"
                            >
                                <Play fill="currentColor" size={24} /> BẮT ĐẦU NGAY
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
                                    <LifelineButton text="50:50" isUsed={lifelines.fiftyFifty} disabled={isAnswerRevealed} onClick={useFiftyFifty} />
                                    <LifelineButton icon={Phone} isUsed={lifelines.phone} disabled={isAnswerRevealed} onClick={usePhone} />
                                    <LifelineButton icon={Users} isUsed={lifelines.audience} disabled={isAnswerRevealed} onClick={useAudience} />
                                    <LifelineButton icon={RefreshCcw} isUsed={lifelines.swap} disabled={isAnswerRevealed} onClick={useSwap} />
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
                                <div className="flex-1 w-full order-2 lg:order-1 flex flex-col pt-2 pb-12 lg:pb-8 h-[75vh] lg:h-full justify-between items-center z-20 relative overflow-y-auto scrollbar-hide">

                                    {/* MC Character */}
                                    <div className="absolute top-0 right-2 md:right-8 lg:right-12 flex flex-col items-end z-[100] mt-6 md:mt-8 pointer-events-none">
                                        <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative z-[101] pointer-events-auto group">
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
                                                    style={{ transformOrigin: 'calc(100% - 30px) top' }}
                                                    className="absolute top-full right-0 mt-4 min-w-[260px] max-w-[calc(100vw-32px)] md:max-w-[400px] z-[100] flex flex-col items-end md:items-center"
                                                >
                                                    {/* Custom Speech Bubble pointing UP towards right-aligned avatar */}
                                                    <motion.div layout className="relative bg-white text-blue-900 text-sm md:text-base px-6 py-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-left md:text-center font-semibold leading-relaxed pointer-events-auto flex flex-col items-start md:items-center w-full">
                                                        <div className="absolute -top-[14px] right-[18px] md:right-[26px] lg:right-[34px] w-0 h-0 border-x-[14px] border-x-transparent border-b-[16px] border-b-white pointer-events-none drop-shadow-sm"></div>

                                                        {/* Text Content */}
                                                        <motion.div layout className="w-full relative">
                                                            {mcMessage.includes('**') ? (
                                                                <span dangerouslySetInnerHTML={{ __html: mcMessage.replace(/\*\*(.*?)\*\*/g, '<span class="text-amber-600 font-bold">$1') }} />
                                                            ) : (
                                                                <span>{mcMessage}</span>
                                                            )}
                                                        </motion.div>

                                                        {/* Next Question / End Game Button inside Bubble */}
                                                        {answerStep === 'explained' && currentQuestionIndex < DUMMY_QUESTIONS.length - 1 && (
                                                            <button
                                                                onClick={handleNextQuestion}
                                                                className="mt-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-[0_4px_10px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 mx-auto"
                                                            >
                                                                <span>{(!isSkipped && selectedOption !== DUMMY_QUESTIONS[currentQuestionIndex].answer) ? 'Kết thúc' : 'Tiếp tục'}</span>
                                                                <ArrowLeft size={16} className="rotate-180" />
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Timer */}
                                    <div className="w-full flex flex-col items-center justify-center shrink-0 relative mt-2 md:mt-0">
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
                        <EndGameScreen score={score} handlePlayAgain={handlePlayAgain} onLeaveGame={onLeaveGame} currentQuestionIndex={currentQuestionIndex} endMessage={endMessage} showEndMessage={showEndMessage} />
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

const EndGameScreen = ({ score, handlePlayAgain, onLeaveGame, currentQuestionIndex, endMessage, showEndMessage }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const lastSoundTime = useRef(0);
    const [confettiKey, setConfettiKey] = useState(0);
    const [showConfetti, setShowConfetti] = useState(score >= 500);
    const [testIndex, setTestIndex] = useState(currentQuestionIndex);
    const [visibleMessageIndex, setVisibleMessageIndex] = useState(0);

    // Xử lý hiệu ứng hiển thị tuần tự các câu hội thoại
    useEffect(() => {
        if (showEndMessage && Array.isArray(endMessage) && visibleMessageIndex < endMessage.length) {
            const timer = setTimeout(() => {
                setVisibleMessageIndex(prev => prev + 1);
            }, 2500); // Cứ 2.5s hiện thêm 1 câu
            return () => clearTimeout(timer);
        }
    }, [showEndMessage, endMessage, visibleMessageIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            let newIndex = null;

            if (key === 'e') newIndex = currentQuestionIndex;
            else if (key === '1') newIndex = 10; // Q11 -> 2 pos
            else if (key === '2') newIndex = 11; // Q12 -> 3 pos
            else if (key === '3') newIndex = 12; // Q13 -> 4 pos
            else if (key === '4') newIndex = 14; // Q15 -> 5 pos

            if (newIndex !== null) {
                setTestIndex(newIndex);
                setShowConfetti(false);
                setTimeout(() => {
                    setConfettiKey(prev => prev + 1);
                    setShowConfetti(true);
                }, 10);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQuestionIndex]);

    const playCoinSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1047, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1568, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
        } catch (_) { }
    }, []);

    useEffect(() => {
        let timer;
        if (displayScore < score) {
            const step = Math.max(1, Math.floor(score / 50));

            timer = setTimeout(() => {
                setDisplayScore(prev => {
                    const next = Math.min(prev + step, score);
                    const now = Date.now();

                    if (now - lastSoundTime.current >= 1000) {
                        playCoinSound();
                        lastSoundTime.current = now;
                    }

                    return next;
                });
            }, 40);
        }
        return () => clearTimeout(timer);
    }, [displayScore, score, playCoinSound]);

    return (
        <>
            {showConfetti && <Confetti key={confettiKey} questionIndex={testIndex} />}
            <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 p-6 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.15)] text-center border-2 border-yellow-200/50 m-auto max-w-2xl w-full text-white backdrop-blur-xl relative z-10 lg:mt-32 mt-16"
            >

                {/* Trophy Badge overlapping top border */}
                <motion.div
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-36 bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] rounded-t-full rounded-b-xl flex items-center justify-center border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] z-20"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                    <div className="absolute inset-1 border border-yellow-300/50" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
                    <Trophy className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" size={56} />
                    {/* Stars around trophy */}
                    <Star className="absolute top-6 left-4 text-yellow-200 fill-current opacity-70" size={12} />
                    <Star className="absolute top-6 right-4 text-yellow-200 fill-current opacity-70" size={12} />
                    <Star className="absolute bottom-10 left-6 text-yellow-200 fill-current opacity-50" size={8} />
                    <Star className="absolute bottom-10 right-6 text-yellow-200 fill-current opacity-50" size={8} />
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-black mt-10 md:mt-12 mb-6 text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider relative z-10">
                    TRÒ CHƠI KẾT THÚC!
                </h2>
                {/* Central White Message Box container (MC's dialog) */}
                <div className="bg-white/95 text-slate-800 rounded-3xl p-6 md:p-8 mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)] min-h-[120px] flex items-center justify-center relative border border-white/50">
                    <AnimatePresence mode="popLayout">
                        {showEndMessage && Array.isArray(endMessage) && endMessage[visibleMessageIndex] ? (
                            <motion.div
                                key={`msg-${visibleMessageIndex}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="text-base md:text-xl font-medium leading-relaxed text-center absolute w-full px-6 italic text-slate-700"
                            >
                                {endMessage[visibleMessageIndex]}
                            </motion.div>
                        ) : (
                            showEndMessage && endMessage && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-base md:text-xl font-medium leading-relaxed text-center"
                                >
                                    {endMessage}
                                </motion.div>
                            )
                        )}

                        {!showEndMessage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-base md:text-xl font-medium leading-relaxed text-center italic text-slate-600"
                            >
                                Hành trình học hỏi vẫn còn phía trước. Hãy sẵn sàng cho thử thách tiếp theo!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Score Pill */}
                <div className="flex items-center justify-center mb-10 w-full max-w-[280px] md:max-w-xs mx-auto">
                    <div className="bg-[#1e293b]/90 py-4 md:py-5 px-8 flex flex-1 items-center justify-center gap-3 border-2 border-yellow-500/40 shadow-[0_0_20px_rgba(250,204,21,0.3)] rounded-full w-full">
                        <motion.span
                            key={displayScore}
                            initial={{ y: -5, opacity: 0.8 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.1 }}
                            className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                        >
                            {displayScore.toLocaleString()}
                        </motion.span>
                        <span className="text-2xl font-bold text-yellow-200 mt-1">XP</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full max-w-lg mx-auto">
                    <button
                        onClick={handlePlayAgain}
                        className="flex-1 bg-[#1e3a8a] hover:bg-[#2563eb] text-white font-bold py-4 rounded-full shadow-[0_4px_15px_rgba(30,58,138,0.4)] transition-all uppercase tracking-wide border border-[#3b82f6]/50"
                    >
                        Chơi lại
                    </button>
                    <button
                        onClick={onLeaveGame}
                        className="flex-1 bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] hover:from-[#fcd34d] hover:to-[#fbbf24] text-[#451a03] font-black uppercase py-4 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)] transition-all tracking-wide border border-[#fde68a]"
                    >
                        Về Menu chính
                    </button>
                </div>
            </motion.div >

        </>
    );
};

export default PinnacleGame;

