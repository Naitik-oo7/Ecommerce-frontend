/**
 * GSAP Animation Setup
 * Configure GSAP with ScrollTrigger for premium scroll animations
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// GSAP defaults for premium feel
export const gsapDefaults = {
  ease: 'power3.out',
  duration: 0.8,
};

// ScrollTrigger defaults
export const scrollTriggerDefaults = {
  start: 'top 85%',
  end: 'bottom 15%',
  toggleActions: 'play none none reverse',
};

// Text reveal animation
export const textRevealAnimation = (
  element: string | Element | Element[],
  options?: gsap.TweenVars
) => {
  return gsap.fromTo(
    element,
    {
      y: 60,
      opacity: 0,
      clipPath: 'inset(100% 0 0 0)',
    },
    {
      y: 0,
      opacity: 1,
      clipPath: 'inset(0% 0 0 0)',
      duration: 1,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Stagger text reveal for multiple elements
export const staggerTextReveal = (
  elements: string | Element | Element[],
  staggerAmount: number = 0.1,
  options?: gsap.TweenVars
) => {
  return gsap.fromTo(
    elements,
    {
      y: 40,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: staggerAmount,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Image mask reveal animation
export const imageRevealAnimation = (
  element: string | Element | Element[],
  options?: gsap.TweenVars
) => {
  return gsap.fromTo(
    element,
    {
      clipPath: 'inset(100% 0 0 0)',
      scale: 1.1,
    },
    {
      clipPath: 'inset(0% 0 0 0)',
      scale: 1,
      duration: 1.2,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Parallax animation
export const parallaxAnimation = (
  element: string | Element | Element[],
  distance: number = 100,
  options?: gsap.TweenVars
) => {
  if (typeof window === 'undefined') return null;

  return gsap.to(element, {
    y: distance,
    ease: 'none',
    scrollTrigger: {
      trigger: element as string | Element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      ...options,
    },
  });
};

// Horizontal scroll section
export const horizontalScrollAnimation = (
  container: string | Element,
  panels: string | Element | Element[],
  options?: gsap.TweenVars
) => {
  if (typeof window === 'undefined') return null;

  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerEl) return null;

  const panelsArray = gsap.utils.toArray(panels);
  
  return gsap.to(panelsArray, {
    xPercent: -100 * (panelsArray.length - 1),
    ease: 'none',
    scrollTrigger: {
      trigger: containerEl,
      pin: true,
      scrub: 1,
      end: () => '+=' + containerEl.scrollWidth,
      ...options,
    },
  });
};

// Export configured GSAP
export { gsap, ScrollTrigger };
