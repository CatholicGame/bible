import { useRef, useEffect, useCallback, useState } from 'react';

const VISIBLE = 3; // show 3 items at a time

/**
 * WheelPicker — Vertical scroll picker with snap
 * Props:
 *   items: Array of { value, label }
 *   selectedIndex: number
 *   onChange: (index) => void
 *   label: string (e.g. "Tràng" / "Chục")
 */
const WheelPicker = ({ items, selectedIndex, onChange, label, itemHeight = 40 }) => {
    const trackRef = useRef(null);
    const startY = useRef(0);
    const startOffset = useRef(0);
    const currentOffset = useRef(0);
    const [offset, setOffset] = useState(0);
    const isDragging = useRef(false);
    const lastVelocity = useRef(0);
    const lastMoveTime = useRef(0);
    const lastMoveY = useRef(0);
    const animFrame = useRef(null);

    // Center area: index 0 → offset = 0, index 1 → offset = -itemHeight, etc.
    const getOffsetForIndex = (idx) => -idx * itemHeight;
    const getClosestIndex = (off) => {
        const idx = Math.round(-off / itemHeight);
        return Math.max(0, Math.min(items.length - 1, idx));
    };

    // Init
    useEffect(() => {
        const off = getOffsetForIndex(selectedIndex);
        currentOffset.current = off;
        setOffset(off);
    }, [selectedIndex, items.length, itemHeight]);

    const snapTo = useCallback((idx) => {
        const clamped = Math.max(0, Math.min(items.length - 1, idx));
        const targetOff = getOffsetForIndex(clamped);
        currentOffset.current = targetOff;
        setOffset(targetOff);
        if (clamped !== selectedIndex) {
            onChange(clamped);
        }
    }, [items.length, selectedIndex, onChange, itemHeight]);

    // Pointer events for drag
    const handlePointerDown = (e) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startOffset.current = currentOffset.current;
        lastMoveY.current = e.clientY;
        lastMoveTime.current = Date.now();
        lastVelocity.current = 0;
        if (animFrame.current) cancelAnimationFrame(animFrame.current);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const dy = e.clientY - startY.current;
        const newOff = startOffset.current + dy;

        // Calculate velocity
        const now = Date.now();
        const dt = now - lastMoveTime.current;
        if (dt > 0) {
            lastVelocity.current = (e.clientY - lastMoveY.current) / dt;
        }
        lastMoveTime.current = now;
        lastMoveY.current = e.clientY;

        // Clamp with rubber-band
        const minOff = getOffsetForIndex(items.length - 1) - itemHeight;
        const maxOff = itemHeight;
        const clamped = Math.max(minOff, Math.min(maxOff, newOff));
        currentOffset.current = clamped;
        setOffset(clamped);
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        // Use velocity to determine target
        const velBias = lastVelocity.current * 80;
        const targetOff = currentOffset.current + velBias;
        const targetIdx = getClosestIndex(targetOff);
        snapTo(targetIdx);
    };

    const centerIdx = Math.max(0, Math.min(items.length - 1, VISIBLE));
    const containerH = VISIBLE * itemHeight;
    // Track top so that selected item sits in the center slot
    const trackTop = (containerH / 2) - (itemHeight / 2);

    return (
        <div className="wheel-picker" style={{ height: containerH }}>
            <div className="wheel-picker-fade-top" />
            <div className="wheel-picker-fade-bottom" />
            <div className="wheel-picker-highlight" />
            <div
                ref={trackRef}
                className="wheel-picker-track"
                style={{
                    marginTop: trackTop,
                    transform: `translateY(${offset}px)`,
                    transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {items.map((item, i) => (
                    <div
                        key={i}
                        className={`wheel-picker-item ${i === selectedIndex ? 'active' : ''}`}
                        onClick={() => snapTo(i)}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
            {label && <div className="wheel-picker-label">{label}</div>}
        </div>
    );
};

export default WheelPicker;
