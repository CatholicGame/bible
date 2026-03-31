import { ref, set, update, get, onValue, remove, onDisconnect } from 'firebase/database';
import { db, auth } from '../config/firebase';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';
import RAW_PUZZLES from '../data/crossword_puzzles.json';

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
   * @param {string} gameType
   * @param {number} wager - số coin cược (mỗi bên phải có ít nhất số này để vào phòng)
   * @returns {string} PIN 6 số
   */
  const createRoom = async (gameType, wager = 100) => {
    const pin = generatePin();
    const roomRef = ref(db, `rooms/${pin}`);

    await set(roomRef, {
      gameType,
      mode: 'p2p',
      isPrivate: true,
      status: 'waiting',
      wager,                          // ← lưu số coin cược
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

    onDisconnect(ref(db, `rooms/${pin}/players/${uid}/isOnline`)).set(false);

    setRoom(pin, 'host');
    return pin;
  };

  /**
   * Vào phòng bằng PIN (Guest)
   * Check coin BEFORE writing — nếu guests không đủ coin sẽ không ghi vào phòng.
   * @param {string} pin
   * @param {number} myCoins - số coin hiện tại của guest (từ playfabStore)
   * @returns {{ success: boolean, error?: string, roomData?: object, wager?: number }}
   */
  const joinRoom = async (pin, myCoins = 0) => {
    const roomRef = ref(db, `rooms/${pin}`);
    const snap = await get(roomRef);

    if (!snap.exists()) return { success: false, error: 'Mã phòng không hợp lệ.' };

    const room = snap.val();
    if (room.status === 'playing') return { success: false, error: 'Trận đấu đã bắt đầu.' };
    if (room.status === 'finished') return { success: false, error: 'Phòng này đã kết thúc.' };
    if (room.guestUid) return { success: false, error: 'Phòng đã có người.' };
    if (room.hostUid === uid) return { success: false, error: 'Bạn là chủ phòng này.' };

    // ── Kiểm tra coin cược ──
    const wager = room.wager ?? 0;
    if (wager > 0 && myCoins < wager) {
      // Trả về insufficient_coins — không ghi vào phòng
      return { success: false, error: 'insufficient_coins', wager, myCoins };
    }

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
    return { success: true, roomData: room, wager };
  };

  /**
   * Đánh dấu mình sẵn sàng
   * @param {string} roomId
   * @param {string[]} playedCrosswordIds - danh sách puzzle ID đã chơi của player này
   * @param {string} authMethod - 'guest' | 'email' | 'google'
   */
  const setReady = async (roomId, playedCrosswordIds = [], authMethod = 'guest') => {
    await update(ref(db, `rooms/${roomId}/players/${uid}`), {
      isReady: true,
      lastSeen: Date.now(),
      // Chỉ ghi playedCrosswordIds nếu đã đăng nhập chính thức
      playedCrosswordIds: authMethod !== 'guest' ? (playedCrosswordIds ?? []) : null,
      authMethod,
    });
  };

  /**
   * Bắt đầu game (chỉ Host gọi)
   * Tự động chọn puzzleId phù hợp cho crossword P2P
   */
  const startGame = async (roomId, gameType) => {
    let updatePayload = { status: 'playing' };

    if (gameType === 'crossword') {
      // Đọc thông tin players để chọn puzzle
      const snap = await get(ref(db, `rooms/${roomId}/players`));
      const players = snap.val() ?? {};

      const playerEntries = Object.values(players);
      const anyGuest = playerEntries.some(p => p.authMethod === 'guest' || p.authMethod == null);

      let selectedPuzzle;
      if (anyGuest) {
        // Có guest → random
        selectedPuzzle = RAW_PUZZLES[Math.floor(Math.random() * RAW_PUZZLES.length)];
      } else {
        // Cả 2 đã đăng nhập → tìm puzzle chưa ai chơi, index nhỏ nhất
        const playedByAll = playerEntries.reduce((acc, p) => {
          (p.playedCrosswordIds ?? []).forEach(id => acc.add(id));
          return acc;
        }, new Set());

        selectedPuzzle = RAW_PUZZLES.find(p => !playedByAll.has(p.id));
        // Đã hết tất cả → reset, chọn từ đầu
        if (!selectedPuzzle) selectedPuzzle = RAW_PUZZLES[0];
      }

      updatePayload.puzzleId = selectedPuzzle.id;
    }

    await update(ref(db, `rooms/${roomId}`), updatePayload);
  };

  /**
   * Rời phòng / cleanup
   * @param {boolean} forfeit - true nếu bỏ cuộc giữa chừng (thua)
   */
  const leaveRoom = async (roomId, myRole, forfeit = false) => {
    if (forfeit) {
      // Ghi forfeit signal để đối thủ biết bạn bỏ cuộc
      try {
        await update(ref(db, `rooms/${roomId}`), {
          forfeit: { uid, nickname: nickname || 'Người chơi', timestamp: Date.now() },
        });
      } catch (_) {}
      // Ngắn delay để Firebase kịp ghi trước khi xóa
      await new Promise(r => setTimeout(r, 300));
    }
    if (myRole === 'host') {
      await remove(ref(db, `rooms/${roomId}`));
    } else {
      await update(ref(db, `rooms/${roomId}`), {
        guestUid: null,
        [`players/${uid}`]: null,
      });
    }
    resetRoom();
  };

  /**
   * Gửi lời mời chơi tiếp (rematch)
   * @param {string} roomId
   * @param {string} toUid - uid đối thủ
   * @param {number} puzzleId - câu đố mới
   */
  const requestRematch = async (roomId, toUid, puzzleId) => {
    await update(ref(db, `rooms/${roomId}`), {
      rematchRequest: {
        fromUid: uid,
        fromName: nickname || 'Người chơi',
        toUid,
        status: 'pending',
        puzzleId,
        timestamp: Date.now(),
      },
    });
  };

  /**
   * Chấp nhận rematch — reset phòng, chọn puzzle mới
   */
  const acceptRematch = async (roomId, puzzleId) => {
    await update(ref(db, `rooms/${roomId}`), {
      status: 'playing',
      puzzleId,
      progress: {},
      forfeit: null,
      'rematchRequest/status': 'accepted',
    });
  };

  /**
   * Từ chối rematch
   */
  const declineRematch = async (roomId) => {
    await update(ref(db, `rooms/${roomId}`), {
      'rematchRequest/status': 'declined',
    });
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

  return { createRoom, joinRoom, setReady, startGame, leaveRoom, watchRoom, requestRematch, acceptRematch, declineRematch };
}
