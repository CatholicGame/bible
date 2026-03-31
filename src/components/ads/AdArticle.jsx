import { useEffect, useRef, useState } from 'react';

const IS_DEV = import.meta.env.DEV;

/**
 * AdArticle — Google AdSense In-article Ad (fluid, centered)
 * Slot: 5313164365
 *
 * - Tự động collapse về height 0 nếu Google không fill ad (unfilled / localhost).
 * - DEV mode: hiện badge trạng thái (loading / done / failed / no-sdk).
 */
const AdArticle = ({ className = '', style = {} }) => {
    const adRef = useRef(null);
    const pushed = useRef(false);
    const [adStatus, setAdStatus] = useState('loading'); // 'loading' | 'done' | 'failed' | 'no-sdk'

    useEffect(() => {
        if (!window.adsbygoogle) {
            setAdStatus('no-sdk');
            return;
        }
        if (pushed.current) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
        } catch (e) {
            setAdStatus('failed');
            console.error('[AdArticle] adsbygoogle push thất bại:', e);
            return;
        }

        // Poll data-adsbygoogle-status — Google gán khi xử lý xong
        let attempts = 0;
        const maxAttempts = 20; // 20 × 500ms = 10s
        const poll = setInterval(() => {
            attempts++;
            const ins = adRef.current;
            if (!ins) { clearInterval(poll); return; }

            const status = ins.getAttribute('data-adsbygoogle-status');
            if (status === 'done') {
                setAdStatus('done');
                clearInterval(poll);
            } else if (attempts >= maxAttempts) {
                setAdStatus('failed');
                clearInterval(poll);
                console.warn('[AdArticle] ⚠️ Ad không fill sau 10s');
            }
        }, 500);

        return () => clearInterval(poll);
    }, []);

    const STATUS_CONFIG = {
        loading: { color: '#f59e0b', label: '⏳ Ad: loading...' },
        done:    { color: '#22c55e', label: '✅ Ad: loaded' },
        failed:  { color: '#ef4444', label: '❌ Ad: unfilled' },
        'no-sdk':{ color: '#94a3b8', label: '⚪ Ad: no SDK' },
    };
    const cfg = STATUS_CONFIG[adStatus] || STATUS_CONFIG.loading;

    const isHidden = adStatus === 'failed' || adStatus === 'no-sdk';

    return (
        <div
            className={className}
            style={{
                width: '100%',
                overflow: 'hidden',
                textAlign: 'center',
                height: isHidden ? 0 : undefined,
                transition: 'height 0.3s ease',
                position: 'relative',
                ...style,
            }}
        >
            {IS_DEV && (
                <div style={{
                    position: 'absolute', top: 4, left: 4, zIndex: 9999,
                    background: 'rgba(0,0,0,0.75)', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, fontWeight: 700,
                    color: cfg.color, pointerEvents: 'none',
                    fontFamily: 'monospace', whiteSpace: 'nowrap',
                }}>
                    {cfg.label}
                </div>
            )}
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
