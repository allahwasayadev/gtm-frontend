'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { connectionsApi } from '@/features/connections/connections.api';
import { matchingApi } from '@/features/matching/matching.api';
import { usersApi } from '@/features/users/users.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import type { Connection } from '@/features/connections/types';
import type {
  AccountMatchesMap,
  PartnerRelationshipType,
} from '@/features/matching/types';
import {
  Button,
  Card,
  Badge,
  Dropdown,
  SkeletonCard,
  SkeletonTable,
  EmptyState,
  PageTransition,
  FadeIn,
  LoadingScreen,
  AccountMatchTooltip,
  InviteModal,
  FilterSheet,
  OnboardingTour,
  useOnboardingTour,
} from '@/components/ui';
import {
  Building2,
  FileText,
  Users,
  Clock,
  CloudUpload,
  Mail,
  ClipboardCheck,
  ChevronRight,
  Pencil,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-utils';

type MatchViewFilter = 'ALL' | PartnerRelationshipType;

const matchViewOptions = [
  { value: 'ALL', label: 'Show All Matches' },
  { value: 'OEM', label: 'Show OEM Only' },
  { value: 'RESELLER', label: 'Show Reseller Only' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([]);
  const [activeList, setActiveList] = useState<AccountList | null>(null);
  const [matchesMap, setMatchesMap] = useState<AccountMatchesMap>({});
  const [loadingData, setLoadingData] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [matchViewFilter, setMatchViewFilter] =
    useState<MatchViewFilter>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const { showTour, closeTour } = useOnboardingTour({
    ready: !loadingData && !loading,
    hasCompletedOnboarding: user?.hasCompletedOnboarding,
  });

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
        setMatchesMap(matchesRes.data.matchesMap ?? {});
      } catch {}
    } catch {
    } finally {
      setLoadingData(false);
    }
  };

  const pendingReceived = connections.filter(
    (c) => c.status === 'pending' && !c.isSender,
  );
  const activeConnections = connections.filter((c) => c.status === 'accepted');
  const companyFilterOptions = useMemo(() => {
    const companies = new Set<string>();
    Object.values(matchesMap).forEach((partners) => {
      partners.forEach((p) => {
        if (p.partnerCompany) companies.add(p.partnerCompany);
      });
    });
    return [
      { value: '', label: 'All companies' },
      ...[...companies].sort().map((c) => ({ value: c, label: c })),
    ];
  }, [matchesMap]);

  const filteredMatchesMap = useMemo<AccountMatchesMap>(() => {
    return Object.fromEntries(
      Object.entries(matchesMap).map(([accountId, partners]) => [
        accountId,
        partners.filter((partner) => {
          if (
            matchViewFilter !== 'ALL' &&
            partner.partnerRelationshipType !== matchViewFilter
          ) {
            return false;
          }
          if (companyFilter && partner.partnerCompany !== companyFilter) {
            return false;
          }
          return true;
        }),
      ]),
    );
  }, [matchesMap, matchViewFilter, companyFilter]);
  const matchedAccountsCount = useMemo(
    () =>
      Object.values(filteredMatchesMap).filter(
        (partners) => partners.length > 0,
      ).length,
    [filteredMatchesMap],
  );

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

  // Rep groups for company-filtered view on dashboard
  const dashboardRepGroups = useMemo(() => {
    if (!companyFilter) return [];
    const groupMap = new Map<
      string,
      {
        connectionId: string;
        partnerName: string;
        accounts: Array<{ accountId: string; accountName: string; theirAccountName: string }>;
      }
    >();
    for (const [accountId, partners] of Object.entries(filteredMatchesMap)) {
      const account = activeAccounts.find((a) => a.id === accountId);
      if (!account) continue;
      for (const partner of partners) {
        const key = partner.connectionId ?? partner.partnerName;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            connectionId: partner.connectionId ?? '',
            partnerName: partner.partnerName,
            accounts: [],
          });
        }
        groupMap.get(key)!.accounts.push({
          accountId,
          accountName: account.accountName,
          theirAccountName: partner.theirAccountName,
        });
      }
    }
    return [...groupMap.values()].sort(
      (a, b) => b.accounts.length - a.accounts.length,
    );
  }, [companyFilter, filteredMatchesMap, activeAccounts]);

  // The same condition the account table uses for its empty state. Guarded on
  // loadingData so a fresh load does not flash the new-user greeting.
  const hasNoAccounts =
    !loadingData && (!activeList || activeAccounts.length === 0);
  const activeFilterCount = (companyFilter ? 1 : 0) + (matchViewFilter !== 'ALL' ? 1 : 0);

  if (loading || !user) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  const firstName = user.name?.trim().split(/\s+/)[0] || user.name;

  const handleOnboardingClose = async () => {
    if (user.hasCompletedOnboarding) {
      closeTour();
      return;
    }

    try {
      const response = await usersApi.completeOnboarding({
        hasCompletedOnboarding: true,
      });
      updateUser({
        ...user,
        hasCompletedOnboarding: response.data.hasCompletedOnboarding,
      });
      closeTour();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to complete onboarding'));
    }
  };

  return (
    <>
      <main className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 md:py-8">
        <div className="mb-3 md:mb-8">
          <h1 className="text-xl max-md:leading-tight md:text-3xl font-bold text-ink tracking-tight">
            {hasNoAccounts
              ? `Welcome to Ovrlap, ${firstName}`
              : `Welcome back, ${user.name}`}
          </h1>
          {/* Narrow screens get a line that says what the page is for; the
              existing subtitle is unchanged from sm up. */}
          <p
            className={`mt-1 text-[13px] leading-snug text-ink-2 md:hidden ${
              hasNoAccounts ? '' : 'max-[359px]:hidden'
            }`}
          >
            {hasNoAccounts
              ? 'Upload your account list, then invite a partner. Ovrlap shows you which accounts you both work with.'
              : 'See where your accounts overlap with your partners’.'}
          </p>
          <p className="mt-1 hidden md:block text-base text-ink-3">
            Here&apos;s an overview of your account mapping activity
          </p>
        </div>

        <PageTransition>
          {loadingData ? (
            <div className="grid grid-cols-3 gap-2 md:gap-6 mb-3 md:mb-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
            {/* Narrow screens: the same three metrics as one compact summary. */}
            <div className="md:hidden mb-3 grid grid-cols-3 bg-surface rounded-xl border border-hairline shadow-card overflow-hidden">
              <div className="px-2 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-xl font-extrabold tracking-tight text-ink leading-none">
                    {activeList ? 1 : 0}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] font-semibold text-ink-2 leading-tight">
                  Account List
                </p>
                <p className="mt-0.5 text-[11px] text-ink-3 leading-tight min-h-[24px]">
                  {activeList?.status === 'active'
                    ? 'Published'
                    : activeList
                      ? 'Draft'
                      : 'No list yet'}
                </p>
              </div>
              <div className="px-2 py-2.5 border-l border-hairline">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok shrink-0" />
                  <span className="text-xl font-extrabold tracking-tight text-ink leading-none">
                    {activeConnections.length}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] font-semibold text-ink-2 leading-tight">
                  Active Connections
                </p>
                <p className="mt-0.5 text-[11px] text-ink-3 leading-tight min-h-[24px]">
                  {activeConnections.length === 0
                    ? 'Send your first invite'
                    : 'Collaboration partners'}
                </p>
              </div>
              <div className="px-2 py-2.5 border-l border-hairline">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-warn shrink-0" />
                  <span className="text-xl font-extrabold tracking-tight text-ink leading-none">
                    {pendingReceived.length}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] font-semibold text-ink-2 leading-tight">
                  Pending Requests
                </p>
                <p className="mt-0.5 text-[11px] text-ink-3 leading-tight min-h-[24px]">
                  {pendingReceived.length === 0
                    ? 'All caught up'
                    : 'Awaiting response'}
                </p>
              </div>
            </div>

            <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
              <Card
                className="border-t-4 border-t-accent rounded-none cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-e2">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink-3 mb-1">
                      Account List
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight text-ink">
                      {activeList ? 1 : 0}
                    </p>
                    <p className="text-xs text-ink-3 mt-1">
                      {activeList?.status === 'active'
                        ? 'Published'
                        : activeList
                          ? 'Draft'
                          : 'No list yet'}
                    </p>
                  </div>
                </div>
              </Card>
              <Card
                className="border-t-4 border-t-ok rounded-none cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-ok rounded-xl flex items-center justify-center shadow-e2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink-3 mb-1">
                      Active Connections
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight text-ink">
                      {activeConnections.length}
                    </p>
                    <p className="text-xs text-ink-3 mt-1">
                      {activeConnections.length === 0
                        ? 'Send your first invite'
                        : 'Collaboration partners'}
                    </p>
                  </div>
                </div>
              </Card>
              <Card
                className="border-t-4 border-t-warn rounded-none cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-warn rounded-xl flex items-center justify-center shadow-e2">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink-3 mb-1">
                      Pending Requests
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight text-ink">
                      {pendingReceived.length}
                    </p>
                    <p className="text-xs text-ink-3 mt-1">
                      {pendingReceived.length === 0
                        ? 'All caught up'
                        : 'Awaiting response'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            </>
          )}

          <FadeIn delay={0.15}>
            <p className="md:hidden mb-1.5 px-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-3">
              Quick actions
            </p>
            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-8">
              {activeList ? (
                <Link
                  href={`/dashboard/lists/${activeList.id}`}
                  className="group"
                  data-tour="upload-list"
                >
                  <div className="max-md:h-full flex flex-col md:flex-row items-center text-center md:text-left gap-1 md:gap-3 px-1 py-2.5 md:p-4 bg-surface rounded-xl md:rounded-2xl border border-hairline shadow-card hover:shadow-card-hover hover:border-accent-soft transition-all duration-200">
                    <div className="w-7 h-7 md:w-10 md:h-10 bg-accent-soft rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                      <FileText className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                    </div>
                    <div className="max-md:w-full md:flex-1 min-w-0">
                      <div className="font-semibold text-ink text-[11.5px] max-md:leading-tight md:text-sm">
                        View List
                      </div>
                      <div className="hidden md:block text-xs text-ink-3">
                        {activeList.name}
                      </div>
                    </div>
                    <ChevronRight className="hidden md:block w-5 h-5 text-ink-3 shrink-0" />
                  </div>
                </Link>
              ) : (
                <Link
                  href="/dashboard/upload"
                  className="group"
                  data-tour="upload-list"
                >
                  <div className="max-md:h-full flex flex-col md:flex-row items-center text-center md:text-left gap-1 md:gap-3 px-1 py-2.5 md:p-4 bg-surface rounded-xl md:rounded-2xl border border-hairline shadow-card hover:shadow-card-hover hover:border-accent-soft transition-all duration-200">
                    <div className="w-7 h-7 md:w-10 md:h-10 bg-accent-soft rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                      <CloudUpload className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                    </div>
                    <div className="max-md:w-full md:flex-1 min-w-0">
                      <div className="font-semibold text-ink text-[11.5px] max-md:leading-tight md:text-sm">
                        Upload List
                      </div>
                      <div className="hidden md:block text-xs text-ink-3">
                        Add account list
                      </div>
                    </div>
                    <ChevronRight className="hidden md:block w-5 h-5 text-ink-3 shrink-0" />
                  </div>
                </Link>
              )}
              <button
                onClick={() => setShowInviteModal(true)}
                className="group text-left max-md:h-full"
                data-tour="invite-partner"
              >
                <div className="max-md:h-full flex flex-col md:flex-row items-center text-center md:text-left gap-1 md:gap-3 px-1 py-2.5 md:p-4 bg-surface rounded-xl md:rounded-2xl border border-hairline shadow-card hover:shadow-card-hover hover:border-accent transition-all duration-200">
                  <div className="w-7 h-7 md:w-10 md:h-10 bg-accent rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Mail className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  </div>
                  <div className="max-md:w-full md:flex-1 min-w-0">
                    <div className="font-semibold text-ink text-[11.5px] max-md:leading-tight md:text-sm">
                      Invite Partner
                    </div>
                    <div className="hidden md:block text-xs text-ink-3">
                      Send email invite
                    </div>
                  </div>
                  <ChevronRight className="hidden md:block w-5 h-5 text-ink-3 shrink-0" />
                </div>
              </button>
              <Link href="/dashboard/connections" className="group">
                <div className="max-md:h-full flex flex-col md:flex-row items-center text-center md:text-left gap-1 md:gap-3 px-1 py-2.5 md:p-4 bg-surface rounded-xl md:rounded-2xl border border-hairline shadow-card hover:shadow-card-hover hover:border-ok transition-all duration-200">
                  <div className="w-7 h-7 md:w-10 md:h-10 bg-ok-soft rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-ok" />
                  </div>
                  <div className="max-md:w-full md:flex-1 min-w-0">
                    <div className="font-semibold text-ink text-[11.5px] max-md:leading-tight md:text-sm">
                      Connections
                    </div>
                    <div className="hidden md:block text-xs text-ink-3">
                      Manage partners
                    </div>
                  </div>
                  <ChevronRight className="hidden md:block w-5 h-5 text-ink-3 shrink-0" />
                </div>
              </Link>
              <Link
                href="/dashboard/matches"
                className="group"
                data-tour="view-matches"
              >
                <div className="max-md:h-full flex flex-col md:flex-row items-center text-center md:text-left gap-1 md:gap-3 px-1 py-2.5 md:p-4 bg-surface rounded-xl md:rounded-2xl border border-hairline shadow-card hover:shadow-card-hover hover:border-accent transition-all duration-200">
                  <div className="w-7 h-7 md:w-10 md:h-10 bg-accent rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  </div>
                  <div className="max-md:w-full md:flex-1 min-w-0">
                    <div className="font-semibold text-ink text-[11.5px] max-md:leading-tight md:text-sm">
                      View Matches
                    </div>
                    <div className="hidden md:block text-xs text-ink-3">
                      Account overlaps
                    </div>
                  </div>
                  <ChevronRight className="hidden md:block w-5 h-5 text-ink-3 shrink-0" />
                </div>
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card padding="none" className="p-3 md:p-6 mb-4 md:mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4 mb-3 pb-3 md:mb-6 md:pb-6 border-b border-hairline">
                <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
                  <div className="w-9 h-9 md:w-11 md:h-11 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-e2">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 md:gap-2.5 flex-nowrap md:flex-wrap max-md:min-w-0">
                      <h3 className="text-[15px] max-md:leading-tight md:text-lg font-semibold text-ink truncate">
                        {companyFilter
                          ? `Accounts overlapping between ${user.name} and ${companyFilter}`
                          : `${user.name} Accounts`}
                      </h3>
                      {activeList &&
                        (activeList.status === 'active' ? (
                          <Badge variant="success" size="sm">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm">
                            Draft
                          </Badge>
                        ))}
                    </div>
                    <p className="text-xs md:text-sm text-ink-3 mt-1">
                      {activeList
                        ? `${activeAccounts.length} account${activeAccounts.length !== 1 ? 's' : ''}`
                        : 'Upload an account list to get started'}
                      {matchedAccountsCount > 0 && (
                        <span className="ml-1.5 text-accent">
                          {'\u2022'}{' '}
                          <span className="md:hidden">Tap</span>
                          <span className="hidden md:inline">Hover</span>{' '}
                          match count to see partners
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {/* Phones: both filters move into a sheet so the controls fit
                    one row. Nothing is dropped — the sheet holds the same two
                    dropdowns. Hidden entirely when there is nothing to filter
                    or edit, which is also when the empty state is showing. */}
                {!hasNoAccounts && (
                  <div className="flex md:hidden items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFilterSheet(true)}
                      className="flex-1 h-11 px-3 flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface text-[13px] font-semibold text-ink-2"
                    >
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Filters
                      </span>
                      {activeFilterCount > 0 && (
                        <span className="bg-accent-soft text-accent-ink text-[11px] rounded-full px-1.5 py-px">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    {activeList && (
                      <Link
                        href={`/dashboard/lists/${activeList.id}`}
                        aria-label="Edit list"
                        className="h-11 px-3 max-[359px]:w-11 max-[359px]:px-0 flex items-center justify-center rounded-lg border border-hairline bg-surface text-[13px] font-semibold text-ink-2"
                      >
                        <Pencil className="w-4 h-4 min-[360px]:hidden" />
                        <span className="max-[359px]:hidden">Edit List</span>
                      </Link>
                    )}
                    <Link href="/dashboard/upload">
                      <span className="h-11 px-3 flex items-center gap-1.5 rounded-lg bg-accent text-white text-[13px] font-semibold">
                        <Plus className="w-3.5 h-3.5" />
                        Upload
                      </span>
                    </Link>
                  </div>
                )}

                <div className="hidden md:flex flex-col md:flex-row items-stretch md:items-center gap-2.5 shrink-0">
                  <Dropdown
                    aria-label="Company filter"
                    value={companyFilter}
                    onChange={setCompanyFilter}
                    options={companyFilterOptions}
                    placeholder="All companies"
                    className="md:w-44"
                  />
                  <Dropdown
                    aria-label="Match display filter"
                    value={matchViewFilter}
                    onChange={(value) =>
                      setMatchViewFilter(value as MatchViewFilter)
                    }
                    options={matchViewOptions}
                    className="md:w-48"
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
              ) : companyFilter && activeList && activeAccounts.length > 0 ? (
                dashboardRepGroups.length === 0 ? (
                  <div className="py-8">
                    <EmptyState
                      icon={FileText}
                      title="No overlaps found"
                      description={`No account overlaps found for ${companyFilter} with the current filters.`}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Rep groups */}
                    {dashboardRepGroups.map((group, groupIndex) => (
                      <motion.div
                        key={group.connectionId || group.partnerName}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: groupIndex * 0.06,
                          duration: 0.3,
                          ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
                        }}
                        className="rounded-xl border border-hairline overflow-hidden"
                      >
                        {/* Rep header */}
                        <div className="px-4 py-3 bg-sunken/70 border-b border-hairline">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-ink text-sm truncate">
                                {group.partnerName}
                              </div>
                              <div className="text-xs text-ink-3">
                                {group.accounts.length} overlap{group.accounts.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <Badge variant={group.accounts.length > 0 ? 'success' : 'outline'}>
                              {group.accounts.length}
                            </Badge>
                          </div>
                        </div>

                        {/* Account list */}
                        <div className="divide-y divide-hairline">
                          {group.accounts.map((account, accountIndex) => (
                            <motion.div
                              key={account.accountId}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: accountIndex * 0.03,
                                duration: 0.2,
                                ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
                              }}
                              className="px-4 py-2.5 bg-surface"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                                  <Building2 className="w-3.5 h-3.5 text-accent" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-ink text-sm truncate">
                                    {account.accountName}
                                  </div>
                                  <div className="text-xs text-ink-3 truncate">
                                    Matched to {account.theirAccountName}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : !activeList || activeAccounts.length === 0 ? (
                <>
                  {/* Phones: the same words, laid out so the primary action
                      stays on the first screen instead of below the fold. */}
                  <div className="md:hidden border-2 border-dashed border-hairline rounded-xl p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-ink leading-tight">
                          No accounts yet
                        </h3>
                        <p className="mt-0.5 text-[13px] text-ink-3 leading-snug">
                          Get started by uploading your first account list
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/upload" className="block">
                      <Button variant="primary" className="w-full">
                        Upload Your First List
                      </Button>
                    </Link>
                  </div>

                  <div className="hidden md:block border-2 border-dashed border-hairline rounded-xl">
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
                </>
              ) : (
                <div className="overflow-hidden rounded-xl border mx-auto w-full max-w-440 border-hairline">
                  <table className="w-full min-w-0">
                    <thead>
                      <tr className="/80/40">
                        <th
                          scope="col"
                          className="px-2 md:px-4 py-2 md:py-3.5 text-left w-9 md:w-14"
                        >
                          <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg bg-surface-2/60 text-ink-3">
                            <span className="text-[10px] font-bold">#</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-5 py-2 md:py-3.5 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <span className="text-xs font-semibold text-ink-2 tracking-wide">
                              Account
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-4 py-2 md:py-3.5 text-right w-24 md:w-32"
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold text-ink-2 tracking-wide">
                              Matches
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-ok" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {sortedAccounts.map((account, index) => {
                        const partners = filteredMatchesMap[account.id] || [];
                        const isTopMatch =
                          topMatchCount > 0 &&
                          partners.length === topMatchCount;
                        return (
                          <tr
                            key={account.id}
                            className={`group transition-colors duration-150 ${
                              isTopMatch
                                ? 'bg-accent-soft/40 hover:bg-accent-soft/60'
                                : 'bg-surface hover:bg-sunken/80'
                            }`}
                          >
                            <td className="px-2 md:px-4 py-2.5 md:py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg text-[11px] md:text-xs font-semibold transition-colors ${
                                  isTopMatch
                                    ? 'bg-accent-soft text-accent'
                                    : 'bg-surface-2 text-ink-3 group-hover:bg-surface-2/80 group-hover:text-ink-3'
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-3 md:px-5 py-2.5 md:py-3">
                              <div className="flex items-center gap-2 md:gap-3 max-md:min-w-0">
                                <div className="min-w-0 max-md:flex-1">
                                  <span
                                    className={`max-md:block max-md:truncate font-medium text-sm md:text-base ${isTopMatch ? 'text-ink' : 'text-ink'}`}
                                  >
                                    {account.accountName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 md:px-4 py-2.5 md:py-3 text-right">
                              {partners.length > 0 ? (
                                <AccountMatchTooltip partners={partners}>
                                  {isTopMatch ? (
                                    <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3.5 py-1 md:py-1.5 rounded-full text-white text-[10px] md:text-xs font-bold cursor-pointer transition-all whitespace-nowrap bg-accent shadow-e2 hover:shadow-lg hover: hover:scale-105">
                                      <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-surface opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-surface" />
                                      </span>
                                      {partners.length} match{partners.length === 1 ? '' : 'es'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold cursor-pointer transition-colors whitespace-nowrap bg-ok-soft text-ok ring-1 ring-ok-soft/80 hover:bg-ok-soft hover:ring-ok">
                                      {partners.length} match{partners.length === 1 ? '' : 'es'}
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
                  <div className="bg-sunken/60 px-3 md:px-5 py-2.5 border-t border-hairline">
                    <div className="flex items-center justify-between">
                      <p className="text-xs md:text-sm text-ink-3">
                        <span className="font-semibold text-ink-2">
                          {activeAccounts.length}
                        </span>{' '}
                        account{activeAccounts.length !== 1 ? 's' : ''}
                        {matchedAccountsCount > 0 && (
                          <span className="ml-3 text-ok">
                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-ok mr-1 align-middle" />
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

      <FilterSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        companyFilter={companyFilter}
        onCompanyFilterChange={setCompanyFilter}
        companyOptions={companyFilterOptions}
        matchViewFilter={matchViewFilter}
        onMatchViewFilterChange={(value) =>
          setMatchViewFilter(value as MatchViewFilter)
        }
        matchViewOptions={matchViewOptions}
        onClear={() => {
          setCompanyFilter('');
          setMatchViewFilter('ALL');
        }}
        activeCount={activeFilterCount}
      />

      <OnboardingTour
        isOpen={showTour}
        onClose={handleOnboardingClose}
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
