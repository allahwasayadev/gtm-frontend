'use client';

import { useEffect, useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getFocusable } from '@/lib/focus';
import { pushOverlay, popOverlay, isTopOverlay } from '@/lib/overlay-stack';

/**
 * Shared overlay behaviour for every dialog and sheet in the app.
 *
 * Escape closes, a click on the scrim closes, the page behind cannot scroll,
 * Tab is trapped inside the dialog, focus starts on the control marked
 * `data-autofocus` (or the first genuinely focusable one), and on close it
 * returns to whatever had focus before the dialog opened.
 *
 * The opening lifecycle runs on `isOpen` alone. Call sites pass inline arrow
 * functions for `onClose`, so a dependency on the handler's identity would
 * re-run this on every keystroke: the effect would restore focus to the
 * trigger, relock the body and move focus back to the first control, which
 * drags the caret out of whatever field is being typed into. The handler is
 * read through a ref instead, so a new closure each render changes nothing.
 */
function useOverlayBehaviour(
  isOpen: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLDivElement | null>
) {
  const onCloseRef = useRef(onClose);
  const restoreTo = useRef<HTMLElement | null>(null);

  // Written in an effect, never during render.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    // The dialog is a layer too: a dropdown opened inside it sits above, and
    // Escape must reach that one first.
    const layer = pushOverlay();

    const node = panelRef.current;
    const candidates = getFocusable(node);
    const preferred = node?.querySelector<HTMLElement>('[data-autofocus]');
    const initial =
      preferred && candidates.includes(preferred) ? preferred : candidates[0];
    // A dialog can legitimately have nothing enabled in it — every action
    // disabled while a request is in flight, for instance. Focus the panel so
    // Escape still works and the trap has something to hold.
    (initial ?? node)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isTopOverlay(layer)) return; // something is open on top of us
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !node) return;

      const items = getFocusable(node);
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (active instanceof Node && !node.contains(active)) {
        // Focus escaped the dialog some other way; pull it back.
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
      popOverlay(layer);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      // Only ever on a real close or unmount, because this effect does not
      // re-run while the dialog stays open.
      const target = restoreTo.current;
      if (target && typeof target.focus === 'function' && target.isConnected) {
        target.focus();
      }
    };
  }, [isOpen, panelRef]);
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

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  const isSheet = variant === 'sheet';

  // A sheet is deliberately edge to edge at the bottom of a phone; a dialog
  // keeps a gutter at every width so it never touches the viewport edges.
  const outerPadding = isSheet ? 'p-0 sm:p-4' : 'p-4';
  const maxHeight = isSheet
    ? 'max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]'
    : 'max-h-[calc(100dvh-2rem)]';

  return createPortal(
    <div
      className={`fixed inset-0 z-60 flex justify-center overflow-hidden ${
        isSheet ? 'items-end sm:items-center' : 'items-center'
      } ${outerPadding}`}
    >
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
        tabIndex={-1}
        className={`${isSheet ? 'ovrlap-sheet' : 'ovrlap-rise'} relative flex w-full ${widths[size]} ${maxHeight} flex-col overflow-hidden bg-surface shadow-e3 border border-hairline focus:outline-none ${
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
