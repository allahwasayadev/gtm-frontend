'use client';

import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  intent?: 'default' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmation dialog.
 *
 * Cancel comes first and holds initial focus, so the destructive action is
 * never the thing a stray Enter lands on. The props and the two outcomes are
 * unchanged; only the composition and the focus handling are Harbour's.
 */
export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  intent = 'default',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            data-autofocus
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={intent === 'danger' ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
