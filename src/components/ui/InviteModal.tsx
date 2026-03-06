'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, User, Send, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { invitesApi } from '@/features/invites/invites.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-utils';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [animate, setAnimate] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation
      requestAnimationFrame(() => setAnimate(true));
      // Focus email input after animation
      setTimeout(() => emailRef.current?.focus(), 200);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      toast.error('Enter valid email address');
      return;
    }

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
    setAnimate(false);
    setTimeout(onClose, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md transition-all duration-300 ${
          animate
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/60 overflow-hidden">
          {/* Premium Header */}
          <div className="bg-linear-to-br from-indigo-600 via-indigo-500 to-violet-500 px-6 py-6 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-700/30">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Invite Partner</h2>
                  <p className="text-indigo-200 text-sm mt-0.5">Send a collaboration invite</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-200 hover:text-white hover:bg-white/15 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl mb-6">
              <div className="w-8 h-8 bg-linear-to-br from-amber-400 to-orange-400 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                If they already have an account, they&apos;ll receive a connection request and can <span className="font-medium text-slate-800">accept or reject</span> it. If not, they&apos;ll get an email invite and must sign up and confirm before you&apos;re connected.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                ref={emailRef}
                label="Email Address"
                icon={Mail}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={sending}
                  className="flex-1"
                >
                  <span>Send Invite</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
