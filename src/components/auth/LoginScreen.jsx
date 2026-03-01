import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserCircle, Facebook, ArrowRight } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        onLogin('guest', guestName.trim() || `Khách ${Math.floor(Math.random() * 10000)}`);
    };

    return (
        <div className="w-full max-w-md px-4 z-10">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-center mb-8"
            >
                <div className="flex justify-center items-center gap-2 mb-2">
                    <span className="text-4xl font-black text-primary tracking-tighter drop-shadow-sm">Catholic</span>
                    <span className="text-4xl font-black text-white bg-kahoot-blue px-4 py-1 rounded-xl italic shadow-lg transform -skew-x-12">Quiz!</span>
                </div>
                <p className="text-gray-700 font-medium bg-white/50 inline-block px-4 py-1 rounded-full backdrop-blur-sm">Đăng nhập để lưu điểm vĩnh viễn</p>
            </motion.div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-b-8 border-gray-200"
            >
                <div className="flex flex-col gap-4">

                    {/* Google Login */}
                    <button
                        onClick={() => onLogin('google')}
                        className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                        Tiếp tục với Google
                    </button>

                    {/* Facebook Login */}
                    <button
                        onClick={() => onLogin('facebook')}
                        className="flex items-center justify-center gap-3 w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-4 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <Facebook fill="currentColor" size={24} />
                        Tiếp tục với Facebook
                    </button>

                    {/* Guest Login */}
                    {!showGuestInput ? (
                        <button
                            onClick={() => setShowGuestInput(true)}
                            className="flex items-center justify-center gap-3 w-full bg-gray-100 border-2 border-transparent hover:border-gray-300 text-gray-600 font-bold py-4 rounded-xl transition-all active:scale-95 group"
                        >
                            <UserCircle size={24} className="text-gray-400 group-hover:text-gray-600" />
                            Chơi Khách
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
                                placeholder="Nhập tên của bạn (Tùy chọn)"
                                maxLength={20}
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                autoFocus
                                className="w-full text-center p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-kahoot-blue focus:ring-4 focus:ring-kahoot-blue/20 outline-none font-semibold transition-all"
                            />

                            <div className="bg-orange-50 text-orange-700 text-xs text-left p-3 rounded-xl border border-orange-200">
                                <strong>Lưu ý:</strong> Ở chế độ Khách, điểm số và thứ hạng của bạn sẽ chỉ lưu tạm thời trên trình duyệt này. Chúng sẽ bị mất nếu bạn xóa dữ liệu duyệt web hoặc đổi thiết bị.
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowGuestInput(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 flex items-center justify-center gap-2 bg-kahoot-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
                                >
                                    Bắt đầu <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.form>
                    )}

                </div>

                <p className="text-center text-xs text-gray-400 mt-6 px-4 leading-relaxed">
                    Bằng việc đăng nhập, bạn đồng ý với Điều khoản và Chính sách bảo mật của chúng tôi.
                </p>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
