'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, MoreVertical, UserMinus } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui';
import { getFocusable } from '@/lib/focus';
import type { Connection } from '@/features/connections/types';

interface ConnectionControlMenuProps {
  connection: Connection;
  onMute: (connectionId: string) => Promise<void>;
  onUnmute: (connectionId: string) => Promise<void>;
  onRemove: (connectionId: string) => Promise<void>;
  align?: 'left' | 'right';
  variant?: 'default' | 'light';
  /* Mute and unmute move the row between two different lists, so this instance
     is unmounted and another is mounted for the same connection. The page that
     owns the list decides which connection should hold focus after the refresh
     and tells its replacement through these; nothing is stored outside React,
     so nothing can survive a route change and steal focus later. */
  restoreFocus?: boolean;
  onFocusRestored?: () => void;
}

const MENU_WIDTH = 208;
const VIEWPORT_PADDING = 8;
const TRIGGER_GAP = 8;
// Only used for the very first paint, before the menu can be measured.
const ESTIMATED_MENU_HEIGHT = 96;

export function ConnectionControlMenu({
  connection,
  onMute,
  onUnmute,
  onRemove,
  align = 'right',
  variant = 'default',
  restoreFocus = false,
  onFocusRestored,
}: ConnectionControlMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isMuting, setIsMuting] = useState(false);
  const [isUnmuting, setIsUnmuting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // menuPosition is a fresh object on every reposition, so depending on it
  // re-focused the first item on every scroll and resize. This is the stable
  // signal instead: it changes once when the portal mounts and once when it goes.
  const [menuNode, setMenuNode] = useState<HTMLDivElement | null>(null);

  const attachDropdown = useCallback((node: HTMLDivElement | null) => {
    dropdownRef.current = node;
    setMenuNode(node);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const triggerRect = buttonRef.current.getBoundingClientRect();
    const rawLeft = align === 'left' ? triggerRect.left : triggerRect.right - MENU_WIDTH;
    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(rawLeft, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING),
    );

    // Dropping the menu below the trigger unconditionally put Mute and Remove
    // under the fold for any row near the bottom of a short window. Flip it
    // above when there is room there, and clamp to the viewport when neither
    // side fits.
    const menuHeight = dropdownRef.current?.offsetHeight || ESTIMATED_MENU_HEIGHT;
    const below = triggerRect.bottom + TRIGGER_GAP;
    const above = triggerRect.top - TRIGGER_GAP - menuHeight;
    const fitsBelow = below + menuHeight <= window.innerHeight - VIEWPORT_PADDING;
    const fitsAbove = above >= VIEWPORT_PADDING;

    let top: number;
    if (fitsBelow) {
      top = below;
    } else if (fitsAbove) {
      top = above;
    } else {
      top = Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - menuHeight - VIEWPORT_PADDING,
      );
    }

    setMenuPosition((previous) =>
      previous && previous.top === top && previous.left === left
        ? previous
        : { top, left },
    );
  }, [align]);

  const menuItems = useCallback(
    () => getFocusable(dropdownRef.current),
    [],
  );

  const closeMenu = useCallback((returnFocus = true) => {
    setIsMenuOpen(false);
    // On a page that relocates the row this node has already been replaced;
    // focusing a detached element does nothing useful, and the page's own
    // nomination focuses the replacement instead.
    if (returnFocus && buttonRef.current?.isConnected) {
      buttonRef.current.focus();
    }
  }, []);

  // Re-measure with the menu's real height the moment it is in the DOM.
  useLayoutEffect(() => {
    if (!menuNode) return;
    updateMenuPosition();
  }, [menuNode, updateMenuPosition]);

  // Once per open, never again on reposition.
  useEffect(() => {
    if (!menuNode) return;
    menuItems()[0]?.focus();
  }, [menuNode, menuItems]);

  // Keep the callback in a ref so claiming focus does not depend on the
  // parent passing a stable function identity.
  const onFocusRestoredRef = useRef(onFocusRestored);
  useEffect(() => {
    onFocusRestoredRef.current = onFocusRestored;
  }, [onFocusRestored]);

  // The page has refreshed its list and nominated this connection, so this is
  // the instance that replaced the one the action started on.
  useLayoutEffect(() => {
    if (!restoreFocus) return;
    buttonRef.current?.focus();
    onFocusRestoredRef.current?.();
  }, [restoreFocus]);

  useEffect(() => {
    if (!isMenuOpen) return;

    updateMenuPosition();

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeMenu();
      }
    };

    const handleWindowChange = () => updateMenuPosition();

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isMenuOpen, updateMenuPosition, closeMenu]);

  // Arrow/Home/End walk the items; Tab leaves the menu the way a menu should.
  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems();
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[(current + 1 + items.length) % items.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Tab':
        // Let focus move on naturally, but do not leave the menu hanging open.
        closeMenu(false);
        break;
      default:
        break;
    }
  };

  const handleMute = async () => {
    setIsMuting(true);
    try {
      await onMute(connection.id);
      setIsMuteModalOpen(false);
    } catch {
      // The parent already showed the error and rethrew. Swallowing it here
      // stops an unhandled rejection and leaves the modal up to retry from.
    } finally {
      setIsMuting(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(connection.id);
      setIsRemoveModalOpen(false);
    } catch {
      // Already reported by the parent; keep the modal open for a retry.
    } finally {
      setIsRemoving(false);
    }
  };

  const handleUnmute = async () => {
    setIsUnmuting(true);
    try {
      await onUnmute(connection.id);
      // Matches keeps this trigger mounted, so focus returns to it here. On
      // Connections the row has moved and the guard above makes this a no-op.
      closeMenu();
    } catch {
      // Already reported by the parent; leave the menu open for a retry.
    } finally {
      setIsUnmuting(false);
    }
  };

  // Name the partner in the confirmations so it is clear which connection is
  // being muted or ended. otherUser is already the counterpart resolved for the
  // signed-in user, so the orientation is correct; fall back to company then
  // email, and only to a generic phrase if a row somehow carries no identity.
  const partnerName =
    connection.otherUser.name?.trim() ||
    connection.otherUser.company?.trim() ||
    connection.otherUser.email ||
    'this partner';

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`w-11 h-11 rounded-sm flex items-center justify-center transition-colors ${
            variant === 'light'
              ? 'text-white hover:text-white hover:bg-surface/20'
              : 'text-ink-3 hover:text-ink-2 hover:bg-surface-2'
          }`}
          aria-label="Connection actions"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {isMenuOpen && menuPosition && createPortal(
        <div
          ref={attachDropdown}
          role="menu"
          aria-label="Connection actions"
          onKeyDown={handleMenuKeyDown}
          className="fixed z-50 w-52 max-h-[calc(100dvh-16px)] overflow-y-auto rounded-md border border-hairline bg-surface shadow-lg ring-1 ring-hairline p-1.5"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {connection.isMuted ? (
            <button
              type="button"
              role="menuitem"
              onClick={handleUnmute}
              disabled={isUnmuting}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <Bell className="w-4 h-4 text-ink-3 shrink-0" />
              Unmute Connection
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                // Focus goes back to the trigger first, so the confirmation
                // records it and Cancel returns to Connection actions.
                closeMenu();
                setIsMuteModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <BellOff className="w-4 h-4 text-ink-3 shrink-0" />
              Mute Connection
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              setIsRemoveModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft rounded-lg transition-colors"
          >
            <UserMinus className="w-4 h-4 text-danger shrink-0" />
            Remove Connection
          </button>
        </div>,
        document.body,
      )}

      <ConfirmationModal
        isOpen={isMuteModalOpen}
        title={`Mute ${partnerName}?`}
        description={`Muting ${partnerName} hides this connection from your main account view and suppresses notifications. Re-mapping continues in the background. If new shared accounts are detected, this connection will automatically reappear.`}
        confirmLabel="Mute"
        cancelLabel="Cancel"
        isLoading={isMuting}
        onConfirm={handleMute}
        onClose={() => {
          if (!isMuting) {
            setIsMuteModalOpen(false);
          }
        }}
      />

      <ConfirmationModal
        isOpen={isRemoveModalOpen}
        title={`End your connection with ${partnerName}?`}
        description={`Ending this connection will stop shared overlap visibility between you and ${partnerName}. You can reconnect at any time through a new invite.`}
        confirmLabel="End Connection"
        cancelLabel="Cancel"
        intent="danger"
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onClose={() => {
          if (!isRemoving) {
            setIsRemoveModalOpen(false);
          }
        }}
      />
    </>
  );
}
