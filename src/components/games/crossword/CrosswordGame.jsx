import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, Star, Check, RotateCcw, Zap, Eye, Lightbulb, ChevronLeft, Play, RefreshCcw } from 'lucide-react';
import { usePlayFabStore } from '../../../store/playfabStore';
import { getRankByScore } from '../../../utils/ranks';
import { useRoomStore } from '../../../store/roomStore';
import bgCrossword from '../../../assets/common/bg_crossword.png';
import resultBanner from '../../../assets/common/result_banner.png';
import iconCoin from '../../../assets/common/coin.png';
import iconTrophy from '../../../assets/common/trophy.png';
import RAW_PUZZLES from '../../../data/crossword_puzzles.json';

const BG_STYLE = {
  backgroundImage: `url(${bgCrossword})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

/* ══════════════════════════════════════════════════════════════
   PUZZLE DATA — load từ crossword_puzzles.json
   ══════════════════════════════════════════════════════════════ */
const PUZZLES = RAW_PUZZLES;

/* ── Helper: chọn puzzle tiếp theo theo thứ tự ── */
function pickNextPuzzle(allPuzzles, playedIds, exclude = null) {
  const next = allPuzzles.find(p => !playedIds.includes(p.id) && p !== exclude);
  if (next) return next;
  // Đã chơi hết → reset về đầu
  return allPuzzles.find(p => p !== exclude) ?? allPuzzles[0];
}

/* ══════════════════════════════════════════════════════════════
   HELPER: build grid map from puzzle data
   ══════════════════════════════════════════════════════════════ */

function buildGridMap(puzzle) {
  const { rows, cols } = puzzle.gridSize;
  // grid[r][c] = { isCell: bool, letter: '', wordIds: [], cellNum: null }
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ isCell: false, letter: '', wordIds: [], cellNum: null }))
  );

  puzzle.words.forEach((word) => {
    const letters = [...word.answer];
    letters.forEach((ch, i) => {
      const r = word.direction === 'down' ? word.row + i : word.row;
      const c = word.direction === 'across' ? word.col + i : word.col;
      if (r < rows && c < cols) {
        grid[r][c].isCell = true;
        grid[r][c].letter = ch;
        if (!grid[r][c].wordIds.includes(word.id)) {
          grid[r][c].wordIds.push(word.id);
        }
        if (i === 0 && grid[r][c].cellNum === null) grid[r][c].cellNum = word.num;
      }
    });
  });

  return grid;
}

/* ══════════════════════════════════════════════════════════════
   VIRTUAL KEYBOARD
   ══════════════════════════════════════════════════════════════ */

const VIET_KEYS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
];

const VirtualKeyboard = ({ onKey, onBackspace, compact = false }) => (
  <div className="flex flex-col gap-[3px] items-center w-full max-w-lg mx-auto select-none">
    {VIET_KEYS.map((row, ri) => (
      <div key={ri} className="flex gap-[3px] justify-center w-full">
        {row.map((k) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.88, y: 2 }}
            onClick={() => k === '⌫' ? onBackspace() : onKey(k)}
            className="flex items-center justify-center rounded-lg font-black transition-colors"
            style={{
              width: k === '⌫' ? (compact ? 38 : 46) : (compact ? 30 : 34),
              height: compact ? 32 : 38,
              fontSize: k === '⌫' ? (compact ? 15 : 18) : (compact ? 13 : 15),
              color: k === '⌫' ? '#ffffff' : '#fef08a',  /* yellow-200 for letters */
              background: k === '⌫'
                ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)',
              border: k === '⌫' ? '2px solid #991b1b' : '2px solid #7dd3fc',
              boxShadow: k === '⌫' ? '0 2px 0 #7f1d1d' : '0 2px 0 #0369a1',
              textShadow: k === '⌫' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {k}
          </motion.button>
        ))}
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   PROGRESS BAR (P2P)
   ══════════════════════════════════════════════════════════════ */

const ProgressBar = ({ label, percent, color, avatar }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0"
      style={{ background: color, border: '2px solid rgba(0,0,0,0.3)', boxShadow: '0 2px 0 rgba(0,0,0,0.3)' }}>
      {avatar || '?'}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-white/80 font-bold text-[10px] truncate">{label}</span>
        <span className="text-white font-black text-xs">{Math.round(percent)}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   CROSSWORD FINISHED OVERLAY — portal, Pinnacle EndGameScreen style
   ══════════════════════════════════════════════════════════════ */

const CrosswordFinishedOverlay = ({
  isPerfect, isP2P, isWinner, isDraw,
  solvedWords, totalWords, timeLeft, score,
  earnedXP, earnedCoins,
  myProfile, opponentProfile, myPercent, opponentPercent,
  onReplay, onNewGame, onLeaveGame,
}) => {
  const { globalScore, coins: profileCoins, nickname } = usePlayFabStore();
  const rankName = getRankByScore(globalScore || 0);

  const totalCoins = earnedCoins?.total ?? 0;
  const totalXP    = earnedXP?.total ?? 0;
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayXP,    setDisplayXP]    = useState(0);
  const [coinsDone,    setCoinsDone]     = useState(false);
  const [xpDone,       setXpDone]       = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [flyParticles, setFlyParticles]  = useState([]);

  // Source refs (reward pills)
  const coinPillRef   = useRef(null);
  const xpPillRef     = useRef(null);
  // Target refs (profile chip)
  const coinTargetRef = useRef(null);
  const xpTargetRef   = useRef(null);

  // Spawn flying icons
  const spawnFly = useCallback((icon, sourceRef, targetRef, count = 6) => {
    const n = Math.min(Math.max(1, count), 9);
    const pill   = sourceRef.current?.getBoundingClientRect();
    const target = targetRef.current?.getBoundingClientRect();
    if (!pill || !target) return;
    const ox = pill.left   + pill.width  / 2, oy = pill.top    + pill.height / 2;
    const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
    const items = Array.from({ length: n }, (_, i) => ({
      id: `${icon}-${Date.now()}-${i}`, icon,
      ox: ox + (Math.random() - 0.5) * 28, oy: oy + (Math.random() - 0.5) * 14,
      bx: (Math.random() - 0.5) * 80,      by: (Math.random() - 0.5) * 50,
      tx, ty, delay: i * 0.07,
    }));
    setFlyParticles(p => [...p, ...items]);
    setTimeout(() => setFlyParticles(p => p.filter(x => !items.find(pp => pp.id === x.id))), 2200);
  }, []);

  // Coin count-up
  useEffect(() => {
    if (totalCoins === 0) { setCoinsDone(true); return; }
    const abs = Math.abs(totalCoins);
    const STEPS = Math.min(abs, 40), step = Math.ceil(abs / STEPS), ms = 1600 / STEPS;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, abs);
      setDisplayCoins(totalCoins < 0 ? -cur : cur);
      if (cur >= abs) { clearInterval(id); setCoinsDone(true); }
    }, ms);
    return () => clearInterval(id);
  }, [totalCoins]);

  // After coins done → fly coins → update profile
  useEffect(() => {
    if (!coinsDone || totalCoins <= 0) return;
    const t = setTimeout(() => {
      spawnFly('coin', coinPillRef, coinTargetRef, Math.min(totalCoins, 9));
      setTimeout(() => setProfileUpdated(true), 1400);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinsDone]);

  // XP count-up
  useEffect(() => {
    if (totalXP <= 0) { setXpDone(true); return; }
    const STEPS = Math.min(totalXP, 40), step = Math.ceil(totalXP / STEPS), ms = 1600 / STEPS;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, totalXP); setDisplayXP(cur);
      if (cur >= totalXP) { clearInterval(id); setXpDone(true); }
    }, ms);
    return () => clearInterval(id);
  }, [totalXP]);

  // After XP done → fly trophies → update profile
  useEffect(() => {
    if (!xpDone || totalXP <= 0) return;
    const t = setTimeout(() => {
      spawnFly('xp', xpPillRef, xpTargetRef, Math.min(totalXP, 9));
      setTimeout(() => setProfileUpdated(true), 1400);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpDone]);

  const titleText =
    isPerfect ? 'HOÀN THÀNH XUẤT SẮC!' :
    isP2P ? (isWinner ? 'BẠN THẮNG!' : isDraw ? 'HÒA!' : 'BẠN THUA!') :
    'HẾT THỜI GIAN!';

  const msgText =
    isPerfect
      ? `Hoàn hảo! Bạn giải được tất cả ${totalWords} từ!`
      : isP2P
      ? (isWinner
          ? `Bạn thắng! ${solvedWords.size}/${totalWords} từ.`
          : isDraw
          ? `Hòa cuộc! ${solvedWords.size}/${totalWords} từ.`
          : `Chơi tốt hơn lần sau nhé! ${solvedWords.size}/${totalWords} từ.`)
      : `Hết thời gian! Bạn đã tìm được ${solvedWords.size}/${totalWords} từ.`;

  const formatT = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }} />

      {/* Profile pill — top */}
      <motion.div initial={{ y:-50, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.3, type:'spring', stiffness:260, damping:26 }}
        style={{ position:'fixed', top:10, left:0, right:0, display:'flex', justifyContent:'center', zIndex:10001, pointerEvents:'none' }}>
        <div style={{
          background:'linear-gradient(135deg,#3f1c00 0%,#78350f 55%,#3f1c00 100%)',
          border:'3px solid #fbbf24', boxShadow:'0 4px 0 #1c0a00, 0 6px 20px rgba(120,53,15,0.6)',
          borderRadius:20, pointerEvents:'auto', maxWidth:'calc(100vw - 32px)',
          padding:'8px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', borderRadius:'17px 17px 0 0', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:10 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#fef3c7,#fbbf24)', border:'2px solid #fef08a', boxShadow:'0 2px 0 #1c0a00', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#92400e', fontSize:12 }}>
              {nickname?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontWeight:900, fontSize:14, color:'#fef3c7', textShadow:'0 1px 0 #1c0a00' }}>{nickname || 'Nguoi choi'}</span>
            <span style={{ fontSize:9, fontWeight:900, padding:'2px 8px', borderRadius:9999, background:'rgba(251,191,36,0.2)', border:'1.5px solid #fbbf24', color:'#fde68a' }}>{rankName}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:10 }}>
            <div ref={coinTargetRef} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:9999, background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'2px solid #fef08a', boxShadow:'0 2px 0 #92400e' }}>
              <img src={iconCoin} alt="" style={{ width:14, height:14 }} />
              <motion.span key={profileUpdated?'uc':'bc'} initial={{ scale: profileUpdated?1.4:1 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, damping:15 }}
                style={{ fontSize:12, fontWeight:900, color:'white', textShadow:'0 1px 0 #92400e' }}>
                {(profileCoins||0).toLocaleString()}
              </motion.span>
            </div>
            <div ref={xpTargetRef} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:9999, background:'linear-gradient(135deg,#fbbf24,#f59e0b)', border:'2px solid #fef08a', boxShadow:'0 2px 0 #92400e' }}>
              <img src={iconTrophy} alt="" style={{ width:14, height:14 }} />
              <motion.span key={profileUpdated?'ux':'bx'} initial={{ scale: profileUpdated?1.4:1 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, damping:15, delay:0.1 }}
                style={{ fontSize:12, fontWeight:900, color:'white', textShadow:'0 1px 0 #92400e' }}>
                {(globalScore||0).toLocaleString()} XP
              </motion.span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fly particles */}
      {flyParticles.map(p => (
        <motion.img
          key={p.id}
          src={p.icon === 'coin' ? iconCoin : iconTrophy}
          alt=""
          initial={{ x: p.ox, y: p.oy, scale: 1, opacity: 1 }}
          animate={{ x: [p.ox, p.ox + p.bx, p.tx], y: [p.oy, p.oy + p.by, p.ty], scale: [1, 1.3, 0.3], opacity: [1, 1, 0] }}
          transition={{ duration: 1.0, delay: p.delay, ease: 'easeInOut', times: [0, 0.4, 1] }}
          style={{ position: 'fixed', top: 0, left: 0, width: 28, height: 28, zIndex: 11000, pointerEvents: 'none', borderRadius: '50%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
        />
      ))}

      {/* Centering wrapper */}
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:9999, width:'min(520px, calc(100vw - 20px))', maxHeight:'calc(100dvh - 20px)', display:'flex', flexDirection:'column', alignItems:'center', overflow:'visible' }}>
        <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:220, damping:22 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>

          {/* Trophy banner */}
          <motion.img src={resultBanner} alt="Result"
            initial={{ scale:0, y:30 }} animate={{ scale:1, y:0 }}
            transition={{ type:'spring', stiffness:200, damping:15, delay:0.15 }}
            style={{ width:'clamp(210px,42vw,320px)', height:'auto', flexShrink:0, position:'relative', zIndex:10, marginBottom:'clamp(-38px,-8vw,-62px)', filter:'drop-shadow(0 6px 10px rgba(30,58,138,0.7))', pointerEvents:'none' }}
          />

          {/* Blue card */}
          <div style={{ background:'#3b82f6', border:'4px solid #1e3a8a', boxShadow:'0 8px 0 rgba(30,58,138,1)', borderRadius:24, width:'100%', flex:'0 0 auto', minHeight:'min(360px,calc(100dvh - 180px))', maxHeight:'calc(100dvh - 20px - clamp(52px,9vw,96px))', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div className="overflow-y-auto scrollbar-hide flex-1 flex flex-col items-center" style={{ padding:'clamp(48px,8vw,76px) 16px 16px' }}>

              <h2 className="text-xl sm:text-2xl font-black mb-3 tracking-widest text-center text-yellow-300 uppercase"
                style={{ textShadow:'0 4px 0 #78350f,1px 0 0 #78350f,-1px 0 0 #78350f' }}>
                {titleText}
              </h2>

              {/* Message box */}
              <div className="w-full max-w-lg mb-4 flex items-center justify-center bg-white rounded-2xl border-4 border-blue-300 shadow-[inset_0_-4px_0_rgba(191,219,254,1),0_6px_0_rgba(30,58,138,0.5)] text-[#1e3a8a]"
                style={{ minHeight:68, padding:'10px 16px' }}>
                <p className="font-bold text-sm leading-snug text-center">{msgText}</p>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4 w-full">
                <span className="text-white font-bold text-sm bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  {solvedWords.size}/{totalWords} từ
                </span>
                <span className="text-white font-bold text-sm bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  {formatT(timeLeft)} còn lại
                </span>
                {score > 0 && (
                  <span className="text-white font-bold text-sm bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                    {score} pts
                  </span>
                )}
              </div>

              {/* Reward Pills */}
              {(totalCoins !== 0 || totalXP > 0) && (
                <div className="flex items-end justify-center gap-4 mb-4 w-full max-w-md mx-auto">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Coin</span>
                    <div ref={coinPillRef} className="flex items-center justify-center bg-yellow-400 text-[#1e3a8a] rounded-full border-4 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1)] py-1.5 px-4 relative overflow-hidden">
                      <div className="absolute inset-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-full" />
                      <img src={iconCoin} alt="" className="w-6 h-6 relative z-10 mr-1.5" />
                      <motion.span key={displayCoins} initial={{ y:-4, opacity:0.7 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.08 }}
                        className="text-xl font-black relative z-10">
                        {displayCoins >= 0 ? '+' : ''}{displayCoins.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">XP</span>
                    <div ref={xpPillRef} className="flex items-center justify-center bg-amber-500 text-white rounded-full border-4 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1)] py-1.5 px-4 relative overflow-hidden">
                      <div className="absolute inset-0 w-full h-1/2 bg-white/25 pointer-events-none rounded-t-full" />
                      <img src={iconTrophy} alt="" className="w-6 h-6 relative z-10 mr-1.5" />
                      <motion.span key={displayXP} initial={{ y:-4, opacity:0.7 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.08 }}
                        className="text-xl font-black relative z-10">
                        +{displayXP.toLocaleString()}
                      </motion.span>
                      <span className="text-base font-black ml-1.5 relative z-10">XP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* P2P comparison */}
              {isP2P && (
                <div className="w-full max-w-md mb-4 rounded-2xl overflow-hidden"
                  style={{ background:'linear-gradient(180deg,#1e3a8a,#1e40af)', border:'3px solid #60a5fa' }}>
                  <div className="px-4 py-2 text-center text-xs font-black tracking-widest uppercase text-blue-200 border-b border-blue-500/40">
                    Số Từ Tìm Được
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-2">
                    <ProgressBar label={myProfile?.nickname || 'Bạn'} percent={myPercent} color="#3b82f6" avatar={(myProfile?.nickname || 'B')[0]} />
                    <ProgressBar label={opponentProfile?.nickname || 'Đối thủ'} percent={opponentPercent} color="#ef4444" avatar={(opponentProfile?.nickname || 'Đ')[0]} />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-2 relative z-10 w-full max-w-md mx-auto mt-1 pb-4">
                {(onReplay || onNewGame) && (
                  <div className="flex flex-row gap-2">
                    {onReplay && (
                      <button onClick={onReplay}
                        className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest text-sm py-4 rounded-full border-4 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1)] active:translate-y-1.5 active:shadow-none transition-all flex justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 pointer-events-none rounded-t-full" />
                        <span className="relative z-10">Chơi Lại</span>
                      </button>
                    )}
                    {onNewGame && (
                      <button onClick={onNewGame}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-white font-black uppercase tracking-widest text-sm py-4 rounded-full border-4 border-green-900 shadow-[0_6px_0_rgba(20,83,45,1)] active:translate-y-1.5 active:shadow-none transition-all flex justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 pointer-events-none rounded-t-full" />
                        <span className="relative z-10">Chủ Đề Mới</span>
                      </button>
                    )}
                  </div>
                )}
                <button onClick={onLeaveGame}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-[#1e3a8a] font-black uppercase tracking-widest text-base py-4 rounded-full border-4 border-[#1e3a8a] shadow-[0_6px_0_rgba(30,58,138,1)] active:translate-y-1.5 active:shadow-none transition-all flex justify-center items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-full" />
                  <span className="relative z-10">Về Menu</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

const CrosswordGame = ({
  onLeaveGame,
  // P2P props (null in solo)
  opponentProgress = null,
  myProfile = null,
  opponentProfile = null,
  onProgressUpdate = null,
  onFinish = null,
}) => {
  // Game state: 'intro' → 'playing' → 'finished'
  const [gameState, setGameState] = useState('intro');
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Store — MUST be declared before puzzle state so lazy initialisers can use them
  const { addXP, addCoins, coins: userCoins, playedCrosswordIds, markCrosswordPlayed, globalScore, nickname, giaoxu } = usePlayFabStore();
  const { roomData } = useRoomStore();

  // Puzzle — solo: theo thứ tự; P2P: từ roomData.puzzleId
  const [puzzle, setPuzzle] = useState(() => {
    if (opponentProgress != null && roomData?.puzzleId) {
      return PUZZLES.find(p => p.id === roomData.puzzleId) ?? PUZZLES[0];
    }
    return pickNextPuzzle(PUZZLES, playedCrosswordIds);
  });
  const gridMap = useMemo(() => buildGridMap(puzzle), [puzzle]);
  const totalWords = puzzle.words.length;
  const [isReplay, setIsReplay] = useState(false);

  // User input grid
  const [userGrid, setUserGrid] = useState(() => {
    const { rows, cols } = puzzle.gridSize;
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  });

  // Selection
  const [selectedCell, setSelectedCell] = useState(null); // { row, col }
  const [direction, setDirection] = useState('across');    // current typing direction
  const [activeWordId, setActiveWordId] = useState(null);

  // Scoring
  const [solvedWords, setSolvedWords] = useState(new Set());
  const [wrongWords, setWrongWords] = useState(new Set());
  const [score, setScore] = useState(0);

  // Hints (solo only)
  const isSolo = opponentProgress == null;
  const [hintUsed, setHintUsed] = useState(false);     // whether any hint was used
  const [hintsSpent, setHintsSpent] = useState(0);      // total coins spent on hints
  const [showHintMenu, setShowHintMenu] = useState(false);

  // Earned rewards (set at finish for display)
  const [earnedXP, setEarnedXP] = useState(null);
  const [earnedCoins, setEarnedCoins] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const timerRef = useRef(null);

  // Celebration
  const [showCelebration, setShowCelebration] = useState(false);

  // Refs
  const gridContainerRef = useRef(null);
  const gridRef = useRef(null);
  const scrollToCellRef = useRef(null);

  /* ── compute which word is active ── */
  const getActiveWord = useCallback((row, col, dir) => {
    if (row == null) return null;
    const cell = gridMap[row]?.[col];
    if (!cell?.isCell) return null;
    // prefer the word matching current direction
    const match = cell.wordIds.find(wid => {
      const w = puzzle.words.find(ww => ww.id === wid);
      return w?.direction === dir;
    });
    if (match) return match;
    return cell.wordIds[0] || null;
  }, [gridMap, puzzle.words]);

  /* ── cell highlighting helpers ── */
  const getWordCells = useCallback((wordId) => {
    if (!wordId) return [];
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return [];
    const letters = [...w.answer];
    return letters.map((_, i) => ({
      row: w.direction === 'down' ? w.row + i : w.row,
      col: w.direction === 'across' ? w.col + i : w.col,
    }));
  }, [puzzle.words]);

  /* ── Select cell ── */
  const selectCell = useCallback((row, col) => {
    const cell = gridMap[row]?.[col];
    if (!cell?.isCell) return;

    // If clicking same cell, toggle direction
    let newDir = direction;
    if (selectedCell?.row === row && selectedCell?.col === col) {
      newDir = direction === 'across' ? 'down' : 'across';
    }
    setSelectedCell({ row, col });
    setDirection(newDir);
    const wid = getActiveWord(row, col, newDir);
    setActiveWordId(wid);
    // Refocus hidden input for physical keyboard
    setTimeout(() => hiddenInputRef.current?.focus({ preventScroll: true }), 0);
  }, [gridMap, selectedCell, direction, getActiveWord]);

  /* ── Select word from clue ── */
  const selectWordFromClue = useCallback((wordId) => {
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return;
    setDirection(w.direction);
    setSelectedCell({ row: w.row, col: w.col });
    setActiveWordId(wordId);
    // Scroll grid to show the word (especially useful in portrait)
    scrollToCellRef.current?.(w.row, w.col);
  }, [puzzle.words]);

  /* ── Move to next cell — skips filled cells, wraps to next unsolved word ── */
  const moveToNext = useCallback((row, col, dir) => {
    // Find the active word containing this cell in the current direction
    const activeWord = puzzle.words.find(w => {
      if (w.direction !== dir) return false;
      return [...w.answer].some((_, i) => {
        const wr = w.direction === 'down' ? w.row + i : w.row;
        const wc = w.direction === 'across' ? w.col + i : w.col;
        return wr === row && wc === col;
      });
    });

    if (activeWord) {
      // Find next empty cell AFTER current position within this word
      const len = activeWord.answer.length;
      for (let i = 0; i < len; i++) {
        const wr = activeWord.direction === 'down' ? activeWord.row + i : activeWord.row;
        const wc = activeWord.direction === 'across' ? activeWord.col + i : activeWord.col;
        const isAfter = dir === 'across' ? wc > col : wr > row;
        if (isAfter && !userGrid[wr]?.[wc]) {
          setSelectedCell({ row: wr, col: wc });
          return;
        }
      }
    } else {
      // No matched word with current direction — simple one-step advance
      const nr = dir === 'down' ? row + 1 : row;
      const nc = dir === 'across' ? col + 1 : col;
      if (nr < puzzle.gridSize.rows && nc < puzzle.gridSize.cols && gridMap[nr]?.[nc]?.isCell && !userGrid[nr]?.[nc]) {
        setSelectedCell({ row: nr, col: nc });
        return;
      }
    }

    // Word complete or all cells filled → jump to next unsolved word
    const words = puzzle.words;
    const currentIdx = words.findIndex(w => w.id === activeWord?.id);
    const ordered = currentIdx >= 0
      ? [...words.slice(currentIdx + 1), ...words.slice(0, currentIdx + 1)]
      : words;

    const nextWord = ordered.find(w => {
      if (solvedWords.has(w.id)) return false;
      return [...w.answer].some((_, i) => {
        const wr = w.direction === 'down' ? w.row + i : w.row;
        const wc = w.direction === 'across' ? w.col + i : w.col;
        return !userGrid[wr]?.[wc];
      });
    });
    if (nextWord) {
      const firstEmpty = [...nextWord.answer].findIndex((_, i) => {
        const wr = nextWord.direction === 'down' ? nextWord.row + i : nextWord.row;
        const wc = nextWord.direction === 'across' ? nextWord.col + i : nextWord.col;
        return !userGrid[wr]?.[wc];
      });
      const idx = firstEmpty >= 0 ? firstEmpty : 0;
      const tr = nextWord.direction === 'down' ? nextWord.row + idx : nextWord.row;
      const tc = nextWord.direction === 'across' ? nextWord.col + idx : nextWord.col;
      setDirection(nextWord.direction);
      setActiveWordId(nextWord.id);
      setSelectedCell({ row: tr, col: tc });
      scrollToCellRef.current?.(tr, tc);
    }
  }, [gridMap, puzzle.gridSize, puzzle.words, solvedWords, userGrid]);

  /* ── Move to previous cell ── */
  const moveToPrev = useCallback((row, col, dir) => {
    const nr = dir === 'down' ? row - 1 : row;
    const nc = dir === 'across' ? col - 1 : col;
    if (nr >= 0 && nc >= 0 && gridMap[nr]?.[nc]?.isCell) {
      setSelectedCell({ row: nr, col: nc });
    }
  }, [gridMap]);

  /* ── Check word completion ── */
  const checkWord = useCallback((wordId, currentUserGrid) => {
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return false;
    const letters = [...w.answer];
    return letters.every((ch, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      return currentUserGrid[r]?.[c]?.toUpperCase() === ch.toUpperCase();
    });
  }, [puzzle.words]);

  /* ── Check if all cells of a word are filled ── */
  const isWordFilled = useCallback((wordId, currentUserGrid) => {
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return false;
    const letters = [...w.answer];
    return letters.every((_, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      return currentUserGrid[r]?.[c]?.trim().length > 0;
    });
  }, [puzzle.words]);

  /* ── Handle letter input ── */
  const handleLetterInput = useCallback((letter) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (!gridMap[row]?.[col]?.isCell) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = letter.toUpperCase();
    setUserGrid(newGrid);

    // Remove wrong state if re-typing
    const cell = gridMap[row][col];
    cell.wordIds.forEach(wid => {
      if (wrongWords.has(wid)) {
        setWrongWords(prev => { const n = new Set(prev); n.delete(wid); return n; });
      }
    });

    // Auto-check each word this cell belongs to
    const newSolved = new Set(solvedWords);
    let changed = false;
    cell.wordIds.forEach(wid => {
      if (!newSolved.has(wid) && isWordFilled(wid, newGrid) && checkWord(wid, newGrid)) {
        newSolved.add(wid);
        changed = true;
      }
    });
    if (changed) {
      setSolvedWords(newSolved);
      setScore(newSolved.size * 10);
      // Report progress
      onProgressUpdate?.({
        score: newSolved.size * 10,
        completedItems: [...newSolved],
        lastUpdated: Date.now(),
      });
    }

    // Move to next cell
    moveToNext(row, col, direction);
  }, [selectedCell, gameState, gridMap, userGrid, direction, solvedWords, wrongWords, checkWord, isWordFilled, moveToNext, onProgressUpdate]);

  /* ── Handle backspace ── */
  const handleBackspace = useCallback(() => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (!gridMap[row]?.[col]?.isCell) return;

    const newGrid = userGrid.map(r => [...r]);
    if (newGrid[row][col]) {
      newGrid[row][col] = '';
      setUserGrid(newGrid);
    } else {
      // Move back and clear
      const pr = direction === 'down' ? row - 1 : row;
      const pc = direction === 'across' ? col - 1 : col;
      if (pr >= 0 && pc >= 0 && gridMap[pr]?.[pc]?.isCell) {
        newGrid[pr][pc] = '';
        setUserGrid(newGrid);
        setSelectedCell({ row: pr, col: pc });
      }
    }
  }, [selectedCell, gameState, gridMap, userGrid, direction]);

  /* ── Handle "Kiểm tra" all ── */
  const handleCheckAll = useCallback(() => {
    const newSolved = new Set(solvedWords);
    const newWrong = new Set();
    puzzle.words.forEach(w => {
      if (newSolved.has(w.id)) return;
      if (isWordFilled(w.id, userGrid)) {
        if (checkWord(w.id, userGrid)) {
          newSolved.add(w.id);
        } else {
          newWrong.add(w.id);
        }
      }
    });
    setSolvedWords(newSolved);
    setWrongWords(newWrong);
    setScore(newSolved.size * 10);
    onProgressUpdate?.({
      score: newSolved.size * 10,
      completedItems: [...newSolved],
      lastUpdated: Date.now(),
    });
  }, [solvedWords, puzzle.words, userGrid, checkWord, isWordFilled, onProgressUpdate]);

  /* ── Hint: Reveal one letter ── */
  const handleRevealLetter = useCallback(() => {
    if (!selectedCell || gameState !== 'playing' || !isSolo) return;
    const { row, col } = selectedCell;
    const cell = gridMap[row]?.[col];
    if (!cell?.isCell) return;
    // Already filled correctly?
    if (userGrid[row][col]?.toUpperCase() === cell.letter.toUpperCase()) return;

    // Check user has enough coins
    if (userCoins < 20) return;
    setHintUsed(true);
    setHintsSpent(prev => prev + 20);
    addCoins(-20); // deduct coins live
    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = cell.letter;
    setUserGrid(newGrid);

    // Auto-check words after reveal
    const newSolved = new Set(solvedWords);
    let changed = false;
    cell.wordIds.forEach(wid => {
      if (!newSolved.has(wid) && isWordFilled(wid, newGrid) && checkWord(wid, newGrid)) {
        newSolved.add(wid);
        changed = true;
      }
    });
    if (changed) {
      setSolvedWords(newSolved);
      setScore(newSolved.size * 10);
      onProgressUpdate?.({
        score: newSolved.size * 10,
        completedItems: [...newSolved],
        lastUpdated: Date.now(),
      });
    }
    moveToNext(row, col, direction);
    setShowHintMenu(false);
  }, [selectedCell, gameState, isSolo, gridMap, userGrid, solvedWords, checkWord, isWordFilled, moveToNext, direction, onProgressUpdate]);

  /* ── Hint: Reveal entire word ── */
  const handleRevealWord = useCallback(() => {
    if (!activeWordId || gameState !== 'playing' || !isSolo) return;
    const w = puzzle.words.find(ww => ww.id === activeWordId);
    if (!w) return;

    // Check user has enough coins
    if (userCoins < 50) return;
    setHintUsed(true);
    setHintsSpent(prev => prev + 50);
    addCoins(-50); // deduct coins live
    const newGrid = userGrid.map(r => [...r]);
    const letters = [...w.answer];
    letters.forEach((ch, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      newGrid[r][c] = ch;
    });
    setUserGrid(newGrid);

    // Mark as solved + check cross-words
    const newSolved = new Set(solvedWords);
    newSolved.add(w.id);
    // Check all words that share cells with this word
    letters.forEach((_, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      gridMap[r][c].wordIds.forEach(wid => {
        if (!newSolved.has(wid) && isWordFilled(wid, newGrid) && checkWord(wid, newGrid)) {
          newSolved.add(wid);
        }
      });
    });
    setSolvedWords(newSolved);
    setScore(newSolved.size * 10);
    onProgressUpdate?.({
      score: newSolved.size * 10,
      completedItems: [...newSolved],
      lastUpdated: Date.now(),
    });
    setShowHintMenu(false);
  }, [activeWordId, gameState, isSolo, puzzle.words, userGrid, gridMap, solvedWords, checkWord, isWordFilled, onProgressUpdate]);

  /* ── Hidden input for physical keyboard + IME support ── */
  const hiddenInputRef = useRef(null);
  const handleLetterInputRef = useRef(handleLetterInput);
  const handleBackspaceRef = useRef(handleBackspace);
  const selectedCellRef = useRef(selectedCell);
  handleLetterInputRef.current = handleLetterInput;
  handleBackspaceRef.current = handleBackspace;
  selectedCellRef.current = selectedCell;

  // Keep hidden input focused during gameplay
  const focusHiddenInput = useCallback(() => {
    if (gameState === 'playing' && hiddenInputRef.current) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, [gameState]);

  useEffect(() => {
    focusHiddenInput();
  }, [selectedCell, focusHiddenInput]);

  // Handle character input from hidden input (works with all IME modes)
  const lastInputTimeRef = useRef(0);
  const onHiddenInput = useCallback((e) => {
    // Skip intermediate composition input events
    if (e.nativeEvent?.isComposing) return;
    const val = e.target.value;
    if (val) {
      const lastChar = val.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(lastChar)) {
        lastInputTimeRef.current = Date.now();
        handleLetterInputRef.current(lastChar);
      }
      e.target.value = '';
    }
  }, []);

  // Handle special keys on hidden input (Backspace, Arrow, Tab)
  const onHiddenKeyDown = useCallback((e) => {
    if (e.isComposing) return; // let IME handle it
    const sel = selectedCellRef.current;

    if (e.key === 'Backspace') {
      // Ignore Backspace from IME (Unikey sends Backspace+replacement char
      // within <100ms of the previous input event)
      if (Date.now() - lastInputTimeRef.current < 100) return;
      e.preventDefault();
      handleBackspaceRef.current();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      setDirection(d => d === 'across' ? 'down' : 'across');
      return;
    }
    if (e.key === 'ArrowUp' && sel) {
      e.preventDefault();
      const nr = sel.row - 1;
      if (nr >= 0 && gridMap[nr]?.[sel.col]?.isCell) {
        setSelectedCell({ row: nr, col: sel.col });
        setDirection('down');
      }
      return;
    }
    if (e.key === 'ArrowDown' && sel) {
      e.preventDefault();
      const nr = sel.row + 1;
      if (nr < puzzle.gridSize.rows && gridMap[nr]?.[sel.col]?.isCell) {
        setSelectedCell({ row: nr, col: sel.col });
        setDirection('down');
      }
      return;
    }
    if (e.key === 'ArrowLeft' && sel) {
      e.preventDefault();
      const nc = sel.col - 1;
      if (nc >= 0 && gridMap[sel.row]?.[nc]?.isCell) {
        setSelectedCell({ row: sel.row, col: nc });
        setDirection('across');
      }
      return;
    }
    if (e.key === 'ArrowRight' && sel) {
      e.preventDefault();
      const nc = sel.col + 1;
      if (nc < puzzle.gridSize.cols && gridMap[sel.row]?.[nc]?.isCell) {
        setSelectedCell({ row: sel.row, col: nc });
        setDirection('across');
      }
      return;
    }
  }, [gridMap, puzzle.gridSize]);

  /* ── Timer ── */
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  /* ── Auto-finish when time runs out ── */
  useEffect(() => {
    if (gameState === 'playing' && timeLeft <= 0) {
      finishGame();
    }
  }, [timeLeft, gameState]);

  /* ── Auto-finish when all words solved ── */
  useEffect(() => {
    if (gameState === 'playing' && solvedWords.size === totalWords) {
      setShowCelebration(true);
      setTimeout(() => finishGame(), 2000);
    }
  }, [solvedWords.size, totalWords, gameState]);

  /* ── Finish game ── */
  const finishGame = useCallback(() => {
    clearInterval(timerRef.current);

    if (isReplay) {
      // ── REPLAY: 0 XP, only +2 coin per word ──
      const wordCoins = solvedWords.size * 2;
      setEarnedXP({ wordsXP: 0, completionXP: 0, noHintXP: 0, speedXP: 0, total: 0 });
      setEarnedCoins({ wordCoins, completionCoins: 0, perfectBonus: 0, hintsSpent, total: wordCoins - hintsSpent });
      if (isSolo) {
        addCoins(wordCoins); // hints already deducted live
      }
    } else {
      // ── FIRST PLAY: full rewards ──
      const wordsXP = solvedWords.size * 3;
      const completionXP = 20;
      const noHintXP = !hintUsed ? 10 : 0;
      const timeUsed = 300 - timeLeft;
      const speedXP = timeUsed <= 120 ? 10 : 0;
      const totalXP = wordsXP + completionXP + noHintXP + speedXP;

      const wordCoins = solvedWords.size * 5;
      const completionCoins = 20;
      const perfectBonus = solvedWords.size === totalWords ? 20 : 0;
      const rewardCoins = wordCoins + completionCoins + perfectBonus;

      setEarnedXP({ wordsXP, completionXP, noHintXP, speedXP, total: totalXP });
      setEarnedCoins({ wordCoins, completionCoins, perfectBonus, hintsSpent, total: rewardCoins - hintsSpent });

      if (isSolo) {
        addXP(totalXP);
        addCoins(rewardCoins);
      }
    }

    const finalScore = solvedWords.size * 10 + Math.floor(timeLeft / 10);
    setScore(finalScore);
    setGameState('finished');
    onFinish?.({
      score: finalScore,
      completedItems: [...solvedWords],
      timeLeft,
      xpEarned: isReplay ? 0 : undefined,
      hintUsed,
      hintsSpent,
    });
  }, [solvedWords, timeLeft, onFinish, hintUsed, hintsSpent, totalWords, isSolo, addXP, addCoins, isReplay]);

  /* ── Start game ── */
  const handleStart = () => {
    setGameState('playing');
    markCrosswordPlayed(puzzle.id);
    const firstWord = puzzle.words[0];
    if (firstWord) {
      setSelectedCell({ row: firstWord.row, col: firstWord.col });
      setDirection(firstWord.direction);
      setActiveWordId(firstWord.id);
    }
  };

  /* ── P2P: sync puzzle từ roomData khi host đã chọn ── */
  useEffect(() => {
    if (opponentProgress == null) return;
    if (!roomData?.puzzleId) return;
    const p = PUZZLES.find(pp => pp.id === roomData.puzzleId);
    if (p && p.id !== puzzle.id) {
      setPuzzle(p);
      resetGameState(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData?.puzzleId]);

  /* ── Reset game state (shared by replay & new game) ── */
  const resetGameState = (targetPuzzle) => {
    const { rows, cols } = targetPuzzle.gridSize;
    setUserGrid(Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')));
    setSelectedCell(null);
    setDirection('across');
    setActiveWordId(null);
    setSolvedWords(new Set());
    setWrongWords(new Set());
    setScore(0);
    setHintUsed(false);
    setHintsSpent(0);
    setShowHintMenu(false);
    setEarnedXP(null);
    setEarnedCoins(null);
    setTimeLeft(300);
    setShowCelebration(false);
    clearInterval(timerRef.current);
  };

  /* ── Replay same puzzle (0 XP, reduced coins) ── */
  const handleReplay = () => {
    setIsReplay(true);
    resetGameState(puzzle);
    setGameState('playing');
    const firstWord = puzzle.words[0];
    if (firstWord) {
      setSelectedCell({ row: firstWord.row, col: firstWord.col });
      setDirection(firstWord.direction);
      setActiveWordId(firstWord.id);
    }
  };

  /* ── New game with a different puzzle (full rewards) ── */
  const handleNewGame = () => {
    setIsReplay(false);
    const newPuzzle = pickNextPuzzle(PUZZLES, playedCrosswordIds, puzzle);
    setPuzzle(newPuzzle);
    resetGameState(newPuzzle);
    setGameState('intro');
  };

  /* ── Update active word when selection changes ── */
  useEffect(() => {
    if (selectedCell) {
      const wid = getActiveWord(selectedCell.row, selectedCell.col, direction);
      setActiveWordId(wid);
    }
  }, [selectedCell, direction, getActiveWord]);

  /* ── Format time ── */
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ── Active word cells ── */
  const activeWordCells = useMemo(() => {
    if (!activeWordId) return [];
    return getWordCells(activeWordId);
  }, [activeWordId, getWordCells]);

  /* ── Progress Percents ── */
  const myPercent = (solvedWords.size / totalWords) * 100;
  const opponentPercent = opponentProgress
    ? ((opponentProgress.completedItems?.length || 0) / totalWords) * 100
    : 0;

  /* ── Orientation ── */
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  );
  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── Cell Size ── */
  const [cellSize, setCellSize] = useState(36);
  useEffect(() => {
    const measure = () => {
      const el = gridContainerRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const maxCellW = Math.floor((w - 12) / puzzle.gridSize.cols);
      const maxCellH = Math.floor((h - 12) / puzzle.gridSize.rows);
      // In landscape: fit all cells within the container (no scroll needed)
      // In portrait: allow oversized cells with scrolling
      const isLand = window.innerWidth > window.innerHeight;
      const fitted = Math.min(maxCellW, maxCellH);
      const computed = isLand ? Math.round(fitted * 0.92) : Math.round(fitted * 1.5);
      setCellSize(Math.max(28, Math.min(90, computed)));
    };
    // Slight delay so flex layout has settled before measuring
    const t = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [puzzle.gridSize, isLandscape, gameState]);

  /* ── keep scroll helper in a ref so it can be called from anywhere ── */
  scrollToCellRef.current = (row, col) => {
    const container = gridContainerRef.current;
    if (!container) return;
    const cellX = col * (cellSize + 2);
    const cellY = row * (cellSize + 2);
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    container.scrollTo({
      left: Math.max(0, cellX - containerW / 2 + cellSize / 2),
      top: Math.max(0, cellY - containerH / 2 + cellSize / 2),
      behavior: 'smooth',
    });
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */

  // ── INTRO SCREEN ──
  if (gameState === 'intro') {
    const rankName = getRankByScore(globalScore || 0);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
        style={{ ...BG_STYLE }}>
        {/* Dark overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(5,10,25,0.78)' }} />

        {/* Ambient glow shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/8" />
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 9, repeat: Infinity }}
            className="absolute -bottom-16 -right-16 w-52 h-52 rounded-3xl rotate-45 bg-blue-600/8" />
        </div>

        <motion.div
          key="lobby"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="m-auto max-w-sm w-full flex flex-col gap-3 px-4 my-auto z-10"
        >
          {/* ── Game title card — matches Pinnacle lobby ── */}
          <div className="bg-[#1e3a8a]/80 backdrop-blur-sm rounded-2xl border-2 border-blue-400/40 p-5 text-center shadow-xl relative">
            <div className="text-4xl mb-1">✝️</div>
            <h1 className="text-2xl font-black text-yellow-300 uppercase tracking-widest mb-0.5"
              style={{ textShadow: '0 3px 0 #78350f' }}>
              Giải Ô Chữ
            </h1>
            <p className="text-blue-200 text-xs font-semibold">{puzzle.theme} · {totalWords} từ cần tìm</p>

            {/* Rules chips */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {[
                { icon: '📝', text: 'Điền chữ theo gợi ý' },
                { icon: '⏱️', text: '5 phút' },
                { icon: '💡', text: 'Hint: 20-50 💰' },
              ].map(({ icon, text }) => (
                <span key={text} className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-blue-100"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {icon} {text}
                </span>
              ))}
            </div>

            {/* Reward row */}
            <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-white/10">
              <span className="text-[11px] font-bold text-purple-300">⭐ +3 XP/từ</span>
              <span className="text-white/30 text-[11px]">·</span>
              <span className="text-[11px] font-bold text-amber-300">💰 +5 Coin/từ</span>
              <span className="text-white/30 text-[11px]">·</span>
              <span className="text-[11px] font-bold text-yellow-300">🏆 Bonus 100%</span>
            </div>
          </div>

          {/* ── Action button ── */}
          <button
            onClick={handleStart}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-[#1e3a8a] font-black uppercase tracking-wider text-base py-4 rounded-2xl border-4 border-[#1e3a8a] shadow-[0_5px_0_rgba(30,58,138,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 pointer-events-none rounded-t-xl" />
            <Play fill="currentColor" size={18} className="relative z-10" />
            <span className="relative z-10">Bắt Đầu</span>
          </button>

          {/* ── Player info card ── */}
          <div className="bg-[#1e40af]/70 backdrop-blur-sm rounded-2xl border-2 border-blue-400/30 p-3.5 shadow-lg flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center font-black text-white text-base border-2 border-blue-300">
                {nickname?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-white font-black text-sm leading-tight truncate">{nickname || 'Người chơi'}</p>
                {rankName && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 shrink-0">{rankName}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-blue-200 font-semibold">🏆 {(globalScore || 0).toLocaleString()} XP</span>
                <span className="text-blue-400/60 text-[10px]">·</span>
                <span className="text-[11px] text-blue-200 font-semibold">💰 {(userCoins || 0).toLocaleString()}</span>
                {giaoxu && <><span className="text-blue-400/60 text-[10px]">·</span><span className="text-[11px] text-blue-200 font-semibold truncate">⛪ {giaoxu}</span></>}
              </div>
            </div>
          </div>

          {/* Back to menu */}
          <button onClick={onLeaveGame}
            className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full text-white/80 hover:text-white font-bold text-xs transition-all active:translate-y-0.5"
            style={{
              background: 'rgba(30,58,138,0.6)',
              border: '2px solid rgba(96,165,250,0.3)',
              boxShadow: '0 2px 0 rgba(15,23,42,0.5)',
            }}>
            <ChevronLeft size={16} strokeWidth={3} />
            Về trang chính
          </button>
        </motion.div>
      </div>
    );
  }

  // ── FINISHED SCREEN ──
  if (gameState === 'finished') {
    const isP2P = opponentProgress != null;
    const myWordsCount = solvedWords.size;
    const oppWordsCount = opponentProgress?.completedItems?.length || 0;
    const isWinner = isP2P ? myWordsCount > oppWordsCount : false;
    const isDraw = isP2P ? myWordsCount === oppWordsCount : false;
    const isPerfect = solvedWords.size === totalWords;
    return <CrosswordFinishedOverlay
      isPerfect={isPerfect}
      isP2P={isP2P} isWinner={isWinner} isDraw={isDraw}
      solvedWords={solvedWords} totalWords={totalWords}
      timeLeft={timeLeft} earnedXP={earnedXP} earnedCoins={earnedCoins}
      hintsSpent={hintsSpent} score={score}
      myProfile={myProfile} opponentProfile={opponentProfile}
      myPercent={myPercent} opponentPercent={opponentPercent}
      onReplay={isSolo ? handleReplay : undefined}
      onNewGame={isSolo ? handleNewGame : undefined}
      onLeaveGame={onLeaveGame}
    />;
  }

  // ── PLAYING SCREEN ──
  const isP2P = opponentProgress != null;
  const acrossClues = puzzle.words.filter(w => w.direction === 'across');
  const downClues = puzzle.words.filter(w => w.direction === 'down');

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none"
      style={{ ...BG_STYLE }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'rgba(10,15,30,0.70)' }} />

      {/* Hidden input for physical keyboard + IME — inputMode="none" prevents native mobile keyboard */}
      <input
        ref={hiddenInputRef}
        onInput={onHiddenInput}
        onKeyDown={onHiddenKeyDown}
        inputMode="none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
          left: -9999,
          top: 0,
          zIndex: -1,
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center gap-2 px-3 py-2"
        style={{ background: '#1e3a8a', borderBottom: '3px solid #172554' }}>

        {/* Quit */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmQuit(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
          <ArrowLeft size={16} className="text-white" />
        </motion.button>

        {/* Title */}
        <span className="font-black text-white text-sm md:text-base flex-1 truncate" style={{ textShadow: '0 1px 0 #172554' }}>
          Giải ô chữ <span className="font-semibold text-blue-200 text-xs ml-1 opacity-80">· {puzzle.theme}</span>
        </span>

        {/* Timer */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs"
          style={{
            background: timeLeft <= 30 ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.4)',
            border: `2px solid ${timeLeft <= 30 ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            color: timeLeft <= 30 ? '#fca5a5' : '#93c5fd',
          }}>
          <Clock size={13} />
          {formatTime(timeLeft)}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs text-amber-200"
          style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(251,191,36,0.3)' }}>
          <Star size={13} className="text-amber-400" />
          {score}
        </div>

        {/* Check button */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleCheckAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-xs text-white"
          style={{ background: 'linear-gradient(180deg, #10b981, #059669)', border: '2px solid #047857', boxShadow: '0 2px 0 #047857' }}>
          <Check size={13} /> Kiểm tra
        </motion.button>
      </div>

      {/* ── P2P PROGRESS ── */}
      {isP2P && (
        <div className="relative z-10 flex-shrink-0 px-3 py-2 flex gap-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <ProgressBar label={myProfile?.nickname || 'Bạn'} percent={myPercent} color="#3b82f6" avatar={(myProfile?.nickname || 'B')[0]} />
          <ProgressBar label={opponentProfile?.nickname || 'Đối thủ'} percent={opponentPercent} color="#ef4444" avatar={(opponentProfile?.nickname || 'Đ')[0]} />
        </div>
      )}

      {/* ── BODY ── */}
      {/* Landscape: row layout (grid | right-pane), Portrait: column layout (grid then keyboard) */}
      <div className={`relative z-10 flex-1 min-h-0 flex gap-2 p-2 ${isLandscape ? 'flex-row' : 'flex-col'}`}>

        {/* ── GRID ── */}
        <div ref={gridContainerRef}
          className={`overflow-auto ${
            isLandscape ? 'flex-1 min-w-0 min-h-0' : 'flex-1 min-h-0'
          }`}>
          <div ref={gridRef} className="grid gap-[2px] px-2"
            style={{
              gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${puzzle.gridSize.rows}, ${cellSize}px)`,
              width: 'fit-content',
              margin: isLandscape ? 'auto' : '0 auto',
              paddingTop: isLandscape ? 10 : 12,
              paddingBottom: isLandscape ? 10 : 12,
            }}>
            {Array.from({ length: puzzle.gridSize.rows }).map((_, r) =>
              Array.from({ length: puzzle.gridSize.cols }).map((_, c) => {
                const cell = gridMap[r][c];
                if (!cell.isCell) {
                  return <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize, background: 'transparent' }} />;
                }

                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                const isInActiveWord = activeWordCells.some(ac => ac.row === r && ac.col === c);
                const cellWordIds = cell.wordIds;
                const isSolved = cellWordIds.some(wid => solvedWords.has(wid));
                const isWrong = cellWordIds.some(wid => wrongWords.has(wid));

                // Glossy gradient backgrounds
                let bg, border, shadow;
                if (isSelected) {
                  bg = 'linear-gradient(180deg, #fde68a 0%, #fbbf24 40%, #f59e0b 100%)';
                  border = '2px solid #d97706';
                  shadow = '0 3px 0 #b45309, 0 5px 10px rgba(245,158,11,0.4), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.08)';
                } else if (isSolved) {
                  bg = 'linear-gradient(180deg, #86efac 0%, #4ade80 40%, #22c55e 100%)';
                  border = '2px solid #16a34a';
                  shadow = '0 3px 0 #15803d, 0 5px 10px rgba(34,197,94,0.35), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.08)';
                } else if (isWrong) {
                  bg = 'linear-gradient(180deg, #fca5a5 0%, #f87171 40%, #ef4444 100%)';
                  border = '2px solid #dc2626';
                  shadow = '0 3px 0 #b91c1c, 0 5px 10px rgba(239,68,68,0.35), inset 0 1px 2px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.08)';
                } else if (isInActiveWord) {
                  bg = 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 40%, #93c5fd 100%)';
                  border = '2px solid #60a5fa';
                  shadow = '0 3px 0 #3b82f6, 0 5px 10px rgba(59,130,246,0.25), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.05)';
                } else {
                  bg = 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, #e2e8f0 100%)';
                  border = '1px solid rgba(0,0,0,0.12)';
                  shadow = '0 3px 0 rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.04)';
                }

                return (
                  <motion.div
                    key={`${r}-${c}`}
                    onClick={() => selectCell(r, c)}
                    whileTap={{ scale: 0.92 }}
                    className="relative flex items-center justify-center cursor-pointer overflow-hidden"
                    style={{
                      width: cellSize, height: cellSize,
                      background: bg,
                      border,
                      borderRadius: 8,
                      boxShadow: shadow,
                      transition: 'all 0.18s ease',
                    }}>
                    {/* Cell number */}
                    {cell.cellNum && (
                      <span className="absolute font-black text-blue-800/70 leading-none"
                        style={{ fontSize: Math.max(8, cellSize * 0.26), top: 1, left: 2 }}>
                        {cell.cellNum}
                      </span>
                    )}
                    {/* Letter */}
                    <span className="font-black leading-none"
                      style={{
                        fontSize: Math.max(10, cellSize * 0.48),
                        color: isSolved ? '#15803d' : isWrong ? '#dc2626' : '#1e293b',
                      }}>
                      {userGrid[r][c] || ''}
                    </span>
                    {/* Solved check */}
                    {isSolved && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute text-green-500"
                        style={{ fontSize: Math.max(7, cellSize * 0.25), bottom: 0, right: 1 }}>✓</motion.span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE (landscape: hints + clues stacked vertically) ── */}
        {isLandscape ? (
          <div className="flex-shrink-0 flex flex-col gap-2" style={{ width: 220 }}>
            {/* Hint buttons */}
            {isSolo && (
              <div className="flex flex-col gap-2">
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealLetter}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden w-full"
                  style={{ background: 'linear-gradient(180deg, #06b6d4, #0891b2)', border: '2px solid #0e7490', boxShadow: '0 3px 0 #0e7490' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Eye size={13} className="relative z-10" />
                  <span className="relative z-10">Mở 1 chữ</span>
                  <span className="relative z-10 text-amber-300 text-[10px] font-bold ml-auto">20💰</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealWord}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden w-full"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '2px solid #b45309', boxShadow: '0 3px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Lightbulb size={13} className="relative z-10" />
                  <span className="relative z-10">Mở cả từ</span>
                  <span className="relative z-10 text-white/80 text-[10px] font-bold ml-auto">50💰</span>
                </motion.button>
              </div>
            )}
            {/* Clues */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 space-y-2 scrollbar-hide"
              style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div>
                <p className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">→ Ngang</p>
                {acrossClues.map(w => {
                  const solved = solvedWords.has(w.id);
                  const wrong = wrongWords.has(w.id);
                  const active = activeWordId === w.id;
                  return (
                    <motion.button key={w.id}
                      onClick={() => selectWordFromClue(w.id)}
                      className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                        ${active ? 'bg-amber-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                      style={{ border: active ? '1px solid rgba(245,158,11,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                      <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-amber-300'}`}>{w.num}.</span>
                      <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                      {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                      {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                    </motion.button>
                  );
                })}
              </div>
              <div>
                <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">↓ Dọc</p>
                {downClues.map(w => {
                  const solved = solvedWords.has(w.id);
                  const wrong = wrongWords.has(w.id);
                  const active = activeWordId === w.id;
                  return (
                    <motion.button key={w.id}
                      onClick={() => selectWordFromClue(w.id)}
                      className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                        ${active ? 'bg-blue-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                      style={{ border: active ? '1px solid rgba(59,130,246,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                      <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-blue-300'}`}>{w.num}.</span>
                      <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                      {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                      {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Portrait: hints as a row above clues, clues in a short panel */
          <div className="flex-shrink-0 flex flex-col gap-2" style={{ maxHeight: '38vh' }}>
            {/* Hint buttons row */}
            {isSolo && (
              <div className="flex gap-2 flex-shrink-0">
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealLetter}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #06b6d4, #0891b2)', border: '2px solid #0e7490', boxShadow: '0 3px 0 #0e7490' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Eye size={13} className="relative z-10" />
                  <span className="relative z-10">Mở 1 chữ</span>
                  <span className="relative z-10 text-amber-300 text-[10px] font-bold">20💰</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealWord}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '2px solid #b45309', boxShadow: '0 3px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Lightbulb size={13} className="relative z-10" />
                  <span className="relative z-10">Mở cả từ</span>
                  <span className="relative z-10 text-white/80 text-[10px] font-bold">50💰</span>
                </motion.button>
              </div>
            )}
            {/* Clues panel — short, scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 space-y-2 scrollbar-hide"
              style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">→ Ngang</p>
                  {acrossClues.map(w => {
                    const solved = solvedWords.has(w.id);
                    const wrong = wrongWords.has(w.id);
                    const active = activeWordId === w.id;
                    return (
                      <motion.button key={w.id}
                        onClick={() => selectWordFromClue(w.id)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                          ${active ? 'bg-amber-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                        style={{ border: active ? '1px solid rgba(245,158,11,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                        <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-amber-300'}`}>{w.num}.</span>
                        <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                        {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                        {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex-1">
                  <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">↓ Dọc</p>
                  {downClues.map(w => {
                    const solved = solvedWords.has(w.id);
                    const wrong = wrongWords.has(w.id);
                    const active = activeWordId === w.id;
                    return (
                      <motion.button key={w.id}
                        onClick={() => selectWordFromClue(w.id)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                          ${active ? 'bg-blue-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                        style={{ border: active ? '1px solid rgba(59,130,246,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                        <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-blue-300'}`}>{w.num}.</span>
                        <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                        {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                        {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── VIRTUAL KEYBOARD (portrait only) ── */}
      {!isLandscape && (
        <div className="relative z-10 flex-shrink-0 px-2 pb-2">
          <VirtualKeyboard onKey={handleLetterInput} onBackspace={handleBackspace} compact />
        </div>
      )}

      {/* ── QUIT CONFIRM ── */}
      <AnimatePresence>
        {confirmQuit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="rounded-3xl p-6 max-w-sm w-full text-center space-y-4"
              style={{ background: 'linear-gradient(180deg, #1e293b, #0f172a)', border: '3px solid rgba(255,255,255,0.15)' }}>
              <p className="text-white font-black text-xl">Thoát game?</p>
              <p className="text-white/60 text-sm">Tiến trình sẽ không được lưu</p>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95, y: 2 }}
                  onClick={() => setConfirmQuit(false)}
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  Ở lại
                </motion.button>
                <motion.button whileTap={{ scale: 0.95, y: 2 }}
                  onClick={onLeaveGame}
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: 'linear-gradient(180deg, #ef4444, #b91c1c)', border: '2px solid #991b1b', boxShadow: '0 3px 0 #7f1d1d' }}>
                  Thoát
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrosswordGame;
