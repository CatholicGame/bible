import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserCircle, Facebook, ArrowRight } from 'lucide-react';

const enterFullscreen = () => {
    try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    } catch (err) { /* ignore */ }
};

const LoginScreen = ({ onLogin }) => {
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        enterFullscreen();
        onLogin('guest', guestName.trim() || `Khách ${Math.floor(Math.random() * 10000)}`);
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 40%, #0f172a 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

            {/* Logo */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="text-center mb-8 relative z-10"
            >
                <div className="flex justify-center items-center gap-2 mb-2">
                    <span className="text-4xl font-black text-white tracking-tighter drop-shadow">Catholic</span>
                    <span className="text-4xl font-black text-white bg-yellow-400 px-4 py-1 rounded-xl italic shadow-lg transform -skew-x-12"
                        style={{ color: '#1e3a8a' }}>Quiz!</span>
                </div>
                <p className="text-blue-200/80 text-sm font-medium">Học hỏi Lời Chúa qua trò chơi</p>
            </motion.div>

            {/* Card */}
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 260, damping: 24 }}
                className="w-full max-w-sm relative z-10"
                style={{
                    background: 'rgba(255,255,255,0.97)',
                    borderRadius: 24,
                    padding: 28,
                    boxShadow: '0 8px 0 rgba(30,58,138,0.5), 0 20px 60px rgba(0,0,0,0.4)',
                    border: '2px solid rgba(255,255,255,0.8)',
                }}
            >
                <p className="text-center text-gray-500 text-sm font-semibold mb-5">Chọn cách đăng nhập</p>
                <div className="flex flex-col gap-3">

                    {/* Google */}
                    <button
                        onClick={() => { enterFullscreen(); onLogin('google'); }}
                        className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Tiếp tục với Google
                    </button>

                    {/* Facebook */}
                    <button
                        onClick={() => { enterFullscreen(); onLogin('facebook'); }}
                        className="flex items-center justify-center gap-3 w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        <Facebook fill="currentColor" size={20} />
                        Tiếp tục với Facebook
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-2 my-1">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-gray-400 text-xs font-semibold">hoặc</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Guest */}
                    {!showGuestInput ? (
                        <button
                            onClick={() => setShowGuestInput(true)}
                            className="flex items-center justify-center gap-3 w-full bg-gray-100 border-2 border-transparent hover:border-gray-300 text-gray-600 font-bold py-3.5 rounded-xl transition-all active:scale-95"
                        >
                            <UserCircle size={22} className="text-gray-400" />
                            Chơi Khách (không cần đăng ký)
                        </button>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            onSubmit={handleGuestSubmit}
                            className="flex flex-col gap-3"
                        >
                            <input
                                type="text"
                                placeholder="Nhập biệt danh (tùy chọn)"
                                maxLength={20}
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                autoFocus
                                className="w-full text-center p-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none font-semibold transition-all text-gray-800 placeholder:text-gray-400"
                            />
                            <div className="bg-orange-50 text-orange-700 text-xs text-left p-3 rounded-xl border border-orange-200">
                                <strong>Lưu ý:</strong> Chế độ Khách lưu điểm tạm thời trên trình duyệt này.
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowGuestInput(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-colors">
                                    Hủy
                                </button>
                                <button type="submit"
                                    className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md">
                                    Bắt đầu <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.form>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
                    Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng.
                </p>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
