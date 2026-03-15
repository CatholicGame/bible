import { ref, update, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';

/**
 * Hook đồng bộ progress trong game giữa 2 player.
 */
export function useGameSync() {
  const { uid } = useUserStore();
  const { setOpponentProgress } = useRoomStore();

  /**
   * Ghi progress của mình lên Firebase
   * @param {string} roomId
   * @param {{ score: number, completedItems: string[], lastUpdated: number }} data
   */
  const updateProgress = (roomId, data) => {
    update(ref(db, `rooms/${roomId}/progress/${uid}`), {
      ...data,
      lastUpdated: Date.now(),
    });
  };

  /**
   * Lắng nghe progress của đối thủ real-time
   * @returns unsubscribe function
   */
  const watchOpponent = (roomId, opponentUid) => {
    const progressRef = ref(db, `rooms/${roomId}/progress/${opponentUid}`);
    return onValue(progressRef, (snap) => {
      setOpponentProgress(snap.val());
    });
  };

  /**
   * Kết thúc game — ghi result và cộng XP
   * Chỉ Host gọi để tránh conflict ghi đồng thời.
   * @param {string} roomId
   * @param {{ winnerUid: string, finalScores: object }} result
   */
  const finishGame = async (roomId, result) => {
    await update(ref(db, `rooms/${roomId}`), {
      status: 'finished',
      result: { ...result, finishedAt: Date.now() },
    });
  };

  return { updateProgress, watchOpponent, finishGame };
}
