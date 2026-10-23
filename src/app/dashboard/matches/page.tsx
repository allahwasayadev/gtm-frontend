'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { connectionsApi } from '@/features/connections/connections.api';
import { ConnectionControlMenu } from '@/features/connections/components/ConnectionControlMenu';
import type { Connection } from '@/features/connections/types';
import { matchingApi } from '@/features/matching/matching.api';
import type {
  AllMatchesResponse,
  ConnectionMatchSummary,
  Match,
  PartnerRelationshipType,
} from '@/features/matching/types';
import {
  Badge,
  Button,
  Card,
  Dropdown,
  EmptyState,
  LoadingScreen,
  PageHeader,
  PageTransition,
  Skeleton, ButtonLink } from '@/components/ui';
import { getErrorMessage } from '@/lib/error-utils';

const EMPTY_ALL_MATCHES: AllMatchesResponse = {
  matchesMap: {},
  accounts: [],
  connectionSummaries: [],
};

type PartnerTypeFilter = 'ALL' | PartnerRelationshipType;

const partnerTypeFilterOptions: { value: PartnerTypeFilter; label: string }[] =
  [
    { value: 'ALL', label: 'All partners' },
    { value: 'OEM', label: 'OEMs only' },
    { value: 'RESELLER', label: 'Resellers only' },
  ];

function getPartnerTypeFromConnection(
  connection: Connection,
): PartnerRelationshipType {
  return connection.otherUser?.roles?.includes('OEM') ? 'OEM' : 'RESELLER';
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading matches..." />}>
      <MatchesContent />
    </Suspense>
  );
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const preselectedConnectionId = searchParams.get('connection') ?? '';

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    preselectedConnectionId,
  );
  const [allMatches, setAllMatches] =
    useState<AllMatchesResponse>(EMPTY_ALL_MATCHES);
  const [resolvedMatches, setResolvedMatches] = useState<Match[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<Match[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingAllPartners, setLoadingAllPartners] = useState(true);
  const [loadingPartnerMatches, setLoadingPartnerMatches] = useState(false);
  const [processingDecision, setProcessingDecision] = useState<string | null>(
    null,
  );
  const [partnerTypeFilter, setPartnerTypeFilter] =
    useState<PartnerTypeFilter>('ALL');
  // Connections and all-partners matches are independently owned resources: a
  // success in one must never clear a failure in the other, or a real error
  // hides behind a falsely-empty page.
  const [connectionsFailed, setConnectionsFailed] = useState(false);
  const [allMatchesFailed, setAllMatchesFailed] = useState(false);
  const [partnerMatchesFailed, setPartnerMatchesFailed] = useState(false);
  const loadFailed = connectionsFailed || allMatchesFailed;
  // A partner response is applied only while it is still the latest request for
  // the connection that is still selected on a still-mounted page. Three guards
  // combined: selection identity (switch to another partner / to All / unmount
  // invalidates — including a match-decision reload that resolves after the user
  // moved on), generation (a newer request for the SAME partner supersedes an
  // older one), and mount. selectedIdRef is synced inside the select effect
  // below so it is authoritative at invocation time, not a render behind.
  const selectedIdRef = useRef(selectedConnectionId);
  const partnerGenRef = useRef(0);
  const mountedRef = useRef(true);
  // Setup must reset true, or React StrictMode's setup→cleanup→setup leaves it
  // permanently false and every partner response is dropped.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      const response = await connectionsApi.getAll({ includeMuted: true });
      const acceptedConnections = response.data.filter(
        (connection) => connection.status === 'accepted',
      );
      setConnections(acceptedConnections);
      setConnectionsFailed(false);

      setSelectedConnectionId((current) => {
        const preferred = current || preselectedConnectionId;
        if (
          preferred &&
          acceptedConnections.some((connection) => connection.id === preferred)
        ) {
          return preferred;
        }
        return '';
      });
    } catch {
      // An empty list here would render "No Active Connections", which looks
      // like real data rather than a failure.
      setConnectionsFailed(true);
      toast.error('We couldn\u2019t load your partners. Try again.');
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [preselectedConnectionId]);

  const loadAllPartnersMatches = useCallback(async () => {
    setLoadingAllPartners(true);
    try {
      const response = await matchingApi.getAllMatches();
      setAllMatches(response.data ?? EMPTY_ALL_MATCHES);
      setAllMatchesFailed(false);
    } catch (error: unknown) {
      setAllMatchesFailed(true);
      toast.error(getErrorMessage(error, 'We couldn\u2019t load your matches. Try again.'));
      setAllMatches(EMPTY_ALL_MATCHES);
    } finally {
      setLoadingAllPartners(false);
    }
  }, []);

  const loadPartnerMatches = useCallback(async (connectionId: string) => {
    if (!connectionId) {
      setResolvedMatches([]);
      setSuggestedMatches([]);
      setPartnerMatchesFailed(false);
      return;
    }

    // Reject a stale INVOCATION before touching loading/error state. A match
    // decision whose reload fires after the user switched partners would
    // otherwise start a skeleton on the now-current view and — its completion
    // being discarded — never clear it, leaving loading stuck.
    if (selectedIdRef.current !== connectionId) return;

    const generation = ++partnerGenRef.current;
    // Valid to apply only if latest request for this still-selected partner.
    const isCurrent = () =>
      mountedRef.current &&
      generation === partnerGenRef.current &&
      selectedIdRef.current === connectionId;

    setPartnerMatchesFailed(false);
    setLoadingPartnerMatches(true);
    try {
      const response = await matchingApi.getMatches(connectionId);
      if (!isCurrent()) return;
      setResolvedMatches(response.data.resolved || []);
      setSuggestedMatches(response.data.suggested || []);
    } catch (error: unknown) {
      if (!isCurrent()) return;
      toast.error(getErrorMessage(error, 'We couldn\u2019t load this partner\u2019s matches. Try again.'));
      // A failed fetch is NOT "no overlaps": clear the stale list but flag the
      // failure so the panel shows an error with Retry, not a false empty.
      setResolvedMatches([]);
      setSuggestedMatches([]);
      setPartnerMatchesFailed(true);
    } finally {
      if (isCurrent()) {
        setLoadingPartnerMatches(false);
      }
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadConnections(), loadAllPartnersMatches()]);
  }, [loadConnections, loadAllPartnersMatches]);

  useEffect(() => {
    // Authoritative selection, set before the load so the invocation guard in
    // loadPartnerMatches sees the current partner rather than lagging a render.
    selectedIdRef.current = selectedConnectionId;
    if (!selectedConnectionId) {
      // Switching to All Partners invalidates any in-flight partner request via
      // selectedIdRef; clear its view and error so nothing stale lingers.
      setResolvedMatches([]);
      setSuggestedMatches([]);
      setPartnerMatchesFailed(false);
      setLoadingPartnerMatches(false);
      return;
    }
    void loadPartnerMatches(selectedConnectionId);
  }, [selectedConnectionId, loadPartnerMatches]);

  const selectedConnection =
    connections.find((connection) => connection.id === selectedConnectionId) ??
    null;
  const allPartnersMode = !selectedConnectionId;

  const summaryByConnectionId = useMemo(() => {
    return new Map(
      allMatches.connectionSummaries.map((summary) => [
        summary.connectionId,
        summary,
      ]),
    );
  }, [allMatches.connectionSummaries]);

  const filteredAccounts = useMemo(() => {
    return allMatches.accounts
      .map((account) => ({
        ...account,
        partners:
          partnerTypeFilter === 'ALL'
            ? account.partners
            : account.partners.filter(
                (p) => p.partnerRelationshipType === partnerTypeFilter,
              ),
      }))
      .filter((account) => account.partners.length > 0)
      .sort((a, b) => b.partners.length - a.partners.length);
  }, [allMatches.accounts, partnerTypeFilter]);

  const filteredConnectionSummaries = useMemo(() => {
    return allMatches.connectionSummaries.filter(
      (s) =>
        partnerTypeFilter === 'ALL' ||
        s.partnerRelationshipType === partnerTypeFilter,
    );
  }, [allMatches.connectionSummaries, partnerTypeFilter]);

  const partnerNavItems = useMemo(() => {
    return connections
      .filter((connection) => {
        const summary = summaryByConnectionId.get(connection.id);
        const type =
          summary?.partnerRelationshipType ??
          getPartnerTypeFromConnection(connection);
        return partnerTypeFilter === 'ALL' || type === partnerTypeFilter;
      })
      .map((connection) => {
        const summary = summaryByConnectionId.get(connection.id);
        return {
          connection,
          matchCount: summary?.matchCount ?? 0,
        };
      });
  }, [connections, summaryByConnectionId, partnerTypeFilter]);

  const filteredTotalOverlaps = useMemo(() => {
    return filteredAccounts.reduce(
      (sum, account) => sum + account.partners.length,
      0,
    );
  }, [filteredAccounts]);

  useEffect(() => {
    if (selectedConnectionId && partnerTypeFilter !== 'ALL') {
      const conn = connections.find((c) => c.id === selectedConnectionId);
      if (conn) {
        const type =
          summaryByConnectionId.get(conn.id)?.partnerRelationshipType ??
          getPartnerTypeFromConnection(conn);
        if (type !== partnerTypeFilter) {
          setSelectedConnectionId('');
        }
      }
    }
  }, [
    partnerTypeFilter,
    selectedConnectionId,
    connections,
    summaryByConnectionId,
  ]);

  const refreshCurrentView = useCallback(async () => {
    if (selectedConnectionId) {
      await Promise.all([
        loadPartnerMatches(selectedConnectionId),
        loadAllPartnersMatches(),
        loadConnections(),
      ]);
      return;
    }

    await Promise.all([loadAllPartnersMatches(), loadConnections()]);
  }, [
    loadAllPartnersMatches,
    loadConnections,
    loadPartnerMatches,
    selectedConnectionId,
  ]);

  const handleMatchDecision = useCallback(
    async (match: Match, decision: 'accepted' | 'rejected') => {
      if (!selectedConnectionId) return;

      const matchKey = `${match.yourAccountId}-${match.theirAccountId}`;
      setProcessingDecision(matchKey);

      try {
        await matchingApi.setMatchDecision(selectedConnectionId, {
          yourAccountId: match.yourAccountId,
          theirAccountId: match.theirAccountId,
          decision,
        });

        toast.success(
          decision === 'accepted'
            ? `Accepted match: ${match.accountName}`
            : 'Rejected match suggestion',
        );

        await Promise.all([
          loadPartnerMatches(selectedConnectionId),
          loadAllPartnersMatches(),
        ]);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'Failed to update match decision'));
      } finally {
        setProcessingDecision(null);
      }
    },
    [loadAllPartnersMatches, loadPartnerMatches, selectedConnectionId],
  );

  /* Mute and Remove drop the selection, so the toolbar holding the actions
     menu unmounts and the keyboard would be left on nothing. The fallback is
     the rail's "All partners" chip — the view the page falls back to. */
  const allChipRef = useRef<HTMLButtonElement>(null);
  const [focusAllPartners, setFocusAllPartners] = useState(false);

  useEffect(() => {
    if (!focusAllPartners) return;
    setFocusAllPartners(false);
    allChipRef.current?.focus();
  }, [focusAllPartners]);

  const handleMuteConnection = async (connectionId: string) => {
    try {
      await connectionsApi.mute(connectionId);
      toast.success('Connection muted');
      await Promise.all([loadConnections(), loadAllPartnersMatches()]);
      if (selectedConnectionId === connectionId) {
        setSelectedConnectionId('');
        setFocusAllPartners(true);
      }
    } catch (error) {
      toast.error('Failed to mute connection');
      throw error;
    }
  };

  const handleUnmuteConnection = async (connectionId: string) => {
    try {
      await connectionsApi.unmute(connectionId);
      toast.success('Connection unmuted');
      await Promise.all([loadConnections(), loadAllPartnersMatches()]);
      if (selectedConnectionId === connectionId) {
        await loadPartnerMatches(connectionId);
      }
    } catch (error) {
      toast.error('Failed to unmute connection');
      throw error;
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await connectionsApi.delete(connectionId);
      toast.success('Connection removed');
      if (selectedConnectionId === connectionId) {
        setSelectedConnectionId('');
      }
      setResolvedMatches([]);
      setSuggestedMatches([]);
      await Promise.all([loadConnections(), loadAllPartnersMatches()]);
      setFocusAllPartners(true);
    } catch (error) {
      toast.error('Failed to remove connection');
      throw error;
    }
  };

  if (loadingConnections) {
    return <LoadingScreen message="Loading connections..." />;
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 lg:py-8">
      {/* One header at every width. PageHeader already scales its title and
          carries the back link, so the phone-only h1 copy was a second header
          to keep in step for no gain. */}
      <PageHeader
        title="Account Matches"
        description="Accounts you and a partner both work. Pick a partner to review their suggested matches."
        backHref="/dashboard"
      />

      <PageTransition>
        {loadFailed ? (
          <Card>
            <div role="alert" className="px-5 py-8 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-danger-soft text-danger">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <h3 className="text-base font-semibold text-ink">
                We couldn&apos;t load your matches
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
                Something went wrong on our side. Your partners and overlaps are safe &mdash;
                try again in a moment.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => {
                  setLoadingConnections(true);
                  void refreshCurrentView();
                }}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Try again
              </Button>
            </div>
          </Card>
        ) : connections.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="No Active Connections"
              description="You need active connections to see account matches."
              action={
                <ButtonLink href="/dashboard/connections" variant="primary" size="lg">
                    Manage Connections
                  </ButtonLink>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <PartnerChips
              allPartnersMode={allPartnersMode}
              allPartnersCount={filteredAccounts.length}
              items={partnerNavItems}
              selectedConnectionId={selectedConnectionId}
              onSelect={setSelectedConnectionId}
              allChipRef={allChipRef}
            />

            <section className="space-y-4 min-w-0">
              <Card padding="none" className="p-3 lg:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] lg:text-lg font-bold lg:font-semibold leading-tight text-ink">
                      {allPartnersMode
                        ? 'Overlapping accounts'
                        : selectedConnection?.otherUser.name ?? 'Partner matches'}
                    </h2>
                    <p className="hidden lg:block text-sm text-ink-3 mt-0.5">
                      {allPartnersMode
                        ? partnerTypeFilter === 'RESELLER'
                          ? 'Your accounts with overlaps across mapped resellers'
                          : partnerTypeFilter === 'OEM'
                            ? 'Your accounts with overlaps across OEM partners'
                            : 'Your accounts with overlaps across all partners'
                        : 'Resolved matches plus rare suggested matches for confirmation'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {allPartnersMode && (
                      <Dropdown
                        aria-label="Partner type filter"
                        value={partnerTypeFilter}
                        onChange={(value) =>
                          setPartnerTypeFilter(value as PartnerTypeFilter)
                        }
                        options={partnerTypeFilterOptions}
                        className="w-40"
                        triggerClassName="min-h-11"
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={refreshCurrentView}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                    {selectedConnection && (
                      <ConnectionControlMenu
                        connection={selectedConnection}
                        onMute={handleMuteConnection}
                        onUnmute={handleUnmuteConnection}
                        onRemove={handleRemoveConnection}
                      />
                    )}
                  </div>
                </div>
              </Card>

              {/* Keyed so switching partner cross-fades the panel instead of
                  snapping. Fade only, never a slide, and motion-safe: drops it
                  entirely under prefers-reduced-motion. */}
              <div key={selectedConnectionId || 'all'} className="space-y-4 ovrlap-swap">
              {allPartnersMode ? (
                <AllPartnersPanel
                  loading={loadingAllPartners}
                  accounts={filteredAccounts}
                  connectionSummaries={filteredConnectionSummaries}
                  totalPartnerOverlaps={filteredTotalOverlaps}
                  onSelectConnection={setSelectedConnectionId}
                />
              ) : (
                <PartnerPanel
                  connection={selectedConnection}
                  loading={loadingPartnerMatches}
                  failed={partnerMatchesFailed}
                  onRetry={() => void loadPartnerMatches(selectedConnectionId)}
                  resolvedMatches={resolvedMatches}
                  suggestedMatches={suggestedMatches}
                  processingDecision={processingDecision}
                  onDecision={handleMatchDecision}
                />
              )}
              </div>
            </section>
          </div>
        )}
      </PageTransition>
    </main>
  );
}

/**
 * The partner picker on phones and tablets. The wide layout keeps its sidebar;
 * this is the same set of destinations and the same live counts in a row that
 * scrolls, with a fade on whichever edge still has chips behind it so the
 * scrollability is visible rather than guessed at.
 */
function PartnerChips({
  className = '',
  allPartnersMode,
  allPartnersCount,
  items,
  selectedConnectionId,
  onSelect,
  allChipRef,
}: {
  className?: string;
  allPartnersMode: boolean;
  allPartnersCount: number;
  items: Array<{ connection: Connection; matchCount: number }>;
  selectedConnectionId: string;
  onSelect: (connectionId: string) => void;
  /* Muting or removing the selected partner closes this page's toolbar, which
     takes the focused control with it. The page falls back to this chip. */
  allChipRef?: React.Ref<HTMLButtonElement>;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measureEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft > 4, end: max > 4 && el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    measureEdges();
    window.addEventListener('resize', measureEdges);
    return () => window.removeEventListener('resize', measureEdges);
  }, [measureEdges, items.length]);

  // Keep the chosen partner on screen when it is picked from elsewhere, e.g.
  // the Connections list linking in with ?connection=.
  useEffect(() => {
    const el = scrollerRef.current;
    const selected = el?.querySelector('[data-selected="true"]');
    if (selected instanceof HTMLElement) {
      selected.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      measureEdges();
    }
  }, [selectedConnectionId, measureEdges]);

  const chip = (key: string, selected: boolean, count: number, title: string, sub: string, onClick: () => void) => (
    <button
      key={key}
      ref={key === 'all' ? allChipRef : undefined}
      type="button"
      data-selected={selected}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-[44px] w-[108px] shrink-0 snap-start flex-col items-start rounded-md border px-2.5 py-2 text-left transition-colors ${
        selected
          ? 'border-accent bg-accent-soft ring-1 ring-accent'
          : 'border-hairline bg-surface'
      }`}
    >
      <span className={`text-[17px] font-extrabold leading-none tracking-tight ${selected ? 'text-accent-ink' : 'text-ink'}`}>
        {count}
      </span>
      <span className="mt-1 w-full truncate text-xs font-bold leading-tight text-ink-2">{title}</span>
      <span className="w-full truncate text-xs leading-tight text-ink-3">{sub}</span>
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        onScroll={measureEdges}
        role="group"
        aria-label="Choose a partner"
        className="flex snap-x gap-2 overflow-x-auto scrollbar-hide pb-0.5"
      >
        {chip('all', allPartnersMode, allPartnersCount, 'All partners', 'accounts', () => onSelect(''))}
        {items.map(({ connection, matchCount }) =>
          chip(
            connection.id,
            connection.id === selectedConnectionId,
            matchCount,
            connection.otherUser.name,
            connection.otherUser.company || connection.otherUser.email,
            () => onSelect(connection.id),
          ),
        )}
      </div>
      {edges.start && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-linear-to-r from-canvas to-transparent" />
      )}
      {edges.end && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-linear-to-l from-canvas to-transparent" />
      )}
      {edges.end && (
        <span className="pointer-events-none absolute -bottom-4 right-0 text-xs font-bold text-ink-3">
          scroll for more &rarr;
        </span>
      )}
    </div>
  );
}

function AllPartnersPanel({
  loading,
  accounts,
  connectionSummaries,
  totalPartnerOverlaps,
  onSelectConnection,
}: {
  loading: boolean;
  accounts: AllMatchesResponse['accounts'];
  connectionSummaries: ConnectionMatchSummary[];
  totalPartnerOverlaps: number;
  onSelectConnection: (connectionId: string) => void;
}) {
  if (loading) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-md border border-hairline p-4">
              <Skeleton className="h-4 w-52" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Search}
          title="No overlaps found yet"
          description="Make sure you and your partners have published account lists. Only resolved matches are shown in the all-partners view."
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden lg:block p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-ink-3">Matched Accounts</div>
            <div className="text-2xl font-bold text-ink">
              {accounts.length}
            </div>
            <div className="text-xs text-ink-3 mt-1">
              {totalPartnerOverlaps} partner overlap
              {totalPartnerOverlaps !== 1 ? 's' : ''} across mapped resellers
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectionSummaries.map((summary) => (
              <button
                key={summary.connectionId}
                type="button"
                onClick={() => onSelectConnection(summary.connectionId)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 text-sm text-ink-2 transition-colors hover:bg-sunken"
              >
                <span className="font-medium">{summary.partnerName}</span>
                <Badge
                  variant={summary.matchCount > 0 ? 'success' : 'outline'}
                  className="!rounded-full"
                >
                  {summary.matchCount}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* One responsive renderer for the overlapping accounts.
          There used to be two — a card list below lg and a wider row layout
          above it — rendering the same data from the same handler. This keeps
          the wide layout's detail (partner company and their list name) and
          the narrow layout's compactness, by letting the row stack. */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline bg-sunken px-3 py-2.5 sm:px-5">
          <span className="text-xs font-bold uppercase tracking-[0.07em] text-ink-3">
            Overlapping accounts &middot; {accounts.length}
          </span>
          <span className="text-xs text-ink-3 tabular">
            {totalPartnerOverlaps} overlap{totalPartnerOverlaps !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y divide-hairline">
          {accounts.map((account) => (
            <div key={account.yourAccountId} className="px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="flex min-w-0 items-center gap-2.5 lg:w-72 lg:shrink-0">
                  <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-soft sm:flex">
                    <Building2 className="h-4 w-4 text-accent-ink" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-ink sm:text-[15px]">
                      {account.yourAccountName}
                    </span>
                    <span className="hidden text-xs text-ink-3 sm:block">
                      {account.partners.length} partner overlap
                      {account.partners.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular lg:hidden ${
                    account.partners.length > 2
                      ? 'bg-accent text-white'
                      : 'border border-ok bg-ok-soft text-ok'
                  }`}>
                    {account.partners.length}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-3">
                  {account.partners.map((partner) => (
                    <button
                      key={`${account.yourAccountId}-${partner.connectionId}`}
                      type="button"
                      onClick={() => onSelectConnection(partner.connectionId)}
                      title={`Their list: ${partner.theirAccountName}`}
                      className="group inline-flex min-h-[44px] max-w-full flex-1 items-center rounded-sm border border-hairline bg-surface px-3 text-left transition-colors hover:border-accent hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:w-full lg:flex-none lg:py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink sm:text-sm">
                          {partner.partnerName}
                        </span>
                        <span className="hidden truncate text-xs text-ink-3 lg:block">
                          {partner.partnerCompany || 'Company not provided'}
                        </span>
                        <span className="hidden truncate text-xs text-ink-3 lg:block">
                          Their list: {partner.theirAccountName}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function PartnerPanel({
  connection,
  loading,
  failed,
  onRetry,
  resolvedMatches,
  suggestedMatches,
  processingDecision,
  onDecision,
}: {
  connection: Connection | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  resolvedMatches: Match[];
  suggestedMatches: Match[];
  processingDecision: string | null;
  onDecision: (
    match: Match,
    decision: 'accepted' | 'rejected',
  ) => Promise<void>;
}) {
  if (!connection) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Partner not found"
          description="Select another partner from the left to view matches."
        />
      </Card>
    );
  }

  if (connection.isMuted) {
    return (
      <Card className="p-5">
        <div className="rounded-md border border-warn bg-warn-soft px-4 py-3">
          <div className="font-medium text-warn">
            This connection is muted
          </div>
          <p className="text-sm text-warn mt-1">
            It is hidden from overlap views until new overlaps are detected or
            you unmute it.
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-md border border-hairline p-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64 mt-2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (failed) {
    return (
      <Card>
        <div role="alert" className="px-5 py-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            We couldn&apos;t load this partner&apos;s matches
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
            Something went wrong loading this partner&apos;s matches. Try again in a moment.
          </p>
          <Button variant="primary" className="mt-4" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  if (resolvedMatches.length === 0 && suggestedMatches.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Search}
          title="No matching accounts found"
          description={`Make sure both you and ${connection.otherUser.name} have published account lists.`}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {suggestedMatches.length > 0 && (
        <Card className="p-4 sm:p-5 border-accent-soft/70 bg-accent-soft">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-accent-ink">
                {suggestedMatches.length} Suggested Match
                {suggestedMatches.length !== 1 ? 'es' : ''}
              </div>
              <p className="text-sm text-accent-ink mt-0.5">
                Suggestions are intentionally conservative. Confirm only if
                these are the same company.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {suggestedMatches.map((match) => {
              const matchKey = `${match.yourAccountId}-${match.theirAccountId}`;
              const isProcessing = processingDecision === matchKey;

              return (
                <div
                  key={matchKey}
                  className="rounded-md border border-accent-soft bg-surface p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink truncate">
                        {match.accountName}
                      </div>
                      <div className="mt-1 text-sm text-ink-2 truncate">
                        You: {match.yourAccountName}
                      </div>
                      <div className="text-sm text-ink-2 truncate">
                        Them: {match.theirAccountName}
                      </div>
                      <div className="mt-2 text-xs text-ink-3">
                        {connection.otherUser.name} •{' '}
                        {connection.otherUser.company ??
                          connection.otherUser.email}
                      </div>
                      <div className="mt-2 inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">
                        Suggested match
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => void onDecision(match, 'rejected')}
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => void onDecision(match, 'accepted')}
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {resolvedMatches.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-hairline bg-sunken/70">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-md bg-ok flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-ink">
                    {resolvedMatches.length} Resolved Match
                    {resolvedMatches.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-sm text-ink-3">
                    {connection.otherUser.name} overlap view
                  </div>
                </div>
              </div>
              <Badge variant="success" size="md">
                {resolvedMatches.length}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-hairline">
            {resolvedMatches.map((match) => (
              <div
                key={`${match.yourAccountId}-${match.theirAccountId}`}
                className="px-4 sm:px-5 py-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 lg:w-80">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">
                        {match.yourAccountName}
                      </div>
                      <div className="text-xs text-ink-3 truncate">
                        Matched to {match.theirAccountName}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">
                      {connection.otherUser.name}
                    </div>
                    <div className="text-xs text-ink-3 truncate">
                      {connection.otherUser.company ??
                        connection.otherUser.email}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
