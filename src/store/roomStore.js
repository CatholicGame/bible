import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  // State
  roomId: null,            // PIN (6 số) hoặc generated ID
  roomData: null,          // Toàn bộ room object từ Firebase
  myRole: null,            // 'host' | 'guest'
  opponentProgress: null,  // { score, completedItems } của đối thủ

  // Actions
  setRoom: (roomId, myRole) => set({ roomId, myRole }),
  setRoomData: (roomData) => set({ roomData }),
  setOpponentProgress: (progress) => set({ opponentProgress: progress }),

  resetRoom: () => set({
    roomId: null,
    roomData: null,
    myRole: null,
    opponentProgress: null,
  }),
}));
