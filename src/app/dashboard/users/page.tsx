'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  ConfirmationModal,
  PageTransition,
  LoadingScreen,
} from '@/components/ui';
import { usersApi, type ListUserItem, type AdminStats } from '@/features/users/users.api';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/error-utils';
import { getUserInitials } from '@/lib/user-initials';
import toast from 'react-hot-toast';
import { UsersRound, Trash2, Mail, Building2, Shield, User as UserIcon, FileStack, GitBranch, Layers } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<ListUserItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ListUserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        usersApi.getUsers(),
        usersApi.getAdminStats(),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setStats(statsRes.data ?? null);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Failed to load users'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      if (!user.roles?.includes('Admin')) {
        router.replace('/dashboard');
        return;
      }
      void loadUsers();
    }
  }, [authLoading, user, router, loadUsers]);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.deleteUser(deleteTarget.id);
      toast.success('User deleted successfully');
      setDeleteTarget(null);
      await loadUsers();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  const isCurrentUser = (u: ListUserItem) => user?.id === u.id;

  if (authLoading || (user && !user.roles?.includes('Admin'))) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <PageTransition>
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1600px]">
          <PageHeader
            title="Users"
            description="Manage user accounts. Deleting a user removes their profile and all related data (lists, connections, invites)."
          />

          {/* Usage at a glance — best cards for quick reading */}
          <section className="mb-8" aria-label="Usage overview">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Usage at a glance
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-t-4 border-t-indigo-500 rounded-xl cursor-default bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total users</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums tracking-tight">
                      {stats?.totalUsers ?? '—'}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0" aria-hidden>
                    <UsersRound className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-t-4 border-t-emerald-500 rounded-xl cursor-default bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lists uploaded</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums tracking-tight">
                      {stats?.totalLists ?? '—'}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0" aria-hidden>
                    <FileStack className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-t-4 border-t-amber-500 rounded-xl cursor-default bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mappings created</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums tracking-tight">
                      {stats?.totalMappings ?? '—'}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0" aria-hidden>
                    <GitBranch className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-t-4 border-t-violet-500 rounded-xl cursor-default bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overlaps stored</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums tracking-tight">
                      {stats?.totalOverlaps ?? '—'}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center shrink-0" aria-hidden>
                    <Layers className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {loading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                <span className="text-sm font-medium">Loading users...</span>
              </div>
            </Card>
          ) : users.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={UsersRound}
                title="No users"
                description="There are no user accounts yet."
              />
            </Card>
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <colgroup>
                    <col className="w-[min(28%,280px)]" />
                    <col className="w-[min(28%,280px)]" />
                    <col className="w-[min(20%,200px)]" />
                    <col className="w-[min(16%,180px)]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        User
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Email
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Company
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Roles
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((u) => {
                      const isYou = isCurrentUser(u);
                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors duration-150 ${
                            isYou
                              ? 'bg-indigo-50/40 hover:bg-indigo-50/60'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                                  isYou
                                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-200/80'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {getUserInitials(isYou ? user?.name ?? 'You' : u.name, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                  {isYou ? (
                                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                                      You
                                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 shrink-0">
                                        Current account
                                      </span>
                                    </span>
                                  ) : (
                                    u.name
                                  )}
                                </p>
                                {!isYou && (
                                  <p className="text-xs text-slate-500 truncate md:hidden mt-0.5">{u.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-slate-600 min-w-0">
                              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                              <span className="truncate" title={u.email}>{u.email}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.company ? (
                              <span className="flex items-center gap-2 text-slate-600 min-w-0">
                                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="truncate" title={u.company}>{u.company}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex flex-wrap items-center gap-1.5">
                              {u.roles?.includes('Admin') && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
                                  <Shield className="h-3 w-3 shrink-0" /> Admin
                                </span>
                              )}
                              {u.roles?.includes('OEM') && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                  OEM
                                </span>
                              )}
                              {u.roles?.includes('Reseller') && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  Reseller
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isYou ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                <UserIcon className="h-4 w-4 shrink-0" />
                                This is you
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setDeleteTarget(u)}
                              >
                                <Trash2 className="h-4 w-4 shrink-0" />
                                <span className="ml-1.5">Delete</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete user account?"
        description={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.name}" (${deleteTarget.email}) and all their data (account lists, connections, invites). They will no longer be able to sign in. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete account"
        cancelLabel="Cancel"
        intent="danger"
        isLoading={deleting}
        onConfirm={handleDeleteUser}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </PageTransition>
  );
}
