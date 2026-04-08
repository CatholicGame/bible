import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * UserAvatar — 3-tier fallback:
 * 1. photoURL (Google Firebase / custom URL)
 * 2. ui-avatars.com
 * 3. Canvas-generated letter avatar
 *
 * Props:
 *   ring — boolean, adds rotating gold ring + pulsing glow
 *          Ring is contained WITHIN the component bounds (no overflow).
 */

function nameToColor(name) {
  const colors = ['#1e3a8a','#7c3aed','#065f46','#9a3412','#be123c','#0e7490','#92400e','#4c1d95'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + (hash << 5) - hash;
  return colors[Math.abs(hash) % colors.length];
}

function generateCanvasAvatar(name, size = 80) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const color = nameToColor(name || 'K');
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.25)'); grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = `900 ${Math.round(size * 0.42)}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
    ctx.fillText((name || 'K')[0].toUpperCase(), size/2, size/2 + 1);
    return canvas.toDataURL();
  } catch { return null; }
}

const UserAvatar = ({
  name = 'K',
  photoURL = null,
  size = 80,
  className = '',
  style = {},
  ring = false,
}) => {
  // Start with a canvas avatar so we never have an empty src
  const [src, setSrc] = useState(() => generateCanvasAvatar(name, size * 2));
  const [tier, setTier] = useState(3);

  useEffect(() => {
    if (photoURL) {
      setSrc(photoURL); setTier(1);
    } else {
      const n = encodeURIComponent(name || 'K');
      const bg = nameToColor(name).replace('#', '');
      setSrc(`https://ui-avatars.com/api/?name=${n}&size=${size*2}&background=${bg}&color=fff&bold=true&format=png`);
      setTier(2);
    }
  }, [photoURL, name, size]);

  const handleError = () => {
    if (tier === 1) {
      const n = encodeURIComponent(name || 'K');
      const bg = nameToColor(name).replace('#', '');
      setSrc(`https://ui-avatars.com/api/?name=${n}&size=${size*2}&background=${bg}&color=fff&bold=true&format=png`);
      setTier(2);
    } else if (tier === 2) {
      setSrc(generateCanvasAvatar(name, size * 2)); setTier(3);
    }
  };

  // Compute a safe src — never pass empty string to <img>
  const safeSrc = src || generateCanvasAvatar(name, size * 2);

  if (!ring) {
    return (
      <img
        src={safeSrc}
        alt={name}
        onError={handleError}
        className={className}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0, ...style }}
      />
    );
  }

  // ── Ring mode ──
  // The outer container is (size + 2*RING_PX) so the ring is fully INSIDE bounds.
  // This prevents the ring from overlapping sibling elements (e.g. rank badge).
  const RING_PX = Math.max(3, Math.round(size * 0.05));
  const total = size + RING_PX * 2;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', width: total, height: total, flexShrink: 0, ...style }}>
      {/* Rotating conic-gradient ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fbbf24, #fde68a, #f59e0b, #fbbf24)',
        }}
      />
      {/* Pulsing outer glow */}
      <motion.div
        animate={{ boxShadow: [
          '0 0 10px 2px rgba(251,191,36,0.4), 0 0 24px 4px rgba(245,158,11,0.2)',
          '0 0 20px 5px rgba(251,191,36,0.75), 0 0 40px 8px rgba(245,158,11,0.45)',
          '0 0 10px 2px rgba(251,191,36,0.4), 0 0 24px 4px rgba(245,158,11,0.2)',
        ]}}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}
      />
      {/* Dark gap separating ring from image */}
      <div style={{ position: 'absolute', inset: RING_PX - 1, borderRadius: '50%', background: '#0f172a' }} />
      {/* Avatar image */}
      <div style={{ position: 'absolute', inset: RING_PX, borderRadius: '50%', overflow: 'hidden', zIndex: 1 }}>
        <img
          src={safeSrc}
          alt={name}
          onError={handleError}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default UserAvatar;
