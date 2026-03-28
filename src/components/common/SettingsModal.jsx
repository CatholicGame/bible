import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Music, Volume2, X, Bell, BellOff } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { updateUserData } from '../../config/playfab';

// Lazy-load notifications to avoid crashing if firebase/messaging fails
const getNotifUtils = () => import('../../utils/notifications');

/* ── Animated Toggle — chunky 3D pill ── */
const Toggle = ({ value, onToggle, disabled }) => (
    <motion.button
        onClick={disabled ? undefined : onToggle}
        whileTap={disabled ? {} : { scale: 0.92 }}
        style={{
            width: 56,
            height: 30,
            borderRadius: 15,
            background: disabled
                ? 'linear-gradient(180deg, #475569, #334155)'
                : value
                ? 'linear-gradient(180deg, #34d399, #059669)'
                : 'linear-gradient(180deg, #94a3b8, #64748b)',
            border: `2.5px solid ${disabled ? '#334155' : value ? '#047857' : '#475569'}`,
            boxShadow: disabled
                ? '0 3px 0 #1e293b'
                : value
                ? '0 3px 0 #065f46, inset 0 1px 0 rgba(255,255,255,0.25)'
                : '0 3px 0 #334155, inset 0 1px 0 rgba(255,255,255,0.15)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            flexShrink: 0,
            opacity: disabled ? 0.5 : 1,
        }}
    >
        <motion.div
            animate={{ x: value ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            style={{
                position: 'absolute',
                top: 2,
                left: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #fff, #e2e8f0)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }}
        />
    </motion.button>
);

/* ── Setting Row — game-style row ── */
const SettingRow = ({ icon: Icon, iconGradient, iconBorder, iconShadow, label, sublabel, value, onToggle, disabled }) => (
    <div className="flex items-center gap-4 py-1">
        {/* 3D Icon badge */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
                background: iconGradient,
                border: `2.5px solid ${iconBorder}`,
                boxShadow: `0 4px 0 ${iconShadow}`,
            }}>
            <div className="absolute inset-0 h-1/2 bg-white/20 pointer-events-none" />
            <Icon size={22} color="#fff" strokeWidth={2.5} className="relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
        </div>
        {/* Label */}
        <div className="flex-1 min-w-0">
            <p className="font-black text-base text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{label}</p>
            <p className="text-[11px] font-bold mt-0.5" style={{ color: disabled ? '#94a3b8' : value ? '#86efac' : '#fca5a5' }}>
                {sublabel || (disabled ? '● Không khả dụng' : value ? '● Đang bật' : '● Đã tắt')}
            </p>
        </div>
        {/* Toggle */}
        <Toggle value={value} onToggle={onToggle} disabled={disabled} />
    </div>
);

/* ══ SettingsModal ══ */
const SettingsModal = ({ onClose }) => {
    const music = useSettingsStore(s => s.music);
    const sound = useSettingsStore(s => s.sound);
    const toggleMusic = useSettingsStore(s => s.toggleMusic);
    const toggleSound = useSettingsStore(s => s.toggleSound);

    const [notifState, setNotifState] = useState('default'); // 'default'|'granted'|'denied'|'unsupported'|'loading'
    const [notifEnabled, setNotifEnabled] = useState(false);

    // Check current notification permission on mount
    useEffect(() => {
        if (!('Notification' in window)) {
            setNotifState('unsupported');
            return;
        }
        const perm = Notification.permission;
        setNotifState(perm);
        setNotifEnabled(perm === 'granted');
    }, []);

    const handleNotifToggle = async () => {
        if (notifState === 'denied' || notifState === 'unsupported' || notifState === 'loading') return;

        const utils = await getNotifUtils().catch(() => null);
        if (!utils) return;

        if (notifEnabled) {
            setNotifEnabled(false);
            await utils.deleteFcmToken();
            await updateUserData({ FcmToken: '' }).catch(() => {});
        } else {
            setNotifState('loading');
            const token = await utils.requestPermissionAndGetToken();
            if (token) {
                setNotifEnabled(true);
                setNotifState('granted');
                await updateUserData({ FcmToken: token }).catch(() => {});
            } else {
                setNotifState(Notification.permission);
                setNotifEnabled(false);
            }
        }
    };

    const notifDisabled = notifState === 'denied' || notifState === 'unsupported' || notifState === 'loading';
    const notifSublabel = notifState === 'denied'
        ? '● Bị chặn — bật lại trong trình duyệt'
        : notifState === 'unsupported'
        ? '● Trình duyệt không hỗ trợ'
        : notifState === 'loading'
        ? '● Đang yêu cầu quyền...'
        : notifEnabled ? '● Đang bật' : '● Đã tắt';

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm overflow-hidden relative"
                style={{
                    borderRadius: 28,
                    background: 'linear-gradient(165deg, #1e3a5f 0%, #0e4166 40%, #0c3555 100%)',
                    border: '3px solid rgba(100,200,255,0.25)',
                    boxShadow: '0 8px 0 rgba(0,20,40,0.6), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(100,200,255,0.15)',
                }}
            >
                {/* Top shine */}
                <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/[0.04] pointer-events-none rounded-t-3xl" />

                {/* ── Header ── */}
                <div className="relative flex items-center justify-center px-5 pt-5 pb-4">
                    {/* Decorative gear icon */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-5 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                            border: '2px solid #1d4ed8',
                            boxShadow: '0 3px 0 #1e3a8a',
                        }}>
                        <Settings size={16} color="#fff" strokeWidth={2.5} />
                    </motion.div>

                    <h2 className="font-black text-2xl tracking-wider uppercase text-white"
                        style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)' }}>
                        Cài Đặt
                    </h2>

                    {/* Close X */}
                    <motion.button
                        whileTap={{ scale: 0.88, rotate: 90 }}
                        onClick={onClose}
                        className="absolute right-5 w-9 h-9 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                            border: '2px solid #991b1b',
                            boxShadow: '0 3px 0 #7f1d1d',
                        }}
                    >
                        <X size={16} color="#fff" strokeWidth={3} />
                    </motion.button>
                </div>

                {/* Separator */}
                <div className="mx-5 mb-1" style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(100,200,255,0.25), transparent)' }} />

                {/* ── Body ── */}
                <div className="px-5 py-4 flex flex-col gap-4">
                    <SettingRow
                        icon={Music}
                        iconGradient="linear-gradient(145deg, #f59e0b, #d97706)"
                        iconBorder="#b45309"
                        iconShadow="#92400e"
                        label="Nhạc nền"
                        value={music}
                        onToggle={toggleMusic}
                    />

                    {/* Divider */}
                    <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(100,200,255,0.15), transparent)' }} />

                    <SettingRow
                        icon={Volume2}
                        iconGradient="linear-gradient(145deg, #06d6a0, #059669)"
                        iconBorder="#047857"
                        iconShadow="#065f46"
                        label="Âm thanh"
                        value={sound}
                        onToggle={toggleSound}
                    />

                    {/* Divider */}
                    <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(100,200,255,0.15), transparent)' }} />

                    <SettingRow
                        icon={notifEnabled ? Bell : BellOff}
                        iconGradient="linear-gradient(145deg, #8b5cf6, #7c3aed)"
                        iconBorder="#5b21b6"
                        iconShadow="#3b0764"
                        label="Thông báo"
                        sublabel={notifSublabel}
                        value={notifEnabled}
                        onToggle={handleNotifToggle}
                        disabled={notifDisabled}
                    />
                </div>

                {/* ── Footer ── */}
                <div className="px-5 pb-5 pt-1">
                    <motion.button
                        whileTap={{ scale: 0.97, y: 3 }}
                        onClick={onClose}
                        className="w-full py-3.5 rounded-2xl font-black text-lg uppercase tracking-widest relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
                            color: '#78350f',
                            border: '3px solid #b45309',
                            boxShadow: '0 5px 0 #92400e, 0 8px 16px rgba(180,83,9,0.3)',
                            WebkitTextStroke: '0.3px #92400e',
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/25 pointer-events-none" />
                        <span className="relative z-10">Đóng</span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsModal;
