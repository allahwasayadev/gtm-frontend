'use client';

import { useState, useEffect, useCallback, useLayoutEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CloudUpload, BarChart3, Mail, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { useOverlayBehaviour } from '@/lib/useOverlayBehaviour';

interface TourStep {
  id: string;
  targetSelector: string;
  icon: LucideIcon;
  iconBg: string;
  title: string;
  body: string;
  buttonText: string;
  hint?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'upload',
    targetSelector: '[data-tour="upload-list"]',
    icon: CloudUpload,
    iconBg: 'bg-accent',
    title: 'Upload Your List',
    body: 'Upload your account list once to start mapping. Overlap automatically re-maps as connections update, so your overlaps stay current.',
    buttonText: 'Upload List',
  },
  {
    id: 'overlaps',
    targetSelector: '[data-tour="view-matches"]',
    icon: BarChart3,
    iconBg: 'bg-ok',
    title: 'See Your Shared Overlaps',
    body: "Once your list is uploaded, you'll see shared accounts between you and each connection. Overlaps update automatically as your network grows.",
    buttonText: 'View Overlaps',
  },
  {
    id: 'invite',
    targetSelector: '[data-tour="invite-partner"]',
    icon: Mail,
    iconBg: 'bg-accent',
    title: 'Invite a Partner',
    body: 'Send an invite by email to connect with colleagues or partners. Once they accept, you can compare lists and see overlapping accounts.',
    buttonText: 'Invite Partner',
    hint: 'Start with someone you already collaborate with.',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void | Promise<void>;
  onAction: (stepId: string) => void;
}

const TOOLTIP_MAX_WIDTH = 360;
const TOOLTIP_EST_HEIGHT = 300;
const GUTTER = 16;

/**
 * The panel used to be a fixed 360px. On a 320px phone the clamp then computed
 * `left = 320 - 360 - 16`, i.e. -56, and pushed a third of the panel off the
 * side of the screen. The width is a budget now, not a constant: it is whatever
 * fits between the gutters, and the height is capped so a short or landscape
 * viewport scrolls inside the panel instead of overflowing the screen.
 */
function getTooltipPosition(rect: DOMRect | null): React.CSSProperties {
  const vw = typeof window === 'undefined' ? TOOLTIP_MAX_WIDTH + GUTTER * 2 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const width = Math.min(TOOLTIP_MAX_WIDTH, vw - GUTTER * 2);

  if (!rect) {
    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${width}px`,
      maxHeight: `${vh - GUTTER * 2}px`,
    };
  }

  let left = rect.left + rect.width / 2 - width / 2;
  let top = rect.bottom + 20;

  if (left + width > vw - GUTTER) left = vw - width - GUTTER;
  if (left < GUTTER) left = GUTTER;
  if (top + TOOLTIP_EST_HEIGHT > vh) top = rect.top - 20 - TOOLTIP_EST_HEIGHT;
  // Never above the top gutter either, which short landscape viewports hit.
  if (top < GUTTER) top = GUTTER;

  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${vh - top - GUTTER}px`,
  };
}

export function OnboardingTour({ isOpen, onClose, onAction }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>(() =>
    getTooltipPosition(null)
  );
  const maskId = useId();

  const handleClose = useCallback(() => {
    void onClose();
  }, [onClose]);

  /* The tour is a dialog over a spotlit page, so it takes the same guarantees
     as every other overlay: Escape through the shared stack, a focus trap,
     focus returned on close, and the page behind it locked. */
  useOverlayBehaviour(isOpen, handleClose, panelRef);

  /* Advancing a step replaces the content under the dialog, including whatever
     was focused — the Next button that was just pressed. Without this, focus
     lands on <body> until the next Tab pulls it back. Put it on the new step's
     first control instead, so the keyboard carries on where it was. */
  useEffect(() => {
    if (!isOpen) return;
    const node = panelRef.current;
    if (!node) return;
    /* The outgoing step animates away before the new one mounts, so this polls
       briefly rather than guessing a delay: focusing during the exit would
       land on content that is about to be removed, and focus would fall out
       again. */
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      /* Wait for THIS step's panel. While the previous one animates out it is
         still in the tree, and focusing its buttons just loses focus again a
         moment later when it unmounts. */
      const incoming = node.querySelector<HTMLElement>(`[data-step="${currentStep}"]`);
      if (incoming) {
        if (incoming.contains(document.activeElement)) { window.clearInterval(id); return; }
        const first = incoming.querySelector<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        (first ?? node).focus();
        window.clearInterval(id);
        return;
      }
      if (tries > 25) { node.focus(); window.clearInterval(id); }
    }, 40);
    return () => window.clearInterval(id);
  }, [isOpen, currentStep]);

  useLayoutEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const updatePositions = () => {
      const step = tourSteps[currentStep];
      const target = document.querySelector(step.targetSelector);

      if (target) {
        const rect = target.getBoundingClientRect();
        const padding = 8;
        setSpotlightRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
        setTooltipStyle(getTooltipPosition(rect));
      } else {
        setSpotlightRect(null);
        setTooltipStyle(getTooltipPosition(null));
      }
    };

    updatePositions();
    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      /* Escape belongs to the shared overlay behaviour, which only reacts while
         this is the frontmost layer. */
      if (e.key === 'ArrowRight' && currentStep < tourSteps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep((s) => s - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrimaryAction = () => {
    const step = tourSteps[currentStep];
    handleClose();
    onAction(step.id);
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-9999"
      >
        <div className="absolute inset-0 bg-[rgba(25,28,27,1)]/70" onClick={handleClose} aria-hidden />

        {spotlightRect && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlightRect.left}
                  y={spotlightRect.top}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.75)"
              mask={`url(#${maskId})`}
            />
          </svg>
        )}

        {spotlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute pointer-events-none rounded-lg"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              boxShadow: '0 0 0 4px rgba(14, 89, 85, 0.45), 0 0 24px 8px rgba(14, 89, 85, 0.22)',
            }}
            aria-hidden
          />
        )}

        {/* The dialog node is stable across steps. It used to be keyed by
            currentStep, so Next and Back remounted the very element the focus
            trap had captured, leaving the trap pointing at a detached node.
            Only the step's contents animate now. */}
        <div
          ref={panelRef}
          style={tooltipStyle}
          className="z-10 flex flex-col focus:outline-none"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby="onboarding-title"
          aria-describedby="onboarding-body"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              data-step={currentStep}
              className="flex min-h-0 flex-col bg-surface rounded-lg shadow-e3 overflow-hidden"
            >
              <div className="px-6 pt-5 pb-4 border-b border-hairline">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {tourSteps.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        aria-label={`Go to step ${index + 1}`}
                        aria-current={index === currentStep ? 'step' : undefined}
                      >
                        {/* The dot is the picture; the button around it is the
                            target. A 2px control is not something anyone can hit. */}
                        <span
                          aria-hidden
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentStep
                              ? 'w-5 bg-accent'
                              : index < currentStep
                                ? 'w-2 bg-accent-soft'
                                : 'w-2 bg-surface-2'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-ink-3">
                    {currentStep + 1} / {tourSteps.length}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${step.iconBg} rounded-md flex items-center justify-center shrink-0 shadow-lg`}
                  >
                    <StepIcon className="w-6 h-6 text-white" aria-hidden />
                  </div>
                  <h3 id="onboarding-title" className="text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                </div>
              </div>
              <div id="onboarding-body" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <p className="text-sm text-ink-2 leading-relaxed">{step.body}</p>
                {step.hint && (
                  <p className="mt-3 text-xs text-ink-3 italic flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-surface-2" />
                    {step.hint}
                  </p>
                )}
              </div>
              <div className="px-6 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {currentStep > 0 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
                      Back
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="text-ink-3"
                    >
                      Skip tour
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentStep < tourSteps.length - 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrimaryAction}
                      >
                        {step.buttonText}
                      </Button>
                      <Button type="button" variant="primary" size="sm" onClick={handleNext}>
                        Next
                        <ChevronRight className="w-4 h-4 -mr-1" aria-hidden />
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="primary" size="sm" onClick={handleClose}>
                      Finish Tour
                      <ChevronRight className="w-4 h-4 -mr-1" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          {spotlightRect && (
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface rotate-45 shadow-lg"
              style={{ boxShadow: '-2px -2px 4px rgba(0,0,0,0.05)' }}
              aria-hidden
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

interface UseOnboardingTourOptions {
  /** Delay showing until content (e.g. dashboard targets) is ready */
  ready?: boolean;
  hasCompletedOnboarding?: boolean;
}

/**
 * Shows onboarding tour only when the authenticated user has not completed onboarding.
 * Use on the dashboard page. Set ready=true once targets (data-tour) are in the DOM.
 */
export function useOnboardingTour(options: UseOnboardingTourOptions = {}) {
  const { ready = true, hasCompletedOnboarding } = options;
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !ready) return;
    if (hasCompletedOnboarding !== false) return;
    const timer = setTimeout(() => setShowTour(true), 400);
    return () => clearTimeout(timer);
  }, [ready, hasCompletedOnboarding]);

  const closeTour = useCallback(() => setShowTour(false), []);

  return { showTour, closeTour };
}
