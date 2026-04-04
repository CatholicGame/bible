import { useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';
import { usePlayFabStore } from '../store/playfabStore';

const SALT = 'BIBLE_P2P_SALT_2026';
const LS_KEY = 'p2p_pending_refund';

/**
 * Tạo hash đơn giản để chống edit localStorage
 */
export function makePendingHash(roomId, uid, amount, timestamp) {
  try {
    return btoa(unescape(encodeURIComponent(`${roomId}:${uid}:${amount}:${timestamp}:${SALT}`)));
  } catch {
    return btoa(`${roomId}:${uid}:${amount}:${timestamp}:${SALT}`);
  }
}

/**
 * Lưu pending refund vào localStorage (gọi ngay sau khi trừ coin)
 */
export function setPendingRefund({ roomId, uid, amount }) {
  const timestamp = Date.now();
  const hash = makePendingHash(roomId, uid, amount, timestamp);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ roomId, uid, amount, timestamp, hash }));
  } catch (_) {}
}

/**
 * Xóa pending refund sau khi đã xử lý xong
 */
export function clearPendingRefund() {
  try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

/**
 * Hook chạy ở App level — tự detect và refund nếu còn pending refund hợp lệ
 * Logic:
 *  - Nếu room đã bị xóa (host thoát, game kết thúc) → refund
 *  - Nếu room tồn tại + status=finished + không có result → refund (bị ngắt kết nối bất thường)
 *  - Nếu room tồn tại + status=finished + result tồn tại → winner đã được award, chỉ clear
 *  - Nếu room vẫn đang playing → không thay đổi gì (player đang reconnect)
 * Anti-cheat: nếu hash sai so với các field → bỏ qua, không refund
 */
export function usePendingRefund() {
  const addCoins = usePlayFabStore(state => state.addCoins);
  const isLoggedIn = usePlayFabStore(state => state.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return; // chờ PlayFab load xong

    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    let data;
    try { data = JSON.parse(raw); } catch { clearPendingRefund(); return; }

    const { roomId, uid, amount, timestamp, hash } = data ?? {};
    if (!roomId || !uid || !amount || !timestamp || !hash) {
      clearPendingRefund();
      return;
    }

    // Anti-tamper: verify hash
    const expectedHash = makePendingHash(roomId, uid, amount, timestamp);
    if (hash !== expectedHash) {
      console.warn('[PendingRefund] Hash mismatch — possible tampering. Clearing without refund.');
      clearPendingRefund();
      return;
    }

    // Check Firebase: room còn tồn tại không?
    get(ref(db, `rooms/${roomId}`)).then(snap => {
      if (!snap.exists()) {
        // Room đã bị xóa → refund (game kết thúc hoặc host rời)
        console.log(`[PendingRefund] Room ${roomId} gone → refunding ${amount} coins to ${uid}`);
        addCoins(amount);
        clearPendingRefund();
        return;
      }

      const room = snap.val();

      if (room.status === 'finished') {
        const result = room.result;
        if (!result) {
          // Finished nhưng không có result → bất thường → refund
          console.log(`[PendingRefund] Room finished, no result → refunding ${amount} coins`);
          addCoins(amount);
        } else if (result.draw) {
          // Hòa → đã refund trong game, hoặc refund lại nếu chưa được
          console.log(`[PendingRefund] Draw result → refunding ${amount} coins`);
          addCoins(amount);
        } else if (result.winner === uid) {
          // Ta thắng → đã nhận pot trong game → không refund (chỉ clear)
          console.log(`[PendingRefund] We won → no refund needed, just clear`);
        } else {
          // Ta thua (đối thủ thắng) → mất coin → chỉ clear
          console.log(`[PendingRefund] We lost → no refund`);
        }
        clearPendingRefund();
        return;
      }

      // status = 'waiting' | 'playing' → game có thể vẫn đang diễn ra
      // Không làm gì — player đang reconnect
      console.log(`[PendingRefund] Room still active (${room.status}), skipping refund`);
    }).catch(err => {
      // Lỗi mạng → thử lại lần sau, không xóa pending refund
      console.warn('[PendingRefund] Firebase check failed:', err);
    });
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
