/**
 * useSoundManager — reusable audio hook for all games.
 *
 * Usage:
 *   const sound = useSoundManager(bgSrc, sfxMap);
 *   sound.playSfx('correct');   // plays sfxMap.correct
 *   sound.playClick();           // plays built-in click SFX
 *   sound.stopBg();
 *   sound.resumeBg();
 *   sound.setBgVolume(0.6);
 *
 * sfxMap: { [name]: importedAssetUrl }
 * bgSrc:  imported asset URL for looping background music (or null)
 *
 * Automatically respects settingsStore { music, sound } reactively.
 * Subscribe to store changes to mute/unmute without re-mounting.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useSoundManager(bgSrc = null, sfxMap = {}) {
    const bgRef    = useRef(null);   // HTMLAudioElement for bg music
    const sfxCache = useRef({});     // cache: name -> HTMLAudioElement

    // Read settings — we subscribe inside effects to react to changes
    const musicEnabled = useSettingsStore(s => s.music);
    const soundEnabled = useSettingsStore(s => s.sound);

    // ── BG Music lifecycle ──────────────────────────────────────────
    useEffect(() => {
        if (!bgSrc) return;
        const audio = new Audio(bgSrc);
        audio.loop = true;
        audio.volume = 0.45;
        bgRef.current = audio;

        if (musicEnabled) {
            audio.play().catch(() => {});
        }

        return () => {
            audio.pause();
            audio.src = '';
            bgRef.current = null;
        };
    // Only run on mount/unmount — music enable is handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bgSrc]);

    // React to music toggle
    useEffect(() => {
        const bg = bgRef.current;
        if (!bg) return;
        if (musicEnabled) {
            bg.play().catch(() => {});
        } else {
            bg.pause();
        }
    }, [musicEnabled]);

    // ── Play SFX ───────────────────────────────────────────────────
    const playSfx = useCallback((name, volume = 0.85) => {
        if (!soundEnabled) return;
        const src = sfxMap[name];
        if (!src) { console.warn(`useSoundManager: no sfx entry for "${name}"`); return; }
        try {
            // Reuse cached element — clone if already playing so overlaps work
            let el = sfxCache.current[name];
            if (!el) {
                el = new Audio(src);
                sfxCache.current[name] = el;
            }
            if (!el.paused) {
                // Clone so overlapping sounds work
                const clone = new Audio(src);
                clone.volume = volume;
                clone.play().catch(() => {});
                return;
            }
            el.volume = volume;
            el.currentTime = 0;
            el.play().catch(() => {});
        } catch (_) {}
    }, [soundEnabled, sfxMap]);

    // Dedicated button-click SFX — uses 'click' key from sfxMap
    const playClick = useCallback(() => {
        playSfx('click', 0.55);
    }, [playSfx]);

    // ── Bg controls ────────────────────────────────────────────────
    const stopBg = useCallback(() => {
        bgRef.current?.pause();
    }, []);

    const resumeBg = useCallback(() => {
        if (!musicEnabled) return;
        bgRef.current?.play().catch(() => {});
    }, [musicEnabled]);

    const setBgVolume = useCallback((vol) => {
        if (bgRef.current) bgRef.current.volume = vol;
    }, []);

    return { playSfx, playClick, stopBg, resumeBg, setBgVolume };
}
