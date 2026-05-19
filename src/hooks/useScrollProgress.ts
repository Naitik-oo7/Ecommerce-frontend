/**
 * Scroll Progress Hook
 * Tracks scroll progress for animations and indicators
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScrollProgress {
  progress: number;
  scrollY: number;
  scrollHeight: number;
  viewportHeight: number;
}

export const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState<ScrollProgress>({
    progress: 0,
    scrollY: 0,
    scrollHeight: 0,
    viewportHeight: 0,
  });

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight - viewportHeight;
    const progress = scrollHeight > 0 ? scrollY / scrollHeight : 0;

    setScrollProgress({
      progress: Math.min(Math.max(progress, 0), 1),
      scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight,
    });
  }, []);

  useEffect(() => {
    // Use timeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(handleScroll, 0);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return scrollProgress;
};

export default useScrollProgress;
