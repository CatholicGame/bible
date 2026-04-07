import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogIn, AlertCircle, Coins } from 'lucide-react';
import { useRoom } from '../../hooks/useRoom';
import { usePlayFabStore } from '../../store/playfabStore';
import iconCoin from '../../assets/common/coin.png';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

/**
 * JoinRoom — nhập PIN, kiểm tra coin cược trước khi vào phòng.
 * Nếu không đủ coin → hiện màn "Không đủ coin" và KHÔNG ghi vào phòng.
 */
export default function JoinRoom({ onBack, onJoined, initialPin = '' }) {
  const { joinRoom } = useRoom();
  const { coins: userCoins } = usePlayFabStore();

  const [digits, setDigits] = useState(() => {
    const chars = initialPin.replace(/\D/g, '').slice(0, 6).split('');
    return [...chars, ...Array(6 - chars.length).fill('')];
  });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  // Màn "không đủ coin" — KHÔNG cho join
  const [insufficientCoins, setInsufficientCoins] = useState(null); // { wager, myCoins }
  const inputRefs = useRef([]);

  const pin = digits.join('');
  const pinFull = pin.length === 6;

  const handleDigit = (index, value) => {
    const val = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setError(null);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    if (!pinFull || loading) return;
    setLoading(true);
    setError(null);
    setInsufficientCoins(null);

    const result = await joinRoom(pin, userCoins ?? 0);
    setLoading(false);

    if (result.success) {
      onJoined?.(pin);
    } else if (result.error === 'insufficient_coins') {
      // Không đủ coin — không ghi vào phòng, hiện màn reject
      setInsufficientCoins({ wager: result.wager, myCoins: result.myCoins });
    } else {
      setError(result.error);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // ── MÀNN "KHÔNG ĐỦ COIN" ──
  if (insufficientCoins) {
    const { wager, myCoins } = insufficientCoins;
    const needed = wager - myCoins;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative w-full max-w-sm overflow-hidden text-center"
          style={{
            borderRadius: 28,
            background: 'linear-gradient(180deg, #7f1d1d, #991b1b)',
            border: '4px solid #b91c1c',
            boxShadow: '0 10px 0 #7f1d1d, 0 20px 40px rgba(0,0,0,0.6)',
          }}>
          {/* Top shine */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/8 pointer-events-none rounded-t-3xl" />

          <div className="relative px-6 pt-8 pb-7 flex flex-col items-center gap-4">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', border: '4px solid rgba(255,255,255,0.25)' }}>
              <img src={iconCoin} alt="coin" className="w-10 h-10 opacity-70 grayscale" />
            </motion.div>

            <div>
              <h2 className="text-white font-black text-2xl uppercase tracking-widest mb-1"
                style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                Không đủ coin!
              </h2>
              <p className="text-red-200 text-sm font-semibold">
                Phòng này yêu cầu cược <strong className="text-white">{wager.toLocaleString()} 💰</strong> để tham gia
              </p>
            </div>

            {/* Coin comparison */}
            <div className="w-full rounded-2xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-red-200 text-xs font-bold uppercase tracking-wide">Coin cần cược</span>
                <span className="text-white font-black text-base flex items-center gap-1">
                  <img src={iconCoin} alt="" className="w-4 h-4" />
                  {wager.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-red-200 text-xs font-bold uppercase tracking-wide">Coin của bạn</span>
                <span className="text-red-300 font-black text-base flex items-center gap-1">
                  <img src={iconCoin} alt="" className="w-4 h-4 grayscale opacity-60" />
                  {(myCoins ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-red-200 text-xs font-bold uppercase tracking-wide">Còn thiếu</span>
                <span className="text-yellow-300 font-black text-base flex items-center gap-1">
                  <img src={iconCoin} alt="" className="w-4 h-4" />
                  {needed.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-red-200/70 text-xs font-semibold leading-relaxed">
              Hãy kiếm thêm coin bằng cách chơi solo hoặc tham gia trận đấu khác rồi thử lại.
            </p>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97, y: 4 }}
              onClick={onBack}
              className="w-full py-4 rounded-full font-black text-[#7f1d1d] text-base uppercase tracking-widest relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
                border: '4px solid #b45309',
                boxShadow: '0 6px 0 #b45309',
              }}>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/25 pointer-events-none rounded-t-full" />
              <span className="relative z-10">Đóng</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── MÀN NHẬP PIN ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: -20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="relative w-full max-w-sm overflow-hidden"
        style={{
          borderRadius: 28,
          background: '#7c3aed',
          border: '4px solid #4c1d95',
          boxShadow: '0 10px 0 #4c1d95, 0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/8 pointer-events-none rounded-t-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#6d28d9', border: '3px solid #4c1d95', boxShadow: '0 4px 0 #4c1d95' }}>
            <ArrowLeft size={18} className="text-white" strokeWidth={3} />
          </motion.button>


        </div>

        <motion.div variants={container} initial="hidden" animate="visible" className="px-5 pb-6">
          <motion.h2 variants={fadeUp}
            className="text-center font-black text-3xl uppercase tracking-wider mb-1"
            style={{ color: '#fbbf24', textShadow: '0 3px 0 #b45309' }}>
            VÀO PHÒNG
          </motion.h2>
          <motion.p variants={fadeUp} className="text-center text-purple-200 text-xs font-semibold mb-1">
            Nhập mã PIN 6 số từ bạn bè
          </motion.p>
          {/* Coin hiện tại — nhắc nhở người chơi */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-1.5 mb-4">
            <img src={iconCoin} alt="" className="w-3.5 h-3.5" />
            <span className="text-purple-200 text-xs font-bold">
              Coin của bạn: <strong className="text-yellow-300">{(userCoins ?? 0).toLocaleString()}</strong>
            </span>
          </motion.div>

          {/* PIN Input */}
          <motion.div variants={fadeUp}
            className="rounded-2xl p-5 mb-3"
            style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #e2e8f0', boxShadow: 'inset 0 2px 0 white, 0 4px 0 rgba(76,29,149,0.2)' }}>
            <p className="text-center text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Mã PIN phòng</p>
            <div className="flex gap-2 justify-center">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-12 rounded-xl text-center text-xl font-black outline-none transition-all"
                  style={{
                    background: d ? '#fbbf24' : '#f1f5f9',
                    border: `3px solid ${d ? '#b45309' : '#e2e8f0'}`,
                    boxShadow: d ? '0 4px 0 #b45309' : '0 2px 0 #cbd5e1',
                    color: '#1e3a8a',
                    transform: d ? 'translateY(-2px)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Paste button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  const nums = text.replace(/\D/g, '').slice(0, 6);
                  if (nums.length > 0) {
                    const newDigits = [...nums.split(''), ...Array(6 - nums.length).fill('')];
                    setDigits(newDigits);
                    setError(null);
                    const nextEmpty = nums.length < 6 ? nums.length : 5;
                    inputRefs.current[nextEmpty]?.focus();
                  }
                } catch { /* clipboard permission denied */ }
              }}
              className="mt-3 mx-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
              style={{ background: '#f5f3ff', color: '#6d28d9', border: '2px solid #ddd6fe' }}>
              📋 Dán PIN từ clipboard
            </motion.button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
                  style={{ background: '#fee2e2', border: '2px solid #fca5a5' }}>
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs font-bold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Join button */}
          <motion.button variants={fadeUp}
            whileHover={pinFull ? { scale: 1.03 } : {}}
            whileTap={pinFull ? { scale: 0.97, y: 4 } : {}}
            onClick={handleJoin}
            disabled={!pinFull || loading}
            className="w-full flex items-center justify-center gap-2 font-black text-lg uppercase tracking-widest py-4 rounded-full relative overflow-hidden transition-all"
            style={pinFull && !loading
              ? { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1e3a8a', border: '4px solid #b45309', boxShadow: '0 6px 0 #b45309', WebkitTextStroke: '0.5px #92400e' }
              : { background: '#e2e8f0', color: '#94a3b8', border: '4px solid #cbd5e1', boxShadow: '0 4px 0 #cbd5e1', cursor: 'not-allowed' }}>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 pointer-events-none" />
            {loading ? (
              <div className="w-5 h-5 border-3 border-slate-400 border-t-transparent rounded-full animate-spin relative z-10" />
            ) : (
              <>
                <LogIn size={20} strokeWidth={3} className="relative z-10" />
                <span className="relative z-10">VÀO PHÒNG</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
