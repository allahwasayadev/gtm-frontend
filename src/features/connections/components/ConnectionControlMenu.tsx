'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, MoreVertical, UserMinus } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui';
import type { Connection } from '@/features/connections/types';

interface ConnectionControlMenuProps {
  connection: Connection;
  onMute: (connectionId: string) => Promise<void>;
  onUnmute: (connectionId: string) => Promise<void>;
  onRemove: (connectionId: string) => Promise<void>;
  align?: 'left' | 'right';
  variant?: 'default' | 'light';
}

const MENU_WIDTH = 208;
const VIEWPORT_PADDING = 8;

export function ConnectionControlMenu({
  connection,
  onMute,
  onUnmute,
  onRemove,
  align = 'right',
  variant = 'default',
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

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const triggerRect = buttonRef.current.getBoundingClientRect();
    const rawLeft = align === 'left' ? triggerRect.left : triggerRect.right - MENU_WIDTH;
    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(rawLeft, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING),
    );

    setMenuPosition({
      top: triggerRect.bottom + 8,
      left,
    });
  }, [align]);

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
      if (event.key === 'Escape') setIsMenuOpen(false);
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
  }, [isMenuOpen, updateMenuPosition]);

  const handleMute = async () => {
    setIsMuting(true);
    try {
      await onMute(connection.id);
      setIsMuteModalOpen(false);
    } finally {
      setIsMuting(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(connection.id);
      setIsRemoveModalOpen(false);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleUnmute = async () => {
    setIsUnmuting(true);
    try {
      await onUnmute(connection.id);
      setIsMenuOpen(false);
    } finally {
      setIsUnmuting(false);
    }
  };

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            variant === 'light'
              ? 'text-white hover:text-white hover:bg-white/20'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
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
          ref={dropdownRef}
          role="menu"
          className="fixed z-50 w-52 rounded-xl border border-slate-200/70 bg-white shadow-lg ring-1 ring-slate-200/40 p-1.5"
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
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60"
            >
              <Bell className="w-4 h-4 text-slate-500 shrink-0" />
              Unmute Connection
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                setIsMuteModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <BellOff className="w-4 h-4 text-slate-500 shrink-0" />
              Mute Connection
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              setIsRemoveModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <UserMinus className="w-4 h-4 text-red-600 shrink-0" />
            Remove Connection
          </button>
        </div>,
        document.body,
      )}

      <ConfirmationModal
        isOpen={isMuteModalOpen}
        title="Mute This Connection?"
        description="Muting hides this connection from your main account view and suppresses notifications. Re-mapping continues in the background. If new shared accounts are detected, this connection will automatically reappear."
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
        title="End This Connection?"
        description="Ending this connection will stop shared overlap visibility between you and this user. You can reconnect at any time through a new invite."
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
