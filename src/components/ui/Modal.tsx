'use client';

import { useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlayBehaviour } from '@/lib/useOverlayBehaviour';

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
