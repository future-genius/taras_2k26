import React, { useEffect, useRef } from 'react';

/**
 * Desktop-only custom cursor:
 *   - 8px white dot that follows the mouse precisely
 *   - 24px dark-red ring with slight lag
 *   - Ring expands + deepens on CTA hover
 *   - Hidden on touch devices
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const ringPosRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let isVisible = false;

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };

      if (!isVisible) {
        isVisible = true;
        if (dot) dot.style.opacity = '1';
        if (ring) ring.style.opacity = '1';
      }

      // Dynamic CTA detection via target matching (works on portals, modals, dynamic DOM)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.closest(
          'button, a, [role="button"], input, textarea, select, [data-cursor-cta], label'
        )
      ) {
        ring.classList.add('on-cta');
      } else {
        ring.classList.remove('on-cta');
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (dot) dot.style.opacity = '0';
      if (ring) ring.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // Laggy ring animation loop
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      const { x, y } = posRef.current;
      const ring = ringRef.current;
      const d = dotRef.current;

      if (d) {
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
      }

      if (ring) {
        ringPosRef.current.x = lerp(ringPosRef.current.x, x, 0.16);
        ringPosRef.current.y = lerp(ringPosRef.current.y, y, 0.16);
        ring.style.left = `${ringPosRef.current.x}px`;
        ring.style.top = `${ringPosRef.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="taras-cursor-dot" aria-hidden="true" style={{ opacity: 0 }} />
      <div ref={ringRef} className="taras-cursor-ring" aria-hidden="true" style={{ opacity: 0 }} />
    </>
  );
};
