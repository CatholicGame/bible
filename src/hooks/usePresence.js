import { useEffect } from 'react';
import { ref, update, onDisconnect, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import { useUserStore } from '../store/userStore';

/**
 * Hook quản lý trạng thái online/offline của player trong phòng.
 * Dùng Firebase onDisconnect để tự động set isOnline = false khi mất kết nối.
 *
 * @param {string|null} roomId - null nếu chưa vào phòng
 * @param {(opponentOnline: boolean) => void} onOpponentOffline - callback khi đối thủ mất kết nối
 */
export function usePresence(roomId, onOpponentOffline) {
  const { uid } = useUserStore();

  useEffect(() => {
    if (!roomId || !uid) return;

    const myPresenceRef = ref(db, `rooms/${roomId}/players/${uid}`);

    // Set mình online
    update(myPresenceRef, { isOnline: true, lastSeen: Date.now() });

    // Auto set offline khi disconnect
    onDisconnect(ref(db, `rooms/${roomId}/players/${uid}/isOnline`)).set(false);

    // Dọn dẹp khi unmount
    return () => {
      update(myPresenceRef, { isOnline: false });
    };
  }, [roomId, uid]);

  // Lắng nghe players để detect đối thủ offline
  useEffect(() => {
    if (!roomId || !uid || !onOpponentOffline) return;

    const playersRef = ref(db, `rooms/${roomId}/players`);
    return onValue(playersRef, (snap) => {
      const players = snap.val() ?? {};
      const opponentEntry = Object.entries(players).find(([pUid]) => pUid !== uid);
      if (opponentEntry) {
        const [, opponentData] = opponentEntry;
        if (opponentData.isOnline === false) {
          onOpponentOffline();
        }
      }
    });
  }, [roomId, uid, onOpponentOffline]);
}
