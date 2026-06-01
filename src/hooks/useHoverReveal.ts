'use client';
import { useEffect, useState, useCallback } from 'react';

/**
 * Reveal hover-only controls on hover, keyboard focus, OR touch devices.
 * Returns the reveal flag plus the handlers to spread on the container.
 */
export function useHoverReveal() {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia?.('(hover: none)').matches ?? false);
  }, []);

  const onBlur = useCallback((e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false);
  }, []);

  const reveal = isHovered || isFocused || isTouch;

  return {
    reveal,
    isHovered,
    handlers: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur,
    },
  };
}
