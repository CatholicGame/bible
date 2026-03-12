// src/utils/ranks.js

export const RANK_TIERS = [
    { level: 1, name: "Người Tìm Hiểu", minXP: 0 },
    { level: 2, name: "Dự Tòng", minXP: 10000 },
    { level: 3, name: "Chiên Con", minXP: 30000 },
    { level: 4, name: "Thiên Thần Nhỏ", minXP: 60000 },
    { level: 5, name: "Thiếu Nhi Thánh Thể", minXP: 100000 },
    { level: 6, name: "Lên Đường", minXP: 150000 },
    { level: 7, name: "Người Phục Vụ", minXP: 250000 },
    { level: 8, name: "Môn Đệ", minXP: 400000 },
    { level: 9, name: "Chứng Nhân", minXP: 600000 },
    { level: 10, name: "Người Gieo Hạt", minXP: 850000 },
    { level: 11, name: "Sứ Giả Tin Mừng", minXP: 1200000 },
    { level: 12, name: "Tông Đồ", minXP: 2000000 }
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
