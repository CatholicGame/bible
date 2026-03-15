// src/utils/ranks.js

export const RANK_TIERS = [
    { level: 1,  name: "Người Tìm Hiểu",      minXP: 0 },       // Bắt đầu
    { level: 2,  name: "Dự Tòng",              minXP: 1000 },    // ~10 trận
    { level: 3,  name: "Chiên Con",             minXP: 3000 },    // ~30 trận
    { level: 4,  name: "Thiên Thần Nhỏ",        minXP: 6000 },    // ~55 trận (~1 tháng casual)
    { level: 5,  name: "Thiếu Nhi Thánh Thể",   minXP: 10000 },   // ~90 trận
    { level: 6,  name: "Lên Đường",             minXP: 16000 },   // ~145 trận (~2 tháng)
    { level: 7,  name: "Người Phục Vụ",         minXP: 25000 },   // ~225 trận (~3 tháng)
    { level: 8,  name: "Môn Đệ",               minXP: 40000 },   // ~360 trận (~6 tháng)
    { level: 9,  name: "Chứng Nhân",            minXP: 60000 },   // ~545 trận (~9 tháng)
    { level: 10, name: "Người Gieo Hạt",        minXP: 85000 },   // ~770 trận (~1 năm)
    { level: 11, name: "Sứ Giả Tin Mừng",       minXP: 120000 },  // ~1,100 trận (~1.5 năm)
    { level: 12, name: "Tông Đồ",               minXP: 200000 },  // ~1,800 trận (~2.5 năm)
];

export const getRankByScore = (score) => {
    // Reverse array to find the highest rank the user qualifies for
    const rank = [...RANK_TIERS].reverse().find(tier => score >= tier.minXP);
    return rank ? rank.name : RANK_TIERS[0].name;
};

export const getNextRank = (score) => {
    const currentRankIdx = RANK_TIERS.findIndex(tier => tier.name === getRankByScore(score));
    if (currentRankIdx === -1 || currentRankIdx === RANK_TIERS.length - 1) {
        return null; // Top rank achieved
    }
    return RANK_TIERS[currentRankIdx + 1];
};

export const getProgressToNextRank = (score) => {
    const nextRank = getNextRank(score);
    if (!nextRank) return 100; // 100% completed

    const currentRank = [...RANK_TIERS].reverse().find(tier => score >= tier.minXP);
    const xpIntoCurrentLevel = score - currentRank.minXP;
    const currentLevelLength = nextRank.minXP - currentRank.minXP;

    return Math.floor((xpIntoCurrentLevel / currentLevelLength) * 100);
};

// ══════════════════════════════════════════════
//  XP REWARDS — Chỉ tăng, không bao giờ mất
// ══════════════════════════════════════════════

export const XP_REWARDS = {
    // Solo
    SOLO_COMPLETE:      30,    // Hoàn thành 1 trận solo
    SOLO_CORRECT:       8,     // Mỗi câu đúng (solo) — max 15 câu = 120 XP
    // P2P
    P2P_COMPLETE:       40,    // Hoàn thành trận P2P (cả thắng/thua)
    P2P_WIN_BONUS:      25,    // Thưởng thêm khi thắng P2P
    P2P_CORRECT:        5,     // Mỗi câu đúng (P2P)
    // Bonuses
    DAILY_FIRST_GAME:   15,    // Game đầu tiên trong ngày
    // Streak multipliers (áp dụng cho XP câu đúng)
    STREAK_3_MULTI:     1.3,   // Đúng liên tiếp 3 câu → x1.3
    STREAK_5_MULTI:     1.5,   // Đúng liên tiếp 5 câu → x1.5
};

// ══════════════════════════════════════════════
//  🪙 COINS REWARDS — Tiền tệ lên/xuống cho P2P bet
// ══════════════════════════════════════════════

export const COINS_REWARDS = {
    NEW_USER_BONUS:     500,   // Vốn khởi đầu cho tân user
    SOLO_COMPLETE:      10,    // Hoàn thành trận solo
    SOLO_PERFECT_BONUS: 30,    // Solo đúng 100%
    DAILY_LOGIN:        20,    // Đăng nhập mỗi ngày
    LOGIN_STREAK_7:     100,   // Chuỗi login 7 ngày liên tiếp
    RANK_UP_BONUS:      100,   // Lên rank mới
};

// ══════════════════════════════════════════════
//  🎲 HỆ THỐNG BET COINS CHO P2P
// ══════════════════════════════════════════════
// Mỗi rank có 3 mức bet: Nhẹ / Vừa / Nặng
// Người thắng nhận coins từ đối thủ, người thua mất coins
// Coins không thể âm (sàn = 0)

export const RANK_BETS = [
    { level: 1,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 100,   desc: 'Học hỏi là chính' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 200,   desc: 'Thử thách bản thân' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 400,   desc: 'Liều lĩnh!' },
    ]},
    { level: 2,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 100,   desc: 'Giữ an toàn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 250,   desc: 'Cược vừa đủ' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 500,   desc: 'Tất tay!' },
    ]},
    { level: 3,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 100,   desc: 'Giữ an toàn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 300,   desc: 'Cược vừa đủ' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 600,   desc: 'Liều ăn nhiều' },
    ]},
    { level: 4,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 150,   desc: 'Giữ an toàn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 350,   desc: 'Đánh lớn' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 700,   desc: 'Sinh tử!' },
    ]},
    { level: 5,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 150,   desc: 'Giữ an toàn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 400,   desc: 'Đánh lớn' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 800,   desc: 'Sinh tử!' },
    ]},
    { level: 6,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 200,   desc: 'Giữ an toàn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 500,   desc: 'Leo rank nhanh' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 1000,  desc: 'Tất tay!' },
    ]},
    { level: 7,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 250,   desc: 'Cẩn thận' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 600,   desc: 'Leo rank nhanh' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 1200,  desc: 'Đặt cược lớn' },
    ]},
    { level: 8,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 300,   desc: 'Chắc chắn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 700,   desc: 'Thử lửa' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 1500,  desc: 'Sinh tử!' },
    ]},
    { level: 9,  bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 350,   desc: 'Chắc chắn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 850,   desc: 'Đặt cược lớn' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 1800,  desc: 'Máu lửa!' },
    ]},
    { level: 10, bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 400,   desc: 'Chắc chắn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 1000,  desc: 'Leo rank nhanh' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 2000,  desc: 'Máu lửa!' },
    ]},
    { level: 11, bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 450,   desc: 'Chắc chắn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 1100,  desc: 'Cuộc chiến lớn' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 2200,  desc: 'Sinh tử!' },
    ]},
    { level: 12, bets: [
        { id: 'low',  label: '🕯️ Nhẹ nhàng', coins: 500,   desc: 'Chắc chắn' },
        { id: 'mid',  label: '⚔️ Vừa phải',  coins: 1200,  desc: 'Trận chiến sử thi' },
        { id: 'high', label: '🔥 Quyết liệt', coins: 2500,  desc: 'Trận đấu huyền thoại!' },
    ]},
];

// ══════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════

/**
 * Lấy danh sách bet options cho user, dựa trên rank + coins hiện có.
 * Các bet có coins > coins hiện tại sẽ bị disable (affordable: false).
 */
export const getBetOptions = (currentXP, currentCoins) => {
    const rank = [...RANK_TIERS].reverse().find(t => currentXP >= t.minXP) || RANK_TIERS[0];
    const tierBets = RANK_BETS.find(b => b.level === rank.level)?.bets || RANK_BETS[0].bets;

    return tierBets.map(bet => ({
        ...bet,
        affordable: currentCoins >= bet.coins,
    }));
};

/**
 * Lấy rank level hiện tại
 */
export const getRankLevel = (score) => {
    const rank = [...RANK_TIERS].reverse().find(t => score >= t.minXP) || RANK_TIERS[0];
    return rank.level;
};

/**
 * Validate bet: cả 2 người chơi phải đủ coins
 */
export const validateBet = (betCoins, player1Coins, player2Coins) => {
    if (player1Coins < betCoins) return { valid: false, reason: 'Bạn không đủ 🪙 để đặt mức cược này' };
    if (player2Coins < betCoins) return { valid: false, reason: 'Đối thủ không đủ 🪙 để đặt mức cược này' };
    return { valid: true };
};

/**
 * Tính XP nhận được sau 1 trận
 * @param {Object} params
 * @param {'solo'|'p2p'} params.mode
 * @param {boolean} params.isWin - chỉ dùng cho P2P
 * @param {number} params.correctCount - số câu đúng
 * @param {number} params.maxStreak - chuỗi đúng dài nhất
 * @param {boolean} params.isFirstGameToday
 * @returns {number} totalXP
 */
export const calculateXPReward = ({ mode, isWin = false, correctCount = 0, maxStreak = 0, isFirstGameToday = false }) => {
    let total = 0;

    if (mode === 'solo') {
        total += XP_REWARDS.SOLO_COMPLETE;
        total += correctCount * XP_REWARDS.SOLO_CORRECT;
    } else {
        total += XP_REWARDS.P2P_COMPLETE;
        if (isWin) total += XP_REWARDS.P2P_WIN_BONUS;
        total += correctCount * XP_REWARDS.P2P_CORRECT;
    }

    // Streak bonus (ước tính đơn giản)
    if (maxStreak >= 5) total = Math.round(total * XP_REWARDS.STREAK_5_MULTI);
    else if (maxStreak >= 3) total = Math.round(total * XP_REWARDS.STREAK_3_MULTI);

    if (isFirstGameToday) total += XP_REWARDS.DAILY_FIRST_GAME;

    return total;
};

/**
 * Format number: 1000 → "1.000", 25000 → "25.000"
 */
export const formatNumber = (n) => n.toLocaleString('vi-VN');

