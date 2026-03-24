import { create } from 'zustand';

/**
 * UserStore — minimal auth identity store
 * 
 * Chỉ giữ uid + nickname cho Firebase Auth (anonymous auth dùng cho room system).
 * Tất cả game data (XP, coins, stats) đã chuyển sang PlayFab (playfabStore.js).
 */

export const useUserStore = create((set) => ({
  uid: null,
  nickname: null,

  setUser: ({ uid, nickname }) => {
    set({ uid, nickname });
  },

  reset: () => set({ uid: null, nickname: null }),
}));
