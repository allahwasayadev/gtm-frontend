'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeftRight,
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
  MatchType,
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
  Skeleton,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/error-utils';

const EMPTY_ALL_MATCHES: AllMatchesResponse = {
  matchesMap: {},
  accounts: [],
  connectionSummaries: [],
};

type PartnerTypeFilter = 'ALL' | PartnerRelationshipType;

const partnerTypeFilterOptions: { value: PartnerTypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All partners' },
  { value: 'RESELLER', label: 'Resellers only' },
  { value: 'OEM', label: 'OEMs only' },
];

function getPartnerTypeFromConnection(connection: Connection): PartnerRelationshipType {
  return connection.otherUser?.isOemSeller ? 'OEM' : 'RESELLER';
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
    useState<PartnerTypeFilter>('RESELLER');

  const loadConnections = useCallback(async () => {
    try {
      const response = await connectionsApi.getAll({ includeMuted: true });
      const acceptedConnections = response.data.filter(
        (connection) => connection.status === 'accepted',
      );
      setConnections(acceptedConnections);

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
      toast.error('Failed to load connections');
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load all-partner matches'));
      setAllMatches(EMPTY_ALL_MATCHES);
    } finally {
      setLoadingAllPartners(false);
    }
  }, []);

  const loadPartnerMatches = useCallback(async (connectionId: string) => {
    if (!connectionId) {
      setResolvedMatches([]);
      setSuggestedMatches([]);
      return;
    }

    setLoadingPartnerMatches(true);
    try {
      const response = await matchingApi.getMatches(connectionId);
      setResolvedMatches(response.data.resolved || []);
      setSuggestedMatches(response.data.suggested || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load partner matches'));
      setResolvedMatches([]);
      setSuggestedMatches([]);
    } finally {
      setLoadingPartnerMatches(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadConnections(), loadAllPartnersMatches()]);
  }, [loadConnections, loadAllPartnersMatches]);

  useEffect(() => {
    if (!selectedConnectionId) {
      setResolvedMatches([]);
      setSuggestedMatches([]);
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
        const type = summary?.partnerRelationshipType ?? getPartnerTypeFromConnection(connection);
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
        const type = summaryByConnectionId.get(conn.id)?.partnerRelationshipType
          ?? getPartnerTypeFromConnection(conn);
        if (type !== partnerTypeFilter) {
          setSelectedConnectionId('');
        }
      }
    }
  }, [partnerTypeFilter, selectedConnectionId, connections, summaryByConnectionId]);

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

  const handleMuteConnection = async (connectionId: string) => {
    try {
      await connectionsApi.mute(connectionId);
      toast.success('Connection muted');
      await Promise.all([loadConnections(), loadAllPartnersMatches()]);
      if (selectedConnectionId === connectionId) {
        setSelectedConnectionId('');
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
    } catch (error) {
      toast.error('Failed to remove connection');
      throw error;
    }
  };

  if (loadingConnections) {
    return <LoadingScreen message="Loading connections..." />;
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
      <PageHeader
        title="Account Matches"
        description="View overlaps across all partners, then drill into any reseller"
        backHref="/dashboard"
      />

      <PageTransition>
        {connections.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="No Active Connections"
              description="You need active connections to see account matches."
              action={
                <Link href="/dashboard/connections">
                  <Button variant="primary" size="lg">
                    Manage Connections
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-6">
            <aside className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Views
                    </div>
                    <div className="text-xs text-slate-500">
                      All partners or reseller drilldown
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedConnectionId('')}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                    allPartnersMode
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {partnerTypeFilter === 'RESELLER'
                          ? 'Reseller Overlaps'
                          : partnerTypeFilter === 'OEM'
                            ? 'OEM Overlaps'
                            : 'All Partners'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {partnerTypeFilter === 'RESELLER'
                          ? 'Account-centric reseller overlap view'
                          : partnerTypeFilter === 'OEM'
                            ? 'Account-centric OEM overlap view'
                            : 'Account-centric overlap view'}
                      </div>
                    </div>
                    <Badge variant="info">{filteredAccounts.length}</Badge>
                  </div>
                </button>

                <div className="mt-3 space-y-2">
                  {partnerNavItems.map(({ connection, matchCount }) => {
                    const isSelected = connection.id === selectedConnectionId;
                    return (
                      <button
                        key={connection.id}
                        type="button"
                        onClick={() => setSelectedConnectionId(connection.id)}
                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                          isSelected
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {connection.otherUser.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {connection.otherUser.company ||
                                connection.otherUser.email}
                            </div>
                            {connection.isMuted && (
                              <div className="mt-1">
                                <Badge variant="warning">Muted</Badge>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={matchCount > 0 ? 'success' : 'outline'}
                          >
                            {matchCount}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </aside>

            <section className="space-y-4 min-w-0">
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {allPartnersMode
                        ? partnerTypeFilter === 'RESELLER'
                          ? 'Reseller Overlaps (Account-Centric)'
                          : partnerTypeFilter === 'OEM'
                            ? 'OEM Overlaps (Account-Centric)'
                            : 'All Partners Overlap (Account-Centric)'
                        : `${selectedConnection?.otherUser.name ?? 'Partner'} Matches`}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
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
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
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
                  resolvedMatches={resolvedMatches}
                  suggestedMatches={suggestedMatches}
                  processingDecision={processingDecision}
                  onDecision={handleMatchDecision}
                />
              )}
            </section>
          </div>
        )}
      </PageTransition>
    </main>
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
            <div key={index} className="rounded-xl border border-slate-200 p-4">
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
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">Matched Accounts</div>
            <div className="text-2xl font-bold text-slate-900">
              {accounts.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
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
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
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

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {accounts.map((account, index) => (
            <div key={account.yourAccountId} className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="min-w-0 lg:w-72">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {account.yourAccountName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {account.partners.length} partner overlap
                        {account.partners.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-wrap gap-2">
                  {account.partners.map((partner) => (
                    <button
                      key={`${account.yourAccountId}-${partner.connectionId}`}
                      type="button"
                      onClick={() => onSelectConnection(partner.connectionId)}
                      className="group rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 group-hover:text-indigo-700">
                          {partner.partnerName}
                        </span>
                        <span>•</span>
                        <span>{confidenceLabel(partner.confidence)}</span>
                        <Badge
                          variant={matchTypeBadgeVariant(partner.matchType)}
                          className="!rounded-full"
                        >
                          {matchTypeLabel(partner.matchType)}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {partner.theirAccountName}
                      </div>
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
  resolvedMatches,
  suggestedMatches,
  processingDecision,
  onDecision,
}: {
  connection: Connection | null;
  loading: boolean;
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="font-medium text-amber-900">
            This connection is muted
          </div>
          <p className="text-sm text-amber-800 mt-1">
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
            <div key={index} className="rounded-xl border border-slate-200 p-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64 mt-2" />
            </div>
          ))}
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
        <Card className="p-4 sm:p-5 border-indigo-200/70 bg-linear-to-r from-indigo-50 to-violet-50">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-indigo-950">
                {suggestedMatches.length} Suggested Match
                {suggestedMatches.length !== 1 ? 'es' : ''}
              </div>
              <p className="text-sm text-indigo-800 mt-0.5">
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
                  className="rounded-xl border border-indigo-200 bg-white p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {match.accountName}
                      </div>
                      <div className="mt-1 text-sm text-slate-600 truncate">
                        You: {match.yourAccountName}
                      </div>
                      <div className="text-sm text-slate-600 truncate">
                        Them: {match.theirAccountName}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="info">
                          {confidenceLabel(match.matchConfidence)}
                        </Badge>
                        <Badge variant="outline">Suggested</Badge>
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
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {resolvedMatches.length} Resolved Match
                    {resolvedMatches.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-sm text-slate-500">
                    {connection.otherUser.name} overlap view
                  </div>
                </div>
              </div>
              <Badge variant="success" size="md">
                {resolvedMatches.length}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {resolvedMatches.map((match, index) => (
              <div
                key={`${match.yourAccountId}-${match.theirAccountId}`}
                className="px-4 sm:px-5 py-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 lg:w-80">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 shrink-0">
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {match.yourAccountName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        Matched to {match.theirAccountName}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <Badge variant={matchTypeBadgeVariant(match.matchType)}>
                      {matchTypeLabel(match.matchType)}
                    </Badge>
                    <Badge variant="info">
                      {confidenceLabel(match.matchConfidence)}
                    </Badge>
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

function confidenceLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function matchTypeLabel(matchType: MatchType): string {
  switch (matchType) {
    case 'accepted':
      return 'Exact';
    case 'auto':
      return 'Exact';
    case 'suggested':
      return 'Suggested';
    default:
      return 'Exact';
  }
}

function matchTypeBadgeVariant(
  matchType: MatchType,
): 'success' | 'info' | 'warning' {
  switch (matchType) {
    case 'suggested':
      return 'warning';
    default:
      return 'success';
  }
}
