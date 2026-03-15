import { create } from 'zustand';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../config/firebase';
import { getRankByScore } from '../utils/ranks';

const DEFAULT_STATS = {
  solo: { plays: 0, perfects: 0, totalCorrect: 0, totalQuestions: 0 },
  p2p:  { plays: 0, wins: 0, losses: 0, totalCorrect: 0, totalQuestions: 0 },
};

export const useUserStore = create((set, get) => ({
  // State
  uid: null,
  nickname: null,
  globalScore: 0,
  rank: null,
  coins: 0,
  stats: { ...DEFAULT_STATS },

  // Set user sau khi auth xong
  setUser: ({ uid, nickname }) => {
    set({ uid, nickname });
    // Lắng nghe global_score từ Firebase
    const scoreRef = ref(db, `users/${uid}/global_score`);
    onValue(scoreRef, (snap) => {
      const score = snap.val() ?? 0;
      set({ globalScore: score, rank: getRankByScore(score) });
    });
    // Lắng nghe coins
    const coinsRef = ref(db, `users/${uid}/coins`);
    onValue(coinsRef, (snap) => {
      set({ coins: snap.val() ?? 0 });
    });
    // Lắng nghe stats
    const statsRef = ref(db, `users/${uid}/stats`);
    onValue(statsRef, (snap) => {
      const val = snap.val();
      set({ stats: val ? { solo: { ...DEFAULT_STATS.solo, ...val.solo }, p2p: { ...DEFAULT_STATS.p2p, ...val.p2p } } : { ...DEFAULT_STATS } });
    });
  },

  // Cộng XP sau khi kết thúc game
  addXP: async (xp) => {
    const { uid, globalScore } = get();
    if (!uid) return;
    const newScore = globalScore + xp;
    await update(ref(db, `users/${uid}`), { global_score: newScore });
    // onValue listener ở trên sẽ tự cập nhật state
  },

  // Cộng/trừ coins (dương = cộng, âm = trừ)
  addCoins: async (amount) => {
    const { uid, coins } = get();
    if (!uid) return;
    const newCoins = Math.max(0, coins + amount);
    await update(ref(db, `users/${uid}`), { coins: newCoins });
    // onValue listener ở trên sẽ tự cập nhật state
  },

  reset: () => set({ uid: null, nickname: null, globalScore: 0, rank: null, coins: 0, stats: { ...DEFAULT_STATS } }),
}));
