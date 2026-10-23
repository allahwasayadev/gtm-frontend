'use client';

import { useId, useState } from 'react';
import { Mail, User, Info } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { invitesApi } from '@/features/invites/invites.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-utils';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Invite a partner.
 *
 * The dialog shell is the shared Modal, so this gets the behaviour that was
 * previously missing here: a real `role="dialog"`, scroll lock, Escape from any
 * field, a focus trap, focus returned to the trigger, viewport-bounded internal
 * scrolling and a labelled 44px close control.
 *
 * The form state, validation, API call, toasts and `onSuccess` are unchanged.
 */
export function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const formId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      // Shown on the field as well as in a toast: a toast alone leaves nothing
      // beside the input that caused it.
      setEmailError('Enter valid email address');
      toast.error('Enter valid email address');
      return;
    }
    setEmailError('');

    setSending(true);
    try {
      const res = await invitesApi.send({
        email: email.trim(),
        ...(name.trim() && { name: name.trim() }),
      });
      const data = res.data;

      if (data.alreadyUser && data.alreadyConnected) {
        toast.success('You are already connected with this user!');
      } else if (data.alreadyUser) {
        toast.success(data.message);
      } else {
        toast.success(data.message);
      }

      setEmail('');
      setName('');
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send invite.'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmailError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Partner"
      description="Send a collaboration invite."
      showClose
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" size="sm" isLoading={sending}>
            Send Invite
          </Button>
        </>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-md border border-hairline bg-sunken p-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-soft">
          <Info className="h-4 w-4 text-accent-ink" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-ink-2">
          If they already have an account, they&apos;ll receive a connection request and can{' '}
          <span className="font-bold text-ink">accept or reject</span> it. If not, they&apos;ll get
          an email invite and must sign up and confirm before you&apos;re connected.
        </p>
      </div>

      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Input
          data-autofocus
          label="Email Address"
          icon={Mail}
          type="email"
          required
          value={email}
          error={emailError || undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          placeholder="partner@company.com"
          autoComplete="email"
        />

        <Input
          label="Name"
          icon={User}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Their name (optional)"
          helperText="Personalizes the invite email"
        />
      </form>
    </Modal>
  );
}
