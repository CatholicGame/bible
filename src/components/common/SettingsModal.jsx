import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Music, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

/* ── Design tokens — same as ProfileScreen ── */
const C = {
    bg: 'linear-gradient(160deg, #caf0f8 0%, #ade8f4 50%, #90e0ef 100%)',
    card: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(0,180,216,0.22)',
    textPrimary: '#1e3a5f',
    textSecondary: '#4a7fa5',
    textMuted: '#7fb3cc',
};

/* ── Animated Toggle ── */
const Toggle = ({ value, onToggle }) => (
    <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.95 }}
        style={{
            width: 52,
            height: 28,
            borderRadius: 14,
            background: value
                ? 'linear-gradient(180deg, #06d6a0, #1b9aaa)'
                : '#cbd5e1',
            border: `2px solid ${value ? '#0e7490' : '#94a3b8'}`,
            boxShadow: value ? '0 3px 0 #0c6478' : '0 2px 0 #64748b',
            transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
        }}
    >
        <motion.div
            animate={{ x: value ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                position: 'absolute',
                top: 2,
                left: 0,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
        />
    </motion.button>
);

/* ── Setting Row ── */
const SettingRow = ({ icon: Icon, iconColor, iconBg, label, subLabel, value, onToggle }) => (
    <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
                background: iconBg,
                border: `2.5px solid ${C.cardBorder}`,
                boxShadow: '0 3px 0 rgba(0,150,200,0.18)',
            }}>
            <Icon size={22} color={iconColor} strokeWidth={2.5} />
        </div>
        {/* Label */}
        <div className="flex-1 min-w-0">
            <p className="font-black text-base" style={{ color: C.textPrimary }}>{label}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: C.textMuted }}>
                {value ? 'Đang bật' : 'Đã tắt'}
            </p>
        </div>
        {/* Toggle */}
        <Toggle value={value} onToggle={onToggle} />
    </div>
);

/* ══ SettingsModal ══ */
const SettingsModal = ({ onClose }) => {
    const music = useSettingsStore(s => s.music);
    const sound = useSettingsStore(s => s.sound);
    const toggleMusic = useSettingsStore(s => s.toggleMusic);
    const toggleSound = useSettingsStore(s => s.toggleSound);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,30,60,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl overflow-hidden"
                style={{
                    background: C.bg,
                    border: `2.5px solid ${C.cardBorder}`,
                    boxShadow: '0 20px 50px rgba(0,80,120,0.28)',
                }}
            >
                {/* ── Header ── */}
                <div
                    className="relative flex items-center justify-center px-5 py-4"
                    style={{
                        background: 'rgba(255,255,255,0.85)',
                        borderBottom: `2px solid ${C.cardBorder}`,
                    }}
                >
                    <div className="absolute left-5 w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(0,180,216,0.12)', border: `1.5px solid ${C.cardBorder}` }}>
                        <Settings size={16} color="#1b9aaa" strokeWidth={2.5} />
                    </div>
                    <h2 className="font-black text-xl tracking-wide" style={{ color: C.textPrimary }}>
                        Cài Đặt
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute right-4 w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm"
                        style={{
                            background: 'linear-gradient(145deg, #4cc9f0, #1b9aaa)',
                            border: '2px solid #0e7490',
                            boxShadow: '0 3px 0 #0c6478',
                        }}
                    >
                        ✕
                    </motion.button>
                </div>

                {/* ── Body ── */}
                <div className="px-5 py-5 flex flex-col gap-4">
                    {/* Settings card */}
                    <div
                        className="rounded-2xl px-5 py-4 flex flex-col gap-5"
                        style={{
                            background: C.card,
                            border: `2px solid ${C.cardBorder}`,
                            boxShadow: '0 4px 12px rgba(0,150,200,0.1)',
                        }}
                    >
                        <SettingRow
                            icon={Music}
                            iconColor="#f59e0b"
                            iconBg="rgba(251,191,36,0.15)"
                            label="Nhạc nền"
                            value={music}
                            onToggle={toggleMusic}
                        />
                        {/* Divider */}
                        <div style={{
                            height: 1.5,
                            background: 'linear-gradient(90deg, transparent, rgba(0,180,216,0.2), transparent)',
                        }} />
                        <SettingRow
                            icon={Volume2}
                            iconColor="#06d6a0"
                            iconBg="rgba(6,214,160,0.12)"
                            label="Âm thanh"
                            value={sound}
                            onToggle={toggleSound}
                        />
                    </div>

                    {/* Version */}
                    <p className="text-center text-[11px] font-semibold" style={{ color: C.textMuted }}>
                        Phiên bản 1.0.0 (Beta)
                    </p>
                </div>

                {/* ── Footer ── */}
                <div className="px-5 pb-5">
                    <motion.button
                        whileTap={{ scale: 0.97, y: 2 }}
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl font-black text-white text-base tracking-wide"
                        style={{
                            background: 'linear-gradient(180deg, #06d6a0, #1b9aaa)',
                            border: `2.5px solid #0e7490`,
                            boxShadow: '0 4px 0 #0c6478',
                        }}
                    >
                        Đóng
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsModal;
