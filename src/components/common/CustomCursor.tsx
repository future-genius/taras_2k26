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
    // Don't activate on touch devices
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide native cursor on body
    document.body.style.cursor = 'none';

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const onEnterCTA = () => ring.classList.add('on-cta');
    const onLeaveCTA = () => ring.classList.remove('on-cta');

    window.addEventListener('mousemove', onMove);

    // Attach CTA hover effects
    const addCtaListeners = () => {
      document
        .querySelectorAll('button, a, [role="button"], input, textarea, select, [data-cursor-cta]')
        .forEach((el) => {
          el.addEventListener('mouseenter', onEnterCTA);
          el.addEventListener('mouseleave', onLeaveCTA);
        });
    };

    addCtaListeners();

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
        ringPosRef.current.x = lerp(ringPosRef.current.x, x, 0.12);
        ringPosRef.current.y = lerp(ringPosRef.current.y, y, 0.12);
        ring.style.left = `${ringPosRef.current.x}px`;
        ring.style.top = `${ringPosRef.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="taras-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="taras-cursor-ring" aria-hidden="true" />
    </>
  );
};
