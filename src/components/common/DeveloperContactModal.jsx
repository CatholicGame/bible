import { motion } from 'framer-motion';
import { Mail, X } from 'lucide-react';

const DeveloperContactModal = ({ onClose }) => {
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
                    <h2 className="font-black text-2xl tracking-wider uppercase text-white"
                        style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)' }}>
                        Trợ Giúp
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

                {/* ── Contact Developer ── */}
                <div className="px-5 pt-3 pb-3">
                    <div className="text-center mb-4">
                        <p className="text-xs font-black tracking-widest uppercase mb-1"
                            style={{ color: 'rgba(100,200,255,0.8)' }}>
                            Liên Hệ Nhà Phát Triển
                        </p>
                        <p className="text-[10px] sm:text-xs text-sky-200/70 font-semibold px-2">
                            Bạn gặp khó khăn hay cần hỗ trợ? Hãy liên hệ với chúng tôi qua các kênh dưới đây.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        {/* Email */}
                        <motion.a
                            href="mailto:hapagonmolie@gmail.com"
                            whileTap={{ scale: 0.97, y: 2 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(234,88,12,0.18), rgba(234,88,12,0.08))',
                                border: '2px solid rgba(234,88,12,0.35)',
                                boxShadow: '0 3px 0 rgba(154,52,18,0.4)',
                                color: '#fed7aa',
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(145deg, #ea580c, #c2410c)',
                                    border: '2px solid #9a3412',
                                    boxShadow: '0 3px 0 #7c2d12',
                                }}>
                                <div className="absolute inset-0 h-1/2 bg-white/20 pointer-events-none" />
                                <Mail size={18} color="#fff" strokeWidth={2.5} className="relative z-10" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-base text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Email</p>
                                <p className="text-[11px] font-bold truncate" style={{ color: '#fed7aa' }}>hapagonmolie@gmail.com</p>
                            </div>
                        </motion.a>

                        {/* Facebook */}
                        <motion.a
                            href="https://www.facebook.com/profile.php?id=61584274960298"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileTap={{ scale: 0.97, y: 2 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(37,99,235,0.10))',
                                border: '2px solid rgba(37,99,235,0.40)',
                                boxShadow: '0 3px 0 rgba(30,58,138,0.5)',
                                color: '#bfdbfe',
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(145deg, #2563eb, #1d4ed8)',
                                    border: '2px solid #1e3a8a',
                                    boxShadow: '0 3px 0 #1e3a8a',
                                }}>
                                <div className="absolute inset-0 h-1/2 bg-white/20 pointer-events-none" />
                                <span className="relative z-10 font-black text-white text-base" style={{ fontFamily: 'serif' }}>f</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-base text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Facebook Page</p>
                                <p className="text-[11px] font-bold" style={{ color: '#bfdbfe' }}>Catholic Quiz Vietnam</p>
                            </div>
                            <span className="text-[10px] font-bold py-0.5 px-2 rounded-full" style={{ background: 'rgba(37,99,235,0.25)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.3)' }}>↗</span>
                        </motion.a>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-5 pb-5 pt-3">
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

export default DeveloperContactModal;
