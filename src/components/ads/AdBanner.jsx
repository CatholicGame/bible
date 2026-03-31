import { useEffect, useRef, useState } from 'react';

const IS_DEV = import.meta.env.DEV;

/**
 * AdBanner — Google AdSense Display Ad (auto, full-width responsive)
 * Slot: 6674347497
 *
 * DEV mode: hiện badge góc trên-trái cho biết trạng thái ad:
 *   🟡 loading  — đang chờ Google response
 *   🟢 done     — ad đã load thành công (data-adsbygoogle-status="done")
 *   🔴 failed   — Google không fill ad (unfilled / blocked)
 *   ⚪ no-sdk   — adsbygoogle script chưa load
 *
 * Notes:
 * - Wrap trong container có width cố định (≥ 300px) để ad hiển thị đúng.
 * - Ad chỉ hiển thị thật trên domain đã đăng ký AdSense, KHÔNG hiển thị ở localhost.
 */
const AdBanner = ({ className = '', style = {} }) => {
    const adRef = useRef(null);
    const pushed = useRef(false);
    const [adStatus, setAdStatus] = useState('loading'); // 'loading' | 'done' | 'failed' | 'no-sdk'

    useEffect(() => {
        // Kiểm tra SDK có sẵn không
        if (!window.adsbygoogle) {
            setAdStatus('no-sdk');
            console.warn('[AdBanner] window.adsbygoogle chưa load. Kiểm tra script trong index.html.');
            return;
        }

        if (pushed.current) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
            console.info('[AdBanner] adsbygoogle.push() gọi thành công — slot 6674347497');
        } catch (e) {
            setAdStatus('failed');
            console.error('[AdBanner] adsbygoogle push thất bại:', e);
            return;
        }

        // Poll data-adsbygoogle-status trên <ins> — Google tự gán khi xử lý xong
        let attempts = 0;
        const maxAttempts = 20; // 20 × 500ms = 10s timeout
        const poll = setInterval(() => {
            attempts++;
            const ins = adRef.current;
            if (!ins) { clearInterval(poll); return; }

            const status = ins.getAttribute('data-adsbygoogle-status');
            if (status === 'done') {
                setAdStatus('done');
                clearInterval(poll);
                console.info('[AdBanner] ✅ Ad loaded — slot 6674347497');
            } else if (attempts >= maxAttempts) {
                // Hết thời gian → coi như không fill được
                setAdStatus('failed');
                clearInterval(poll);
                console.warn('[AdBanner] ⚠️ Ad không có response sau 10s (unfilled hoặc localhost)');
            }
        }, 500);

        return () => clearInterval(poll);
    }, []);

    const STATUS_CONFIG = {
        loading: { color: '#f59e0b', label: '⏳ Ad: loading...' },
        done:    { color: '#22c55e', label: '✅ Ad: loaded' },
        failed:  { color: '#ef4444', label: '❌ Ad: unfilled (localhost?)' },
        'no-sdk':{ color: '#94a3b8', label: '⚪ Ad: no SDK' },
    };
    const cfg = STATUS_CONFIG[adStatus] || STATUS_CONFIG.loading;

    // Ẩn hoàn toàn container khi ad không load được (không chiếm không gian UI)
    const isHidden = adStatus === 'failed' || adStatus === 'no-sdk';

    return (
        <div
            className={className}
            style={{
                width: '100%',
                overflow: 'hidden',
                // Chỉ dành không gian khi đang load hoặc đã done;
                // collapse về 0 nếu unfilled / no-sdk
                minHeight: isHidden ? 0 : (adStatus === 'done' ? undefined : 60),
                height: isHidden ? 0 : undefined,
                position: 'relative',
                transition: 'height 0.3s ease, min-height 0.3s ease',
                ...style,
            }}
        >
            {/* DEV-only status badge */}
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
