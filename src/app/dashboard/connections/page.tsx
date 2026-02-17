'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectionsApi } from '@/features/connections/connections.api';
import { invitesApi } from '@/features/invites/invites.api';
import type { Connection } from '@/features/connections/types';
import type { Invite } from '@/features/invites/types';
import {
  Button, Badge, EmptyState, DashboardHeader, InviteModal,
  Skeleton, PageTransition, StaggerList, StaggerItem, FadeIn,
} from '@/components/ui';
import { Users, Clock, Mail, ArrowLeftRight, Trash2, Bell, CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const avatarColors = [
  'from-indigo-500 to-violet-500 shadow-indigo-500/15',
  'from-sky-500 to-blue-500 shadow-sky-500/15',
  'from-emerald-500 to-teal-500 shadow-emerald-500/15',
  'from-amber-500 to-orange-500 shadow-amber-500/15',
  'from-rose-500 to-pink-500 shadow-rose-500/15',
  'from-violet-500 to-purple-500 shadow-violet-500/15',
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [connectionsRes, invitesRes] = await Promise.all([
        connectionsApi.getAll(),
        invitesApi.getAll(),
      ]);
      setConnections(connectionsRes.data);
      setInvites(invitesRes.data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConnection = async (id: string) => {
    try {
      await connectionsApi.accept(id);
      toast.success('Connection accepted!');
      loadData();
    } catch (error) {
      toast.error('Failed to accept connection');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      await connectionsApi.delete(id);
      toast.success('Connection removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove connection');
    }
  };

  const pendingReceived = connections.filter(c => c.status === 'pending' && !c.isSender);
  const pendingSent = connections.filter(c => c.status === 'pending' && c.isSender);
  const accepted = connections.filter(c => c.status === 'accepted');

  return (
    <>
      <DashboardHeader
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
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
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 bg-linear-to-br ${avatarColors[index % avatarColors.length]} rounded-xl flex items-center justify-center shrink-0 shadow-md text-white font-semibold text-sm`}>
                          {getInitials(connection.otherUser.name)}
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
                          onClick={() => handleDeleteConnection(connection.id)}
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
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden mb-6">
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
                {!loading && accepted.length > 0 && (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold">
                    {accepted.length}
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
              ) : accepted.length === 0 ? (
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
                <StaggerList className="space-y-0 divide-y divide-slate-100">
                  {accepted.map((connection, index) => {
                    const colorClass = avatarColors[index % avatarColors.length];
                    const initials = getInitials(connection.otherUser.name);
                    return (
                      <StaggerItem key={connection.id}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-1 sm:px-2 group hover:bg-indigo-50/40 rounded-lg transition-colors duration-150 -mx-1 sm:-mx-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 bg-linear-to-br ${colorClass} rounded-xl flex items-center justify-center shrink-0 shadow-md text-white font-semibold text-sm`}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{connection.otherUser.name}</div>
                              <div className="text-xs sm:text-sm text-slate-500 truncate">{connection.otherUser.email}</div>
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
                            <button
                              onClick={() => handleDeleteConnection(connection.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shrink-0"
                              title="Remove connection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              )}
            </div>
          </div>

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
                {pendingSent.map((connection, index) => (
                  <div
                    key={connection.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-slate-100 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-linear-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-sky-500/15 text-white font-semibold text-sm">
                        {getInitials(connection.otherUser.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{connection.otherUser.name}</div>
                        <div className="text-xs sm:text-sm text-slate-500 truncate">{connection.otherUser.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                      <Badge variant="info" size="sm">Pending</Badge>
                      <Button
                        onClick={() => handleDeleteConnection(connection.id)}
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
                            loadData();
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
    </>
  );
}
