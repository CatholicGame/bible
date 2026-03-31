import { useEffect, useRef } from 'react';

/**
 * AdArticle — Google AdSense In-article Ad (fluid, centered)
 * Slot: 5313164365
 *
 * Usage:
 *   <AdArticle />
 *
 * Best placements:
 * - Giữa đoạn giải thích câu trả lời (sau khi trả lời đúng/sai)
 * - Giữa các section văn bản dài (giải thích Kinh Thánh, bình luận)
 * - Giữa màn kết quả game (giữa bảng điểm và nút hành động)
 *
 * Notes:
 * - In-article ads tự căn chỉnh theo chiều rộng container.
 * - AdSense policy: tối đa 3 ads/trang, không đặt quá gần nhau.
 * - Không hiển thị ở localhost — chỉ hoạt động trên domain đã đăng ký.
 */
const AdArticle = ({ className = '', style = {} }) => {
    const adRef = useRef(null);
    const pushed = useRef(false);

    useEffect(() => {
        if (pushed.current) return;
        try {
            if (adRef.current && window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushed.current = true;
            }
        } catch (e) {
            console.warn('[AdArticle] adsbygoogle push failed:', e);
        }
    }, []);

    return (
        <div
            className={className}
            style={{
                width: '100%',
                overflow: 'hidden',
                textAlign: 'center',
                ...style,
            }}
        >
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center' }}
                data-ad-layout="in-article"
                data-ad-format="fluid"
                data-ad-client="ca-pub-7009965786329459"
                data-ad-slot="5313164365"
            />
        </div>
    );
};

export default AdArticle;
