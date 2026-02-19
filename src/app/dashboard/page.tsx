'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { connectionsApi } from '@/features/connections/connections.api';
import { matchingApi } from '@/features/matching/matching.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import type { Connection } from '@/features/connections/types';
import type { AccountMatchesMap, PartnerRelationshipType } from '@/features/matching/types';
import {
  Button, Card, Badge, Dropdown,
  SkeletonCard, SkeletonTable, EmptyState,
  PageTransition, StaggerList, StaggerItem, FadeIn, LoadingScreen,
  AccountMatchTooltip, InviteModal, OnboardingTour, useOnboardingTour,
} from '@/components/ui';
import { FileText, Users, Clock, CloudUpload, Mail, ClipboardCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { avatarColors } from '@/lib/avatar-colors';

type MatchViewFilter = 'ALL' | PartnerRelationshipType;

const matchViewOptions = [
  { value: 'ALL', label: 'Show All Matches' },
  { value: 'OEM', label: 'Show OEM Only' },
  { value: 'RESELLER', label: 'Show Reseller Only' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([]);
  const [activeList, setActiveList] = useState<AccountList | null>(null);
  const [matchesMap, setMatchesMap] = useState<AccountMatchesMap>({});
  const [loadingData, setLoadingData] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [matchViewFilter, setMatchViewFilter] = useState<MatchViewFilter>('ALL');
  const { showTour, closeTour } = useOnboardingTour({ ready: !loadingData });

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
      }
    } catch {
    } finally {
      setLoadingData(false);
    }
  };

  const pendingConnections = connections.filter(c => c.status === 'pending');
  const activeConnections = connections.filter(c => c.status === 'accepted');
  const filteredMatchesMap = useMemo<AccountMatchesMap>(() => {
    return Object.fromEntries(
      Object.entries(matchesMap).map(([accountId, partners]) => [
        accountId,
        partners.filter((partner) => {
          if (partner.matchType === 'suggested') return false;
          if (matchViewFilter !== 'ALL' && partner.partnerRelationshipType !== matchViewFilter) {
            return false;
          }
          return true;
        }),
      ]),
    );
  }, [matchesMap, matchViewFilter]);
  const matchedAccountsCount = useMemo(
    () => Object.values(filteredMatchesMap).filter((partners) => partners.length > 0).length,
    [filteredMatchesMap],
  );

  // Find the maximum match count (only counts > 1 qualify as "top")
  const topMatchCount = useMemo(() => {
    const counts = Object.values(filteredMatchesMap).map((p) => p.length);
    const max = Math.max(0, ...counts);
    return max > 1 ? max : 0; // Only highlight if more than 1 match
  }, [filteredMatchesMap]);

  const sortedAccounts = useMemo(() => {
    return [...activeAccounts].sort((a, b) => {
      const aMatches = (filteredMatchesMap[a.id] || []).length;
      const bMatches = (filteredMatchesMap[b.id] || []).length;
      return bMatches - aMatches;
    });
  }, [activeAccounts, filteredMatchesMap]);

  if (loading || !user) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <>
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Here&apos;s an overview of your account mapping activity
          </p>
        </div>
        <PageTransition>
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <StaggerItem>
                <Card hover className="border-t-4 border-t-indigo-500 rounded-none">
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
                <Card hover className="border-t-4 border-t-emerald-500 rounded-none">
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
                <Card hover className="border-t-4 border-t-amber-500 rounded-none">
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

          <FadeIn delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {activeList ? (
                <Link href={`/dashboard/lists/${activeList.id}`} className="group" data-tour="upload-list">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-card hover:shadow-card-hover hover:border-indigo-200 transition-all duration-200">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">View List</div>
                      <div className="text-xs text-slate-500">{activeList.name}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                </Link>
              ) : (
                <Link href="/dashboard/upload" className="group" data-tour="upload-list">
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
              )}
              <button onClick={() => setShowInviteModal(true)} className="group text-left" data-tour="invite-partner">
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
              <Link href="/dashboard/matches" className="group" data-tour="view-matches">
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

          <FadeIn delay={0.2}>
            <Card className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
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
                      {matchedAccountsCount > 0 && (
                        <span className="ml-1.5 text-indigo-500">
                          {'\u2022'} Hover match count to see partners
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <Dropdown
                    aria-label="Match display filter"
                    value={matchViewFilter}
                    onChange={(value) => setMatchViewFilter(value as MatchViewFilter)}
                    options={matchViewOptions}
                    className="sm:w-48"
                  />
                  <div className="flex gap-2">
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
                <div className="overflow-hidden rounded-xl border mx-auto w-full max-w-440 border-slate-200/60">
                  <table className="w-full min-w-0">
                    <thead>
                      <tr className="bg-linear-to-r from-slate-50 via-slate-50/80 to-indigo-50/40">
                        <th scope="col" className="hidden sm:table-cell px-4 py-3.5 text-left w-14">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-200/60 text-slate-500">
                            <span className="text-[10px] font-bold">#</span>
                          </div>
                        </th>
                        <th scope="col" className="px-3 sm:px-5 py-3.5 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="text-xs font-semibold text-slate-600 tracking-wide">Account</span>
                          </div>
                        </th>
                        <th scope="col" className="px-3 sm:px-4 py-3.5 text-right w-24 sm:w-32">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold text-slate-600 tracking-wide">Matches</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sortedAccounts.map((account, index) => {
                        const partners = filteredMatchesMap[account.id] || [];
                        const isTopMatch = topMatchCount > 0 && partners.length === topMatchCount;
                        const colorClass = avatarColors[index % avatarColors.length];
                        return (
                          <tr
                            key={account.id}
                            className={`group transition-colors duration-150 ${
                              isTopMatch
                                ? 'bg-indigo-50/40 hover:bg-indigo-50/60'
                                : 'bg-white hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                                isTopMatch
                                  ? 'bg-indigo-100 text-indigo-600'
                                  : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-500'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-3 sm:px-5 py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`hidden sm:flex w-8 h-8 rounded-full ${colorClass} items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm`}>
                                  {account.accountName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className={`font-medium text-sm sm:text-base ${isTopMatch ? 'text-slate-900' : 'text-slate-800'}`}>
                                    {account.accountName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-right">
                              {partners.length > 0 ? (
                                <AccountMatchTooltip partners={partners}>
                                  {isTopMatch ? (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs font-bold cursor-pointer transition-all whitespace-nowrap bg-linear-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-105">
                                      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white" />
                                      </span>
                                      {partners.length} matches
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold cursor-pointer transition-colors whitespace-nowrap bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 hover:bg-emerald-100 hover:ring-emerald-300">
                                      {partners.length} matches
                                    </span>
                                  )}
                                </AccountMatchTooltip>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="bg-slate-50/60 px-3 sm:px-5 py-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{activeAccounts.length}</span> account{activeAccounts.length !== 1 ? 's' : ''}
                        {matchedAccountsCount > 0 && (
                          <span className="ml-3 text-emerald-600">
                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 align-middle" />
                            {matchedAccountsCount} matched
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

      <OnboardingTour
        isOpen={showTour}
        onClose={closeTour}
        onAction={(stepId) => {
          if (stepId === 'upload') {
            router.push('/dashboard/upload');
          } else if (stepId === 'overlaps') {
            router.push('/dashboard/matches');
          } else if (stepId === 'invite') {
            setShowInviteModal(true);
          }
        }}
      />
    </>
  );
}
