import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue } from 'firebase/database';
import { db } from '../../config/firebase';
import { useRoom } from '../../hooks/useRoom';

/* ── 40 reaction phrases, 6 nhóm ── */
const REACTION_GROUPS = [
  {
    label: '🏁 Chào hỏi',
    color: '#3b82f6',
    items: [
      { emoji: '👋', label: 'Chào bạn, chơi vui nhé!' },
      { emoji: '🙏', label: 'Chúc bạn may mắn nhé!' },
      { emoji: '😊', label: 'Mình chơi lần đầu, thông cảm nghen!' },
      { emoji: '🤝', label: 'Cùng chơi cho vui thôi nhé!' },
      { emoji: '😎', label: 'Sẵn sàng rồi, bắt đầu thôi!' },
    ],
  },
  {
    label: '⚔️ Thách thức',
    color: '#ef4444',
    items: [
      { emoji: '😏', label: 'Mình đang dẫn trước rồi đó!' },
      { emoji: '🔥', label: 'Bạn theo kịp mình không đó?' },
      { emoji: '😤', label: 'Câu này mình giải xong rồi nha!' },
      { emoji: '👑', label: 'Ô chữ này dễ với mình lắm!' },
      { emoji: '💪', label: 'Cố lên, mình đang chờ bạn đây!' },
      { emoji: '😈', label: 'Xem bạn có vượt được mình không!' },
      { emoji: '🏃', label: 'Mình chạy trước nhé, đừng bỏ cuộc!' },
      { emoji: '✌️', label: 'Hai từ nữa là mình thắng rồi!' },
    ],
  },
  {
    label: '😅 Khó / Bó tay',
    color: '#f59e0b',
    items: [
      { emoji: '🤯', label: 'Câu này khó quá trời ơi!' },
      { emoji: '😵', label: 'Mình không biết câu này rồi...' },
      { emoji: '🙈', label: 'Ôi trời, mình nhầm hết rồi!' },
      { emoji: '😂', label: 'Bó tay với câu này luôn!' },
      { emoji: '😩', label: 'Câu này mình bỏ qua được không?' },
      { emoji: '🤔', label: 'Đọc gợi ý hoài mà không ra...' },
      { emoji: '😓', label: 'Kiến thức Kinh Thánh mình kém quá!' },
      { emoji: '🤦', label: 'Sao mình lại điền chữ đó chứ!' },
    ],
  },
  {
    label: '🎉 Khen ngợi',
    color: '#22c55e',
    items: [
      { emoji: '🎉', label: 'Bạn giỏi thật, mình phục rồi!' },
      { emoji: '⭐', label: 'Ồ! Bạn nhanh vậy, ghê thiệt!' },
      { emoji: '👏', label: 'Chơi hay lắm, đợt sau chơi tiếp!' },
      { emoji: '😇', label: 'Thua rồi nhưng vui lắm!' },
      { emoji: '🥳', label: 'Bạn thắng xứng đáng lắm!' },
      { emoji: '💯', label: 'Xuất sắc! Mình không ngờ bạn nhanh vậy!' },
      { emoji: '🙌', label: 'Giỏi lắm, học hỏi được nhiều từ bạn!' },
      { emoji: '😮', label: 'Wow, bạn biết hết các câu này hả?' },
    ],
  },
  {
    label: '⏰ Áp lực',
    color: '#8b5cf6',
    items: [
      { emoji: '⏰', label: 'Còn ít thời gian, nhanh lên nào!' },
      { emoji: '💨', label: 'Đừng để hết giờ nghen bạn ơi!' },
      { emoji: '😰', label: 'Đồng hồ chạy nhanh quá trời!' },
      { emoji: '⚡', label: 'Nhanh nhanh, còn 1 phút thôi!' },
      { emoji: '😱', label: 'Hết giờ mất rồi, cố lên!' },
      { emoji: '🏄', label: 'Tăng tốc lên, sắp hết giờ rồi!' },
    ],
  },
  {
    label: '🤣 Hài hước',
    color: '#ec4899',
    items: [
      { emoji: '🤣', label: 'Ô chữ này ai ra vậy, khó ghê!' },
      { emoji: '😜', label: 'Mình đoán bừa mà trúng luôn!' },
      { emoji: '🤓', label: 'Đây là Kinh Thánh, không phải bắp rang!' },
      { emoji: '🙃', label: 'Ờ thôi, lần sau mình sẽ thắng!' },
      { emoji: '😆', label: 'Lỡ điền sai rồi, tha lỗi nghen!' },
    ],
  },
];

const COOLDOWN_MS = 2500;
const AUTO_CLOSE_MS = 3000; // auto-close sau 3s

/* ─────────────────────────────────────────────────────────────────
   Arrow-bubble component — dùng createPortal, vị trí dựa vào
   avatarRef (DOM node/ref) của người gửi.

   Props:
     reaction      – { emoji, label, fromName, fromSide }
                     fromSide: 'left' | 'right'
     isLandscape   – orientation
     avatarRef     – React ref trỏ đến DOM element của avatar
     onDone        – callback khi ẩn
───────────────────────────────────────────────────────────────── */
const ReactionBubble = ({ reaction, isLandscape, avatarRef, onDone }) => {
  const [pos, setPos] = useState(null);

  // Đo vị trí avatar để định vị bubble
  useEffect(() => {
    const measure = () => {
      const el = avatarRef?.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: r.width,
        h: r.height,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [avatarRef]);

  // Auto close
  useEffect(() => {
    const t = setTimeout(onDone, AUTO_CLOSE_MS + 400); // +400 để animation exit xong
    return () => clearTimeout(t);
  }, [onDone]);

  if (!pos) return null;

  const fromSide = reaction.fromSide || 'right';
  const BUBBLE_W  = 220;
  const AW = 10;              // arrow half-width
  const AH = 9;               // arrow height
  const BORDER_CLR = '#e2e8f0';
  const BG = '#ffffff';

  let bubbleStyle, motionInitial;
  // Two-triangle arrow: outer (border color) + inner (bg color) slightly smaller
  let arrowOuterStyle, arrowInnerStyle;

  if (isLandscape) {
    // Bubble bên DƯỚI avatar, arrow trỏ LÊN
    const left = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, pos.x - BUBBLE_W / 2));
    bubbleStyle = {
      position: 'fixed',
      top: pos.y + pos.h / 2 + AH + 5,
      left,
      width: BUBBLE_W,
      zIndex: 9000,
    };
    const arrowX = Math.max(AW + 6, Math.min(BUBBLE_W - AW * 2 - 6, pos.x - left - AW));
    // Arrow outer (border color)
    arrowOuterStyle = {
      position: 'absolute',
      top: -(AH + 2),
      left: arrowX,
      width: 0, height: 0,
      borderLeft: `${AW}px solid transparent`,
      borderRight: `${AW}px solid transparent`,
      borderBottom: `${AH + 1}px solid ${BORDER_CLR}`,
    };
    // Arrow inner (fill) — 1px smaller, offset 2px down
    arrowInnerStyle = {
      position: 'absolute',
      top: -(AH),
      left: arrowX + 1,
      width: 0, height: 0,
      borderLeft: `${AW - 1}px solid transparent`,
      borderRight: `${AW - 1}px solid transparent`,
      borderBottom: `${AH}px solid ${BG}`,
    };
    motionInitial = { y: -10, opacity: 0, scale: 0.9 };
  } else {
    // Portrait: bubble xuất hiện NGAY TRÊN avatar, arrow trỏ XUỐNG vào avatar
    const BUBBLE_H_EST = 88;
    const HEADER_SAFE  = 62;
    const rawTop = pos.y - pos.h / 2 - BUBBLE_H_EST - AH - 6;
    const top    = Math.max(HEADER_SAFE, rawTop);

    const left = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, pos.x - BUBBLE_W / 2));
    bubbleStyle = {
      position: 'fixed',
      top,
      left,
      width: BUBBLE_W,
      zIndex: 9000,
    };

    const arrowX = Math.max(AW + 6, Math.min(BUBBLE_W - AW * 2 - 6, pos.x - left - AW));
    arrowOuterStyle = {
      position: 'absolute',
      bottom: -(AH + 2),
      left: arrowX,
      width: 0, height: 0,
      borderLeft: `${AW}px solid transparent`,
      borderRight: `${AW}px solid transparent`,
      borderTop: `${AH + 1}px solid ${BORDER_CLR}`,
    };
    arrowInnerStyle = {
      position: 'absolute',
      bottom: -(AH),
      left: arrowX + 1,
      width: 0, height: 0,
      borderLeft: `${AW - 1}px solid transparent`,
      borderRight: `${AW - 1}px solid transparent`,
      borderTop: `${AH}px solid ${BG}`,
    };
    motionInitial = { y: 8, opacity: 0, scale: 0.92 };
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={motionInitial}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: isLandscape ? -8 : 8, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        style={{
          ...bubbleStyle,
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.18)) drop-shadow(0 2px 6px rgba(0,0,0,0.10))',
        }}
        onClick={onDone}
      >
        {/* Bubble body */}
        <div style={{
          background: BG,
          border: `1.5px solid ${BORDER_CLR}`,
          borderRadius: 16,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Close btn */}
          <button
            onClick={(e) => { e.stopPropagation(); onDone(); }}
            style={{
              position: 'absolute', top: 6, right: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(30,30,30,0.35)', fontSize: 14, lineHeight: 1,
              padding: 2,
            }}
          >✕</button>

          {/* Emoji */}
          <motion.span
            animate={{ rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.3, 1.1, 1.2, 1] }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}
          >
            {reaction.emoji}
          </motion.span>

          {/* Text */}
          <div style={{ flex: 1, paddingRight: 16 }}>
            <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 12, lineHeight: 1.45, margin: 0 }}>
              {reaction.label}
            </p>
            <p style={{ color: '#64748b', fontSize: 10, fontWeight: 600, margin: '4px 0 0' }}>
              — {reaction.fromName}
            </p>
          </div>

          {/* Auto-close progress bar — inside body */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: AUTO_CLOSE_MS / 1000, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: 3,
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
              originX: fromSide === 'left' ? 0 : 1,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Arrow outer (border) */}
        <div style={arrowOuterStyle} />
        {/* Arrow inner (fill) — covers border to make clean bordered arrow */}
        <div style={arrowInnerStyle} />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

/* ── Main component ── */
const EmojiReactionPanel = ({ roomId, myUid, opponentUid, opponentName = 'Đối thủ', isLandscape = false, opponentAvatarRef, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [incomingReactions, setIncomingReactions] = useState([]);
  const lastSentRef = useRef(0);
  const cooldownIntervalRef = useRef(null);
  const { sendReaction } = useRoom();

  // Fallback: tự tìm DOM node nếu prop chưa được cấp
  const internalRef = useRef(null);
  const resolvedRef = opponentAvatarRef ?? internalRef;
  useEffect(() => {
    if (!opponentAvatarRef) {
      // Chỉ fallback khi không có prop ref
      const findAvatars = () => {
        internalRef.current = document.querySelector('[data-p2p-avatar="opponent"]') || null;
      };
      findAvatars();
      const t = setTimeout(findAvatars, 600);
      return () => clearTimeout(t);
    }
  }, [opponentAvatarRef]);

  /* ── Listen for incoming reactions (từ bất kỳ ai không phải mình) ── */
  useEffect(() => {
    if (!roomId || !myUid) return;
    const reactionsRef = ref(db, `rooms/${roomId}/reactions`);
    const unsub = onValue(reactionsRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      // Lấy reaction từ bất kỳ player nào KHÔNG phải mình (không phụ thuộc opponentUid)
      const incoming = Object.entries(data)
        .filter(([, v]) => v.fromUid && v.fromUid !== myUid)
        .map(([id, v]) => ({ id, ...v, fromName: opponentName, fromSide: 'right' }));
      if (incoming.length === 0) return;
      setIncomingReactions(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const fresh = incoming.filter(r => !existingIds.has(r.id));
        return [...prev, ...fresh];
      });
    });
    return () => unsub();
  }, [roomId, myUid, opponentName]);

  /* ── Cooldown timer ── */
  const startCooldown = useCallback(() => {
    lastSentRef.current = Date.now();
    setCooldownLeft(COOLDOWN_MS);
    clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSentRef.current;
      const left = Math.max(0, COOLDOWN_MS - elapsed);
      setCooldownLeft(left);
      if (left === 0) clearInterval(cooldownIntervalRef.current);
    }, 100);
  }, []);

  /* ── Send reaction ── */
  const handleSend = useCallback(async (emoji, label) => {
    if (cooldownLeft > 0 || !roomId) return;
    setIsOpen(false);
    startCooldown();
    try {
      await sendReaction(roomId, emoji, label, myUid);
    } catch (e) {
      console.warn('sendReaction error:', e);
    }
  }, [cooldownLeft, roomId, sendReaction, startCooldown, myUid]);

  /* ── Remove shown incoming reaction ── */
  const removeIncoming = useCallback((id) => {
    setIncomingReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  const isCooling = cooldownLeft > 0;

  return (
    <>
      {/* ── Incoming bubbles — chỉ hiện 1 cái mỗi lúc ── */}
      <AnimatePresence>
        {incomingReactions.slice(-1).map(r => (
          <ReactionBubble
            key={r.id}
            reaction={r}
            isLandscape={isLandscape}
            avatarRef={resolvedRef}
            onDone={() => removeIncoming(r.id)}
          />
        ))}
      </AnimatePresence>

      {/* ── Floating or Inline trigger button ── */}
      <div
        style={inline ? {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        } : {
          position: 'fixed',
          bottom: 16,
          left: 64, // Dịch sang phải 48px để tránh đè lên nút Fullscreen (left: 14)
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        {/* Picker panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                background: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(30,58,138,0.97))',
                border: '2px solid rgba(99,179,237,0.35)',
                borderRadius: 20,
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(16px)',
                width: 'min(320px, calc(100vw - 32px))',
                // Portrait: giới hạn chiều cao để không che khu vực gõ/gợi ý
                maxHeight: isLandscape ? '55vh' : '42vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...(inline ? {
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: 8,
                  zIndex: 100,
                } : {
                  marginBottom: 4,
                })
              }}
            >
              {/* Group tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '10px 10px 0',
                  overflowX: 'auto',
                  flexShrink: 0,
                }}
              >
                {REACTION_GROUPS.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGroup(i)}
                    style={{
                      flexShrink: 0,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: activeGroup === i ? g.color : 'rgba(255,255,255,0.08)',
                      color: activeGroup === i ? '#fff' : 'rgba(255,255,255,0.5)',
                      boxShadow: activeGroup === i ? `0 2px 10px ${g.color}66` : 'none',
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Reactions grid — scrollable */}
              <div style={{ padding: '8px 10px 4px', overflowY: 'auto', flex: 1 }}>
                {REACTION_GROUPS[activeGroup].items.map((item, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend(item.emoji, item.label)}
                    disabled={isCooling}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: isCooling ? 'not-allowed' : 'pointer',
                      background: 'transparent',
                      transition: 'background 0.12s',
                      opacity: isCooling ? 0.45 : 1,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!isCooling) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Cooldown bar */}
              {isCooling && (
                <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
                  <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        borderRadius: 3,
                      }}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(cooldownLeft / COOLDOWN_MS) * 100}%` }}
                      transition={{ duration: 0.1, ease: 'linear' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: isOpen ? '2px solid #60a5fa' : '2px solid rgba(255,255,255,0.25)',
            background: isOpen
              ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
              : 'rgba(15,23,42,0.85)',
            boxShadow: isOpen
              ? '0 0 0 4px rgba(59,130,246,0.3), 0 8px 20px rgba(0,0,0,0.5)'
              : '0 4px 12px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 20,
            transition: 'all 0.18s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span style={{ lineHeight: 1 }}>
            {isOpen ? '✕' : '💬'}
          </span>
          {/* Cooldown ring */}
          {isCooling && (
            <svg
              viewBox="0 0 44 44"
              style={{
                position: 'absolute',
                inset: -2,
                width: 'calc(100% + 4px)',
                height: 'calc(100% + 4px)',
                transform: 'rotate(-90deg)',
                pointerEvents: 'none',
              }}
            >
              <circle
                cx={22} cy={22} r={20}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray={`${Math.PI * 2 * 20}`}
                strokeDashoffset={`${Math.PI * 2 * 20 * (1 - cooldownLeft / COOLDOWN_MS)}`}
                strokeLinecap="round"
              />
            </svg>
          )}
        </motion.button>
      </div>
    </>
  );
};

export default EmojiReactionPanel;
