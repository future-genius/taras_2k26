import type { Variants } from 'framer-motion';

// Checks prefers-reduced-motion at call time
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeCustom: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Standard section/card fade-up entrance */
export const fadeInUp: Variants = {
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : 0.5, ease: easeCustom },
  },
};

/** Stagger container — wraps a list of children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reduced ? 0 : 0.07,
      delayChildren: reduced ? 0 : 0.04,
    },
  },
};

/** Individual card item inside a stagger container */
export const cardEntrance: Variants = {
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 20, scale: reduced ? 1 : 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: reduced ? 0 : 0.45, ease: easeCustom },
  },
};

/** Page-level entrance */
export const pageTransitionIn: Variants = {
  initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 18, scale: reduced ? 1 : 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: reduced ? 0 : 0.48, ease: easeCustom },
  },
  exit: {
    opacity: reduced ? 1 : 0,
    y: reduced ? 0 : -14,
    scale: reduced ? 1 : 0.985,
    transition: { duration: reduced ? 0 : 0.28, ease: [0.4, 0, 1, 1] },
  },
};

/** Hero section — longer cinematic reveal */
export const heroReveal: Variants = {
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 36, scale: reduced ? 1 : 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: reduced ? 0 : 0.75, ease: easeCustom },
  },
};

/** Slide-in from left for timeline steps */
export const slideInLeft: Variants = {
  hidden: { opacity: reduced ? 1 : 0, x: reduced ? 0 : -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: reduced ? 0 : 0.5, ease: easeCustom },
  },
};

/** Slide-in from right for timeline steps */
export const slideInRight: Variants = {
  hidden: { opacity: reduced ? 1 : 0, x: reduced ? 0 : 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: reduced ? 0 : 0.5, ease: easeCustom },
  },
};

/** Scale entrance for badges and focal cards */
export const scaleIn: Variants = {
  hidden: { opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: reduced ? 0 : 0.4, ease: easeCustom },
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
    transition: { duration: reduced ? 0 : 0.35, ease: easeCustom },
  },
};
