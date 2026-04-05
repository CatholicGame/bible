import { useEffect } from 'react';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-400 rounded-full inline-block" />
            {title}
        </h2>
        <div className="text-slate-300 leading-relaxed space-y-2 pl-3">
            {children}
        </div>
    </div>
);

const PrivacyPolicy = ({ onBack }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div
            className="relative w-full min-h-screen bg-[#020617] text-white overflow-y-auto"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-600 opacity-5 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-indigo-700 opacity-5 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-5 py-8 pb-20">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <button
                        id="privacy-back-btn"
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Quay lại</span>
                    </button>

                    {/* Title card */}
                    <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-700/40 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Chính Sách Bảo Mật</h1>
                                <p className="text-xs text-amber-400/80">Catholic Quiz · Cập nhật: Tháng 4, 2025</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Chúng tôi coi trọng quyền riêng tư của bạn. Tài liệu này giải thích cách <strong className="text-slate-200">Catholic Quiz</strong> thu thập, sử dụng và bảo vệ thông tin của bạn.
                        </p>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                >
                    <Section title="1. Thông Tin Chúng Tôi Thu Thập">
                        <p>Khi bạn sử dụng Catholic Quiz, chúng tôi có thể thu thập các loại thông tin sau:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
                            <li><strong className="text-slate-200">Thông tin tài khoản Google:</strong> Tên hiển thị, địa chỉ email và ảnh đại diện khi bạn đăng nhập bằng Google.</li>
                            <li><strong className="text-slate-200">Dữ liệu chơi game:</strong> Điểm số, xếp hạng, số lượt chơi và tiến trình trong các trò chơi.</li>
                            <li><strong className="text-slate-200">Dữ liệu phòng P2P:</strong> Thông tin phòng chơi tạm thời được lưu trữ trên Firebase Realtime Database trong quá trình chơi đối kháng.</li>
                            <li><strong className="text-slate-200">Dữ liệu ẩn danh:</strong> Khi chơi dưới dạng khách, chúng tôi tạo một ID ẩn danh để duy trì phiên chơi của bạn.</li>
                        </ul>
                    </Section>

                    <Section title="2. Cách Chúng Tôi Sử Dụng Thông Tin">
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Xác thực danh tính và duy trì phiên đăng nhập của bạn.</li>
                            <li>Lưu trữ điểm số và tiến trình để cung cấp trải nghiệm liên tục giữa các phiên chơi.</li>
                            <li>Hiển thị bảng xếp hạng và so sánh điểm số với người chơi khác.</li>
                            <li>Cải thiện hiệu suất và chất lượng ứng dụng thông qua phân tích dữ liệu ẩn danh.</li>
                            <li>Hiển thị quảng cáo phù hợp thông qua Google AdSense để duy trì dịch vụ miễn phí.</li>
                        </ul>
                    </Section>

                    <Section title="3. Dịch Vụ Bên Thứ Ba">
                        <p className="text-sm mb-2">Catholic Quiz sử dụng các dịch vụ bên thứ ba sau đây, mỗi dịch vụ có chính sách bảo mật riêng:</p>
                        <div className="space-y-3 text-sm">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <p className="font-semibold text-slate-200">🔵 Firebase (Google)</p>
                                <p className="text-slate-400">Xác thực người dùng, lưu trữ dữ liệu thời gian thực.</p>
                                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline text-xs">→ firebase.google.com/support/privacy</a>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <p className="font-semibold text-slate-200">🎮 PlayFab (Microsoft)</p>
                                <p className="text-slate-400">Quản lý dữ liệu người chơi, điểm số và tài nguyên trong game.</p>
                                <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline text-xs">→ privacy.microsoft.com</a>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <p className="font-semibold text-slate-200">📢 Google AdSense</p>
                                <p className="text-slate-400">Hiển thị quảng cáo. Google có thể sử dụng cookie để hiển thị quảng cáo dựa trên lượt truy cập của bạn.</p>
                                <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline text-xs">→ policies.google.com/technologies/ads</a>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <p className="font-semibold text-slate-200">📊 Vercel Analytics</p>
                                <p className="text-slate-400">Phân tích hiệu suất ứng dụng ẩn danh.</p>
                                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline text-xs">→ vercel.com/legal/privacy-policy</a>
                            </div>
                        </div>
                    </Section>

                    <Section title="4. Cookie và Lưu Trữ Cục Bộ">
                        <p className="text-sm">Chúng tôi sử dụng <strong className="text-slate-200">localStorage</strong> của trình duyệt để lưu trữ:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                            <li>Thông tin phiên đăng nhập (<code className="text-amber-300 text-xs bg-black/30 px-1 rounded">guestSession</code>)</li>
                            <li>Cài đặt và tuỳ chọn cá nhân của người chơi</li>
                        </ul>
                        <p className="text-sm mt-2">Google AdSense có thể sử dụng cookie riêng phục vụ mục đích hiển thị quảng cáo phù hợp. Bạn có thể quản lý cookie tại <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">adssettings.google.com</a>.</p>
                    </Section>

                    <Section title="5. Bảo Mật Dữ Liệu">
                        <p className="text-sm">
                            Chúng tôi áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông tin của bạn. Tuy nhiên, không có phương thức truyền tải qua Internet nào là an toàn tuyệt đối. Mật khẩu và thông tin xác thực được xử lý hoàn toàn qua Firebase Authentication của Google — chúng tôi không lưu trữ mật khẩu của bạn.
                        </p>
                    </Section>

                    <Section title="6. Quyền Của Bạn">
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong className="text-slate-200">Truy cập:</strong> Bạn có thể xem dữ liệu của mình trong phần Hồ Sơ (Profile).</li>
                            <li><strong className="text-slate-200">Xóa dữ liệu:</strong> Liên hệ với chúng tôi để yêu cầu xóa tài khoản và tất cả dữ liệu liên quan.</li>
                            <li><strong className="text-slate-200">Từ chối quảng cáo cá nhân hóa:</strong> Truy cập <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">adssettings.google.com</a> để quản lý tùy chọn.</li>
                        </ul>
                    </Section>

                    <Section title="7. Trẻ Em">
                        <p className="text-sm">
                            Catholic Quiz không thu thập có chủ đích thông tin cá nhân từ trẻ em dưới 13 tuổi. Nếu bạn là phụ huynh và phát hiện con bạn đã cung cấp thông tin cá nhân, vui lòng liên hệ với chúng tôi để xóa dữ liệu đó.
                        </p>
                    </Section>

                    <Section title="8. Thay Đổi Chính Sách">
                        <p className="text-sm">
                            Chúng tôi có thể cập nhật Chính Sách Bảo Mật này theo thời gian. Mọi thay đổi sẽ được đăng tại trang này với ngày cập nhật mới. Chúng tôi khuyến khích bạn xem lại định kỳ.
                        </p>
                    </Section>

                    <Section title="9. Liên Hệ">
                        <p className="text-sm">
                            Nếu bạn có câu hỏi về Chính Sách Bảo Mật này, vui lòng liên hệ:
                        </p>
                        <div className="mt-2 bg-black/20 rounded-xl p-3 text-sm border border-white/10">
                            <p className="text-slate-200 font-semibold">Catholic Quiz</p>
                            <p className="text-slate-400">📧 Email: <a href="mailto:hapagonmolie@gmail.com" className="text-amber-400 hover:underline">hapagonmolie@gmail.com</a></p>
                            <p className="text-slate-400">📘 Facebook: <a href="https://www.facebook.com/profile.php?id=61584274960298" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Catholic Quiz Vietnam</a></p>
                        </div>
                    </Section>
                </motion.div>

                {/* Footer note */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2025 Catholic Quiz · Chính sách này có hiệu lực từ ngày 1 tháng 4 năm 2025
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
