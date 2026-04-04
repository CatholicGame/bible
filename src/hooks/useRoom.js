import { ref, set, update, get, onValue, remove, push, onDisconnect } from 'firebase/database';
import { db, auth } from '../config/firebase';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';
import { usePlayFabStore } from '../store/playfabStore';
import RAW_PUZZLES from '../data/crossword_puzzles.json';

export function useRoom() {
  const { uid: storeUid, nickname } = useUserStore();
  // Fallback: lấy uid từ Firebase Auth trực tiếp nếu store chưa kịp sync
  const uid = storeUid || auth.currentUser?.uid;
  const { setRoom, setRoomData, resetRoom } = useRoomStore();
  // Lấy avatarUrl từ playfabStore (Google photo URL)
  const avatarUrl = usePlayFabStore.getState().avatarUrl || null;

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

    const myAvatarUrl = usePlayFabStore.getState().avatarUrl || null;
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
          avatarUrl: myAvatarUrl,     // ← lưu avatar để đối thủ hiển thị
          coins: usePlayFabStore.getState().coins ?? 0,
          rank: usePlayFabStore.getState().rank || 'Tân Binh',
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
    if (room.locked)           return { success: false, error: 'Phòng đã khoá (2 người đã vào phòng).' };
    if (room.status === 'playing')  return { success: false, error: 'Trận đấu đã bắt đầu.' };
    if (room.status === 'finished') return { success: false, error: 'Phòng này đã kết thúc.' };
    if (room.guestUid)         return { success: false, error: 'Phòng đã có người.' };
    if (room.hostUid === uid)  return { success: false, error: 'Bạn là chủ phòng này.' };

    // ── Kiểm tra coin cược ──
    const wager = room.wager ?? 0;
    if (wager > 0 && myCoins < wager) {
      return { success: false, error: 'insufficient_coins', wager, myCoins };
    }

    // Ghi guest vào phòng + khoá phòng ngay lập tức
    const myAvatarUrl = usePlayFabStore.getState().avatarUrl || null;
    await update(roomRef, {
      guestUid: uid,
      locked: true,          // ← khoá phòng — không cho ai khác join
      [`players/${uid}`]: {
        nickname: nickname || 'Khách',
        avatarUrl: myAvatarUrl,     // ← lưu avatar để đối thủ hiển thị
        coins: myCoins,             // lưu số dư xu hiện tại
        rank: usePlayFabStore.getState().rank || 'Tân Binh',
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
   * Trừ coin cược từ player hiện tại (idempotent — check betCharged trước)
   * @param {string} roomId
   * @param {number} wager - số coin cần trừ
   */
  const chargeBet = async (roomId, wager) => {
    if (!wager || wager <= 0) return;
    // Idempotent: nếu đã charge rồi thì bỏ qua
    const chargedSnap = await get(ref(db, `rooms/${roomId}/players/${uid}/betCharged`));
    if (chargedSnap.val() === true) return;
    // Trừ coin
    const { addCoins } = usePlayFabStore.getState();
    await addCoins(-wager);
    // Đánh dấu đã charge trong Firebase
    await update(ref(db, `rooms/${roomId}/players/${uid}`), { betCharged: true });
  };

  /**
   * Ghi kết quả + award pot cho winner
   * @param {string} roomId
   * @param {string} winnerUid - uid của người thắng (hoặc 'draw')
   * @param {number} pot - tổng coin thưởng
   * @param {boolean} isDraw - nếu hòa thì true
   */
  const awardWinner = async (roomId, winnerUid, pot, isDraw = false) => {
    try {
      await update(ref(db, `rooms/${roomId}`), {
        status: 'finished',
        result: {
          winner: isDraw ? 'draw' : winnerUid,
          pot,
          draw: isDraw,
          timestamp: Date.now(),
        },
      });
    } catch (_) {}
  };

  /**
   * Rời phòng / cleanup
   * — Forfeit: chỉ ghi signal, không xóa room, để đối thủ nhận được.
   * — Thoát bình thường: đánh dấu leftAt, chỉ xóa room khi người cuối cùng ra đi.
   */
  const leaveRoom = async (roomId, myRole, forfeit = false, opponentUid = null, pot = 0) => {
    if (forfeit) {
      // Ghi forfeit signal để đối thủ biết — sau đó chỉ thoát local, KHÔNG xóa room.
      // Việc cleanup room do đối thủ (winner) thực hiện sau khi họ nhận thông báo.
      try {
        const updates = {
          forfeit: { uid, nickname: nickname || 'Người chơi', timestamp: Date.now() },
        };
        if (opponentUid && pot > 0) {
          updates.status = 'finished';
          updates.result = { winner: opponentUid, pot, draw: false, timestamp: Date.now() };
        }
        await update(ref(db, `rooms/${roomId}`), updates);
      } catch (_) {}
      // Chỉ reset local state, không đụng Firebase room
      resetRoom();
      return;
    }

    // ── Thoát bình thường: đánh dấu leftAt cho player này ──
    try {
      await update(ref(db, `rooms/${roomId}/players/${uid}`), {
        leftAt: Date.now(),
        isOnline: false,
      });

      // Kiểm tra xem tất cả player đã thoát chưa — nếu vậy mới xóa room
      const snap = await get(ref(db, `rooms/${roomId}/players`));
      const players = snap.val() || {};
      const allLeft = Object.values(players).every(p => p.leftAt);

      if (allLeft) {
        await remove(ref(db, `rooms/${roomId}`));
      }
    } catch (_) {}

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
   * Gửi emoji reaction cho đối thủ
   * @param {string} roomId
   * @param {string} emoji  - ký tự emoji
   * @param {string} label  - câu hiển thị
   * @param {string} explicitUid
   */
  const sendReaction = async (roomId, emoji, label, explicitUid) => {
    const senderUid = explicitUid || uid;
    const reactionsRef = ref(db, `rooms/${roomId}/reactions`);
    const newRef = push(reactionsRef);
    await set(newRef, {
      fromUid: senderUid,
      emoji,
      label,
      timestamp: Date.now(),
    });
    // Tự xóa sau 4 giây để tránh tích luỹ data
    setTimeout(() => remove(newRef), 4000);
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

  return { createRoom, joinRoom, setReady, startGame, leaveRoom, watchRoom, requestRematch, acceptRematch, declineRematch, sendReaction, chargeBet, awardWinner };
}
