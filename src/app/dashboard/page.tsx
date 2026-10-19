'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Button, Card, Badge, Dropdown, SkeletonCard, SkeletonTable, EmptyState, PageTransition, FadeIn, LoadingScreen, AccountMatchTooltip, QuickAction, QuickActionGrid, InviteModal, FilterSheet, OnboardingTour, useOnboardingTour, ButtonLink } from '@/components/ui';
import {
  Building2,
  FileText,
  Users,
  CloudUpload,
  Mail,
  ClipboardCheck,
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [matchesUnavailable, setMatchesUnavailable] = useState(false);
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

  const loadingRef = useRef(false);

  const loadData = async () => {
    // Without this, each extra Try again click queued another pair of
    // requests whose responses raced each other back into state.
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingData(true);
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
        setMatchesUnavailable(false);
      } catch {
        // Overlaps could not be read. That is not the same as "no overlaps",
        // and the table says so rather than printing a 0 that is not a count.
        setMatchesUnavailable(true);
      }
      setLoadFailed(false);
    } catch {
      // The lists and connections themselves failed. Showing the empty state
      // here would tell the user they have no list, which may be untrue.
      setLoadFailed(true);
    } finally {
      loadingRef.current = false;
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
    !loadingData && !loadFailed && (!activeList || activeAccounts.length === 0);
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
          ) : loadFailed ? (
            /* Say the load failed. The empty state here would claim the account
               has no list, which a failed request is no evidence of. */
            <div className="mb-3 md:mb-8 rounded-md border border-danger-soft bg-danger-soft p-5" role="alert">
              <p className="text-sm font-bold text-danger">We couldn&rsquo;t load your dashboard</p>
              <p className="mt-1 text-sm text-danger/90">Please try again in a moment.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void loadData()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
            {/* One renderer at every width. Phones join the three metrics into a
                single banded card; from md they separate into their own cards and
                the numbers grow. Same markup, same order, same copy throughout. */}
            {(() => {
              const metrics = [
                {
                  dot: 'bg-accent',
                  value: activeList ? 1 : 0,
                  label: 'Account List',
                  note: activeList?.status === 'active'
                    ? 'Published'
                    : activeList
                      ? 'Draft'
                      : 'No list yet',
                },
                {
                  dot: 'bg-ok',
                  value: activeConnections.length,
                  label: 'Active Connections',
                  note: activeConnections.length === 0
                    ? 'Send your first invite'
                    : 'Collaboration partners',
                },
                {
                  dot: 'bg-warn',
                  value: pendingReceived.length,
                  label: 'Pending Requests',
                  note: pendingReceived.length === 0
                    ? 'All caught up'
                    : 'Awaiting response',
                },
              ];
              return (
                <div className="mb-3 md:mb-8 grid grid-cols-3 md:gap-5 bg-surface md:bg-transparent rounded-md md:rounded-none border md:border-0 border-hairline shadow-card md:shadow-none overflow-hidden md:overflow-visible">
                  {metrics.map((m, index) => (
                    <div
                      key={m.label}
                      className={`px-2 py-2.5 md:p-5 md:bg-surface md:rounded-md md:border md:border-hairline md:shadow-card ${
                        index > 0 ? 'border-l border-hairline' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 md:gap-2.5">
                        <span className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full shrink-0 ${m.dot}`} />
                        <span className="text-xl md:text-4xl font-extrabold tracking-tight text-ink leading-none">
                          {m.value}
                        </span>
                      </div>
                      <p className="mt-1 md:mt-3 text-xs md:text-sm font-semibold text-ink-2 leading-tight">
                        {m.label}
                      </p>
                      <p className="mt-0.5 text-xs md:text-[13px] text-ink-3 leading-tight min-h-[24px] md:min-h-0">
                        {m.note}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
            </>
          )}

          <FadeIn delay={0.04}>
            <p className="md:hidden mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wider text-ink-3">
              Quick actions
            </p>
            <QuickActionGrid>
              {activeList ? (
                <QuickAction
                  href={`/dashboard/lists/${activeList.id}`}
                  icon={FileText}
                  label="View List"
                  detail={activeList.name}
                  dataTour="upload-list"
                />
              ) : (
                <QuickAction
                  href="/dashboard/upload"
                  icon={CloudUpload}
                  label="Upload List"
                  detail="Start mapping"
                  dataTour="upload-list"
                />
              )}
              <QuickAction
                href="/dashboard/connections"
                icon={Mail}
                label="Invite Partner"
                detail="Send email invite"
                dataTour="invite-partner"
              />
              <QuickAction
                href="/dashboard/connections"
                icon={Users}
                label="Connections"
                detail="Manage partners"
                tone="ok"
              />
              <QuickAction
                href="/dashboard/matches"
                icon={ClipboardCheck}
                label="View Matches"
                detail="Account overlaps"
                dataTour="view-matches"
              />
            </QuickActionGrid>
          </FadeIn>

          <FadeIn delay={0.06}>
            <Card padding="none" className="p-3 md:p-6 mb-4 md:mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 md:gap-4 mb-2.5 pb-2.5 md:mb-6 md:pb-6 border-b border-hairline">
                <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
                  <div className="hidden md:flex w-11 h-11 bg-accent rounded-sm items-center justify-center shrink-0 shadow-e1">
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
                    <p className="text-xs md:text-sm text-ink-3 mt-0.5 md:mt-1">
                      {activeList
                        ? `${activeAccounts.length} account${activeAccounts.length !== 1 ? 's' : ''}`
                        : 'Upload an account list to get started'}
                      {matchedAccountsCount > 0 && (
                        <span className="ml-1.5 text-accent">
                          {'\u2022'}{' '}
                          <span className="md:hidden">Tap a match count</span>
                          <span className="hidden md:inline">
                            Hover match count to see partners
                          </span>
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
                        <span className="bg-accent-soft text-accent-ink text-xs font-bold rounded-full px-1.5 py-px">
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

                {/* From 768 the two filters sit in the toolbar with visible
                    labels rather than behind a sheet. They wrap onto a second
                    line when the toolbar runs out of room. Phones keep the
                    sheet, and the two renderers never coexist, so there is no
                    duplicate focusable control at any width. Both read and
                    write the same state, so a selection survives a resize. */}
                <div className="hidden md:flex flex-wrap items-end gap-2.5">
                  <Dropdown
                    label="Company"
                    value={companyFilter}
                    onChange={setCompanyFilter}
                    options={companyFilterOptions}
                    placeholder="All companies"
                    className="w-44 lg:w-52"
                  />
                  <Dropdown
                    label="Matches"
                    value={matchViewFilter}
                    onChange={(value) =>
                      setMatchViewFilter(value as MatchViewFilter)
                    }
                    options={matchViewOptions}
                    className="w-48 lg:w-56"
                  />
                  <div className="flex gap-2">
                    {activeList && (
                      <ButtonLink href={`/dashboard/lists/${activeList.id}`} variant="outline" size="sm">
                        Edit List
                      </ButtonLink>
                    )}
                    <ButtonLink href="/dashboard/upload" variant="primary" size="sm">
                        + Upload New
                      </ButtonLink>
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
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(groupIndex * 0.03, 0.12),
                          duration: 0.18,
                          ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
                        }}
                        className="rounded-md border border-hairline overflow-hidden"
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
                                delay: Math.min(accountIndex * 0.02, 0.12),
                                duration: 0.18,
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
              ) : loadFailed ? null : !activeList || activeAccounts.length === 0 ? (
                <div className="border-2 border-dashed border-hairline rounded-md">
                  <EmptyState
                    icon={FileText}
                    title="No accounts yet"
                    description="Get started by uploading your first account list"
                    action={
                      <ButtonLink href="/dashboard/upload" variant="primary" size="lg">
                        Upload Your First List
                      </ButtonLink>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-hidden rounded-md border mx-auto w-full border-hairline">
                  {/* Its own horizontal scroller: the Matches cell holds the
                      popover trigger, and overflow-hidden here cut it off at
                      narrow widths, making the action unreachable. */}
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="bg-sunken">
                        <th
                          scope="col"
                          className="px-1.5 md:px-4 py-2 md:py-3.5 text-left w-8 md:w-14"
                        >
                          <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg bg-surface-2/60 text-ink-3">
                            <span className="text-xs font-bold">#</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-2 md:px-5 py-2 md:py-3.5 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <span className="text-xs font-bold uppercase text-ink-2 tracking-[0.07em]">
                              Account
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-2 md:px-4 py-2 md:py-3.5 text-right w-[86px] md:w-32"
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-bold uppercase text-ink-2 tracking-[0.07em]">
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
                                className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg text-xs md:text-xs font-semibold transition-colors ${
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
                                    className="block truncate font-medium text-sm md:text-base text-ink"
                                    title={account.accountName}
                                  >
                                    {account.accountName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 md:px-4 py-2.5 md:py-3 text-right">
                              {partners.length > 0 ? (
                                <AccountMatchTooltip
                                  partners={partners}
                                  accountName={account.accountName}
                                >
                                  {isTopMatch ? (
                                    <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3.5 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap bg-accent shadow-e1 transition-colors hover:bg-accent-hover">
                                      <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-surface opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-surface" />
                                      </span>
                                      {partners.length} match{partners.length === 1 ? '' : 'es'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-ok-soft text-ok ring-1 ring-ok-soft transition-colors hover:ring-ok">
                                      {partners.length} match{partners.length === 1 ? '' : 'es'}
                                    </span>
                                  )}
                                </AccountMatchTooltip>
                              ) : matchesUnavailable ? (
                                /* A blank cell reads as "no overlaps". When the
                                   overlap request failed we do not know that. */
                                <span
                                  className="text-sm text-ink-3"
                                  title="Overlaps could not be loaded for this account"
                                >
                                  &mdash;
                                </span>
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
                        {matchesUnavailable ? (
                          <span className="ml-3 inline-flex items-center gap-2 text-warn">
                            Overlaps unavailable
                            <button
                              type="button"
                              onClick={() => void loadData()}
                              className="rounded-sm font-semibold underline underline-offset-2 hover:text-warn/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                              Try again
                            </button>
                          </span>
                        ) : matchedAccountsCount > 0 ? (
                          <span className="ml-3 text-ok">
                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-ok mr-1 align-middle" />
                            {matchedAccountsCount} matched
                          </span>
                        ) : null}
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
