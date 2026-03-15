import { ref, set, update, get, onValue, remove, onDisconnect } from 'firebase/database';
import { db, auth } from '../config/firebase';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';

export function useRoom() {
  const { uid: storeUid, nickname } = useUserStore();
  // Fallback: lấy uid từ Firebase Auth trực tiếp nếu store chưa kịp sync
  const uid = storeUid || auth.currentUser?.uid;
  const { setRoom, setRoomData, resetRoom } = useRoomStore();

  // Sinh mã PIN 6 số ngẫu nhiên
  const generatePin = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  /**
   * Tạo phòng mới (Host)
   * @param {string} gameType - 'quiz' | 'crossword' | 'sorting' | ...
   * @returns {string} PIN 6 số
   */
  const createRoom = async (gameType) => {
    const pin = generatePin();
    const roomRef = ref(db, `rooms/${pin}`);

    await set(roomRef, {
      gameType,
      mode: 'p2p',
      isPrivate: true,
      status: 'waiting',
      hostUid: uid,
      guestUid: null,
      createdAt: Date.now(),
      players: {
        [uid]: {
          nickname: nickname || 'Khách',
          isReady: false,
          isOnline: true,
          lastSeen: Date.now(),
        },
      },
      progress: {},
      result: null,
    });

    // onDisconnect: xóa phòng nếu Host disconnect khi đang waiting
    onDisconnect(ref(db, `rooms/${pin}/players/${uid}/isOnline`)).set(false);

    setRoom(pin, 'host');
    return pin;
  };

  /**
   * Vào phòng bằng PIN (Guest)
   * @param {string} pin
   * @returns {{ success: boolean, error?: string, roomData?: object }}
   */
  const joinRoom = async (pin) => {
    const roomRef = ref(db, `rooms/${pin}`);
    const snap = await get(roomRef);

    if (!snap.exists()) return { success: false, error: 'Mã phòng không hợp lệ.' };

    const room = snap.val();
    if (room.status === 'playing') return { success: false, error: 'Trận đấu đã bắt đầu.' };
    if (room.status === 'finished') return { success: false, error: 'Phòng này đã kết thúc.' };
    if (room.guestUid) return { success: false, error: 'Phòng đã có người.' };
    if (room.hostUid === uid) return { success: false, error: 'Bạn là chủ phòng này.' };

    // Ghi guest vào phòng
    await update(roomRef, {
      guestUid: uid,
      [`players/${uid}`]: {
        nickname: nickname || 'Khách',
        isReady: false,
        isOnline: true,
        lastSeen: Date.now(),
      },
    });

    onDisconnect(ref(db, `rooms/${pin}/players/${uid}/isOnline`)).set(false);

    setRoom(pin, 'guest');
    return { success: true, roomData: room };
  };

  /**
   * Đánh dấu mình sẵn sàng
   */
  const setReady = async (roomId) => {
    await update(ref(db, `rooms/${roomId}/players/${uid}`), {
      isReady: true,
      lastSeen: Date.now(),
    });
  };

  /**
   * Bắt đầu game (chỉ Host gọi)
   */
  const startGame = async (roomId) => {
    await update(ref(db, `rooms/${roomId}`), { status: 'playing' });
  };

  /**
   * Rời phòng / cleanup
   */
  const leaveRoom = async (roomId, myRole) => {
    if (myRole === 'host') {
      // Host rời → xóa cả phòng
      await remove(ref(db, `rooms/${roomId}`));
    } else {
      // Guest rời → xóa mình khỏi phòng
      await update(ref(db, `rooms/${roomId}`), {
        guestUid: null,
        [`players/${uid}`]: null,
      });
    }
    resetRoom();
  };

  /**
   * Lắng nghe toàn bộ room real-time
   * @returns unsubscribe function
   */
  const watchRoom = (roomId, callback) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    return onValue(roomRef, (snap) => {
      callback(snap.val());
      setRoomData(snap.val());
    });
  };

  return { createRoom, joinRoom, setReady, startGame, leaveRoom, watchRoom };
}
