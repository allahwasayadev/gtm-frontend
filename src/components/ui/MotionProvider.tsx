'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Framer animates through inline JS transforms, so a CSS
 * `prefers-reduced-motion` rule cannot cancel it. The shared wrappers branch in
 * JS, but every page that reaches for `motion.*` directly — the auth, landing,
 * policy and onboarding routes — would otherwise still animate.
 *
 * `reducedMotion="user"` makes that the default for every motion component
 * underneath, so a route gets it by existing rather than by remembering to ask.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
