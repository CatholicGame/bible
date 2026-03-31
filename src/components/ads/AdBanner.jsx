import { useEffect, useRef } from 'react';

/**
 * AdBanner — Google AdSense Display Ad (auto, full-width responsive)
 * Slot: 6674347497
 *
 * Usage:
 *   <AdBanner />
 *
 * Notes:
 * - Wrap trong container có width cố định (≥ 300px) để ad hiển thị đúng.
 * - Không đặt trong các div overflow:hidden mà không có chiều cao xác định.
 * - AdSense tự động xác định kích thước dựa trên container.
 */
const AdBanner = ({ className = '', style = {} }) => {
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
            console.warn('[AdBanner] adsbygoogle push failed:', e);
        }
    }, []);

    return (
        <div
            className={className}
            style={{
                width: '100%',
                overflow: 'hidden',
                minHeight: 60,
                ...style,
            }}
        >
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-7009965786329459"
                data-ad-slot="6674347497"
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
};

export default AdBanner;
