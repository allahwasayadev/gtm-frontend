'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { connectionsApi } from '@/features/connections/connections.api';
import { invitesApi } from '@/features/invites/invites.api';
import type { Connection } from '@/features/connections/types';
import type { Invite } from '@/features/invites/types';
import { ConnectionControlMenu } from '@/features/connections/components/ConnectionControlMenu';
import {
  Button, Badge, EmptyState, PageHeader, InviteModal, ConfirmationModal,
  Skeleton, PageTransition, FadeIn, ButtonLink } from '@/components/ui';
import { Users, Clock, Mail, ArrowLeftRight, Bell, CheckCircle2, Send, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getUserInitials } from '@/lib/user-initials';
import toast from 'react-hot-toast';
import Link from 'next/link';

type ConnectionsTab = 'active' | 'pending' | 'sent';

/* ---- small pieces used only by the phone layout ---------------------- */

function MobileGroup({
  label,
  note,
  action,
  children,
}: {
  label: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-hairline bg-surface shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-3">{label}</h2>
          {note && <p className="mt-0.5 text-xs leading-snug text-ink-3">{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MobileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger bg-danger-soft/70 px-5 py-6 text-center"
    >
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-danger-soft text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h3 className="text-[15px] font-bold text-ink">
        We couldn&apos;t load your connections
      </h3>
      <p className="mx-auto mt-1 max-w-[17rem] text-[13px] leading-snug text-ink-2">
        Something went wrong on our side. Your partners and requests are safe &mdash; try again
        in a moment.
      </p>
      <Button variant="primary" className="mt-3.5 w-full" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

function MobileEmpty({
  tone,
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  footnote,
}: {
  tone: 'violet' | 'amber' | 'sky';
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  footnote?: string;
}) {
  const tones = {
    violet: 'bg-accent text-accent',
    amber: 'bg-warn-soft text-warn',
    sky: 'bg-accent text-accent',
  } as const;
  return (
    <div className="rounded-md border border-hairline bg-surface px-5 py-6 text-center shadow-card">
      <span className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-[16rem] text-[13px] leading-snug text-ink-3">{body}</p>
      {actionLabel && onAction && (
        <Button variant="primary" className="mt-3.5 w-full" onClick={onAction}>
          <Mail className="mr-1.5 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
      {footnote && <p className="mt-2.5 text-xs text-ink-3">{footnote}</p>}
    </div>
  );
}

function MobilePartnerRow({
  connection,
  muted,
  onMute,
  onUnmute,
  onRemove,
}: {
  connection: Connection;
  muted?: boolean;
  onMute: (id: string) => Promise<void>;
  onUnmute: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const sharedMatchCount = connection.sharedMatchCount ?? 0;
  const role = connection.otherUser.roles?.[0];
  return (
    <div className="flex items-center gap-2.5 border-b border-hairline px-3 py-2.5 last:border-b-0">
      <Link
        href={`/dashboard/matches?connection=${connection.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[13px] font-bold ${
          muted ? 'bg-surface-2 text-ink-3' : 'bg-accent-soft text-accent-ink'
        }`}>
          {getUserInitials(connection.otherUser.name, 2)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="min-w-0 truncate text-[13.5px] font-bold leading-tight text-ink">
              {connection.otherUser.name}
            </span>
            {muted && <Badge variant="warning" size="sm">Muted</Badge>}
          </span>
          <span className="block truncate text-xs text-ink-3">
            {connection.otherUser.company || connection.otherUser.email}
            {role ? ` · ${role}` : ''}
          </span>
        </span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${
          sharedMatchCount > 0
            ? 'border-ok bg-ok-soft text-ok'
            : 'border-hairline bg-sunken text-ink-3'
        }`}>
          {sharedMatchCount} {sharedMatchCount === 1 ? 'match' : 'matches'}
        </span>
      </Link>
      <ConnectionControlMenu
        connection={connection}
        onMute={onMute}
        onUnmute={onUnmute}
        onRemove={onRemove}
      />
    </div>
  );
}


const TAB_VALUES: ConnectionsTab[] = ['active', 'pending', 'sent'];

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPageInner />
    </Suspense>
  );
}

function ConnectionsPageInner() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    connectionId: string;
    connectionName: string;
    action: 'decline' | 'remove' | 'cancel';
  }>({ isOpen: false, connectionId: '', connectionName: '', action: 'remove' });
  // null until the first load settles, so the default lands on real counts
  // rather than flipping tab under the user a moment later.
  const [tab, setTab] = useState<ConnectionsTab | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [connectionsRes, invitesRes] = await Promise.all([
        connectionsApi.getAll({ includeMuted: true }),
        invitesApi.getAll(),
      ]);
      setConnections(connectionsRes.data);
      setInvites(invitesRes.data);
      setLoadFailed(false);
    } catch {
      // Leaving the lists empty here would render the "no partners yet" state,
      // which reads as real data. Flag the failure instead.
      setLoadFailed(true);
      toast.error('We couldn\u2019t load your connections. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAcceptConnection = async (id: string) => {
    try {
      await connectionsApi.accept(id);
      toast.success('Connection accepted!');
      void loadData();
    } catch {
      toast.error('Failed to accept connection');
    }
  };

  const handleDeleteConnection = (id: string, name: string, action: 'decline' | 'remove' | 'cancel') => {
    setConfirmModal({
      isOpen: true,
      connectionId: id,
      connectionName: name,
      action,
    });
  };

  const handleConfirmDelete = async () => {
    const { connectionId, action } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      await connectionsApi.delete(connectionId);
      const messages = {
        decline: 'Connection declined',
        remove: 'Connection removed',
        cancel: 'Request cancelled',
      };
      toast.success(messages[action]);
      void loadData();
    } catch {
      toast.error('Failed to complete action');
    }
  };

  const handleMuteConnection = async (id: string) => {
    try {
      await connectionsApi.mute(id);
      toast.success('Connection muted');
      await loadData();
    } catch (error) {
      toast.error('Failed to mute connection');
      throw error;
    }
  };

  const handleUnmuteConnection = async (id: string) => {
    try {
      await connectionsApi.unmute(id);
      toast.success('Connection unmuted');
      await loadData();
    } catch (error) {
      toast.error('Failed to unmute connection');
      throw error;
    }
  };

  const handleRemoveConnection = async (id: string) => {
    try {
      await connectionsApi.delete(id);
      toast.success('Connection removed');
      await loadData();
    } catch (error) {
      toast.error('Failed to remove connection');
      throw error;
    }
  };

  const urlTab = searchParams.get('tab');

  const pendingReceived = connections.filter(c => c.status === 'pending' && !c.isSender);
  const pendingSent = connections.filter(c => c.status === 'pending' && c.isSender);
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const activeAccepted = acceptedConnections.filter((c) => !c.isMuted);
  const mutedAccepted = acceptedConnections.filter((c) => c.isMuted);
  const sentCount = pendingSent.length + invites.length;

  // Predictable rule, applied once per load and then left alone:
  //   ?tab= wins, else the Pending tab when something is waiting on you,
  //   else Active. Switching tabs rewrites the query string so a reload or a
  //   back press lands on the same tab.
  useEffect(() => {
    if (loading || tab !== null) return;
    const fromUrl = TAB_VALUES.find((t) => t === urlTab);
    setTab(fromUrl ?? (pendingReceived.length > 0 ? 'pending' : 'active'));
  }, [loading, tab, urlTab, pendingReceived.length]);

  const selectTab = useCallback((next: ConnectionsTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const activeTab: ConnectionsTab = tab ?? 'active';

  return (
    <>
      <main className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 md:py-8">
        <div className="hidden md:block">
        <PageHeader
          title="Connections"
          description="Manage your network and collaboration partners"
          backHref="/dashboard"
          actions={
            <Button
              onClick={() => setShowInviteModal(true)}
              variant="primary"
              size="sm"
            >
              <Mail className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Invite Partner</span>
            </Button>
          }
        />
        </div>

        {/* ------------------------------------------------------------------
            Phones: one segmented list instead of four stacked cards. Every
            group, count and action from the wide layout below is present.
           ------------------------------------------------------------------ */}
        <PageTransition className="md:hidden">
          <h1 className="text-xl leading-tight font-bold text-ink tracking-tight">
            Connections
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-ink-2 max-[359px]:hidden">
            Partners you share account lists with. Ovrlap compares your lists and shows the overlap.
          </p>

          {/* The tablist sits directly under the introduction and never moves.
              The "requests waiting" notice lives inside the panel below it, so
              changing tab or clearing the queue cannot shift the control. */}
          <div
            role="tablist"
            aria-label="Connection groups"
            className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1"
          >
            {TAB_VALUES.map((value) => {
              const count =
                value === 'active' ? acceptedConnections.length
                  : value === 'pending' ? pendingReceived.length
                    : sentCount;
              const label = value.charAt(0).toUpperCase() + value.slice(1);
              const selected = activeTab === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectTab(value)}
                  className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold transition-colors ${
                    selected ? 'bg-surface text-ink shadow-sm' : 'text-ink-2'
                  }`}
                >
                  {label}
                  <span className={`rounded-full px-1.5 text-xs leading-[1.45] ${
                    value === 'pending' && count > 0
                      ? 'bg-warn-soft text-warn'
                      : selected ? 'bg-accent-soft text-accent-ink' : 'bg-surface-2 text-ink-2'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div key={activeTab} className="mt-3 ovrlap-swap">
            {!loading && pendingReceived.length > 0 && activeTab !== 'pending' && (
              <button
                type="button"
                onClick={() => selectTab('pending')}
                className="mb-3 flex w-full items-center gap-2.5 rounded-md border border-warn bg-warn-soft px-3 py-2.5 text-left"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-warn text-[12px] font-extrabold text-white">
                  {pendingReceived.length}
                </span>
                <span className="flex-1 text-[12.5px] font-bold leading-tight text-warn">
                  {pendingReceived.length === 1
                    ? '1 request is waiting on you'
                    : `${pendingReceived.length} requests are waiting on you`}
                </span>
                <span className="text-[12px] font-bold text-warn">Review</span>
              </button>
            )}
            {loadFailed ? (
              <MobileError
                onRetry={() => {
                  setLoading(true);
                  void loadData();
                }}
              />
            ) : loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-hairline bg-surface p-3">
                    <Skeleton variant="rect" className="h-9 w-9 shrink-0 rounded-md" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-40" /></div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'active' ? (
              acceptedConnections.length === 0 ? (
                <MobileEmpty
                  tone="violet"
                  icon={Users}
                  title="No partners yet"
                  body="Invite someone you sell alongside. Once you both publish a list, Ovrlap shows where your accounts overlap."
                  actionLabel="Invite a partner"
                  onAction={() => setShowInviteModal(true)}
                  footnote="They’ll get an email with a link to join."
                />
              ) : (
                <>
                  <MobileGroup
                    label="Your partners"
                    action={
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-accent px-2.5 text-[12.5px] font-bold text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Invite
                      </button>
                    }
                  >
                    {activeAccepted.map((connection) => (
                      <MobilePartnerRow
                        key={connection.id}
                        connection={connection}
                        onMute={handleMuteConnection}
                        onUnmute={handleUnmuteConnection}
                        onRemove={handleRemoveConnection}
                      />
                    ))}
                    {activeAccepted.length === 0 && (
                      <p className="px-3 py-4 text-center text-[13px] text-ink-3">
                        All of your partners are muted.
                      </p>
                    )}
                  </MobileGroup>

                  {mutedAccepted.length > 0 && (
                    <div className="mt-3">
                      <MobileGroup
                        label={`Muted · ${mutedAccepted.length}`}
                        note="Hidden from your main account view. They auto-return if new overlaps are found."
                      >
                        {mutedAccepted.map((connection) => (
                          <MobilePartnerRow
                            key={connection.id}
                            connection={connection}
                            muted
                            onMute={handleMuteConnection}
                            onUnmute={handleUnmuteConnection}
                            onRemove={handleRemoveConnection}
                          />
                        ))}
                      </MobileGroup>
                    </div>
                  )}
                </>
              )
            ) : activeTab === 'pending' ? (
              pendingReceived.length === 0 ? (
                <MobileEmpty
                  tone="amber"
                  icon={Bell}
                  title="Nothing waiting on you"
                  body="When a partner asks to connect, their request appears here for you to accept or decline."
                />
              ) : (
                <div className="space-y-2.5">
                  {pendingReceived.map((connection) => (
                    <div key={connection.id} className="overflow-hidden rounded-md border border-hairline bg-surface shadow-card">
                      <div className="flex items-center gap-3 px-3 pt-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warn-soft text-[13px] font-bold text-warn">
                          {getUserInitials(connection.otherUser.name, 2)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-bold leading-tight text-ink">{connection.otherUser.name}</span>
                          <span className="block truncate text-xs text-ink-3">{connection.otherUser.company || connection.otherUser.email}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 px-3 pb-3 pt-2.5">
                        <Button onClick={() => handleAcceptConnection(connection.id)} variant="success" size="sm" className="min-h-11 flex-1">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDeleteConnection(connection.id, connection.otherUser.name, 'decline')}
                          variant="outline" size="sm" className="min-h-11 flex-1"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : sentCount === 0 ? (
              <MobileEmpty
                tone="sky"
                icon={Send}
                title="Nothing sent yet"
                body="Connection requests and email invites you send will be listed here until they are answered."
                actionLabel="Invite a partner"
                onAction={() => setShowInviteModal(true)}
              />
            ) : (
              <div className="space-y-3">
                {pendingSent.length > 0 && (
                  <MobileGroup
                    label={`Connection requests · ${pendingSent.length}`}
                    note="Sent to people already on Ovrlap, waiting for them to accept."
                  >
                    {pendingSent.map((connection) => (
                      <div key={connection.id} className="flex items-center gap-3 border-b border-hairline px-3 py-2.5 last:border-b-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-[13px] font-bold text-accent">
                          {getUserInitials(connection.otherUser.name, 2)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-bold leading-tight text-ink">{connection.otherUser.name}</span>
                          <span className="block truncate text-xs text-ink-3">{connection.otherUser.company || connection.otherUser.email}</span>
                        </span>
                        <Button
                          onClick={() => handleDeleteConnection(connection.id, connection.otherUser.name, 'cancel')}
                          variant="outline" size="sm" className="min-h-11 shrink-0 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </MobileGroup>
                )}

                {invites.length > 0 && (
                  <MobileGroup
                    label={`Email invites · ${invites.length}`}
                    note="Sent by email to people who do not have an Ovrlap account yet."
                  >
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center gap-3 border-b border-hairline px-3 py-2.5 last:border-b-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent">
                          <Mail className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-bold leading-tight text-ink">
                            {invite.invitedName || invite.invitedEmail}
                          </span>
                          {invite.invitedName && (
                            <span className="block truncate text-xs text-ink-3">{invite.invitedEmail}</span>
                          )}
                          <span className="mt-0.5 flex items-center gap-2">
                            <Badge
                              variant={invite.status === 'pending' ? 'info' : invite.status === 'accepted' ? 'success' : 'default'}
                              size="sm"
                            >
                              {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-ink-3">
                              {new Date(invite.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </span>
                        </span>
                        {invite.status === 'pending' && (
                          <Button
                            onClick={async () => {
                              try {
                                await invitesApi.revoke(invite.id);
                                toast.success('Invite revoked');
                                void loadData();
                              } catch {
                                toast.error('Failed to revoke invite');
                              }
                            }}
                            variant="outline" size="sm" className="min-h-11 shrink-0 text-xs"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </MobileGroup>
                )}
              </div>
            )}
          </div>
        </PageTransition>

        <div className="hidden md:block">
        <PageTransition>
          {/* Pending Requests (Received) */}
          {pendingReceived.length > 0 && (
            <FadeIn>
              <div className="bg-surface rounded-lg border border-hairline shadow-card overflow-hidden mb-6">
                {/* Amber Gradient Header */}
                <div className=" to-orange-400 px-5 md:px-6 py-4 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-surface/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-surface/5 rounded-full" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface/20 backdrop-blur-sm rounded-md flex items-center justify-center shadow-e2">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Pending Requests</h2>
                        <p className="text-warn-soft text-xs md:text-sm">Awaiting your response</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface/20 backdrop-blur-sm text-white text-sm font-bold">
                      {pendingReceived.length}
                    </span>
                  </div>
                </div>

                {/* Pending Rows */}
                <div className="px-5 md:px-6 py-4 space-y-3">
                  {pendingReceived.map((connection, index) => (
                    <div
                      key={connection.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-4 bg-warn-soft/50 border border-warn/60 rounded-md"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="min-w-0">
                          <div className="font-semibold text-ink text-sm md:text-base truncate">{connection.otherUser.name}</div>
                          <div className="text-xs md:text-sm text-ink-3 truncate">{connection.otherUser.company || connection.otherUser.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 md:ml-auto">
                        <Button
                          onClick={() => handleAcceptConnection(connection.id)}
                          variant="success"
                          size="sm"
                          className="flex-1 md:flex-none text-xs md:text-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 md:mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDeleteConnection(connection.id, connection.otherUser.name, 'decline')}
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none text-xs md:text-sm"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* Active Connections — Main Card */}
          <div className="bg-surface rounded-lg border border-hairline shadow-card overflow-visible mb-6">
            {/* Gradient Header */}
            <div className="bg-accent px-5 md:px-6 py-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-surface/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-surface/5 rounded-full" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface/20 backdrop-blur-sm rounded-md flex items-center justify-center shadow-e2">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-white">Active Connections</h2>
                    <p className="text-accent-soft text-xs md:text-sm">Your collaboration partners</p>
                  </div>
                </div>
                {!loading && activeAccepted.length > 0 && (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface/20 backdrop-blur-sm text-white text-sm font-bold">
                    {activeAccepted.length}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-5 md:px-6 py-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-md">
                      <Skeleton variant="rect" className="w-11 h-11 rounded-md shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton variant="rect" className="h-8 w-20 rounded-lg shrink-0 hidden md:block" />
                    </div>
                  ))}
                </div>
              ) : activeAccepted.length === 0 ? (
                <div className="border-2 border-dashed border-hairline rounded-md">
                  <EmptyState
                    icon={Users}
                    title="No active connections yet"
                    description="Start connecting with colleagues to find account overlaps"
                    action={
                      <Button
                        onClick={() => setShowInviteModal(true)}
                        variant="primary"
                        size="lg"
                      >
                        Invite Your First Partner
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-hairline">
                  <AnimatePresence initial={false}>
                    {activeAccepted.map((connection) => {
                      const sharedMatchCount = connection.sharedMatchCount ?? 0;
                      return (
                        <motion.div
                          key={connection.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-3 py-3.5 px-1 md:px-2 group hover:bg-accent-soft/40 rounded-lg transition-colors duration-150 -mx-1 md:-mx-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-ink text-sm md:text-base truncate">{connection.otherUser.name}</div>
                                <div className="text-xs md:text-sm text-ink-3 truncate">{connection.otherUser.company || connection.otherUser.email}</div>
                                <div className="mt-1">
                                  <Badge
                                    variant={sharedMatchCount > 0 ? 'success' : 'outline'}
                                    size="sm"
                                  >
                                    {sharedMatchCount} {sharedMatchCount === 1 ? 'match' : 'matches'}
                                  </Badge>
                                </div>
                              </div>
                              <span className="hidden md:inline-block text-xs text-ink-3 shrink-0">
                                {new Date(connection.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex gap-2 shrink-0 md:ml-2">
                              <ButtonLink
                                href={`/dashboard/matches?connection=${connection.id}`}
                                variant="primary"
                                size="sm"
                                className="flex-1 md:flex-none w-full md:w-auto text-xs md:text-sm"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5 md:mr-1" />
                                <span className="hidden md:inline">Matches</span>
                                <span className="md:hidden">View Matches</span>
                              </ButtonLink>
                              <ConnectionControlMenu
                                connection={connection}
                                onMute={handleMuteConnection}
                                onUnmute={handleUnmuteConnection}
                                onRemove={handleRemoveConnection}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {mutedAccepted.length > 0 && (
            <div className="bg-surface rounded-lg border border-warn/70 shadow-card overflow-visible mb-6">
              <div className="px-5 md:px-6 py-4 border-b border-warn-soft bg-warn-soft/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-warn text-sm md:text-base">
                      Muted Connections
                    </h3>
                    <p className="text-xs text-warn/80">
                      Hidden from your main account view. They auto-return if new overlaps are found.
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-warn-soft text-warn text-sm font-bold">
                    {mutedAccepted.length}
                  </span>
                </div>
              </div>
              <div className="px-5 md:px-6 py-4 space-y-0 divide-y divide-warn-soft/70">
                {mutedAccepted.map((connection) => {
                  const sharedMatchCount = connection.sharedMatchCount ?? 0;
                  return (
                    <div
                      key={connection.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 py-3.5 px-1 md:px-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="font-semibold text-ink text-sm md:text-base truncate">
                              {connection.otherUser.name}
                            </div>
                            <Badge variant="warning" size="sm">Muted</Badge>
                          </div>
                          <div className="text-xs md:text-sm text-ink-3 truncate">
                            {connection.otherUser.company || connection.otherUser.email}
                          </div>
                          <div className="mt-1">
                            <Badge
                              variant={sharedMatchCount > 0 ? 'success' : 'outline'}
                              size="sm"
                            >
                              {sharedMatchCount} {sharedMatchCount === 1 ? 'match' : 'matches'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 md:ml-2">
                        <ButtonLink
                          href={`/dashboard/matches?connection=${connection.id}`}
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none w-full md:w-auto text-xs md:text-sm"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 md:mr-1" />
                          <span className="hidden md:inline">Matches</span>
                          <span className="md:hidden">View Matches</span>
                        </ButtonLink>
                        <ConnectionControlMenu
                          connection={connection}
                          onMute={handleMuteConnection}
                          onUnmute={handleUnmuteConnection}
                          onRemove={handleRemoveConnection}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Sent */}
          {pendingSent.length > 0 && (
            <div className="bg-surface rounded-lg border border-hairline shadow-card overflow-hidden mb-6">
              <div className="px-5 md:px-6 py-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0 shadow-e2">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm md:text-base">Sent Requests</h3>
                    <p className="text-xs text-ink-3">Connection requests waiting for approval</p>
                  </div>
                </div>
              </div>
              <div className="px-5 md:px-6 py-4 space-y-3">
                {pendingSent.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-4 border border-hairline rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-sm md:text-base truncate">{connection.otherUser.name}</div>
                        <div className="text-xs md:text-sm text-ink-3 truncate">{connection.otherUser.company || connection.otherUser.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 md:ml-auto">
                      <Badge variant="info" size="sm">Pending</Badge>
                      <Button
                        onClick={() => handleDeleteConnection(connection.id, connection.otherUser.name, 'cancel')}
                        variant="outline"
                        size="sm"
                        className="text-xs md:text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Invites */}
          {invites.length > 0 && (
            <div className="bg-surface rounded-lg border border-hairline shadow-card overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0 shadow-e2">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm md:text-base">Sent Invites</h3>
                    <p className="text-xs text-ink-3">Email invitations you&apos;ve sent to partners</p>
                  </div>
                </div>
              </div>
              <div className="px-5 md:px-6 py-4 space-y-0 divide-y divide-hairline">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0 md:justify-between py-3.5 px-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 shadow-md ${
                        invite.status === 'accepted'
                          ? 'bg-ok'
                          : invite.status === 'pending'
                            ? 'bg-accent'
                            : 'bg-surface-2'
                      }`}>
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-ink text-sm md:text-base">
                          {invite.invitedName || invite.invitedEmail}
                        </div>
                        {invite.invitedName && (
                          <div className="text-xs md:text-sm text-ink-3">{invite.invitedEmail}</div>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={
                              invite.status === 'pending' ? 'info' :
                              invite.status === 'accepted' ? 'success' :
                              'default'
                            }
                            size="sm"
                          >
                            {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-ink-3">
                            {new Date(invite.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {invite.status === 'pending' && (
                      <Button
                        onClick={async () => {
                          try {
                            await invitesApi.revoke(invite.id);
                            toast.success('Invite revoked');
                            void loadData();
                          } catch {
                            toast.error('Failed to revoke invite');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs md:text-sm self-end md:self-auto"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </PageTransition>
        </div>
      </main>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadData}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.action === 'decline'
            ? 'Decline Connection Request'
            : confirmModal.action === 'cancel'
              ? 'Cancel Connection Request'
              : 'Remove Connection'
        }
        description={
          confirmModal.action === 'decline'
            ? `Are you sure you want to decline the connection request from ${confirmModal.connectionName}?`
            : confirmModal.action === 'cancel'
              ? `Are you sure you want to cancel your connection request to ${confirmModal.connectionName}?`
              : `Are you sure you want to remove ${confirmModal.connectionName} from your connections? You will no longer see shared accounts with them.`
        }
        confirmLabel={
          confirmModal.action === 'decline'
            ? 'Decline'
            : confirmModal.action === 'cancel'
              ? 'Cancel Request'
              : 'Remove'
        }
        cancelLabel="Keep"
        intent="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
