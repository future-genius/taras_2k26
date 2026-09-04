import type { Variants } from 'framer-motion';

// Checks prefers-reduced-motion at call time
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeCustom: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Standard section/card fade-up entrance */
export const fadeInUp: Variants = {
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : 0.45, ease: easeCustom },
  },
};

/** Stagger container — wraps a list of children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reduced ? 0 : 0.08,
      delayChildren: reduced ? 0 : 0.05,
    },
  },
};

/** Individual card item inside a stagger container */
export const cardEntrance: Variants = {
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 18, scale: reduced ? 1 : 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: reduced ? 0 : 0.4, ease: easeCustom },
  },
};

/** Page-level entrance */
export const pageTransitionIn: Variants = {
  initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : 0.35, ease: easeCustom },
  },
  exit: {
    opacity: reduced ? 1 : 0,
    y: reduced ? 0 : -8,
    transition: { duration: reduced ? 0 : 0.2, ease: 'easeIn' },
  },
};

/** Hero section — longer cinematic reveal */
export const heroReveal: Variants = {
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : 0.7, ease: easeCustom },
  },
};

/** Slide-in from left for timeline steps */
export const slideInLeft: Variants = {
  hidden: { opacity: reduced ? 1 : 0, x: reduced ? 0 : -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: reduced ? 0 : 0.45, ease: easeCustom },
  },
};

/** Number flip for countdown */
export const numberFlip: Variants = {
  initial: { rotateX: reduced ? 0 : -90, opacity: 0 },
  animate: {
    rotateX: 0,
    opacity: 1,
    transition: { duration: reduced ? 0 : 0.28, ease: easeCustom },
  },
  exit: {
    rotateX: reduced ? 0 : 90,
    opacity: 0,
    transition: { duration: reduced ? 0 : 0.18, ease: 'easeIn' },
  },
};

/** Accordion content */
export const accordionContent: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: reduced ? 0 : 0.25, ease: 'easeInOut' },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: reduced ? 0 : 0.3, ease: easeCustom },
  },
};
