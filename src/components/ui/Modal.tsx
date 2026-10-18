'use client';

import { useEffect, useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Shared overlay behaviour for every dialog and sheet in the app.
 *
 * Escape closes, a click on the scrim closes, the page behind cannot scroll,
 * Tab is trapped inside the dialog, focus starts on the first control marked
 * `data-autofocus` (or the first focusable element), and on close it returns
 * to whatever had focus before the dialog opened.
 *
 * Positioning is fixed to the viewport and the body scrolls inside itself, so
 * a dialog opened at the bottom of a long page is still on screen.
 */
function useOverlayBehaviour(isOpen: boolean, onClose: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const initial =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(FOCUSABLE);
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Lock the page behind the dialog without letting the layout jump as the
    // scrollbar disappears.
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      restoreTo.current?.focus?.();
    };
  }, [isOpen, onClose, ref]);
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Hide the title visually but keep it for assistive technology. */
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Bottom sheet on small screens, centred dialog from `sm` upwards. */
  variant?: 'dialog' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  hideTitle = false,
  description,
  children,
  footer,
  variant = 'dialog',
  size = 'md',
  showClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehaviour(isOpen, onClose, panelRef);

  if (!isOpen || typeof document === 'undefined') return null;

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };
  const isSheet = variant === 'sheet';

  return createPortal(
    <div className={`fixed inset-0 z-60 flex justify-center overflow-hidden ${isSheet ? 'items-end sm:items-center' : 'items-center'} p-0 sm:p-4`}>
      <div
        className="ovrlap-scrim absolute inset-0 bg-[rgba(25,28,27,0.45)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${isSheet ? 'ovrlap-sheet' : 'ovrlap-rise'} relative flex w-full ${widths[size]} max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-surface shadow-e3 border border-hairline ${
          isSheet ? 'rounded-t-[20px] sm:rounded-lg' : 'rounded-lg'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className={hideTitle ? 'sr-only' : 'text-[17px] font-bold text-ink'}>
              {title}
            </h2>
            {description && (
              <div className="mt-2 text-[15px] text-ink-2 leading-relaxed">{description}</div>
            )}
          </div>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pb-5">
            {children}
          </div>
        )}

        {footer && (
          <div className="shrink-0 border-t border-hairline bg-sunken px-5 sm:px-6 py-4 flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
