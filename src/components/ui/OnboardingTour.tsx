'use client';

import { useState, useEffect, useCallback, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CloudUpload, BarChart3, Mail, ChevronRight } from 'lucide-react';
import { Button } from './Button';

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
    iconBg: 'bg-indigo-500',
    title: 'Upload Your List',
    body: 'Upload your account list once to start mapping. Overlap automatically re-maps as connections update, so your overlaps stay current.',
    buttonText: 'Upload List',
  },
  {
    id: 'overlaps',
    targetSelector: '[data-tour="view-matches"]',
    icon: BarChart3,
    iconBg: 'bg-emerald-500',
    title: 'See Your Shared Overlaps',
    body: "Once your list is uploaded, you'll see shared accounts between you and each connection. Overlaps update automatically as your network grows.",
    buttonText: 'View Overlaps',
  },
  {
    id: 'invite',
    targetSelector: '[data-tour="invite-partner"]',
    icon: Mail,
    iconBg: 'bg-violet-500',
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

const TOOLTIP_WIDTH = 360;
const TOOLTIP_EST_HEIGHT = 300;

function getTooltipPosition(rect: DOMRect | null): React.CSSProperties {
  if (!rect) {
    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${TOOLTIP_WIDTH}px`,
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  let top = rect.bottom + 20;

  if (left < 16) left = 16;
  if (left + TOOLTIP_WIDTH > vw - 16) left = vw - TOOLTIP_WIDTH - 16;
  if (top + TOOLTIP_EST_HEIGHT > vh) top = rect.top - 20 - TOOLTIP_EST_HEIGHT;

  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${left}px`,
    width: `${TOOLTIP_WIDTH}px`,
  };
}

export function OnboardingTour({ isOpen, onClose, onAction }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>(() =>
    getTooltipPosition(null)
  );
  const maskId = useId();

  const handleClose = useCallback(() => {
    void onClose();
  }, [onClose]);

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
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'ArrowRight' && currentStep < tourSteps.length - 1) {
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
        <div className="absolute inset-0 bg-slate-950/70" onClick={handleClose} aria-hidden />

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
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute pointer-events-none rounded-2xl"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.4), 0 0 24px 8px rgba(99, 102, 241, 0.2)',
            }}
            aria-hidden
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={tooltipStyle}
            className="z-10"
            role="dialog"
            aria-labelledby="onboarding-title"
            aria-describedby="onboarding-body"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {tourSteps.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? 'w-6 bg-indigo-500'
                            : index < currentStep
                              ? 'bg-indigo-300'
                              : 'bg-slate-200'
                        }`}
                        aria-label={`Go to step ${index + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {currentStep + 1} / {tourSteps.length}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${step.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}
                  >
                    <StepIcon className="w-6 h-6 text-white" aria-hidden />
                  </div>
                  <h3 id="onboarding-title" className="text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                </div>
              </div>
              <div id="onboarding-body" className="px-6 py-5">
                <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                {step.hint && (
                  <p className="mt-3 text-xs text-slate-400 italic flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
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
                      className="text-slate-400"
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
            </div>
            {spotlightRect && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-lg"
                style={{ boxShadow: '-2px -2px 4px rgba(0,0,0,0.05)' }}
                aria-hidden
              />
            )}
          </motion.div>
        </AnimatePresence>
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
