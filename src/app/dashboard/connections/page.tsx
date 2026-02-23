'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { connectionsApi } from '@/features/connections/connections.api';
import { invitesApi } from '@/features/invites/invites.api';
import type { Connection } from '@/features/connections/types';
import type { Invite } from '@/features/invites/types';
import { ConnectionControlMenu } from '@/features/connections/components/ConnectionControlMenu';
import {
  Button, Badge, EmptyState, PageHeader, InviteModal, ConfirmationModal,
  Skeleton, PageTransition, FadeIn,
} from '@/components/ui';
import { Users, Clock, Mail, ArrowLeftRight, Bell, CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { avatarColors } from '@/lib/avatar-colors';
import { getUserInitials } from '@/lib/user-initials';

export default function ConnectionsPage() {
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

  const loadData = useCallback(async () => {
    try {
      const [connectionsRes, invitesRes] = await Promise.all([
        connectionsApi.getAll({ includeMuted: true }),
        invitesApi.getAll(),
      ]);
      setConnections(connectionsRes.data);
      setInvites(invitesRes.data);
    } catch {
      toast.error('Failed to load connections');
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

  const pendingReceived = connections.filter(c => c.status === 'pending' && !c.isSender);
  const pendingSent = connections.filter(c => c.status === 'pending' && c.isSender);
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const activeAccepted = acceptedConnections.filter((c) => !c.isMuted);
  const mutedAccepted = acceptedConnections.filter((c) => c.isMuted);

  return (
    <>
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
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
              <Mail className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Invite Partner</span>
            </Button>
          }
        />
        <PageTransition>
          {/* Pending Requests (Received) */}
          {pendingReceived.length > 0 && (
            <FadeIn>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden mb-6">
                {/* Amber Gradient Header */}
                <div className="bg-linear-to-br from-amber-500 via-amber-400 to-orange-400 px-5 sm:px-6 py-4 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-white/5 rounded-full" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Pending Requests</h2>
                        <p className="text-amber-100 text-xs sm:text-sm">Awaiting your response</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold">
                      {pendingReceived.length}
                    </span>
                  </div>
                </div>

                {/* Pending Rows */}
                <div className="px-5 sm:px-6 py-4 space-y-3">
                  {pendingReceived.map((connection, index) => (
                    <div
                      key={connection.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center shrink-0 shadow-sm text-white font-semibold text-sm`}>
                          {getUserInitials(connection.otherUser.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{connection.otherUser.name}</div>
                          <div className="text-xs sm:text-sm text-slate-500 truncate">{connection.otherUser.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 sm:ml-auto">
                        <Button
                          onClick={() => handleAcceptConnection(connection.id)}
                          variant="success"
                          size="sm"
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 sm:mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDeleteConnection(connection.id, connection.otherUser.name, 'decline')}
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
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
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-visible mb-6">
            {/* Gradient Header */}
            <div className="bg-linear-to-br from-indigo-600 via-indigo-500 to-violet-500 px-5 sm:px-6 py-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-700/30">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Active Connections</h2>
                    <p className="text-indigo-200 text-xs sm:text-sm">Your collaboration partners</p>
                  </div>
                </div>
                {!loading && activeAccepted.length > 0 && (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold">
                    {activeAccepted.length}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-6 py-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                      <Skeleton variant="rect" className="w-11 h-11 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton variant="rect" className="h-8 w-20 rounded-lg shrink-0 hidden sm:block" />
                    </div>
                  ))}
                </div>
              ) : activeAccepted.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl">
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
                <div className="space-y-0 divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {activeAccepted.map((connection, index) => {
                      const colorClass = avatarColors[index % avatarColors.length];
                      const initials = getUserInitials(connection.otherUser.name);
                      const sharedMatchCount = connection.sharedMatchCount ?? 0;
                      return (
                        <motion.div
                          key={connection.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-1 sm:px-2 group hover:bg-indigo-50/40 rounded-lg transition-colors duration-150 -mx-1 sm:-mx-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 sm:w-11 sm:h-11 ${colorClass} rounded-full flex items-center justify-center shrink-0 shadow-sm text-white font-semibold text-sm`}>
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{connection.otherUser.name}</div>
                                <div className="text-xs sm:text-sm text-slate-500 truncate">{connection.otherUser.email}</div>
                                <div className="mt-1">
                                  <Badge
                                    variant={sharedMatchCount > 0 ? 'success' : 'outline'}
                                    size="sm"
                                  >
                                    {sharedMatchCount} {sharedMatchCount === 1 ? 'match' : 'matches'}
                                  </Badge>
                                </div>
                              </div>
                              <span className="hidden md:inline-block text-xs text-slate-400 shrink-0">
                                {new Date(connection.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex gap-2 shrink-0 sm:ml-2">
                              <Link href={`/dashboard/matches?connection=${connection.id}`} className="flex-1 sm:flex-none">
                                <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                                  <ArrowLeftRight className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Matches</span>
                                  <span className="sm:hidden">View Matches</span>
                                </Button>
                              </Link>
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
            <div className="bg-white rounded-2xl border border-amber-200/70 shadow-card overflow-visible mb-6">
              <div className="px-5 sm:px-6 py-4 border-b border-amber-100 bg-amber-50/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-amber-900 text-sm sm:text-base">
                      Muted Connections
                    </h3>
                    <p className="text-xs text-amber-700/80">
                      Hidden from your main account view. They auto-return if new overlaps are found.
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
                    {mutedAccepted.length}
                  </span>
                </div>
              </div>
              <div className="px-5 sm:px-6 py-4 space-y-0 divide-y divide-amber-100/70">
                {mutedAccepted.map((connection, index) => {
                  const colorClass = avatarColors[index % avatarColors.length];
                  const initials = getUserInitials(connection.otherUser.name);
                  const sharedMatchCount = connection.sharedMatchCount ?? 0;
                  return (
                    <div
                      key={connection.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-1 sm:px-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 ${colorClass} rounded-full flex items-center justify-center shrink-0 shadow-sm text-white font-semibold text-sm`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                              {connection.otherUser.name}
                            </div>
                            <Badge variant="warning" size="sm">Muted</Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 truncate">
                            {connection.otherUser.email}
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
                      <div className="flex gap-2 shrink-0 sm:ml-2">
                        <Link href={`/dashboard/matches?connection=${connection.id}`} className="flex-1 sm:flex-none">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                            <ArrowLeftRight className="w-3.5 h-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Matches</span>
                            <span className="sm:hidden">View Matches</span>
                          </Button>
                        </Link>
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
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden mb-6">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-linear-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-sky-500/15">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Sent Requests</h3>
                    <p className="text-xs text-slate-500">Connection requests waiting for approval</p>
                  </div>
                </div>
              </div>
              <div className="px-5 sm:px-6 py-4 space-y-3">
                {pendingSent.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-slate-100 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-linear-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-sky-500/15 text-white font-semibold text-sm">
                        {getUserInitials(connection.otherUser.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{connection.otherUser.name}</div>
                        <div className="text-xs sm:text-sm text-slate-500 truncate">{connection.otherUser.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                      <Badge variant="info" size="sm">Pending</Badge>
                      <Button
                        onClick={() => handleDeleteConnection(connection.id, connection.otherUser.name, 'cancel')}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
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
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-linear-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-violet-500/15">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Sent Invites</h3>
                    <p className="text-xs text-slate-500">Email invitations you&apos;ve sent to partners</p>
                  </div>
                </div>
              </div>
              <div className="px-5 sm:px-6 py-4 space-y-0 divide-y divide-slate-100">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between py-3.5 px-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        invite.status === 'accepted'
                          ? 'bg-linear-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/15'
                          : invite.status === 'pending'
                            ? 'bg-linear-to-br from-sky-400 to-blue-500 shadow-sky-500/15'
                            : 'bg-linear-to-br from-slate-300 to-slate-400 shadow-slate-400/15'
                      }`}>
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm sm:text-base">
                          {invite.invitedName || invite.invitedEmail}
                        </div>
                        {invite.invitedName && (
                          <div className="text-xs sm:text-sm text-slate-500">{invite.invitedEmail}</div>
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
                          <span className="text-xs text-slate-400">
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
                        className="text-xs sm:text-sm self-end sm:self-auto"
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
