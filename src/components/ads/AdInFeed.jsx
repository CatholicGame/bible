import { useEffect, useRef } from 'react';

/**
 * AdInFeed — Google AdSense In-feed / Fluid Ad
 * Slot: 8694510756
 * Layout key: -f1+5r+5a-db+57
 *
 * Usage:
 *   <AdInFeed />
 *
 * Notes:
 * - Fluid ads tự thích nghi với layout xung quanh.
 * - Nên đặt giữa các phần tử list/card để tự nhiên nhất.
 * - Không đặt quá nhiều trên 1 trang (tối đa 3 ads/trang theo policy AdSense).
 */
const AdInFeed = ({ className = '', style = {} }) => {
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
            console.warn('[AdInFeed] adsbygoogle push failed:', e);
        }
    }, []);

    return (
        <div
            className={className}
            style={{
                width: '100%',
                overflow: 'hidden',
                ...style,
            }}
        >
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="fluid"
                data-ad-layout-key="-f1+5r+5a-db+57"
                data-ad-client="ca-pub-7009965786329459"
                data-ad-slot="8694510756"
            />
        </div>
    );
};

export default AdInFeed;
