import { create } from 'zustand';
import { loginWithCustomID, loginWithEmail, registerWithEmail, getUserData, updateUserData, updateDisplayName, updateAvatarUrl, forgetCredentials, updatePlayerStatistics, getLeaderboard, getLeaderboardSilent, getLeaderboardAroundPlayer, getPlayerProfile } from '../config/playfab';

// XP leaderboard stat names — 4 periods (must match PlayFab stat config)
const XP_STATS = {
  daily:   'GlobalScore_XP_Daily',
  weekly:  'GlobalScore_XP_Weekly',
  monthly: 'GlobalScore_XP_Monthly',
  allTime: 'GlobalScore_XP',        // all-time stat (no reset)
};
import { getQuestionsForGame } from '../utils/questionManager';
import { getRankByScore } from '../utils/ranks';
import { auth, db } from '../config/firebase';
import { ref, increment, update, get, onValue } from 'firebase/database';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Leaderboard stat names for PinnacleGame
const PINNACLE_STATS = {
  daily:   'PinnacleScore_Daily',
  weekly:  'PinnacleScore_Weekly',
  monthly: 'PinnacleScore_Monthly',
  allTime: 'PinnacleScore_AllTime',
};

// Positional encoding — mã hóa để 1 số nguyên đảm bảo lexicographic ranking:
//   Hàng triệu = số lần Q15 | Hàng nghìn = số lần Q10–Q14 | Đơn vị = số lần Q5–Q9
// Đảm bảo: N lần Q15 luôn > bất kỳ số lần Q10 nào (cần >999,999 ván Q10 mới bằng 1 Q15)
function calcPinnaclePoints(levelIndex, isQ15Complete) {
  if (levelIndex < 4) return 0;         // Q1–Q4: không gửi
  if (isQ15Complete) return 1_000_000;  // Q15: hàng triệu
  if (levelIndex >= 9) return 1_000;    // Q10–Q14: hàng nghìn
  return 1;                             // Q5–Q9: đơn vị
}

/**
 * PlayFab Store — Quản lý PlayFab auth + player data
 *
 * Chức năng:
 * 1. Login với Custom ID (device-based)
 * 2. Load/Save danh sách câu hỏi đã trả lời
 * 3. Rút câu hỏi mới cho mỗi ván chơi
 */

// Helper: generate or retrieve a persistent device ID
function getDeviceId() {
  let id = localStorage.getItem('playfab_device_id');
  if (!id) {
    id = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('playfab_device_id', id);
  }
  return id;
}

export const usePlayFabStore = create((set, get) => ({
  // ── State ──
  isLoggedIn: false,
  isLoading: false,
  playFabId: null,
  nickname: null,
  authMethod: null,
  avatarUrl: null,
  giaoxu: null,          // Giáo xứ
  hat: null,             // Hạt (giáo hạt)
  giaophan: null,        // Giáo phận
  tinhthanh: null,       // Tỉnh thành
  answeredQuestions: [],
  currentQuestions: [],
  playedCrosswordIds: [],   // IDs của crossword puzzle đã chơi
  globalScore: 0,
  coins: 0,
  rank: null,
  stats: { solo: { plays: 0, perfects: 0, totalCorrect: 0, totalQuestions: 0 }, p2p: { plays: 0, wins: 0, losses: 0, forfeits: 0, totalCorrect: 0, totalQuestions: 0 } },
  // Per-game breakdown: { millionaire: { xp, coins, plays }, crossword: { xp, coins, plays } }
  gameStats: {},
  error: null,

  // ── Rosary Offering (Dâng Hoa) ──
  rosaryToday: 0,
  rosaryDate: null,
  rosaryTotal: 0,
  rosaryGlobal: 0,

  // ── Pinnacle Leaderboard ──
  pinnacleLeaderboard: [],
  pinnaclePlayerRank: null,
  pinnacleLeaderboardLoading: false,
  pinnacleActiveTab: 'daily',
  hallOfFame: [],            // top achievers for header slider
  hallOfFameLoading: false,
  pinnaclePlayerCount: 0,    // unique player count
  pinnacleMyVote: null,      // null | 'like' | 'dislike' — vote của player này
  pinnacleVoteCounts: { like: 0, dislike: 0 }, // tổng vote (xấp xỉ từ stats)

  // ── XP Leaderboard ──
  xpLeaderboard: [],
  xpLeaderboardLoading: false,
  xpPlayerRank: null,
  xpActiveTab: 'allTime',

  // ── Crossword Vote ──
  crosswordMyVote: null,     // null | 'like' | 'dislike'
  crosswordVoteCounts: { like: 0, dislike: 0 },

  // ── Login ──
  login: async (customNickname) => {
    // Guard: skip if already logged-in state is set or login is in progress
    const s = get();
    if (s.isLoggedIn || s.isLoading) return true;

    set({ isLoading: true, error: null });
    try {
      const deviceId = getDeviceId();
      localStorage.setItem('pf_last_login', String(Date.now()));
      const data = await loginWithCustomID(deviceId);

      const playFabId = data.PlayFabId;

      // Extract answered questions from login response
      let answeredQuestions = [];
      const userData = data.InfoResultPayload?.UserData;
      if (userData?.AnsweredQuestions?.Value) {
        try {
          answeredQuestions = JSON.parse(userData.AnsweredQuestions.Value);
        } catch (e) {
          console.warn('[PlayFab] Failed to parse AnsweredQuestions', e);
          answeredQuestions = [];
        }
      }

      // Guest: load crossword history from localStorage
      let playedCrosswordIds = [];
      try {
        playedCrosswordIds = JSON.parse(localStorage.getItem('crossword_played_guest') || '[]');
      } catch (_) {}

      // Get display name and profile fields
      const displayName = data.InfoResultPayload?.PlayerProfile?.DisplayName;
      const avatarUrl = data.InfoResultPayload?.PlayerProfile?.AvatarUrl || null;
      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;
      let globalScore = parseInt(userData?.GlobalScore?.Value) || 0;
      let coins = parseInt(userData?.Coins?.Value) || 0;
      let stats = null;
      if (userData?.Stats?.Value) { try { stats = JSON.parse(userData.Stats.Value); } catch (_) {} }

      if (data.NewlyCreated) {
        coins = 500;
        try { await updateUserData({ Coins: '500', GlobalScore: '0' }); } catch (_) {}
      }

      // Rosary data
      const rosaryTotal = parseInt(userData?.RosaryTotal?.Value) || 0;
      const rosaryGlobal = parseInt(userData?.RosaryGlobal?.Value) || 0;
      const rosaryDate = userData?.RosaryDate?.Value || null;
      const rosaryToday = parseInt(userData?.RosaryToday?.Value) || 0;
      // Auto-reset if different day
      const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
      const effectiveRosaryToday = rosaryDate === todayStr ? rosaryToday : 0;

      const pinnacleMyVote = userData?.PinnacleMyVote?.Value || null;
      const crosswordMyVote = userData?.CrosswordMyVote?.Value || null;

      // GameStats per game
      let gameStats = {};
      if (userData?.GameStats?.Value) {
        try { gameStats = JSON.parse(userData.GameStats.Value); } catch (_) {}
      }

      set({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName || customNickname || 'Người chơi',
        authMethod: 'guest',
        avatarUrl,
        giaoxu,
        hat,
        giaophan,
        tinhthanh,
        answeredQuestions,
        playedCrosswordIds,
        globalScore,
        coins,
        rank: getRankByScore(globalScore),
        ...(stats ? { stats } : {}),
        gameStats,
        rosaryToday: effectiveRosaryToday,
        rosaryDate: todayStr,
        rosaryTotal,
        rosaryGlobal,
        pinnacleMyVote,
        crosswordMyVote,
        error: null,
      });

      console.log(`[PlayFab] Guest login: ${playFabId}, XP: ${globalScore}, coins: ${coins}, answered: ${answeredQuestions.length}`);
      return true;
    } catch (error) {
      set({ isLoading: false, error: error?.errorMessage || 'Login failed' });
      console.error('[PlayFab] Login failed', error);
      return false;
    }
  },

  // ── Restore Session ──
  restoreSession: async () => {
    const s = get();
    if (s.isLoggedIn || s.isLoading) return true;
    const ticket = localStorage.getItem('pf_session');
    if (!ticket) return false;

    set({ isLoading: true, error: null });
    try {
      const [profileReq, dataReq] = await Promise.all([
        getPlayerProfile(),
        getUserData()
      ]);
      const data = dataReq.Data || {};
      let answeredQuestions = [];
      if (data.AnsweredQuestions?.Value) {
        try { answeredQuestions = JSON.parse(data.AnsweredQuestions.Value); } catch (_) {}
      }
      let playedCrosswordIds = [];
      if (data.PlayedCrosswordIds?.Value) {
        try { playedCrosswordIds = JSON.parse(data.PlayedCrosswordIds.Value); } catch (_) {}
      }
      const giaoxu = data.GiaoXu?.Value || null;
      const hat = data.Hat?.Value || null;
      const giaophan = data.GiaoPhan?.Value || null;
      const tinhthanh = data.TinhThanh?.Value || null;
      const globalScore = parseInt(data.GlobalScore?.Value) || 0;
      const coins = parseInt(data.Coins?.Value) || 0;
      const nickname = profileReq.PlayerProfile?.DisplayName || 'Người chơi';
      const playFabId = profileReq.PlayerProfile?.PlayerId;
      // Ưu tiên AvatarUrl từ PlayFab, fallback về localStorage (Google photo)
      const avatarUrl = profileReq.PlayerProfile?.AvatarUrl
        || localStorage.getItem('pf_avatar_url')
        || null;

      // Rosary data — auto-reset if different day
      const rosaryTotal = parseInt(data.RosaryTotal?.Value) || 0;
      const rosaryDate = data.RosaryDate?.Value || null;
      const rosaryToday = parseInt(data.RosaryToday?.Value) || 0;
      const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
      const effectiveRosaryToday = rosaryDate === todayStr ? rosaryToday : 0;

      const pinnacleMyVote = data.PinnacleMyVote?.Value || null;

      // GameStats per game
      let gameStats = {};
      if (data.GameStats?.Value) {
        try { gameStats = JSON.parse(data.GameStats.Value); } catch (_) {}
      }

      set({
        isLoggedIn: true, isLoading: false,
        playFabId, nickname, authMethod: 'restored',
        answeredQuestions, playedCrosswordIds,
        globalScore, coins, rank: getRankByScore(globalScore),
        giaoxu, hat, giaophan, tinhthanh, avatarUrl,
        gameStats,
        rosaryToday: effectiveRosaryToday,
        rosaryDate: todayStr,
        rosaryTotal,
        pinnacleMyVote,
        error: null,
      });

      console.log(`[PlayFab] Session restored: ${playFabId}, XP: ${globalScore}, coins: ${coins}`);
      return true;
    } catch (error) {
      console.warn('[PlayFab] Restore failed, token may be expired', error);
      forgetCredentials();
      set({ isLoading: false });
      return false;
    }
  },

  // ── Email Register ──
  registerWithEmail: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerWithEmail(email, password, displayName);
      const playFabId = data.PlayFabId;

      // Set display name after registration
      if (displayName) {
        try { await updateDisplayName(displayName); } catch (_) {}
      }

      // Init coins for new user
      try { await updateUserData({ Coins: '500', GlobalScore: '0' }); } catch (_) {}

      set({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName || email,
        authMethod: 'email',
        answeredQuestions: [],
        globalScore: 0,
        coins: 500,
        rank: getRankByScore(0),
        error: null,
      });

      console.log(`[PlayFab] Registered: ${playFabId}`);
      return { success: true };
    } catch (error) {
      const msg = error?.errorMessage || 'Đăng ký thất bại';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── Email Login ──
  loginWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginWithEmail(email, password);
      const playFabId = data.PlayFabId;

      // Extract answered questions
      let answeredQuestions = [];
      const userData = data.InfoResultPayload?.UserData;
      if (userData?.AnsweredQuestions?.Value) {
        try { answeredQuestions = JSON.parse(userData.AnsweredQuestions.Value); } catch (_) {}
      }

      // Extract crossword history
      let playedCrosswordIds = [];
      if (userData?.PlayedCrosswordIds?.Value) {
        try { playedCrosswordIds = JSON.parse(userData.PlayedCrosswordIds.Value); } catch (_) {}
      }

      const displayName = data.InfoResultPayload?.PlayerProfile?.DisplayName;
      const avatarUrl = data.InfoResultPayload?.PlayerProfile?.AvatarUrl || null;
      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;
      const globalScore = parseInt(userData?.GlobalScore?.Value) || 0;
      const coins = parseInt(userData?.Coins?.Value) || 0;
      let stats = null;
      if (userData?.Stats?.Value) { try { stats = JSON.parse(userData.Stats.Value); } catch (_) {} }

      const pinnacleMyVote = userData?.PinnacleMyVote?.Value || null;
      const crosswordMyVote = userData?.CrosswordMyVote?.Value || null;

      // GameStats per game
      let gameStats = {};
      if (userData?.GameStats?.Value) {
        try { gameStats = JSON.parse(userData.GameStats.Value); } catch (_) {}
      }

      set({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName || email,
        authMethod: 'email',
        avatarUrl,
        giaoxu,
        hat,
        giaophan,
        tinhthanh,
        answeredQuestions,
        playedCrosswordIds,
        globalScore,
        coins,
        rank: getRankByScore(globalScore),
        ...(stats ? { stats } : {}),
        gameStats,
        pinnacleMyVote,
        crosswordMyVote,
        error: null,
      });

      console.log(`[PlayFab] Email login: ${playFabId}, XP: ${globalScore}, coins: ${coins}`);
      return { success: true };
    } catch (error) {
      const msg = error?.errorMessage || 'Đăng nhập thất bại';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── Google Login (Firebase → PlayFab CustomID) ──
  loginWithGoogle: async () => {
    usePlayFabStore.setState({ isLoading: true, error: null });
    try {
      // Step 1: Firebase Google Sign-In popup
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;

      // Step 2: Use Firebase UID as PlayFab Custom ID
      const customId = 'google_' + firebaseUser.uid;
      const data = await loginWithCustomID(customId);
      const playFabId = data.PlayFabId;

      // Extract answered questions
      let answeredQuestions = [];
      const userData = data.InfoResultPayload?.UserData;
      if (userData?.AnsweredQuestions?.Value) {
        try { answeredQuestions = JSON.parse(userData.AnsweredQuestions.Value); } catch (_) {}
      }

      // Extract crossword history
      let playedCrosswordIds = [];
      if (userData?.PlayedCrosswordIds?.Value) {
        try { playedCrosswordIds = JSON.parse(userData.PlayedCrosswordIds.Value); } catch (_) {}
      }

      // Use Google display name as nickname
      const displayName = data.InfoResultPayload?.PlayerProfile?.DisplayName
        || firebaseUser.displayName
        || 'Người chơi Google';

      // Save display name to PlayFab if new account
      if (!data.InfoResultPayload?.PlayerProfile?.DisplayName && firebaseUser.displayName) {
        try { await updateDisplayName(firebaseUser.displayName); } catch (_) {}
      }

      // Save Google photo URL as avatar (persist to localStorage để survive F5)
      const photoURL = firebaseUser.photoURL || null;
      if (photoURL) {
        try { localStorage.setItem('pf_avatar_url', photoURL); } catch (_) {}
        // Push avatar URL to PlayFab so it appears in leaderboards
        try { await updateAvatarUrl(photoURL); } catch (_) {}
      }

      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;
      let globalScore = parseInt(userData?.GlobalScore?.Value) || 0;
      let coins = parseInt(userData?.Coins?.Value) || 0;
      let stats = null;
      if (userData?.Stats?.Value) { try { stats = JSON.parse(userData.Stats.Value); } catch (_) {} }

      // If new account, give 500 free coins default
      if (data.NewlyCreated) {
        coins = 500;
        try { await updateUserData({ Coins: '500', GlobalScore: '0' }); } catch (_) {}
      }

      const pinnacleMyVote = userData?.PinnacleMyVote?.Value || null;
      const crosswordMyVote = userData?.CrosswordMyVote?.Value || null;

      // Rosary data — auto-reset if different day
      const rosaryTotal = parseInt(userData?.RosaryTotal?.Value) || 0;
      const rosaryDate  = userData?.RosaryDate?.Value || null;
      const rosaryToday = parseInt(userData?.RosaryToday?.Value) || 0;
      const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
      const effectiveRosaryToday = rosaryDate === todayStr ? rosaryToday : 0;

      // GameStats per game
      let gameStats = {};
      if (userData?.GameStats?.Value) {
        try { gameStats = JSON.parse(userData.GameStats.Value); } catch (_) {}
      }

      usePlayFabStore.setState({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName,
        authMethod: 'google',
        avatarUrl: photoURL,
        giaoxu,
        hat,
        giaophan,
        tinhthanh,
        answeredQuestions,
        playedCrosswordIds,
        globalScore,
        coins,
        rank: getRankByScore(globalScore),
        ...(stats ? { stats } : {}),
        gameStats,
        rosaryToday: effectiveRosaryToday,
        rosaryDate: todayStr,
        rosaryTotal,
        pinnacleMyVote,
        crosswordMyVote,
        error: null,
      });

      console.log(`[PlayFab] Google login: ${playFabId}, XP: ${globalScore}, coins: ${coins}`);
      return { success: true, nickname: displayName };
    } catch (error) {
      // User closed popup
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        usePlayFabStore.setState({ isLoading: false, error: null });
        return { success: false, error: null };
      }
      const msg = error?.errorMessage || error?.message || 'Đăng nhập Google thất bại';
      usePlayFabStore.setState({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── Load answered questions from PlayFab ──
  loadAnsweredQuestions: async () => {
    try {
      const result = await getUserData(['AnsweredQuestions']);

      let answeredQuestions = [];
      const data = result?.Data;
      if (data?.AnsweredQuestions?.Value) {
        try {
          answeredQuestions = JSON.parse(data.AnsweredQuestions.Value);
        } catch (e) {
          answeredQuestions = [];
        }
      }

      set({ answeredQuestions });
      return answeredQuestions;
    } catch (error) {
      console.error('[PlayFab] Failed to load answered questions', error);
      return get().answeredQuestions;
    }
  },

  // ── Save answered questions to PlayFab ──
  saveAnsweredQuestions: async () => {
    const { answeredQuestions } = get();
    try {
      await updateUserData({
        AnsweredQuestions: JSON.stringify(answeredQuestions),
      });
      console.log(`[PlayFab] Saved ${answeredQuestions.length} answered questions`);
      return true;
    } catch (error) {
      console.error('[PlayFab] Failed to save answered questions', error);
      return false;
    }
  },

  // ── Mark crossword puzzle as played ──
  markCrosswordPlayed: async (puzzleId) => {
    const { authMethod } = get();
    set(state => {
      if (state.playedCrosswordIds.includes(puzzleId)) return state;
      const updated = [...state.playedCrosswordIds, puzzleId];
      // Guest: sync to localStorage
      if (authMethod === 'guest') {
        try { localStorage.setItem('crossword_played_guest', JSON.stringify(updated)); } catch (_) {}
      }
      return { playedCrosswordIds: updated };
    });
    // Registered: persist to PlayFab
    if (authMethod !== 'guest') {
      const { playedCrosswordIds } = get();
      try {
        await updateUserData({ PlayedCrosswordIds: JSON.stringify(playedCrosswordIds) });
        console.log(`[CrosswordHistory] Saved ${playedCrosswordIds.length} played puzzles`);
      } catch (e) {
        console.warn('[CrosswordHistory] Failed to save', e);
      }
    }
  },

  // ── Load new game (rút 15 câu hỏi mới) ──
  loadNewGame: () => {
    const { answeredQuestions } = get();
    const { questions, resetLevels } = getQuestionsForGame(answeredQuestions);

    if (resetLevels.length > 0) {
      console.log(`[QuestionManager] Reset pools for levels: ${resetLevels.join(', ')}`);
    }

    set({ currentQuestions: questions });
    return questions;
  },

  // ── Load a host-curated custom set (15 câu, đã convert sang game format) ──
  loadCustomGame: (questions) => {
    set({ currentQuestions: questions });
    return questions;
  },

  // ── Mark a question as answered (local state only, batched save later) ──
  markAnswered: (questionId) => {
    set(state => {
      if (state.answeredQuestions.includes(questionId)) return state;
      return {
        answeredQuestions: [...state.answeredQuestions, questionId],
      };
    });
  },

  // ── Add XP (persist to PlayFab UserData + all 4 Statistics for leaderboard) ──
  addXP: async (xp) => {
    const { globalScore } = get();
    const newScore = globalScore + xp;
    set({ globalScore: newScore, rank: getRankByScore(newScore) });
    try {
      await Promise.all([
        updateUserData({ GlobalScore: String(newScore) }),
        // Write to all 4 XP leaderboard stats simultaneously
        updatePlayerStatistics([
          { StatisticName: XP_STATS.daily,   Value: newScore },
          { StatisticName: XP_STATS.weekly,  Value: newScore },
          { StatisticName: XP_STATS.monthly, Value: newScore },
          { StatisticName: XP_STATS.allTime, Value: newScore },
        ]),
      ]);
      console.log(`[PlayFab] XP updated: ${globalScore} → ${newScore}`);
    } catch (e) {
      console.warn('[PlayFab] Failed to save XP', e);
    }
  },

  // ── Add Per-Game Stats (XP + coins + plays per gameId) ──
  addGameStats: async (gameId, { xp = 0, coins = 0, plays = 1 } = {}) => {
    const current = get().gameStats || {};
    const prev = current[gameId] || { xp: 0, coins: 0, plays: 0 };
    const updated = {
      ...current,
      [gameId]: {
        xp: prev.xp + xp,
        coins: Math.max(0, prev.coins + coins),
        plays: prev.plays + plays,
      },
    };
    set({ gameStats: updated });
    try {
      await updateUserData({ GameStats: JSON.stringify(updated) });
    } catch (e) {
      console.warn('[GameStats] Failed to save', e);
    }
  },

  // ── Record P2P game result: 'win' | 'loss' | 'forfeit' ──
  addGameResult: async (outcome) => {
    const current = get().stats || {};
    const p2p = current.p2p || { plays: 0, wins: 0, losses: 0, forfeits: 0 };
    const updated = {
      ...current,
      p2p: {
        ...p2p,
        plays:    (p2p.plays    || 0) + 1,
        wins:     outcome === 'win'     ? (p2p.wins     || 0) + 1 : (p2p.wins     || 0),
        losses:   outcome === 'loss'   ? (p2p.losses   || 0) + 1 : (p2p.losses   || 0),
        forfeits: outcome === 'forfeit'? (p2p.forfeits || 0) + 1 : (p2p.forfeits || 0),
      },
    };
    set({ stats: updated });
    try {
      await updateUserData({ Stats: JSON.stringify(updated) });
    } catch (e) {
      console.warn('[GameResult] Failed to save', e);
    }
  },

  // ── Add/subtract coins (persist to PlayFab) ──
  addCoins: async (amount) => {
    const { coins } = get();
    const newCoins = Math.max(0, coins + amount);
    set({ coins: newCoins });
    try {
      await updateUserData({ Coins: String(newCoins) });
      console.log(`[PlayFab] Coins updated: ${coins} → ${newCoins}`);
    } catch (e) {
      console.warn('[PlayFab] Failed to save coins', e);
    }
  },

  // ── Save Pinnacle composite score ──
  savePinnacleCompositeScore: async (levelIndex, isQ15Complete) => {
    const points = calcPinnaclePoints(levelIndex, isQ15Complete);
    if (points <= 0) return;
    try {
      await updatePlayerStatistics([
        { StatisticName: PINNACLE_STATS.daily,   Value: points },
        { StatisticName: PINNACLE_STATS.weekly,  Value: points },
        { StatisticName: PINNACLE_STATS.monthly, Value: points },
        { StatisticName: PINNACLE_STATS.allTime, Value: points },
      ]);
      console.log(`[Pinnacle] Saved composite score ${points} (levelIndex=${levelIndex}, q15=${isQ15Complete})`);
    } catch (e) {
      console.warn('[Pinnacle] Failed to save score', e);
    }
  },

  // ── Load leaderboard for a given tab ──
  loadPinnacleLeaderboard: async (tab = 'daily') => {
    const statName = PINNACLE_STATS[tab];
    if (!statName) return;

    set({ pinnacleLeaderboardLoading: true, pinnacleActiveTab: tab });
    try {
      const [topData, aroundData] = await Promise.all([
        getLeaderboard(statName, 10),
        getLeaderboardAroundPlayer(statName, 7),
      ]);

      // V1 response: data.Leaderboard = [{Position (0-indexed), DisplayName, StatValue, ...}]
      const entries = (topData?.Leaderboard || []).map(e => ({
        position: e.Position + 1,
        displayName: e.DisplayName || e.PlayFabId?.slice(-6) || '???',
        score: e.StatValue ?? 0,
        entityId: e.PlayFabId,
        avatarUrl: e.Profile?.AvatarUrl || null,
      }));

      // Find player's rank from around-player response (player is somewhere in the list)
      let playerRank = null;
      const around = aroundData?.Leaderboard || [];
      if (around.length > 0) {
        // The current player's entry will have the same PlayFabId
        // PlayFab centers the list around the player; use the middle entry as fallback
        const midEntry = around[Math.floor(around.length / 2)];
        if (midEntry) {
          playerRank = {
            position: midEntry.Position + 1,
            score: midEntry.StatValue ?? 0,
          };
        }
      }

      set({
        pinnacleLeaderboard: entries,
        pinnaclePlayerRank: playerRank,
        pinnacleLeaderboardLoading: false,
      });
    } catch (e) {
      console.warn('[Pinnacle] Failed to load leaderboard', e);
      set({ pinnacleLeaderboardLoading: false });
    }
  },

  // ── Load Hall of Fame (top achievers for header slider) ──
  loadHallOfFame: async () => {
    set({ hallOfFameLoading: true });
    try {
      const data = await getLeaderboard(PINNACLE_STATS.allTime, 10);
      const entries = (data?.Leaderboard || []).map(e => {
        const score = e.StatValue ?? 0;
        let achievement;
        if (score >= 1_000_000) {
          achievement = `${Math.floor(score / 1_000_000)}× Q15 ✅`;
        } else if (score >= 1_000) {
          achievement = `${Math.floor(score / 1_000)}× Q14`;
        } else {
          achievement = `${score}× Q13`;
        }
        return {
          displayName: e.DisplayName || '???',
          avatarUrl: e.Profile?.AvatarUrl || null,
          achievement,
          score,
          rank: e.Position + 1,
          entityId: e.PlayFabId,
        };
      });
      set({ hallOfFame: entries, hallOfFameLoading: false });
    } catch (e) {
      console.warn('[Pinnacle] Failed to load Hall of Fame', e);
      set({ hallOfFameLoading: false });
    }
  },

  // ── Load XP Leaderboard (tab: 'daily' | 'weekly' | 'monthly' | 'allTime') ──
  loadXPLeaderboard: async (tab = 'allTime') => {
    const statName = XP_STATS[tab];
    if (!statName) return;
    set({ xpLeaderboardLoading: true, xpActiveTab: tab });
    try {
      const [topData, aroundData] = await Promise.all([
        getLeaderboard(statName, 20),
        getLeaderboardAroundPlayer(statName, 5),
      ]);
      const entries = (topData?.Leaderboard || []).map(e => ({
        position: e.Position + 1,
        displayName: e.DisplayName || e.PlayFabId?.slice(-6) || '???',
        xp: e.StatValue ?? 0,
        playFabId: e.PlayFabId,
        avatarUrl: e.Profile?.AvatarUrl || null,
      }));
      let xpPlayerRank = null;
      const around = aroundData?.Leaderboard || [];
      if (around.length > 0) {
        const mid = around[Math.floor(around.length / 2)];
        if (mid) xpPlayerRank = { position: mid.Position + 1, xp: mid.StatValue ?? 0 };
      }
      set({ xpLeaderboard: entries, xpPlayerRank, xpLeaderboardLoading: false });
    } catch (e) {
      console.warn('[XP Leaderboard] Failed to load', e);
      set({ xpLeaderboardLoading: false });
    }
  },

  // ── Save display name ──
  saveDisplayName: async (name) => {
    try {
      await updateDisplayName(name);
      set({ nickname: name });
      // Also update localStorage so App.jsx picks it up
      try {
        const saved = JSON.parse(localStorage.getItem('guestSession') || '{}');
        saved.name = name;
        localStorage.setItem('guestSession', JSON.stringify(saved));
      } catch (_) {}
      console.log('[Profile] Display name saved:', name);
      return true;
    } catch (e) {
      console.warn('[Profile] Failed to save display name', e);
      return false;
    }
  },

  // ── Save profile fields (giaoxu + hat + giaophan + tinhthanh) ──
  saveProfile: async ({ giaoxu, hat, giaophan, tinhthanh }) => {
    try {
      const updates = {};
      if (giaoxu !== undefined) updates.GiaoXu = giaoxu;
      if (hat !== undefined) updates.Hat = hat;
      if (giaophan !== undefined) updates.GiaoPhan = giaophan;
      if (tinhthanh !== undefined) updates.TinhThanh = tinhthanh;
      await updateUserData(updates);
      const stateUpdate = {};
      if (giaoxu !== undefined) stateUpdate.giaoxu = giaoxu;
      if (hat !== undefined) stateUpdate.hat = hat;
      if (giaophan !== undefined) stateUpdate.giaophan = giaophan;
      if (tinhthanh !== undefined) stateUpdate.tinhthanh = tinhthanh;
      set(stateUpdate);
      console.log('[Profile] Saved:', updates);
      return true;
    } catch (e) {
      console.warn('[Profile] Failed to save', e);
      return false;
    }
  },

  // ── Submit Rosary Offering (Dâng Hoa) ──
  // Reward: 1 hạt = 1 Coin + bonus 10 Coin mỏi tràng hoàn chỉnh (50 hạt)
  // Max mỗi ngày: 150 hạt = 150 Coin + 3 tràng × 10 = 30 bonus = 180 Coins
  // Ghi chú bảo mật:
  //   - Chống double-submit sau F5 được xử lý bởi restoreSession (load rosaryToday từ server)
  //   - KHÔNG đọc lại PlayFab ở đây để tránh: (1) PlayFab cache stale, (2) store update mid-animation
  submitRosary: async (hatCount, coinReward) => {
    const { rosaryToday, rosaryTotal, coins } = get();
    const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
    const DAILY_MAX_HAT = 150;

    // Validate daily limit using local store (đã sync chính xác từ server khi login/restoreSession)
    const effectiveToday = get().rosaryDate === todayStr ? rosaryToday : 0;
    const newToday = effectiveToday + hatCount;
    if (newToday > DAILY_MAX_HAT) {
      console.warn('[Rosary] Daily limit exceeded');
      return false;
    }

    const newTotal = rosaryTotal + hatCount;
    const newCoins = coins + coinReward;

    // Update local state ngay lập tức (optimistic) — KHÔNG update ở đây để tránh
    // useEffect trong Modal bị trigger và reset animCoins mid-animation.
    // Store sẽ chỉ update SAU KHI animation hoàn thành (thông qua flag delay 2800ms trong Modal).
    // GHI CHÚ: Thực ra store cần update để canSubmit = false trong lần sau,
    // nhưng không được update coins vì sẽ trigger useEffect trong modal.
    // Giải pháp: update rosaryToday (dùng để validate canSubmit) nhưng để modal tự xử lý animCoins.
    set({
      rosaryToday: newToday,
      rosaryDate: todayStr,
      rosaryTotal: newTotal,
      // coins KHÔNG update ở đây — Modal tự update animCoins qua setTimeout 1300ms
      // Store.coins sẽ được update sau khi animation xong (2800ms delay ở Modal)
    });

    // 1. Persist per-player data to PlayFab
    try {
      await updateUserData({
        RosaryToday: String(newToday),
        RosaryDate: todayStr,
        RosaryTotal: String(newTotal),
        Coins: String(newCoins),
      });
      // Update coins trong store SAU KHI PlayFab đã lưu thành công
      // Lúc này animation đã xong (PlayFab call thường > 1300ms)
      set({ coins: newCoins });
    } catch (e) {
      console.warn('[Rosary] Failed to save PlayFab data', e);
      // Ngay cả khi PlayFab fail, update local coins để UI nhất quán
      set({ coins: newCoins });
    }

    // 2. Atomic increment on Firebase global counter (sum across ALL players)
    try {
      await update(ref(db, 'global'), { rosaryTotal: increment(hatCount) });
      // Read back the new global total
      const snap = await get(ref(db, 'global/rosaryTotal'));
      const newGlobal = snap.val() || 0;
      set({ rosaryGlobal: newGlobal });
      console.log(`[Rosary] Submitted ${hatCount} hạt, +${coinReward} coins. Global: ${newGlobal}`);
    } catch (e) {
      console.warn('[Rosary] Failed to update Firebase global', e);
    }

    return true;
  },

  // ── Subscribe to real-time global rosary total from Firebase ──
  // Returns unsubscribe function. Use inside a useEffect.
  subscribeRosaryGlobal: () => {
    const unsub = onValue(
      ref(db, 'global/rosaryTotal'),
      (snap) => {
        const val = snap.val() || 0;
        usePlayFabStore.setState({ rosaryGlobal: val });
      },
      (err) => { console.warn('[Rosary] onValue error', err); }
    );
    return unsub; // caller must call unsub() on cleanup
  },

  // ── Re-fetch rosary data from PlayFab (cross-device sync) ──
  // Call this when the Rosary modal opens to pick up changes from other devices.
  refreshRosaryData: async () => {
    try {
      const res = await getUserData(['RosaryToday', 'RosaryDate', 'RosaryTotal', 'Coins']);
      const d = res?.Data || {};
      const rosaryTotal = parseInt(d.RosaryTotal?.Value) || 0;
      const rosaryDate  = d.RosaryDate?.Value || null;
      const rosaryToday = parseInt(d.RosaryToday?.Value) || 0;
      const coins       = parseInt(d.Coins?.Value) || 0;
      const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
      const effectiveRosaryToday = rosaryDate === todayStr ? rosaryToday : 0;
      set({
        rosaryToday: effectiveRosaryToday,
        rosaryDate: todayStr,
        rosaryTotal,
        coins,
      });
      console.log(`[Rosary] Refreshed from PlayFab: today=${effectiveRosaryToday}, total=${rosaryTotal}, coins=${coins}`);
    } catch (e) {
      console.warn('[Rosary] Failed to refresh from PlayFab', e);
    }
  },

  // ── Legacy one-time load (kept as fallback) ──
  loadRosaryGlobal: async () => {
    try {
      const snap = await get(ref(db, 'global/rosaryTotal'));
      const val = snap.val() || 0;
      set({ rosaryGlobal: val });
      return val;
    } catch (e) {
      console.warn('[Rosary] Failed to load global', e);
      return 0;
    }
  },

  // ── Track Pinnacle Play (unique player count) ──
  trackPinnaclePlay: async () => {
    try {
      await updatePlayerStatistics([
        { StatisticName: 'PinnaclePlayerCount', Value: 1 },
      ]);
      // Đọc vị trí của player ≈ số người đã chơi
      const res = await getLeaderboardAroundPlayer('PinnaclePlayerCount', 1);
      const entries = res?.Leaderboard || [];
      if (entries.length > 0) {
        const pos = entries[Math.floor(entries.length / 2)]?.Position;
        if (pos != null) set({ pinnaclePlayerCount: pos + 1 });
      }
    } catch (e) {
      console.warn('[Pinnacle] trackPlay failed', e);
    }
  },

  // ── Submit Like / Dislike vote ──
  submitPinnacleVote: async (vote) => {
    const oldVote = get().pinnacleMyVote;
    if (oldVote === vote) return;
    
    // Update UI immediately (optimistic update)
    set(s => {
      const newCounts = { ...s.pinnacleVoteCounts };
      if (oldVote) newCounts[oldVote] = Math.max(0, newCounts[oldVote] - 1);
      newCounts[vote] += 1;
      return { pinnacleMyVote: vote, pinnacleVoteCounts: newCounts };
    });

    try {
      // 1. Save this player's vote to UserData (persists across sessions)
      await updateUserData({ PinnacleMyVote: vote });
      // 2. Write stat = 1 so this player appears in the leaderboard count
      //    Each player has exactly one stat entry, so count = number of unique voters
      const statName = vote === 'like' ? 'PinnacleVoteLike' : 'PinnacleVoteDislike';
      await updatePlayerStatistics([{ StatisticName: statName, Value: 1 }]);
      // LƯU Ý: Không fetch lại leaderboard ngay vì PlayFab có cache (có thể trả về số cũ làm nhảy số)
    } catch (e) {
      console.warn('[Pinnacle] vote save failed', e);
      // Revert UI on failure
      set(s => {
        const revertedCounts = { ...s.pinnacleVoteCounts };
        revertedCounts[vote] = Math.max(0, revertedCounts[vote] - 1);
        if (oldVote) revertedCounts[oldVote] += 1;
        return { pinnacleMyVote: oldVote, pinnacleVoteCounts: revertedCounts };
      });
    }
  },

  // ── Load global vote counts from PlayFab leaderboard ──
  loadPinnacleVoteCounts: async () => {
    const [likeData, dislikeData] = await Promise.all([
      getLeaderboardSilent('PinnacleVoteLike', 100),
      getLeaderboardSilent('PinnacleVoteDislike', 100),
    ]);
    const likes    = likeData?.Leaderboard?.length ?? 0;
    const dislikes = dislikeData?.Leaderboard?.length ?? 0;
    set({ pinnacleVoteCounts: { like: likes, dislike: dislikes } });
  },

  // ── Submit Like / Dislike vote cho Crossword ──
  submitCrosswordVote: async (vote) => {
    const oldVote = get().crosswordMyVote;
    if (oldVote === vote) return;

    // Optimistic UI update
    set(s => {
      const newCounts = { ...s.crosswordVoteCounts };
      if (oldVote) newCounts[oldVote] = Math.max(0, newCounts[oldVote] - 1);
      newCounts[vote] += 1;
      return { crosswordMyVote: vote, crosswordVoteCounts: newCounts };
    });

    try {
      await updateUserData({ CrosswordMyVote: vote });
      const statName = vote === 'like' ? 'CrosswordVoteLike' : 'CrosswordVoteDislike';
      await updatePlayerStatistics([{ StatisticName: statName, Value: 1 }]);
      // Không fetch lại leaderboard ngay vì PlayFab cache
    } catch (e) {
      console.warn('[Crossword] vote save failed', e);
      // Revert UI on failure
      set(s => {
        const revertedCounts = { ...s.crosswordVoteCounts };
        revertedCounts[vote] = Math.max(0, revertedCounts[vote] - 1);
        if (oldVote) revertedCounts[oldVote] += 1;
        return { crosswordMyVote: oldVote, crosswordVoteCounts: revertedCounts };
      });
    }
  },

  // ── Load global crossword vote counts ──
  loadCrosswordVoteCounts: async () => {
    try {
      const [likeData, dislikeData] = await Promise.all([
        getLeaderboardSilent('CrosswordVoteLike', 100),
        getLeaderboardSilent('CrosswordVoteDislike', 100),
      ]);
      const likes    = likeData?.Leaderboard?.length ?? 0;
      const dislikes = dislikeData?.Leaderboard?.length ?? 0;
      set({ crosswordVoteCounts: { like: likes, dislike: dislikes } });
    } catch (e) {
      console.warn('[Crossword] loadVoteCounts failed', e);
    }
  },

  // ── Reset (logout) ──
  reset: () => {
    forgetCredentials();
    try { localStorage.removeItem('pf_avatar_url'); } catch (_) {}
    set({
      isLoggedIn: false,
      isLoading: false,
      playFabId: null,
      nickname: null,
      authMethod: null,
      avatarUrl: null,
      answeredQuestions: [],
      currentQuestions: [],
      playedCrosswordIds: [],
      globalScore: 0,
      coins: 0,
      rank: null,
      stats: { solo: { plays: 0, perfects: 0, totalCorrect: 0, totalQuestions: 0 }, p2p: { plays: 0, wins: 0, losses: 0, totalCorrect: 0, totalQuestions: 0 } },
      error: null,
      rosaryToday: 0,
      rosaryDate: null,
      rosaryTotal: 0,
      rosaryGlobal: 0,
    });
  },
}));
