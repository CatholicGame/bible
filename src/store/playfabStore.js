import { create } from 'zustand';
import { loginWithCustomID, loginWithEmail, registerWithEmail, getUserData, updateUserData, updateDisplayName, forgetCredentials, updateStatisticsV2, getLeaderboardV2, getLeaderboardAroundEntityV2 } from '../config/playfab';
import { getQuestionsForGame } from '../utils/questionManager';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Leaderboard stat names for PinnacleGame
const PINNACLE_STATS = {
  daily:   'PinnacleScore_Daily',
  weekly:  'PinnacleScore_Weekly',
  monthly: 'PinnacleScore_Monthly',
  allTime: 'PinnacleScore_AllTime',
};

// Composite points per game based on highest level reached
// Q15 complete: +1,000,000 | Q14 reached: +1,000 | Q13 reached: +1 | below: 0
function calcPinnaclePoints(levelIndex, isQ15Complete) {
  if (isQ15Complete) return 1_000_000;  // answered all 15 correctly
  if (levelIndex >= 13) return 1_000;   // got to Q14 or Q15 but didn't complete
  if (levelIndex >= 12) return 1;       // got to Q13
  return 0;
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
  error: null,

  // ── Pinnacle Leaderboard ──
  pinnacleLeaderboard: [],
  pinnaclePlayerRank: null,
  pinnacleLeaderboardLoading: false,
  pinnacleActiveTab: 'daily',
  hallOfFame: [],            // top achievers for header slider
  hallOfFameLoading: false,

  // ── Login ──
  login: async (customNickname) => {
    set({ isLoading: true, error: null });
    try {
      const deviceId = getDeviceId();
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

      // Get display name and profile fields
      const displayName = data.InfoResultPayload?.PlayerProfile?.DisplayName;
      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;

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
        error: null,
      });

      console.log(`[PlayFab] Guest login: ${playFabId}, answered: ${answeredQuestions.length} questions`);
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

      set({
        isLoggedIn: true,
        isLoading: false,
        playFabId,
        nickname: displayName || email,
        authMethod: 'email',
        answeredQuestions: [],
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

      const displayName = data.InfoResultPayload?.PlayerProfile?.DisplayName;
      const giaoxu = userData?.GiaoXu?.Value || null;
      const hat = userData?.Hat?.Value || null;
      const giaophan = userData?.GiaoPhan?.Value || null;
      const tinhthanh = userData?.TinhThanh?.Value || null;

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
        error: null,
      });

      console.log(`[PlayFab] Email login: ${playFabId}, answered: ${answeredQuestions.length}`);
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
        error: null,
      });

      console.log(`[PlayFab] Google login via Firebase: ${playFabId}`);
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

  // ── Save Pinnacle composite score ──
  savePinnacleCompositeScore: async (levelIndex, isQ15Complete) => {
    const points = calcPinnaclePoints(levelIndex, isQ15Complete);
    if (points <= 0) return;
    try {
      await updateStatisticsV2([
        { Name: PINNACLE_STATS.daily,   Value: points },
        { Name: PINNACLE_STATS.weekly,  Value: points },
        { Name: PINNACLE_STATS.monthly, Value: points },
        { Name: PINNACLE_STATS.allTime, Value: points },
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
        getLeaderboardV2(statName, 10),
        getLeaderboardAroundEntityV2(statName, 3),
      ]);

      // Parse top 10 entries
      const entries = (topData?.Rankings || []).map(e => ({
        position: e.Rank,
        displayName: e.Entity?.DisplayName || e.Entity?.Id?.slice(-6) || '???',
        score: e.Statistics?.[0]?.Value ?? e.Score ?? 0,
        entityId: e.Entity?.Id,
      }));

      // Find player's own rank — PlayFab returns current player at center of around-entity response
      let playerRank = null;
      if (aroundData?.Rankings && aroundData.Rankings.length > 0) {
        const mid = aroundData.Rankings[Math.floor(aroundData.Rankings.length / 2)];
        playerRank = {
          position: mid.Rank,
          score: mid.Statistics?.[0]?.Value ?? mid.Score ?? 0,
        };
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
      // Get top 10 from AllTime leaderboard
      const data = await getLeaderboardV2(PINNACLE_STATS.allTime, 10);
      const entries = (data?.Rankings || []).map(e => {
        const score = e.Statistics?.[0]?.Value ?? e.Score ?? 0;
        // Decode composite score back to readable achievement
        let achievement;
        if (score >= 1_000_000) {
          const q15Count = Math.floor(score / 1_000_000);
          achievement = `${q15Count}× Q15 ✅`;
        } else if (score >= 1_000) {
          const q14Count = Math.floor(score / 1_000);
          achievement = `${q14Count}× Q14`;
        } else {
          achievement = `${score}× Q13`;
        }
        return {
          displayName: e.Entity?.DisplayName || '???',
          avatarUrl: e.Profile?.AvatarUrl || null,
          achievement,
          score,
          rank: e.Rank,
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
      error: null,
    });
  },
}));
