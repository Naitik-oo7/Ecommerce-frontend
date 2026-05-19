/**
 * MONO Brand Animation Library
 * Reusable Framer Motion variants and configurations
 */

import { Variants, Transition } from 'framer-motion';

// ============================================
// EASING CURVES
// ============================================

export const easings = {
  // Smooth deceleration - great for content appearing
  outExpo: [0.16, 1, 0.3, 1] as const,
  // Quick start, smooth end - for UI feedback
  outQuart: [0.25, 1, 0.5, 1] as const,
  // Standard material motion
  inOut: [0.4, 0, 0.2, 1] as const,
  // Playful bounce - for interactive elements
  bounce: [0.34, 1.56, 0.64, 1] as const,
  // Sharp exit
  outSharp: [0.4, 0, 1, 1] as const,
};

// ============================================
// DURATIONS
// ============================================

export const durations = {
  instant: 0.15,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  page: 0.6,
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitions: Record<string, Transition> = {
  fast: {
    duration: durations.fast,
    ease: easings.outQuart,
  },
  normal: {
    duration: durations.normal,
    ease: easings.outQuart,
  },
  slow: {
    duration: durations.slow,
    ease: easings.outExpo,
  },
  bounce: {
    duration: durations.normal,
    ease: easings.bounce,
  },
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
  springSoft: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
};

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
};

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transitions.fast,
  },
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: transitions.fast,
  },
};

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.fast,
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: transitions.fast,
  },
};

export const fadeInScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: transitions.fast,
  },
};

// ============================================
// STAGGER CONTAINERS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.08,
      staggerDirection: -1,
    },
  },
};

// ============================================
// STAGGER ITEMS
// ============================================

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: durations.fast,
      ease: easings.outQuart,
    },
  },
};

export const staggerItemFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.outQuart,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.instant,
    },
  },
};

export const staggerItemScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: durations.fast,
    },
  },
};

// ============================================
// HOVER EFFECTS
// ============================================

export const hoverLift = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: transitions.fast,
  },
  hover: {
    y: -4,
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    transition: transitions.normal,
  },
};

export const hoverScale = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: transitions.normal,
  },
};

export const hoverScaleSubtle = {
  rest: { scale: 1 },
  hover: {
    scale: 1.01,
    transition: transitions.fast,
  },
};

export const hoverImageZoom = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: durations.slow,
      ease: easings.outExpo,
    },
  },
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.page,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: durations.fast,
      ease: easings.outSharp,
    },
  },
};

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: durations.slow,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
};

// ============================================
// DROPDOWN / MODAL
// ============================================

export const dropdownMenu: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: durations.fast,
    },
  },
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: {
      duration: durations.fast,
    },
  },
};

// ============================================
// BUTTON INTERACTIONS
// ============================================

export const buttonTap = {
  scale: 0.98,
  transition: {
    duration: durations.instant,
  },
};

export const buttonHover = {
  scale: 1.02,
  transition: transitions.fast,
};

// ============================================
// CART ITEM ANIMATIONS
// ============================================

export const cartItem: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    height: 0,
  },
  visible: {
    opacity: 1,
    x: 0,
    height: 'auto',
    transition: {
      duration: durations.normal,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    transition: {
      duration: durations.fast,
      ease: easings.outSharp,
    },
  },
};

// ============================================
// SKELETON LOADING
// ============================================

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// NOTIFICATION
// ============================================

export const notificationSlide: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.outExpo,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95,
    transition: {
      duration: durations.fast,
    },
  },
};

// ============================================
// TEXT REVEAL (for hero sections)
// ============================================

export const textReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slower,
      ease: easings.outExpo,
    },
  },
};

export const textRevealContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const textRevealItem: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slower,
      ease: easings.outExpo,
    },
  },
};

// ============================================
// SCROLL REVEAL
// ============================================

export const scrollReveal = {
  offscreen: {
    opacity: 0,
    y: 30,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      bounce: 0.3,
      duration: durations.slow,
    },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a custom stagger container with specified delay
 */
export const createStaggerContainer = (staggerDelay: number = 0.08, delayChildren: number = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerDelay * 0.5,
      staggerDirection: -1,
    },
  },
});

/**
 * Creates fade in variants with custom delay
 */
export const createFadeInUp = (delay: number = 0, y: number = 20): Variants => ({
  hidden: {
    opacity: 0,
    y,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.outExpo,
      delay,
    },
  },
  exit: {
    opacity: 0,
    y: y * 0.5,
    transition: {
      duration: durations.fast,
    },
  },
});
