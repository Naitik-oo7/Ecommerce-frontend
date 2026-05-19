/**
 * Mouse Parallax Hook
 * Creates subtle parallax effect based on mouse position
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ParallaxValues {
  x: number;
  y: number;
}

interface UseMouseParallaxOptions {
  intensity?: number;
  smoothing?: number;
}

export const useMouseParallax = (options: UseMouseParallaxOptions = {}) => {
  const { intensity = 20, smoothing = 0.1 } = options;
  const [position, setPosition] = useState<ParallaxValues>({ x: 0, y: 0 });
  const targetRef = useRef<ParallaxValues>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Calculate normalized position (-1 to 1)
    const normalizedX = (clientX / innerWidth - 0.5) * 2;
    const normalizedY = (clientY / innerHeight - 0.5) * 2;

    targetRef.current = {
      x: normalizedX * intensity,
      y: normalizedY * intensity,
    };
  }, [intensity]);

  useEffect(() => {
    // Check for touch device
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    isActiveRef.current = true;
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Smooth animation loop (defined inside effect to avoid dependency issues)
    const animate = () => {
      if (!isActiveRef.current) return;

      setPosition((prev) => ({
        x: prev.x + (targetRef.current.x - prev.x) * smoothing,
        y: prev.y + (targetRef.current.y - prev.y) * smoothing,
      }));

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      isActiveRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, smoothing]);

  return position;
};

export default useMouseParallax;
