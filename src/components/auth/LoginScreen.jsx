import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserCircle, ArrowRight, Mail, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { usePlayFabStore } from '../../store/playfabStore';



const LoginScreen = ({ onLogin, onOpenPrivacy }) => {
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [guestName, setGuestName] = useState('');

    // Email auth state
    const [showEmailForm, setShowEmailForm] = useState(false); // 'login' | 'register' | false
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => {
        return !!localStorage.getItem('saved_email');
    });

    // Load saved email on mount
    const savedEmail = localStorage.getItem('saved_email') || '';
    const [emailInitialized, setEmailInitialized] = useState(false);

    const openEmailForm = (mode) => {
        if (!emailInitialized && mode === 'login') {
            setEmail(savedEmail);
            setEmailInitialized(true);
        }
        setShowEmailForm(mode);
        setEmailError('');
    };

    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState('');

    const pfLoginWithEmail = usePlayFabStore(state => state.loginWithEmail);
    const pfRegisterWithEmail = usePlayFabStore(state => state.registerWithEmail);
    const pfLoginWithGoogle = usePlayFabStore(state => state.loginWithGoogle);

    const handleGuestSubmit = (e) => {
        e.preventDefault();

        onLogin('guest', guestName.trim() || `Khách ${Math.floor(Math.random() * 10000)}`);
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');

        if (!email.trim() || !password.trim()) {
            setEmailError('Vui lòng nhập email và mật khẩu');
            return;
        }
        if (password.length < 6) {
            setEmailError('Mật khẩu tối thiểu 6 ký tự');
            return;
        }

        setEmailLoading(true);
        let result;

        if (showEmailForm === 'register') {
            result = await pfRegisterWithEmail(email.trim(), password, displayName.trim() || undefined);
        } else {
            result = await pfLoginWithEmail(email.trim(), password);
        }

        setEmailLoading(false);

        if (result.success) {
            // Save or clear remembered email
            if (showEmailForm === 'login') {
                if (rememberMe) {
                    localStorage.setItem('saved_email', email.trim());
                } else {
                    localStorage.removeItem('saved_email');
                }
            }

            onLogin('email');
        } else {
            // Map PlayFab error messages to Vietnamese
            const errorMap = {
                'User not found': 'Tài khoản không tồn tại',
                'Invalid email address or password': 'Email hoặc mật khẩu không đúng',
                'Email address already exists': 'Email đã được đăng ký',
                'The display name entered is not available': 'Tên hiển thị đã được sử dụng',
                'Password is too short': 'Mật khẩu quá ngắn (tối thiểu 6 ký tự)',
                'Invalid input parameters': 'Thông tin không hợp lệ',
            };
            setEmailError(errorMap[result.error] || result.error || 'Có lỗi xảy ra');
        }
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
                <AnimatePresence mode="wait">
                    {/* ── EMAIL FORM ── */}
                    {showEmailForm ? (
                        <motion.div
                            key="email-form"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                onClick={() => { setShowEmailForm(false); setEmailError(''); }}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-semibold mb-4 transition-colors"
                            >
                                <ArrowLeft size={16} /> Quay lại
                            </button>

                            <p className="text-center text-gray-700 text-lg font-bold mb-5">
                                {showEmailForm === 'register' ? '🎉 Tạo tài khoản mới' : '👋 Đăng nhập'}
                            </p>

                            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                                {/* Display Name (only for register) */}
                                {showEmailForm === 'register' && (
                                    <input
                                        type="text"
                                        placeholder="Tên hiển thị (biệt danh)"
                                        maxLength={25}
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none font-semibold transition-all text-gray-800 placeholder:text-gray-400"
                                    />
                                )}

                                {/* Email */}
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    className="w-full p-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none font-semibold transition-all text-gray-800 placeholder:text-gray-400"
                                />

                                {/* Password */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3.5 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none font-semibold transition-all text-gray-800 placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Remember Me — chỉ hiện ở login */}
                                {showEmailForm === 'login' && (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500 font-medium">Nhớ tài khoản</span>
                                    </label>
                                )}

                                {/* Error */}
                                {emailError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-50 text-red-600 text-xs text-center p-3 rounded-xl border border-red-200 font-semibold"
                                    >
                                        {emailError}
                                    </motion.div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={emailLoading}
                                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    {emailLoading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {showEmailForm === 'register' ? 'Đăng ký' : 'Đăng nhập'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                {/* Toggle login/register */}
                                <p className="text-center text-sm text-gray-500 mt-1">
                                    {showEmailForm === 'register' ? (
                                        <>Đã có tài khoản? <button type="button" onClick={() => openEmailForm('login')} className="text-blue-600 font-bold hover:underline">Đăng nhập</button></>
                                    ) : (
                                        <>Chưa có tài khoản? <button type="button" onClick={() => openEmailForm('register')} className="text-blue-600 font-bold hover:underline">Đăng ký</button></>
                                    )}
                                </p>
                            </form>
                        </motion.div>
                    ) : (

                    /* ── MAIN BUTTONS ── */
                    <motion.div
                        key="main-buttons"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.2 }}
                    >
                        <p className="text-center text-gray-500 text-sm font-semibold mb-5">Chọn cách đăng nhập</p>
                        <div className="flex flex-col gap-3">

                            {/* Email + Password */}
                            <button
                                onClick={() => openEmailForm('login')}
                                className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                            >
                                <Mail size={20} />
                                Đăng nhập bằng Email
                            </button>

                            {/* Google Sign-In */}
                            <button
                                onClick={async () => {
                                    setGoogleError('');
                                    setGoogleLoading(true);
                                    const result = await pfLoginWithGoogle();
                                    setGoogleLoading(false);
                                    if (result.success) {

                                        onLogin('google', result.nickname);
                                    } else {
                                        setGoogleError(result.error || 'Đăng nhập Google thất bại');
                                    }
                                }}
                                disabled={googleLoading}
                                className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                {googleLoading ? (
                                    <Loader2 size={20} className="animate-spin text-gray-400" />
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                )}
                                Tiếp tục với Google
                            </button>

                            {/* Google Error */}
                            {googleError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 text-red-600 text-xs text-center p-2.5 rounded-xl border border-red-200 font-semibold"
                                >
                                    {googleError}
                                </motion.div>
                            )}

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
                    </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
                    Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng và{' '}
                    <button
                        id="login-privacy-policy-link"
                        type="button"
                        onClick={onOpenPrivacy}
                        className="text-blue-500 hover:underline font-medium"
                    >
                        Chính Sách Bảo Mật
                    </button>.
                </p>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
