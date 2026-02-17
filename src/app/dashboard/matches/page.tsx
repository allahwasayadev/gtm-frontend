'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { connectionsApi } from '@/features/connections/connections.api';
import { matchingApi } from '@/features/matching/matching.api';
import type { Connection } from '@/features/connections/types';
import type { Match } from '@/features/matching/types';
import {
  Button, Card, Badge, Select, EmptyState, DashboardHeader,
  Skeleton,
  PageTransition, StaggerList, StaggerItem, FadeIn, LoadingScreen,
} from '@/components/ui';
import { Users, Search, RefreshCw, Building2, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function MatchesPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading matches..." />}>
      <MatchesContent />
    </Suspense>
  );
}

function MatchesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedConnectionId = searchParams.get('connection');

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(preselectedConnectionId || '');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnectionId) {
      loadMatches();
    }
  }, [selectedConnectionId]);

  const loadConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      const activeConnections = response.data.filter(c => c.status === 'accepted');
      setConnections(activeConnections);

      if (preselectedConnectionId && !activeConnections.find(c => c.id === preselectedConnectionId)) {
        if (activeConnections.length > 0) {
          setSelectedConnectionId(activeConnections[0].id);
        }
      } else if (!preselectedConnectionId && activeConnections.length > 0) {
        setSelectedConnectionId(activeConnections[0].id);
      }
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!selectedConnectionId) return;

    setLoadingMatches(true);
    try {
      const response = await matchingApi.getMatches(selectedConnectionId);
      setMatches(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load matches');
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  const connectionOptions = connections.map(c => ({
    value: c.id,
    label: `${c.otherUser.name} (${c.otherUser.email})`,
  }));

  return (
    <>
      <DashboardHeader
        title="Account Matches"
        description="Find account overlaps with your connections"
        backHref="/dashboard"
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <LoadingScreen message="Loading connections..." />
        ) : (
          <PageTransition>
            {connections.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Users}
                  title="No Active Connections"
                  description="You need to have active connections to see account matches."
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
              <>
                {/* Connection Selector + Matches — Single Card */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden">
                  {/* Gradient Header */}
                  <div className="bg-linear-to-br from-indigo-600 via-indigo-500 to-violet-500 px-5 sm:px-6 py-5 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

                    <div className="relative">
                      {/* Top row: icon, title, refresh */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-700/30">
                            <ArrowLeftRight className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-white">Account Matches</h2>
                            <p className="text-indigo-200 text-xs sm:text-sm">Compare accounts with a partner</p>
                          </div>
                        </div>
                        {selectedConnectionId && (
                          <Button
                            onClick={loadMatches}
                            variant="outline"
                            size="sm"
                            className="shrink-0 bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 hover:text-white backdrop-blur-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Refresh</span>
                          </Button>
                        )}
                      </div>

                      {/* Connection Selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="text-indigo-200 text-sm font-medium shrink-0">Partner:</span>
                        <Select
                          value={selectedConnectionId}
                          onChange={(e) => setSelectedConnectionId(e.target.value)}
                          options={connectionOptions}
                          placeholder="-- Select a connection --"
                          className="bg-white/15! border-white/20! text-white! rounded-xl! focus:ring-white/30! focus:border-white/40! [&>option]:text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Matches Body */}
                  <div className="px-5 sm:px-6 py-5">
                    {!selectedConnectionId ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-400">Select a partner above to view matches</p>
                      </div>
                    ) : loadingMatches ? (
                      <div className="space-y-0 divide-y divide-slate-100">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-4 py-4 px-1">
                            <Skeleton variant="rect" className="w-7 h-7 rounded-lg shrink-0" />
                            <Skeleton variant="rect" className="w-8 h-8 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-40" />
                            </div>
                            <Skeleton variant="rect" className="h-6 w-16 rounded-full shrink-0" />
                          </div>
                        ))}
                      </div>
                    ) : matches.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl">
                        <EmptyState
                          icon={Search}
                          title="No matching accounts found"
                          description={`Make sure both you and ${selectedConnection?.otherUser.name} have published account lists.`}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Summary Banner */}
                        <FadeIn>
                          <div className="mb-4 p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-emerald-900">
                                  Found {matches.length} matching account{matches.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-emerald-700/80 mt-0.5">
                                  These accounts appear in both of your lists
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200/60">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {matches.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </FadeIn>

                        {/* Column Headers (desktop) */}
                        <div className="hidden sm:flex items-center gap-4 px-1 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="w-8 text-center">#</div>
                          <div className="flex-1">Account</div>
                          <div className="w-20 text-center">Match</div>
                        </div>

                        {/* Match Rows */}
                        <StaggerList className="divide-y divide-slate-100">
                          {matches.map((match, index) => (
                            <StaggerItem key={index}>
                              {/* Desktop Row */}
                              <div className="hidden sm:flex items-center gap-4 py-3.5 px-1 group hover:bg-indigo-50/40 rounded-lg transition-colors duration-150 -mx-1 sm:px-2">
                                {/* Rank */}
                                <div className="w-8 text-center">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                    {index + 1}
                                  </span>
                                </div>

                                {/* Account Name */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/15">
                                    <Building2 className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-medium text-slate-900 truncate block">
                                      {match.accountName}
                                    </span>
                                    {match.matchConfidence < 1.0 && match.yourAccountName && match.theirAccountName && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[11px] font-medium ring-1 ring-sky-200/50">
                                          You: {match.yourAccountName}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[11px] font-medium ring-1 ring-violet-200/50">
                                          Them: {match.theirAccountName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Confidence */}
                                <div className="w-20 text-center shrink-0">
                                  {match.matchConfidence >= 1.0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200/60">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Exact
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium ring-1 ring-amber-200/60">
                                      ~{Math.round(match.matchConfidence * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Mobile Card */}
                              <div className="sm:hidden py-4 px-1">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                                    {index + 1}
                                  </span>
                                  <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/15">
                                    <Building2 className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="font-medium text-slate-900 text-sm truncate flex-1">
                                    {match.accountName}
                                  </span>
                                  {match.matchConfidence >= 1.0 ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Badge variant="warning" size="sm">
                                      ~{Math.round(match.matchConfidence * 100)}%
                                    </Badge>
                                  )}
                                </div>
                                {match.matchConfidence < 1.0 && match.yourAccountName && match.theirAccountName && (
                                  <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[11px] font-medium ring-1 ring-sky-200/50">
                                      You: {match.yourAccountName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[11px] font-medium ring-1 ring-violet-200/50">
                                      Them: {match.theirAccountName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </StaggerItem>
                          ))}
                        </StaggerList>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </PageTransition>
        )}
      </main>
    </>
  );
}
