'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { connectionsApi } from '@/features/connections/connections.api';
import { matchingApi } from '@/features/matching/matching.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import type { Connection } from '@/features/connections/types';
import type { AccountMatchesMap } from '@/features/matching/types';
import {
  Button, Card, Badge,
  SkeletonCard, SkeletonTable, EmptyState,
  PageTransition, StaggerList, StaggerItem, FadeIn, LoadingScreen,
  AccountMatchTooltip, InviteModal,
} from '@/components/ui';
import { FileText, Users, Clock, CloudUpload, Mail, ClipboardCheck, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([]);
  const [activeList, setActiveList] = useState<AccountList | null>(null);
  const [matchesMap, setMatchesMap] = useState<AccountMatchesMap>({});
  const [loadingData, setLoadingData] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    try {
      const [listsRes, connectionsRes] = await Promise.all([
        accountListsApi.getAll(),
        connectionsApi.getAll(),
      ]);
      setConnections(connectionsRes.data);

      const active = listsRes.data.find((l) => l.status === 'active');
      const listToShow = active || listsRes.data[0];

      if (listToShow) {
        const listDetail = await accountListsApi.getOne(listToShow.id);
        setActiveList(listDetail.data);
        setActiveAccounts(listDetail.data.accounts || []);
      }

      try {
        const matchesRes = await matchingApi.getAllMatches();
        setMatchesMap(matchesRes.data);
      } catch {
        // Silently ignore - matches may not be available yet
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading || !user) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  const pendingConnections = connections.filter(c => c.status === 'pending');
  const activeConnections = connections.filter(c => c.status === 'accepted');

  return (
    <>
      {/* Dark Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">GTM Account Mapper</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Welcome, <Link href="/dashboard/profile" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">{user.name}</Link>!
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="shrink-0 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
            >
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageTransition>
          {/* Gradient Stat Cards */}
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <StaggerItem>
                <Card hover className="border-l-4 border-l-indigo-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Account List</p>
                      <p className="text-4xl font-extrabold tracking-tight text-slate-900">{activeList ? 1 : 0}</p>
                      <p className="text-xs text-slate-400 mt-1">{activeList?.status === 'active' ? 'Published' : activeList ? 'Draft' : 'No list yet'}</p>
                    </div>
                    <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card hover className="border-l-4 border-l-emerald-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Active Connections</p>
                      <p className="text-4xl font-extrabold tracking-tight text-slate-900">{activeConnections.length}</p>
                      <p className="text-xs text-slate-400 mt-1">{activeConnections.length === 0 ? 'Send your first invite' : 'Collaboration partners'}</p>
                    </div>
                    <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card hover className="border-l-4 border-l-amber-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Pending Requests</p>
                      <p className="text-4xl font-extrabold tracking-tight text-slate-900">{pendingConnections.length}</p>
                      <p className="text-xs text-slate-400 mt-1">{pendingConnections.length === 0 ? 'All caught up' : 'Awaiting response'}</p>
                    </div>
                    <div className="w-12 h-12 bg-linear-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            </StaggerList>
          )}

          {/* Quick Actions — Hover Cards */}
          <FadeIn delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Link href="/dashboard/upload" className="group">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-card hover:shadow-card-hover hover:border-indigo-200 transition-all duration-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <CloudUpload className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">Upload List</div>
                    <div className="text-xs text-slate-500">Add account list</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
              </Link>
              <button onClick={() => setShowInviteModal(true)} className="group text-left">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-card hover:shadow-card-hover hover:border-violet-200 transition-all duration-200">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Mail className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">Invite Partner</div>
                    <div className="text-xs text-slate-500">Send email invite</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
              </button>
              <Link href="/dashboard/connections" className="group">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-card hover:shadow-card-hover hover:border-emerald-200 transition-all duration-200">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">Connections</div>
                    <div className="text-xs text-slate-500">Manage partners</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
              </Link>
              <Link href="/dashboard/matches" className="group">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-card hover:shadow-card-hover hover:border-sky-200 transition-all duration-200">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <ClipboardCheck className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">View Matches</div>
                    <div className="text-xs text-slate-500">Account overlaps</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
              </Link>
            </div>
          </FadeIn>

          {/* Account List Table */}
          <FadeIn delay={0.2}>
            <Card className="mb-8">
              {/* Premium Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                        {activeList ? activeList.name : 'Your Accounts'}
                      </h3>
                      {activeList && (
                        activeList.status === 'active'
                          ? <Badge variant="success" size="sm">Published</Badge>
                          : <Badge variant="outline" size="sm">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {activeList
                        ? `${activeAccounts.length} account${activeAccounts.length !== 1 ? 's' : ''}`
                        : 'Upload an account list to get started'}
                      {Object.keys(matchesMap).length > 0 && (
                        <span className="ml-1.5 text-indigo-500">
                          {'\u2022'} Hover names to see matches
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {activeList && (
                    <Link href={`/dashboard/lists/${activeList.id}`}>
                      <Button variant="outline" size="sm">
                        Edit List
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard/upload">
                    <Button variant="primary" size="sm">
                      + Upload New
                    </Button>
                  </Link>
                </div>
              </div>

              {loadingData ? (
                <SkeletonTable rows={6} />
              ) : !activeList || activeAccounts.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl">
                  <EmptyState
                    icon={FileText}
                    title="No accounts yet"
                    description="Get started by uploading your first account list"
                    action={
                      <Link href="/dashboard/upload">
                        <Button variant="primary" size="lg">
                          Upload Your First List
                        </Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200/60">
                  <table className="w-full min-w-0">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100">
                        <th scope="col" className="hidden sm:table-cell px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14">
                          #
                        </th>
                        <th scope="col" className="px-3 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Account
                        </th>
                        <th scope="col" className="hidden md:table-cell px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-60">
                          Matched Partners
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeAccounts.map((account, index) => {
                        const partners = matchesMap[account.id] || [];
                        const avatarColors = [
                          'from-indigo-500 to-violet-500 shadow-indigo-500/15',
                          'from-sky-500 to-blue-500 shadow-sky-500/15',
                          'from-emerald-500 to-teal-500 shadow-emerald-500/15',
                          'from-amber-500 to-orange-500 shadow-amber-500/15',
                          'from-rose-500 to-pink-500 shadow-rose-500/15',
                          'from-violet-500 to-purple-500 shadow-violet-500/15',
                        ];
                        const colorClass = avatarColors[index % avatarColors.length];
                        return (
                          <tr
                            key={account.id}
                            className="group bg-white hover:bg-slate-50/80 transition-colors duration-150"
                          >
                            <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold group-hover:bg-slate-200/80 group-hover:text-slate-500 transition-colors">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-3 sm:px-5 py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`hidden sm:flex w-8 h-8 rounded-lg bg-linear-to-br ${colorClass} items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md`}>
                                  {account.accountName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <AccountMatchTooltip partners={partners}>
                                    <span className="font-medium text-sm sm:text-base text-slate-800">
                                      {account.accountName}
                                    </span>
                                  </AccountMatchTooltip>
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3">
                              {partners.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 ring-1 ring-emerald-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-xs font-medium text-emerald-700 truncate max-w-44">
                                      {partners[0].partnerName}
                                      {partners[0].partnerCompany && (
                                        <span className="text-emerald-500"> – {partners[0].partnerCompany}</span>
                                      )}
                                    </span>
                                  </div>
                                  {partners.length > 1 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                      +{partners.length - 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">&mdash;</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Footer */}
                  <div className="bg-slate-50/60 px-3 sm:px-5 py-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{activeAccounts.length}</span> account{activeAccounts.length !== 1 ? 's' : ''}
                        {Object.keys(matchesMap).length > 0 && (
                          <span className="ml-3 text-emerald-600">
                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 align-middle" />
                            {Object.values(matchesMap).filter(v => v.length > 0).length} matched
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </FadeIn>

        </PageTransition>
      </main>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  );
}
