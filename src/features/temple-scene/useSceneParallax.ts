import { useEffect, useRef, useState } from 'react';

export function useSceneParallax() {
  const frame = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    if (reducedMotion.matches || coarsePointer.matches) return;

    const onMove = (event: PointerEvent) => {
      target.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2
      };
      if (frame.current === null) {
        frame.current = window.requestAnimationFrame(() => {
          setOffset(target.current);
          frame.current = null;
        });
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return offset;
}
