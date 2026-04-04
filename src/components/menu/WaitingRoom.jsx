import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Crown, Check, Play, Wifi, WifiOff } from 'lucide-react';
import { useRoom } from '../../hooks/useRoom';
import { usePresence } from '../../hooks/usePresence';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import { usePlayFabStore } from '../../store/playfabStore';
import UserAvatar from '../common/UserAvatar';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export default function WaitingRoom({ onLeave, onGameStart }) {
  const { uid } = useUserStore();
  const { roomId, roomData, myRole } = useRoomStore();
  const { setReady, startGame, leaveRoom, watchRoom } = useRoom();
  const { playedCrosswordIds, authMethod } = usePlayFabStore();
  const [opponentOffline, setOpponentOffline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [opponentLeftToast, setOpponentLeftToast] = useState(null); // { name }

  // Lắng nghe toàn bộ phòng real-time
  useEffect(() => {
    if (!roomId) return;
    const unsub = watchRoom(roomId, (data) => {
      if (!data) {
        // Room bị xóa (host thoát) → guest về menu
        if (myRole === 'guest') {
          setOpponentLeftToast({ name: 'Chủ phòng' });
          setTimeout(() => onLeave?.(), 2500);
        }
        return;
      }
      // Host nhận tín hiệu status = 'playing' → vào game
      if (data.status === 'playing') onGameStart?.(data);
    });
    return () => unsub?.();
  }, [roomId]);

  // Presence tracking
  usePresence(roomId, useCallback(() => setOpponentOffline(true), []));

  // Reset cờ offline khi đối thủ quay lại
  useEffect(() => {
    if (!roomData) return;
    const players = roomData.players ?? {};
    const opponent = Object.entries(players).find(([pUid]) => pUid !== uid);
    if (opponent?.[1]?.isOnline) {
      setOpponentOffline(false);
      setOpponentLeftToast(null); // dismiss toast nếu họ quay lại
    } else if (opponent && opponent[1]?.isOnline === false) {
      // Vừa offline → show toast
      const name = opponent[1]?.nickname || 'Đối thủ';
      setOpponentLeftToast({ name });
    }
  }, [roomData, uid]);

  // Auto-dismiss toast sau 4s
  useEffect(() => {
    if (!opponentLeftToast) return;
    const t = setTimeout(() => setOpponentLeftToast(null), 4000);
    return () => clearTimeout(t);
  }, [opponentLeftToast]);

  if (!roomData || !roomId) return null;

  const players = roomData.players ?? {};
  const myData = players[uid];
  const opponentEntry = Object.entries(players).find(([pUid]) => pUid !== uid);
  const opponentUid = opponentEntry?.[0];
  const opponentData = opponentEntry?.[1];
  const isPrivate = roomData.isPrivate;
  const pin = roomId;

  // Host không cần tự bấm ready — bấm "BẮT ĐẦU" chính là ready
  const guestJoined = !!opponentUid;
  const guestReady = opponentData?.isReady;
  const canStart = guestJoined && (myRole === 'host' ? guestReady : (myData?.isReady && guestReady));

  const handleReady = () => setReady(roomId, playedCrosswordIds, authMethod);
  const handleStart = () => startGame(roomId, roomData?.gameType);
  const handleLeave = async () => {
    await leaveRoom(roomId, myRole);
    onLeave?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>

      {/* ── Toast: đối thủ thoát phòng ── */}
      <AnimatePresence>
        {opponentLeftToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
              border: '2px solid #fca5a5',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              minWidth: 240, maxWidth: 320,
            }}>
            <span style={{ fontSize: 22 }}>🚪</span>
            <div>
              <p className="font-black text-white text-sm leading-tight">
                {opponentLeftToast.name} đã rời phòng!
              </p>
              <p className="text-red-200 text-xs font-semibold mt-0.5">
                {myRole === 'guest' ? 'Đang về trang chủ...' : 'Chờ người chơi khác vào'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="relative w-full max-w-sm overflow-hidden"
        style={{
          borderRadius: 28,
          background: '#2563eb',
          border: '4px solid #1e3a8a',
          boxShadow: '0 10px 0 #1e3a8a, 0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Shine */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/8 pointer-events-none rounded-t-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleLeave}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#1d4ed8', border: '3px solid #1e3a8a', boxShadow: '0 4px 0 #1e3a8a' }}>
            <ArrowLeft size={18} className="text-white" strokeWidth={3} />
          </motion.button>

          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#f59e0b', border: '3px solid #b45309', boxShadow: '0 4px 0 #b45309' }}>
            <Users size={18} className="text-amber-900" />
          </div>
        </div>

        <motion.div variants={container} initial="hidden" animate="visible" className="px-5 pb-6">
          <motion.h2 variants={fadeUp}
            className="text-center font-black text-2xl uppercase tracking-wider mb-1"
            style={{ color: '#fbbf24', textShadow: '0 3px 0 #b45309' }}>
            PHÒNG CHỜ
          </motion.h2>
          <motion.p variants={fadeUp} className="text-center text-blue-200 text-xs font-semibold mb-4">
            {roomData.gameType} · {myRole === 'host' ? 'Chủ phòng' : 'Khách'}
          </motion.p>

          {/* PIN Card */}
          {isPrivate && (
            <motion.div variants={fadeUp} className="rounded-2xl p-4 mb-3"
              style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #e2e8f0', boxShadow: 'inset 0 2px 0 white, 0 4px 0 rgba(30,58,138,0.15)' }}>
              <p className="text-center text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Mã PIN phòng</p>
              <div className="flex gap-1.5 justify-center">
                {pin.split('').map((d, i) => (
                  <motion.div key={i}
                    initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-10 h-12 rounded-xl flex items-center justify-center text-xl font-black"
                    style={{ background: '#fbbf24', border: '3px solid #b45309', boxShadow: '0 4px 0 #b45309', color: '#1e3a8a' }}>
                    {d}
                  </motion.div>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigator.clipboard.writeText(pin).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="mt-3 mx-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={copied
                  ? { background: '#dcfce7', color: '#166534', border: '2px solid #bbf7d0' }
                  : { background: '#eff6ff', color: '#2563eb', border: '2px solid #bfdbfe' }}>
                {copied ? '✓ Đã sao chép!' : '📋 Sao chép PIN'}
              </motion.button>
              <p className="text-center text-slate-400 text-[10px] font-semibold mt-2">Chia sẻ mã này cho bạn bè</p>
            </motion.div>
          )}

          {/* Players */}
          <motion.div variants={fadeUp} className="rounded-2xl p-4 mb-4"
            style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #e2e8f0', boxShadow: 'inset 0 2px 0 white, 0 4px 0 rgba(30,58,138,0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Người chơi</p>
              <span className="text-xs font-black px-2.5 py-1 rounded-full"
                style={{ background: '#dbeafe', color: '#1e40af', border: '2px solid #bfdbfe' }}>
                {guestJoined ? '2' : '1'} / 2
              </span>
            </div>

            {/* Player rows */}
            {[
              { pUid: uid, data: myData, isMe: true },
              { pUid: opponentUid, data: opponentData, isMe: false },
            ].map(({ pUid, data, isMe }) => (
              <div key={pUid ?? 'empty'} className="flex items-center gap-2.5 mb-2 last:mb-0">
                {/* Avatar slot */}
                {data ? (
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      name={data.nickname || '?'}
                      photoURL={data.avatarUrl || null}
                      size={40}
                      style={{
                        border: `2px solid ${isMe ? '#b45309' : (opponentOffline ? '#ef4444' : '#6d28d9')}`,
                        borderRadius: '0.75rem',
                        boxShadow: `0 2px 0 ${isMe ? '#92400e' : '#4c1d95'}`,
                      }}
                    />
                    {/* Crown badge for me, wifi for opponent */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: isMe ? '#fbbf24' : (opponentOffline ? '#ef4444' : '#a78bfa'), border: '1.5px solid white' }}>
                      {isMe
                        ? <Crown size={9} className="text-amber-900" />
                        : (opponentOffline ? <WifiOff size={9} className="text-white" /> : <Wifi size={9} className="text-white" />)
                      }
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: '#f1f5f9', border: '2px dashed #cbd5e1' }}>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Users size={16} className="text-slate-300" />
                    </motion.div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {data ? (
                    <>
                      <p className="font-black text-slate-700 text-sm leading-none truncate">
                        {data.nickname} {isMe && <span className="text-blue-400 text-xs font-semibold">(Bạn)</span>}
                      </p>
                      <p className="text-[10px] font-semibold mt-0.5"
                        style={{ color: opponentOffline && !isMe ? '#ef4444' : '#94a3b8' }}>
                        {isMe ? (myRole === 'host' ? 'Chủ phòng' : 'Khách') : (opponentOffline ? 'Mất kết nối...' : 'Đã vào phòng')}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="h-2.5 w-24 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2 w-16 rounded-full bg-slate-100 mt-1 animate-pulse" />
                    </>
                  )}
                </div>
                {data && (
                  <AnimatePresence>
                    <motion.span key={data.isReady ? 'ready' : 'waiting'}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                      style={data.isReady
                        ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
                        : { background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                      {data.isReady ? '✓ Sẵn sàng' : 'Chờ...'}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
            ))}
          </motion.div>

          {/* Action button */}
          <motion.div variants={fadeUp}>
            {/* Guest: Sẵn sàng */}
            {myRole === 'guest' && !myData?.isReady && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97, y: 4 }}
                onClick={handleReady}
                className="w-full flex items-center justify-center gap-2 font-black text-lg uppercase tracking-widest py-4 rounded-full relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: '4px solid #065f46', boxShadow: '0 6px 0 #065f46' }}>
                <Check size={20} strokeWidth={3} />
                <span>SẴN SÀNG</span>
              </motion.button>
            )}

            {/* Guest đã sẵn sàng */}
            {myRole === 'guest' && myData?.isReady && (
              <div className="w-full flex items-center justify-center gap-2 font-black text-lg py-4 rounded-full"
                style={{ background: '#dcfce7', color: '#166534', border: '4px solid #bbf7d0' }}>
                <Check size={20} strokeWidth={3} />
                <span>Đã sẵn sàng — Chờ host...</span>
              </div>
            )}

            {/* Host: Bắt đầu */}
            {myRole === 'host' && (
              <motion.button
                whileHover={canStart && guestJoined ? { scale: 1.03 } : {}}
                whileTap={canStart && guestJoined ? { scale: 0.97, y: 4 } : {}}
                onClick={canStart && guestJoined ? handleStart : undefined}
                className="w-full flex items-center justify-center gap-2 font-black text-lg uppercase tracking-widest py-4 rounded-full relative overflow-hidden transition-all"
                style={canStart && guestJoined
                  ? { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1e3a8a', border: '4px solid #b45309', boxShadow: '0 6px 0 #b45309', WebkitTextStroke: '0.5px #92400e' }
                  : { background: '#e2e8f0', color: '#94a3b8', border: '4px solid #cbd5e1', boxShadow: '0 4px 0 #cbd5e1', cursor: 'not-allowed' }}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 pointer-events-none" />
                <Play size={20} strokeWidth={3} className="relative z-10" />
                <span className="relative z-10">
                  {!guestJoined ? 'Chờ người chơi...' : !canStart ? 'Chờ sẵn sàng...' : 'BẮT ĐẦU NGAY'}
                </span>
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
