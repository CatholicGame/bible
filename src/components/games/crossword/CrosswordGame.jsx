import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, Star, Check, RotateCcw, Zap, Eye, Lightbulb, ChevronLeft, Play, RefreshCcw } from 'lucide-react';
import { usePlayFabStore } from '../../../store/playfabStore';
import { getRankByScore } from '../../../utils/ranks';
import { useRoomStore } from '../../../store/roomStore';
import { useUserStore } from '../../../store/userStore';
import { useRoom } from '../../../hooks/useRoom';
import { setPendingRefund, clearPendingRefund } from '../../../hooks/usePendingRefund';
import EmojiReactionPanel from '../EmojiReactionPanel';
import UserAvatar from '../../common/UserAvatar';
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
const MIN_WORDS = 6; // puzzle phải có ít nhất 6 từ mới đưa vào chơi
const PUZZLES = RAW_PUZZLES.filter(p => p.words.length >= MIN_WORDS);

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
              color: k === '⌫' ? '#fff' : '#1e293b',
              background: k === '⌫'
                ? 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)'
                : 'rgba(255,255,255,0.92)',
              border: k === '⌫' ? '1.5px solid #be123c' : '1.5px solid rgba(0,0,0,0.10)',
              boxShadow: k === '⌫'
                ? '0 2px 0 #9f1239, 0 1px 4px rgba(0,0,0,0.18)'
                : '0 2px 0 rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08)',
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
   P2P RACE BAR — fighting-game style
   Layout: [bar] [avatar] ⚔️ [avatar] [bar]
   Bar fill từ ngoài vo hướng vào avatar ở giữa
   ══════════════════════════════════════════════════════════════ */

const P2PRaceBar = ({ myLabel, myPercent, myColor, opponentLabel, opponentPercent, opponentColor, compact = false, opponentAvatarRef }) => {
  const clampedMy  = Math.min(100, Math.max(0, myPercent));
  const clampedOpp = Math.min(100, Math.max(0, opponentPercent));
  // compact = landscape strip, !compact = portrait panel
  const AV   = compact ? 34 : 44;
  const BAR  = compact ? 7  : 10;
  const FONT_NAME = compact ? 11 : 13;
  const FONT_PCT  = compact ? 10 : 12;
  const isMyLeading  = clampedMy  > clampedOpp;
  const isOppLeading = clampedOpp > clampedMy;

  /* ── Avatar + name block (reused) ── */
  const Avatar = ({ label, color, isLeading, dataAttr, pct, domRef }) => (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <motion.div
        ref={domRef}
        data-p2p-avatar={dataAttr}
        animate={{ scale: isLeading ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: AV, height: AV, borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}cc, ${color})`,
          border: `2.5px solid ${color}`,
          boxShadow: `0 0 0 2px rgba(255,255,255,0.18), 0 0 ${isLeading ? 18 : 10}px ${color}aa`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: Math.round(AV * 0.42), color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        }}
      >
        {label?.[0]?.toUpperCase() || '?'}
      </motion.div>
      <span style={{
        fontSize: FONT_NAME, fontWeight: 900, color: '#1e293b',
        textShadow: '0 1px 0 rgba(255,255,255,0.6)',
        maxWidth: compact ? 64 : 82,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>{label}</span>
      <span style={{ fontSize: FONT_PCT, fontWeight: 800, color, marginTop: -1 }}>
        {Math.round(pct)}%
      </span>
    </div>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: compact ? 8 : 12,
      padding: compact ? '6px 0 4px' : '10px 0 8px',
      width: '100%',
    }}>

      {/* ── LEFT BAR: fill từ cạnh TRÁI vào phía avatar (edge → center) ── */}
      <div style={{ flex: 1, position: 'relative', height: BAR, borderRadius: 99, overflow: 'hidden',
        background: 'rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.07)', minWidth: 0 }}>
        <motion.div
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            background: `linear-gradient(to right, ${myColor}, ${myColor}77)`,
            borderRadius: 99, boxShadow: `0 0 10px ${myColor}77`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${clampedMy}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>

      {/* ── MY AVATAR (left of center) ── */}
      <Avatar label={myLabel} color={myColor} isLeading={isMyLeading} dataAttr="my" pct={clampedMy} />

      {/* ── CENTER ⚔️ ── */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ flexShrink: 0, fontSize: compact ? 16 : 20, lineHeight: 1 }}
      >⚔️</motion.div>

      {/* ── OPP AVATAR (right of center) ── */}
      <Avatar label={opponentLabel} color={opponentColor} isLeading={isOppLeading} dataAttr="opponent" pct={clampedOpp} domRef={opponentAvatarRef} />

      {/* ── RIGHT BAR: fill từ cạnh PHẢI vào phía avatar (edge → center) ── */}
      <div style={{ flex: 1, position: 'relative', height: BAR, borderRadius: 99, overflow: 'hidden',
        background: 'rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.07)', minWidth: 0 }}>
        <motion.div
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            background: `linear-gradient(to left, ${opponentColor}, ${opponentColor}77)`,
            borderRadius: 99, boxShadow: `0 0 10px ${opponentColor}77`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${clampedOpp}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>

    </div>
  );
};


/* Simple bar used in result overlay */
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
  onRequestRematch = null,   // P2P only
  canAffordRematch = true,   // P2P only
  rematchStatus = null,      // 'waiting'|'declined'
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
                    <ProgressBar label={myProfile?.nickname || myFBName || 'Bạn'} percent={myPercent} color="#3b82f6" avatar={(myProfile?.nickname || myFBName || 'B')[0]} />
                    <ProgressBar label={opponentProfile?.nickname || oppFBName || 'Đối thủ'} percent={opponentPercent} color="#ef4444" avatar={(opponentProfile?.nickname || oppFBName || 'Đ')[0]} />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-2 relative z-10 w-full max-w-md mx-auto mt-1 pb-4">
                {/* P2P: Chơi tiếp */}
                {isP2P && onRequestRematch && !rematchStatus && (
                  <button onClick={onRequestRematch}
                    disabled={!canAffordRematch}
                    className="w-full font-black uppercase tracking-widest text-sm py-4 rounded-full border-4 transition-all flex justify-center items-center relative overflow-hidden"
                    style={canAffordRematch
                      ? { background: '#22c55e', color: '#fff', borderColor: '#14532d', boxShadow: '0 6px 0 #14532d' }
                      : { background: '#94a3b8', color: '#fff', borderColor: '#475569', boxShadow: '0 4px 0 #475569', cursor: 'not-allowed' }}>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 pointer-events-none rounded-t-full" />
                    <span className="relative z-10">
                      {canAffordRematch ? '⚔️ Chơi Tiếp' : <>Cần 20 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> để chơi tiếp</>}
                    </span>
                  </button>
                )}
                {/* Đang chờ đối thủ phản hồi */}
                {isP2P && rematchStatus === 'waiting' && (
                  <div className="w-full py-3.5 rounded-full border-4 flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                    <span className="text-sm font-bold">Đang chờ đối thủ...</span>
                  </div>
                )}
                {/* Đối thủ từ chối */}
                {isP2P && rematchStatus === 'declined' && (
                  <p className="text-center text-red-300 text-sm font-semibold py-2">Đối thủ đã từ chối chơi tiếp</p>
                )}

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
  // Game state: 'intro' | 'matchSetup' | 'playing' | 'finished'
  // P2P bắt đầu từ 'matchSetup' (countdown) thay vì 'intro'
  const isP2PMode = myProfile != null; // khai báo đầu để dùng trong useState init
  const [gameState, setGameState] = useState(() => isP2PMode ? 'matchSetup' : 'intro');
  const [countdown, setCountdown] = useState(3);   // 3-2-1 countdown
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [hintEffects, setHintEffects] = useState([]);

  // Store — MUST be declared before puzzle state so lazy initialisers can use them
  const { addXP, addCoins, coins: userCoins, playedCrosswordIds, markCrosswordPlayed, globalScore, nickname, giaoxu, avatarUrl } = usePlayFabStore();
  const { roomData, roomId, myRole } = useRoomStore();
  const { uid: storeUid } = useUserStore();
  const { leaveRoom, requestRematch, acceptRematch, declineRematch, chargeBet, awardWinner } = useRoom();
  const myUid = storeUid;
  // Lấy opponentUid từ roomData players (ngoại trừ myUid)
  const opponentUid = useMemo(() => {
    if (!roomData?.players || !myUid) return opponentProfile?.uid ?? null;
    return Object.keys(roomData.players).find(k => k !== myUid) ?? opponentProfile?.uid ?? null;
  }, [roomData?.players, myUid, opponentProfile?.uid]);
  const REMATCH_MIN_COINS = 20;
  const FORFEIT_BONUS = 30; // fallback khi không có wager
  const wager = roomData?.wager ?? 0;
  const pot = wager * 2; // tổng coin cược của 2 player cộng lại

  // ── Tên người chơi: luôn đọc từ Firebase roomData (single source of truth) ──
  // Cả 2 client đọc cùng 1 nguồn → tên luôn nhất quán giữa 2 màn hình
  const hostUid  = roomData?.hostUid;
  const guestUid = roomData?.guestUid;
  const p2pHostName  = roomData?.players?.[hostUid]?.nickname  || myProfile?.nickname  || 'Host';
  const p2pGuestName = roomData?.players?.[guestUid]?.nickname || opponentProfile?.nickname || 'Guest';
  // Đặt tên cho "tôi" và "đối thủ" dựa theo role
  const myFBName  = myRole === 'host' ? p2pHostName  : p2pGuestName;
  const oppFBName = myRole === 'host' ? p2pGuestName : p2pHostName;

  // Puzzle — solo: theo thứ tự; P2P: từ roomData.puzzleId (set bởi host trước khi game start)
  const [puzzle, setPuzzle] = useState(() => {
    if (isP2PMode && roomData?.puzzleId) {
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
  const isSolo = !isP2PMode;
  const [hintUsed, setHintUsed] = useState(false);
  const [hintsSpent, setHintsSpent] = useState(0);
  const [showHintMenu, setShowHintMenu] = useState(false);

  // P2P: forfeit + rematch state
  const [forfeitWin, setForfeitWin]           = useState(null);  // { name, coinReward } khi đối thủ bỏ cuộc
  const [rematchIncoming, setRematchIncoming] = useState(null);  // { fromName, puzzleId }
  const [rematchStatus, setRematchStatus]     = useState(null);  // 'waiting'|'declined'
  const [rematchHandled, setRematchHandled]   = useState(false); // tránh xử lý 2 lần

  // Bet animation state (matchSetup)
  const [betAnimDone, setBetAnimDone] = useState(false);   // cho phép countdown chạy sau anim
  const [betParticles, setBetParticles] = useState([]);    // coin particles bay vào pot
  const [potGlow, setPotGlow] = useState(false);           // pot bừng sáng sau khi coin tụ
  const [displayPot, setDisplayPot] = useState(0);         // số dư pot đang hiển thị
  const betChargedRef = useRef(false);                     // tránh charge 2 lần (StrictMode)
  const potRef = useRef(null);                             // ref tới pot element để lấy vị trí
  const myAvatarRef  = useRef(null);                       // ref avatar bản thân (trong matchSetup)
  const oppAvatarRef2 = useRef(null);                      // ref avatar đối thủ (trong matchSetup)

  // Earned rewards (set at finish for display)
  const [earnedXP, setEarnedXP] = useState(null);
  const [earnedCoins, setEarnedCoins] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const timerRef = useRef(null);

  // Ref to opponent avatar DOM element (used by EmojiReactionPanel for bubble positioning)
  const opponentAvatarRef = useRef(null);

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
  const handleRevealLetter = useCallback((e) => {
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
    if (e && e.clientX && e.clientY) { setHintEffects(prev => [...prev, { id: Date.now() + Math.random(), amt: 20, x: e.clientX, y: e.clientY }]); }
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
  const handleRevealWord = useCallback((e) => {
    if (!activeWordId || gameState !== 'playing' || !isSolo) return;
    const w = puzzle.words.find(ww => ww.id === activeWordId);
    if (!w) return;

    // Check user has enough coins
    if (userCoins < 50) return;
    setHintUsed(true);
    setHintsSpent(prev => prev + 50);
    addCoins(-50); // deduct coins live
    if (e && e.clientX && e.clientY) { setHintEffects(prev => [...prev, { id: Date.now() + Math.random(), amt: 50, x: e.clientX, y: e.clientY }]); }
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
        setSelectedCell({ row: sel.row, col: sel.col });
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

  /* ── P2P: distribute pot khi game kết thúc bình thường ── */
  useEffect(() => {
    if (!isP2PMode || gameState !== 'finished') return;
    const myWordsCount  = solvedWords.size;
    const oppWordsCount = opponentProgress?.completedItems?.length || 0;
    const isDraw = myWordsCount === oppWordsCount;
    const iWon  = myWordsCount > oppWordsCount;

    if (pot <= 0) { clearPendingRefund(); return; } // không có wager

    if (isDraw) {
      // Hòa: refund wager cho cả 2
      addCoins(wager);
      awardWinner(roomId, 'draw', pot, true);
    } else if (iWon) {
      // Ta thắng: nhận toàn bộ pot
      addCoins(pot);
      awardWinner(roomId, myUid, pot, false);
    } else {
      // Ta thua: đối thủ thắng, ghi result nhưng không award chính mình
      awardWinner(roomId, opponentUid, pot, false);
    }
    clearPendingRefund();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);


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

  /* ── P2P: sync puzzle từ roomData khi host đã chọn ──
     Chạy ngay khi puzzleId thay đổi, không chờ opponentProgress ── */
  useEffect(() => {
    if (!isP2PMode) return;
    if (!roomData?.puzzleId) return;
    const p = PUZZLES.find(pp => pp.id === roomData.puzzleId);
    if (p && p.id !== puzzle.id) {
      setPuzzle(p);
      resetGameState(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData?.puzzleId, isP2PMode]);

  /* ── P2P matchSetup countdown: 3-2-1 → auto-start — chứ bet animation xong ── */
  useEffect(() => {
    if (gameState !== 'matchSetup') return;
    if (!betAnimDone) return; // đợi animation coin bay xong
    if (countdown <= 0) {
      setGameState('playing');
      markCrosswordPlayed(puzzle.id);
      const firstWord = puzzle.words[0];
      if (firstWord) {
        setSelectedCell({ row: firstWord.row, col: firstWord.col });
        setDirection(firstWord.direction);
        setActiveWordId(firstWord.id);
      }
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, countdown, betAnimDone]);

  /* ── Charge bet + spawn coin animation khi bắt đầu matchSetup ── */
  useEffect(() => {
    if (gameState !== 'matchSetup') return;
    if (betChargedRef.current) return;
    betChargedRef.current = true;

    if (!wager || wager <= 0) {
      // Không có wager → bỏ qua animation, bắt đầu luôn
      setBetAnimDone(true);
      return;
    }

    // Bắt đầu animation ngay lập tức để tránh UI bị treo khi đợi mạng chậm
    spawnBetParticles();
    
    // Đếm số pot tăng dần 0 -> pot
    const targetPot = (wager || 0) * 2;
    const duration = 1400;
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setDisplayPot(targetPot);
        clearInterval(intervalId);
      } else {
        setDisplayPot(Math.floor((elapsed / duration) * targetPot));
      }
    }, 40);

    const tAnim = setTimeout(() => {
      setPotGlow(true);
      setTimeout(() => setBetAnimDone(true), 400);
    }, 1400);

    // Trừ coin và lưu pending refund chạy ngầm
    chargeBet(roomId, wager)
      .then(() => {
        setPendingRefund({ roomId, uid: myUid, amount: wager });
      })
      .catch(err => {
        console.warn('[BetCharge] Failed:', err);
      });

    return () => {
      clearTimeout(tAnim);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  /* ── Spawn coin fly particles từ 2 avatar vào pot ── */
  const spawnBetParticles = useCallback(() => {
    const potEl = potRef.current;
    if (!potEl) { setBetAnimDone(true); return; }
    const potRect = potEl.getBoundingClientRect();
    const tx = potRect.left + potRect.width  / 2;
    const ty = potRect.top  + potRect.height / 2;

    // Lấy vị trí thực tế từ DOM avatar refs
    const myRect  = myAvatarRef.current?.getBoundingClientRect();
    const oppRect = oppAvatarRef2.current?.getBoundingClientRect();

    // Fallback nếu refs chưa mount
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const myX  = myRect  ? myRect.left  + myRect.width  / 2 : vw * 0.2;
    const myY  = myRect  ? myRect.top   + myRect.height / 2 : vh * 0.3;
    const oppX = oppRect ? oppRect.left + oppRect.width  / 2 : vw * 0.8;
    const oppY = oppRect ? oppRect.top  + oppRect.height / 2 : vh * 0.3;

    // Số lượng coin bay ra
    const count = 30; // 30 coin từ mỗi bên (tổng 60)
    const items = [];
    for (let i = 0; i < count; i++) {
      const isMine = i % 2 === 0;
      const ox = isMine ? myX : oppX;
      const oy = isMine ? myY : oppY;
      items.push({
        id: `bet-${Date.now()}-${i}`,
        ox: ox + (Math.random() - 0.5) * 24,
        oy: oy + (Math.random() - 0.5) * 16,
        bx: (Math.random() - 0.5) * 60,
        by: -(Math.random() * 40 + 20),
        tx,
        ty,
        delay: i * 0.03,
      });
    }
    setBetParticles(items);
    setTimeout(() => setBetParticles([]), 2000);
  }, []);



  /* ── P2P: watch forfeit (opponent bỏ cuộc giữa chừ́ng) ── */
  useEffect(() => {
    if (!isP2PMode || !roomData) return;
    if (gameState !== 'playing' && gameState !== 'matchSetup') return;
    const f = roomData.forfeit;
    if (f && f.uid !== myUid) {
      clearInterval(timerRef.current);
      setForfeitWin({ name: f.nickname || 'Đối thủ' });
    }
  }, [roomData?.forfeit?.timestamp, gameState, isP2PMode, myUid]);

  /* ── P2P: watch rematch request từ đối thủ ── */
  useEffect(() => {
    if (!isP2PMode || !roomData?.rematchRequest) return;
    const req = roomData.rematchRequest;
    // Đối thủ mời mình chơi tiếp
    if (req.toUid === myUid && req.status === 'pending' && !rematchHandled) {
      setRematchIncoming({ fromName: req.fromName || 'Đối thủ', puzzleId: req.puzzleId });
    }
    // Đối thủ từ chối lời mời của mình
    if (req.fromUid === myUid && req.status === 'declined') {
      setRematchStatus('declined');
    }
    // Cả 2 đồng ý rematch — reset game
    if (req.status === 'accepted' && !rematchHandled) {
      setRematchHandled(true);
      setRematchIncoming(null);
      setRematchStatus(null);
      setForfeitWin(null);
      setCountdown(3);
      // puzzle sẽ được cập nhật bởi effect roomData?.puzzleId
      resetGameState(puzzle);
      setGameState('matchSetup');
      // Reset rematchHandled sau 1s để tránh chạy lại
      setTimeout(() => setRematchHandled(false), 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData?.rematchRequest?.status, roomData?.rematchRequest?.timestamp]);

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
    
    // Reset matchSetup states for Rematch
    setBetAnimDone(false);
    setPotGlow(false);
    setDisplayPot(0);
    betChargedRef.current = false;
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
                { icon: '💡', text: <>Hint: 20-50 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></> },
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
              <span className="text-[11px] font-bold text-amber-300"><img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> +5 Coin/từ</span>
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
                <span className="text-[11px] text-blue-200 font-semibold"><img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> {(userCoins || 0).toLocaleString()}</span>
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

  // ── MATCH SETUP SCREEN (P2P only: 3-2-1 countdown) ──
  if (gameState === 'matchSetup') {
    // Host luôn bên trái (xanh), guest luôn bên phải (đỏ) — nhất quán trên cả 2 client
    const amHost       = myRole === 'host';
    const leftLabel    = p2pHostName;                          // host luôn trái
    const rightLabel   = p2pGuestName;                         // guest luôn phải
    const leftInitial  = leftLabel[0]?.toUpperCase()  || '?';
    const rightInitial = rightLabel[0]?.toUpperCase() || '?';

    // Avatar URLs: đọc từ roomData (Firebase) — single source of truth
    const hostAvatarUrl  = roomData?.players?.[hostUid]?.avatarUrl  || null;
    const guestAvatarUrl = roomData?.players?.[guestUid]?.avatarUrl || null;
    const leftAvatarUrl  = hostAvatarUrl;   // host = trái
    const rightAvatarUrl = guestAvatarUrl;  // guest = phải

    // Lấy số coin hiện tại của cả 2 từ Firebase để tránh sai lệch hiển thị
    const hostCoins  = amHost ? userCoins : (roomData?.players?.[hostUid]?.coins ?? 0);
    const guestCoins = !amHost ? userCoins : (roomData?.players?.[guestUid]?.coins ?? 0);
    const leftCoins  = hostCoins;
    const rightCoins = guestCoins;

    const countdownLabel = countdown > 0 ? String(countdown) : 'GO!';
    const countdownColor = countdown > 0
      ? ['#fbbf24', '#f97316', '#ef4444'][3 - countdown] ?? '#fbbf24'
      : '#22c55e';

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none"
        style={{ ...BG_STYLE }}>
        <div className="absolute inset-0" style={{ background: 'rgba(5,10,25,0.85)' }} />

        {/* Ambient pulses */}
        <motion.div animate={{ scale: [1,1.3,1] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 50%, ${countdownColor}22 0%, transparent 70%)` }} />

        {/* ── Landscape: profiles at top corners, countdown center ── */}
        {isLandscape ? (
          <>
            {/* My profile — top-left (host) */}
            <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute top-3 left-4 flex items-center gap-2 z-10"
              ref={amHost ? myAvatarRef : oppAvatarRef2}>
              <UserAvatar
                name={leftLabel}
                photoURL={leftAvatarUrl}
                size={36}
                style={{ border: '3px solid #93c5fd', boxShadow: '0 0 12px #3b82f688', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#93c5fd', maxWidth: 120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{leftLabel}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Host · Xanh</div>
                {/* Coin balance trước khi trừ */}
                {wager > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.4)', borderRadius:99, padding:'1px 6px', marginTop: 2, width: 'fit-content' }}>
                    <img src={iconCoin} alt="" style={{ width:10, height:10 }} />
                    <span style={{ fontSize:10, fontWeight:800, color:'#bfdbfe' }}>
                      {leftCoins.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Opponent profile — top-right (guest) */}
            <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute top-3 right-4 flex items-center gap-2 z-10 flex-row-reverse"
              ref={amHost ? oppAvatarRef2 : myAvatarRef}>
              <UserAvatar
                name={rightLabel}
                photoURL={rightAvatarUrl}
                size={36}
                style={{ border: '3px solid #fca5a5', boxShadow: '0 0 12px #ef444488', flexShrink: 0 }}
              />
              <div className="text-right flex flex-col items-end">
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fca5a5', maxWidth: 120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rightLabel}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Guest · Đỏ</div>
                {/* Coin balance trước khi trừ */}
                {wager > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:99, padding:'1px 6px', marginTop: 2, width: 'fit-content' }}>
                    <img src={iconCoin} alt="" style={{ width:10, height:10 }} />
                    <span style={{ fontSize:10, fontWeight:800, color:'#fecaca' }}>
                      {rightCoins.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Center: countdown + pot + puzzle info */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.div key={betAnimDone ? countdownLabel : 'bet'}
                  initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{ fontSize: 96, fontWeight: 900, color: betAnimDone ? countdownColor : '#fbbf24', textShadow: `0 0 40px ${betAnimDone ? countdownColor : '#fbbf24'}`, lineHeight: 1 }}>
                  {betAnimDone ? countdownLabel : '⏳'}
                </motion.div>
              </AnimatePresence>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: 3, textTransform: 'uppercase' }}>
                {!betAnimDone ? 'Đang tập hợp coin...' : (countdown > 0 ? 'Chuẩn bị...' : 'Bắt đầu!')}
              </div>

              {/* Pot display */}
              {wager > 0 && (
                <motion.div
                  ref={potRef}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: potGlow ? [1, 1.15, 1] : 1, opacity: 1 }}
                  transition={{ duration: potGlow ? 0.5 : 0.3 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: potGlow
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'rgba(251,191,36,0.15)',
                    border: `2px solid ${potGlow ? '#fef08a' : 'rgba(251,191,36,0.4)'}`,
                    borderRadius: 14, padding: '7px 16px',
                    boxShadow: potGlow ? '0 0 24px rgba(251,191,36,0.7)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                  <img src={iconCoin} alt="" style={{ width: 20, height: 20 }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 8, color: potGlow ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Giải thưởng</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: potGlow ? '#fff' : '#fbbf24', lineHeight: 1.1 }}>{displayPot} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></div>
                  </div>
                </motion.div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Chủ đề</div>
                <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 900 }}>{puzzle.theme}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{totalWords} từ cần tìm</div>
              </div>
            </div>
          </>
        ) : (
          /* ── Portrait: VS layout center ── */
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 w-full max-w-sm">
            {/* VS row: host (left, blue) vs guest (right, red) */}
            <div className="flex items-center gap-4 w-full">
              {/* Host avatar — left */}
              <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  ref={amHost ? myAvatarRef : oppAvatarRef2}
                  animate={{ scale: 1 }}
                  style={{ flexShrink: 0 }}
                >
                  <UserAvatar
                    name={leftLabel}
                    photoURL={leftAvatarUrl}
                    size={56}
                    style={{
                      border: '3px solid #93c5fd',
                      boxShadow: '0 0 20px #3b82f688',
                    }}
                  />
                </motion.div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#93c5fd', maxWidth: 90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>{leftLabel}</div>
                {/* Coin balance trước khi trừ */}
                {wager > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.4)', borderRadius:99, padding:'2px 7px' }}>
                    <img src={iconCoin} alt="" style={{ width:11, height:11 }} />
                    <span style={{ fontSize:10, fontWeight:800, color:'#bfdbfe' }}>
                      {leftCoins.toLocaleString()}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* VS */}
              <div style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, flexShrink: 0 }}>VS</div>

              {/* Guest avatar — right */}
              <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  ref={amHost ? oppAvatarRef2 : myAvatarRef}
                  animate={{ scale: 1 }}
                  style={{ flexShrink: 0 }}
                >
                  <UserAvatar
                    name={rightLabel}
                    photoURL={rightAvatarUrl}
                    size={56}
                    style={{
                      border: '3px solid #fca5a5',
                      boxShadow: '0 0 20px #ef444488',
                    }}
                  />
                </motion.div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fca5a5', maxWidth: 90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>{rightLabel}</div>
                {/* Coin balance trước khi trừ */}
                {wager > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:99, padding:'2px 7px' }}>
                    <img src={iconCoin} alt="" style={{ width:11, height:11 }} />
                    <span style={{ fontSize:10, fontWeight:800, color:'#fecaca' }}>
                      {rightCoins.toLocaleString()}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Countdown */}
            <AnimatePresence mode="wait">
              <motion.div key={betAnimDone ? countdownLabel : 'bet'}
                initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                style={{ fontSize: 80, fontWeight: 900, color: betAnimDone ? countdownColor : '#fbbf24', textShadow: `0 0 30px ${betAnimDone ? countdownColor : '#fbbf24'}`, lineHeight: 1 }}>
                {betAnimDone ? countdownLabel : '⏳'}
              </motion.div>
            </AnimatePresence>

            {/* Pot display — phía trên puzzle info */}
            {wager > 0 && (
              <motion.div
                ref={potRef}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: potGlow ? [1, 1.18, 1] : 1, opacity: 1 }}
                transition={{ duration: potGlow ? 0.5 : 0.3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: potGlow
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'rgba(251,191,36,0.15)',
                  border: `2px solid ${potGlow ? '#fef08a' : 'rgba(251,191,36,0.4)'}`,
                  borderRadius: 14, padding: '8px 18px',
                  boxShadow: potGlow ? '0 0 24px rgba(251,191,36,0.7)' : 'none',
                  transition: 'all 0.3s',
                }}>
                <img src={iconCoin} alt="" style={{ width: 22, height: 22 }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: potGlow ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Giải thưởng</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: potGlow ? '#fff' : '#fbbf24', lineHeight: 1.1 }}>{pot} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></div>
                </div>
              </motion.div>
            )}

            {/* Puzzle info */}
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '8px 20px', textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Câu đố • {totalWords} từ</div>
              <div style={{ fontSize: 15, color: '#fbbf24', fontWeight: 900, marginTop: 2 }}>{puzzle.theme}</div>
            </div>

            {/* Quit link */}
            <button onClick={onLeaveGame}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              Thoát trận
            </button>
          </div>
          )}

        {/* ── Bet coin fly particles (portal) ── */}
        {betParticles.map(p => createPortal(
          <motion.img
            key={p.id}
            src={iconCoin}
            alt=""
            initial={{ x: p.ox, y: p.oy, scale: 1, opacity: 1 }}
            animate={{ x: [p.ox, p.ox + p.bx, p.tx], y: [p.oy, p.oy + p.by, p.ty], scale: [1, 1.3, 0.5], opacity: [1, 1, 0] }}
            transition={{ duration: 0.95, delay: p.delay, ease: 'easeInOut', times: [0, 0.45, 1] }}
            style={{ position: 'fixed', top: 0, left: 0, width: 28, height: 28, zIndex: 10000, pointerEvents: 'none', filter: 'drop-shadow(0 2px 6px rgba(251,191,36,0.8))' }}
          />,
          document.body
        ))}
      </div>
    );
  }

  // ── FINISHED SCREEN ──
  if (gameState === 'finished') {
    const isP2P = isP2PMode;
    const myWordsCount = solvedWords.size;
    const oppWordsCount = opponentProgress?.completedItems?.length || 0;
    const isWinner = isP2P ? myWordsCount > oppWordsCount : false;
    const isDraw = isP2P ? myWordsCount === oppWordsCount : false;
    const isPerfect = solvedWords.size === totalWords;
    // Tính xem đối thủ còn online không (để hiện nút "Chơi tiếp")
    const opponentUid = Object.keys(roomData?.players ?? {}).find(k => k !== myUid);
    const opponentStillOnline = roomData?.players?.[opponentUid]?.isOnline !== false;
    const handleRequestRematch = async () => {
      if (!canAffordRematch || !roomId || !opponentUid) return;
      const nextPuzzle = pickNextPuzzle(PUZZLES, playedCrosswordIds);
      setRematchStatus('waiting');
      await requestRematch(roomId, opponentUid, nextPuzzle.id);
    };

    return <>
      <CrosswordFinishedOverlay
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
        onRequestRematch={isP2P && opponentStillOnline ? handleRequestRematch : null}
        canAffordRematch={canAffordRematch}
        rematchStatus={rematchStatus}
      />
    </>;
  }

  // ── PLAYING SCREEN ──
  const isP2P = isP2PMode;
  const acrossClues = puzzle.words.filter(w => w.direction === 'across');
  const downClues = puzzle.words.filter(w => w.direction === 'down');

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none"
      style={{ ...BG_STYLE }}>
      {/* Subtle light overlay — giảm tối, tăng độ trong */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'rgba(255,255,255,0.18)' }} />

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
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        }}>

        {/* Quit */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmQuit(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.07)', border: '1.5px solid rgba(0,0,0,0.12)' }}>
          <ArrowLeft size={16} className="text-slate-700" />
        </motion.button>

        {/* Title */}
        <span className="font-black text-slate-800 text-sm md:text-base flex-1 truncate">
          Giải ô chữ <span className="font-semibold text-slate-500 text-xs ml-1">· {puzzle.theme}</span>
        </span>

        {/* Timer */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs"
          style={{
            background: timeLeft <= 30 ? 'rgba(239,68,68,0.12)' : 'rgba(0,0,0,0.07)',
            border: `1.5px solid ${timeLeft <= 30 ? '#ef4444' : 'rgba(0,0,0,0.12)'}`,
            color: timeLeft <= 30 ? '#dc2626' : '#334155',
          }}>
          <Clock size={13} />
          {formatTime(timeLeft)}
        </div>

        {/* User Profile (Avatar + XP + Coins) */}
        <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-slate-900/10 border-[1.5px] border-slate-900/10 backdrop-blur-sm pr-3">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40 shadow-sm shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                {nickname?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          {/* Value XP */}
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-500" />
            <span className="font-black text-xs text-slate-700">{globalScore?.toLocaleString() || 0}</span>
          </div>

          <div className="w-px h-3 bg-slate-900/15 mx-0.5" />

          {/* Value Coin */}
          <div className="flex items-center gap-1">
            <img src={iconCoin} alt="C" className="w-3.5 h-3.5" />
            <span className="font-black text-xs text-slate-700">{userCoins?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>


      {/* ── P2P RACE BAR (landscape only — full-width strip between header & body) ── */}
      {isP2P && isLandscape && (
        <div className="relative z-10 flex-shrink-0 px-3"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}>
          <P2PRaceBar
            myLabel={p2pHostName}
            myPercent={myRole === 'host' ? myPercent : opponentPercent}
            myColor="#3b82f6"
            opponentLabel={p2pGuestName}
            opponentPercent={myRole === 'host' ? opponentPercent : myPercent}
            opponentColor="#ef4444"
            opponentAvatarRef={myRole === 'host' ? opponentAvatarRef : undefined}
            compact
          />
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
                  <span className="relative z-10 text-amber-300 text-[10px] font-bold ml-auto"><div className="flex items-center gap-0.5 relative z-10 text-amber-300 text-[10px] font-bold ml-auto">20<img src={iconCoin} alt="C" className="w-3.5 h-3.5" /></div></span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealWord}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden w-full"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '2px solid #b45309', boxShadow: '0 3px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Lightbulb size={13} className="relative z-10" />
                  <span className="relative z-10">Mở cả từ</span>
                  <span className="relative z-10 text-white/80 text-[10px] font-bold ml-auto"><div className="flex items-center gap-0.5 relative z-10 text-white/80 text-[10px] font-bold ml-auto">50<img src={iconCoin} alt="C" className="w-3.5 h-3.5" /></div></span>
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
            {/* P2P Race Bar — portrait, sits above clues */}
            {isP2P && (
              <div style={{
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 14,
                padding: '0 10px',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                flexShrink: 0,
              }}>
                <P2PRaceBar
                  myLabel={myRole === 'host' ? (myProfile?.nickname || 'Bạn') : (opponentProfile?.nickname || 'Đối thủ')}
                  myPercent={myRole === 'host' ? myPercent : opponentPercent}
                  myColor="#3b82f6"
                  opponentLabel={myRole === 'host' ? (opponentProfile?.nickname || 'Đối thủ') : (myProfile?.nickname || 'Bạn')}
                  opponentPercent={myRole === 'host' ? opponentPercent : myPercent}
                  opponentColor="#ef4444"
                  opponentAvatarRef={myRole === 'host' ? opponentAvatarRef : undefined}
                />
              </div>
            )}
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
                  <span className="relative z-10 text-amber-300 text-[10px] font-bold"><div className="flex items-center gap-0.5 relative z-10 text-amber-300 text-[10px] font-bold ml-auto">20<img src={iconCoin} alt="C" className="w-3.5 h-3.5" /></div></span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealWord}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '2px solid #b45309', boxShadow: '0 3px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Lightbulb size={13} className="relative z-10" />
                  <span className="relative z-10">Mở cả từ</span>
                  <span className="relative z-10 text-white/80 text-[10px] font-bold"><div className="flex items-center gap-0.5 relative z-10 text-white/80 text-[10px] font-bold ml-auto">50<img src={iconCoin} alt="C" className="w-3.5 h-3.5" /></div></span>
                </motion.button>
              </div>
            )}
            {/* Clues panel — short, scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 space-y-2 scrollbar-hide"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-orange-600 font-black text-[10px] uppercase tracking-widest mb-1 px-1">→ Ngang</p>
                  {acrossClues.map(w => {
                    const solved = solvedWords.has(w.id);
                    const wrong = wrongWords.has(w.id);
                    const active = activeWordId === w.id;
                    return (
                      <motion.button key={w.id}
                        onClick={() => selectWordFromClue(w.id)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                          ${active ? 'bg-amber-100' : solved ? 'bg-green-50' : wrong ? 'bg-red-50' : 'hover:bg-black/5'}`}
                        style={{ border: active ? '1px solid rgba(245,158,11,0.5)' : solved ? '1px solid rgba(34,197,94,0.4)' : wrong ? '1px solid rgba(239,68,68,0.4)' : '1px solid transparent' }}>
                        <span className={`font-black mr-1 ${solved ? 'text-green-600' : wrong ? 'text-red-500' : 'text-orange-500'}`}>{w.num}.</span>
                        <span className={`font-semibold flex-1 ${solved ? 'text-green-600/70 line-through' : wrong ? 'text-red-500' : 'text-slate-700'}`}>{w.clue}</span>
                        {solved && <span className="text-green-500 text-xs font-black shrink-0">✓</span>}
                        {wrong && <span className="text-red-500 text-xs font-black shrink-0">✗</span>}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex-1">
                  <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-1 px-1">↓ Dọc</p>
                  {downClues.map(w => {
                    const solved = solvedWords.has(w.id);
                    const wrong = wrongWords.has(w.id);
                    const active = activeWordId === w.id;
                    return (
                      <motion.button key={w.id}
                        onClick={() => selectWordFromClue(w.id)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                          ${active ? 'bg-blue-100' : solved ? 'bg-green-50' : wrong ? 'bg-red-50' : 'hover:bg-black/5'}`}
                        style={{ border: active ? '1px solid rgba(59,130,246,0.5)' : solved ? '1px solid rgba(34,197,94,0.4)' : wrong ? '1px solid rgba(239,68,68,0.4)' : '1px solid transparent' }}>
                        <span className={`font-black mr-1 ${solved ? 'text-green-600' : wrong ? 'text-red-500' : 'text-blue-600'}`}>{w.num}.</span>
                        <span className={`font-semibold flex-1 ${solved ? 'text-green-600/70 line-through' : wrong ? 'text-red-500' : 'text-slate-700'}`}>{w.clue}</span>
                        {solved && <span className="text-green-500 text-xs font-black shrink-0">✓</span>}
                        {wrong && <span className="text-red-500 text-xs font-black shrink-0">✗</span>}
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

      {/* ── EMOJI REACTION PANEL (P2P only, khi đang chơi) ── */}
      {isP2P && gameState === 'playing' && roomId && (
        <EmojiReactionPanel
          roomId={roomId}
          myUid={myUid}
          opponentUid={opponentUid}
          opponentName={oppFBName}
          isLandscape={isLandscape}
          opponentAvatarRef={opponentAvatarRef}
        />
      )}

      <AnimatePresence>
        {confirmQuit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="rounded-3xl p-6 max-w-sm w-full text-center space-y-4"
              style={{ background: 'linear-gradient(180deg, #1e293b, #0f172a)', border: '3px solid rgba(255,255,255,0.15)' }}>
              <p className="text-white font-black text-xl">Thoát game?</p>
              {isP2PMode && gameState === 'playing' ? (
                <p className="text-red-400 text-sm font-semibold">⚠️ Bỏ cuộc giữa chừng sẽ xử thua — coin thuộc về đối thủ!</p>
              ) : (
                <p className="text-white/60 text-sm">Tiến trình sẽ không được lưu</p>
              )}
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95, y: 2 }}
                  onClick={() => setConfirmQuit(false)}
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  Ở lại
                </motion.button>
                <motion.button whileTap={{ scale: 0.95, y: 2 }}
                  onClick={async () => {
                    setConfirmQuit(false);
                    if (isP2PMode && (gameState === 'playing' || gameState === 'matchSetup') && roomId && myRole) {
                      // Forfeit: đối thủ nhận pot, ta mất bet
                      clearPendingRefund(); // ta đã forfeit, không refund
                      await leaveRoom(roomId, myRole, true, opponentUid, pot);
                    }
                    onLeaveGame?.();
                  }}
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: 'linear-gradient(180deg, #ef4444, #b91c1c)', border: '2px solid #991b1b', boxShadow: '0 3px 0 #7f1d1d' }}>
                  Thoát
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FORFEIT WIN OVERLAY ── */}
      <AnimatePresence>
        {forfeitWin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="rounded-3xl p-6 max-w-sm w-full text-center space-y-4"
              style={{ background: 'linear-gradient(180deg, #1e3a8a, #1e40af)', border: '4px solid #60a5fa', boxShadow: '0 10px 0 #1e3a8a, 0 20px 40px rgba(0,0,0,0.5)' }}>
              <div className="text-5xl">🏆</div>
              <p className="text-yellow-300 font-black text-2xl uppercase tracking-widest"
                style={{ textShadow: '0 3px 0 #78350f' }}>Bạn Thắng!</p>
              <p className="text-blue-200 text-sm font-semibold">
                <span className="text-white font-black">"{forfeitWin.name}"</span> đã rời phòng giữa chừng.
              </p>
              <div className="flex justify-center">
                <div className="px-5 py-2.5 rounded-2xl font-black text-amber-300 text-xl"
                  style={{ background: 'rgba(251,191,36,0.15)', border: '2px solid rgba(251,191,36,0.4)' }}>
                  +{forfeitWin.coinReward} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97, y: 2 }}
                onClick={async () => {
                  addCoins(forfeitWin.coinReward);
                  clearPendingRefund(); // nhận thưởng xong, clear pending
                  setForfeitWin(null);
                  // Winner cleanup room (người thoát không xóa room để winner nhận được signal)
                  if (roomId && myRole) {
                    await leaveRoom(roomId, myRole, false);
                  }
                  onLeaveGame?.();
                }}
                className="w-full py-3.5 rounded-2xl font-black text-[#1e3a8a] text-lg uppercase"
                style={{ background: 'linear-gradient(180deg, #fbbf24, #f59e0b)', border: '4px solid #b45309', boxShadow: '0 5px 0 #b45309' }}>
                OK — Nhận {forfeitWin.coinReward} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REMATCH INCOMING POPUP ── */}
      <AnimatePresence>
        {rematchIncoming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="rounded-3xl p-6 max-w-sm w-full text-center space-y-4"
              style={{ background: 'linear-gradient(180deg, #1e3a8a, #1e40af)', border: '4px solid #fbbf24', boxShadow: '0 10px 0 #1e3a8a, 0 20px 40px rgba(0,0,0,0.5)' }}>
              <div className="text-4xl">⚔️</div>
              <p className="text-white font-black text-xl">
                <span className="text-yellow-300">"{rematchIncoming.fromName}"</span><br />
                muốn chơi tiếp!
              </p>
              {userCoins < REMATCH_MIN_COINS ? (
                <p className="text-red-300 text-sm font-semibold">
                  ⚠️ Bạn cần ít nhất {REMATCH_MIN_COINS} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> để tiếp tục.<br />
                  Hiện tại: {userCoins} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} />
                </p>
              ) : (
                <p className="text-blue-200 text-xs">Bạn có {userCoins} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> — Đủ để chơi tiếp</p>
              )}
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    setRematchHandled(true);
                    setRematchIncoming(null);
                    if (roomId && myRole) await declineRematch(roomId);
                    onLeaveGame?.();
                  }}
                  className="flex-1 py-3 rounded-xl font-black text-white text-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  Từ chối
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  disabled={userCoins < REMATCH_MIN_COINS}
                  onClick={async () => {
                    if (userCoins < REMATCH_MIN_COINS) return;
                    setRematchHandled(true);
                    setRematchIncoming(null);
                    if (roomId) await acceptRematch(roomId, rematchIncoming.puzzleId);
                  }}
                  className="flex-1 py-3 rounded-xl font-black text-[#1e3a8a] text-sm"
                  style={{
                    background: userCoins < REMATCH_MIN_COINS ? '#94a3b8' : 'linear-gradient(180deg, #fbbf24, #f59e0b)',
                    border: '3px solid #b45309',
                    boxShadow: userCoins < REMATCH_MIN_COINS ? 'none' : '0 3px 0 #b45309',
                    cursor: userCoins < REMATCH_MIN_COINS ? 'not-allowed' : 'pointer',
                  }}>
                  Đồng ý ⚔️
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
{/* ── Coin Drop Animation ── */}
      <AnimatePresence>
        {hintEffects.map(p => createPortal(
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: p.y - 10, x: p.x - 20, scale: 0.5 }}
            animate={{ opacity: 0, y: p.y - 90, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={() => setHintEffects(prev => prev.filter(e => e.id !== p.id))}
            className="fixed pointer-events-none z-[10000] flex items-center gap-1 font-black"
            style={{ left: 0, top: 0, color: '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            -{p.amt}
            <img src={iconCoin} alt="C" className="w-5 h-5" />
          </motion.div>,
          document.body
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CrosswordGame;
