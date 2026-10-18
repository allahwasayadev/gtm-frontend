'use client';

import { useEffect, useRef } from 'react';
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
export function useOverlayBehaviour(
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
