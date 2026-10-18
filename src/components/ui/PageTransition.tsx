'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: (staggerDelay: number) => ({
    opacity: 1,
    transition: {
      // Capped so a long list cannot accumulate a visible wait at the end.
      staggerChildren: Math.min(staggerDelay, 0.03),
      delayChildren: 0,
    },
  }),
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function StaggerList({ children, className = '', staggerDelay = 0.03 }: StaggerListProps) {
  const reduce = useReducedMotion();

  // Framer Motion animates through inline transforms, which CSS cannot switch
  // off, so the reduced-motion branch has to be taken here in JS.
  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      custom={staggerDelay}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ children, className = '', delay = 0, direction = 'up' }: FadeInProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const offsets = {
    up: { y: 8 },
    down: { y: -8 },
    left: { x: 8 },
    right: { x: -8 },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(delay, 0.06), ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) =>
            reduce ? (
              // Still three dots, so the shape of the indicator is the same;
              // they simply hold their position instead of bouncing.
              <div key={i} className="w-3 h-3 rounded-full bg-accent" style={{ opacity: 0.4 + i * 0.3 }} />
            ) : (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-accent"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            )
          )}
        </div>
        <p className="text-[15px] text-ink-2">{message}</p>
      </div>
    </div>
  );
}
