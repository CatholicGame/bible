import { create } from 'zustand';
import { loginWithCustomID, loginWithEmail, registerWithEmail, getUserData, updateUserData, updateDisplayName, forgetCredentials, updatePlayerStatistics, getLeaderboard, getLeaderboardSilent, getLeaderboardAroundPlayer, getPlayerProfile } from '../config/playfab';
import { getQuestionsForGame } from '../utils/questionManager';
import { getRankByScore } from '../utils/ranks';
import { auth } from '../config/firebase';
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
  stats: { solo: { plays: 0, perfects: 0, totalCorrect: 0, totalQuestions: 0 }, p2p: { plays: 0, wins: 0, losses: 0, totalCorrect: 0, totalQuestions: 0 } },
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

  // ── Login ──
  login: async (customNickname) => {
    // Guard: skip if already logged-in state is set or login is in progress
    const s = get();
    if (s.isLoggedIn || s.isLoading) return true;
    // Guard: skip if sessionTicket already exists in sessionStorage (survives Vite HMR)
    if (sessionStorage.getItem('pf_session')) {
      // Tokens restored — just re-trigger login silently to refresh user data
      // but debounce: avoid double-calling within 10 seconds
      const lastLogin = sessionStorage.getItem('pf_last_login');
      const now = Date.now();
      if (lastLogin && now - parseInt(lastLogin) < 10_000) {
        // Already logged in recently — restore state from next login
        // (let the full login proceed on next hard reload instead)
        console.log('[PlayFab] Skipping duplicate login within 10s');
        return true;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const deviceId = getDeviceId();
      sessionStorage.setItem('pf_last_login', String(Date.now()));
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
      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;
      const globalScore = parseInt(userData?.GlobalScore?.Value) || 0;
      const coins = parseInt(userData?.Coins?.Value) || 0;
      let stats = null;
      if (userData?.Stats?.Value) { try { stats = JSON.parse(userData.Stats.Value); } catch (_) {} }

      // Rosary data
      const rosaryTotal = parseInt(userData?.RosaryTotal?.Value) || 0;
      const rosaryGlobal = parseInt(userData?.RosaryGlobal?.Value) || 0;
      const rosaryDate = userData?.RosaryDate?.Value || null;
      const rosaryToday = parseInt(userData?.RosaryToday?.Value) || 0;
      // Auto-reset if different day
      const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
      const effectiveRosaryToday = rosaryDate === todayStr ? rosaryToday : 0;

      // Pinnacle vote
      const pinnacleMyVote = userData?.PinnacleMyVote?.Value || null;

      set({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName || customNickname || 'Người chơi',
        authMethod: 'guest',
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
        rosaryToday: effectiveRosaryToday,
        rosaryDate: todayStr,
        rosaryTotal,
        rosaryGlobal,
        pinnacleMyVote,
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
      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;
      const globalScore = parseInt(userData?.GlobalScore?.Value) || 0;
      const coins = parseInt(userData?.Coins?.Value) || 0;
      let stats = null;
      if (userData?.Stats?.Value) { try { stats = JSON.parse(userData.Stats.Value); } catch (_) {} }

      const pinnacleMyVote = userData?.PinnacleMyVote?.Value || null;

      set({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName || email,
        authMethod: 'email',
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
        pinnacleMyVote,
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

      // Save Google photo URL as avatar
      const photoURL = firebaseUser.photoURL || null;

      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;
      const globalScore = parseInt(userData?.GlobalScore?.Value) || 0;
      const coins = parseInt(userData?.Coins?.Value) || 0;
      let stats = null;
      if (userData?.Stats?.Value) { try { stats = JSON.parse(userData.Stats.Value); } catch (_) {} }

      const pinnacleMyVote = userData?.PinnacleMyVote?.Value || null;

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
        pinnacleMyVote,
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

  // ── Mark a question as answered (local state only, batched save later) ──
  markAnswered: (questionId) => {
    set(state => {
      if (state.answeredQuestions.includes(questionId)) return state;
      return {
        answeredQuestions: [...state.answeredQuestions, questionId],
      };
    });
  },

  // ── Add XP (persist to PlayFab) ──
  addXP: async (xp) => {
    const { globalScore } = get();
    const newScore = globalScore + xp;
    set({ globalScore: newScore, rank: getRankByScore(newScore) });
    try {
      await updateUserData({ GlobalScore: String(newScore) });
      console.log(`[PlayFab] XP updated: ${globalScore} → ${newScore}`);
    } catch (e) {
      console.warn('[PlayFab] Failed to save XP', e);
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

      // Enrich entries with avatar URLs in parallel (best-effort)
      const playfabIds = entries.map(e => e.entityId).filter(Boolean);
      if (playfabIds.length > 0) {
        const results = await Promise.allSettled(playfabIds.map(id => getPlayerProfile(id)));
        const enriched = entries.map((e, i) => {
          const result = results[i];
          const avatarUrl = result?.status === 'fulfilled'
            ? (result.value?.PlayerProfile?.AvatarUrl || null)
            : null;
          return { ...e, avatarUrl };
        });
        set({ pinnacleLeaderboard: enriched });
      }
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
          avatarUrl: null,
          achievement,
          score,
          rank: e.Position + 1,
        };
      });
      set({ hallOfFame: entries, hallOfFameLoading: false });
    } catch (e) {
      console.warn('[Pinnacle] Failed to load Hall of Fame', e);
      set({ hallOfFameLoading: false });
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
  submitRosary: async (hatCount, coinReward) => {
    const { rosaryToday, rosaryTotal, rosaryGlobal, coins } = get();
    const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString().slice(0, 10);
    const DAILY_MAX = 150;

    // Validate daily limit
    const newToday = rosaryToday + hatCount;
    if (newToday > DAILY_MAX) {
      console.warn('[Rosary] Daily limit exceeded');
      return false;
    }

    const newTotal = rosaryTotal + hatCount;
    const newGlobal = rosaryGlobal + hatCount;
    const newCoins = coins + coinReward;

    // Update local state immediately
    set({
      rosaryToday: newToday,
      rosaryDate: todayStr,
      rosaryTotal: newTotal,
      rosaryGlobal: newGlobal,
      coins: newCoins,
    });

    // Persist to PlayFab
    try {
      await updateUserData({
        RosaryToday: String(newToday),
        RosaryDate: todayStr,
        RosaryTotal: String(newTotal),
        RosaryGlobal: String(newGlobal),
        Coins: String(newCoins),
      });
      console.log(`[Rosary] Submitted ${hatCount} hạt, +${coinReward} coins. Today: ${newToday}/${DAILY_MAX}`);
      return true;
    } catch (e) {
      console.warn('[Rosary] Failed to save', e);
      return false;
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
    if (get().pinnacleMyVote === vote) return;
    // Update UI immediately
    set({ pinnacleMyVote: vote });
    try {
      // 1. Save this player's vote to UserData (persists across sessions)
      await updateUserData({ PinnacleMyVote: vote });
      // 2. Write stat = 1 so this player appears in the leaderboard count
      //    Each player has exactly one stat entry, so count = number of unique voters
      const statName = vote === 'like' ? 'PinnacleVoteLike' : 'PinnacleVoteDislike';
      await updatePlayerStatistics([{ StatisticName: statName, Value: 1 }]);
      // 3. Reload global counts
      await get().loadPinnacleVoteCounts();
    } catch (e) {
      console.warn('[Pinnacle] vote save failed', e);
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

  // ── Reset (logout) ──
  reset: () => {
    forgetCredentials();
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
