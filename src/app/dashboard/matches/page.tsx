'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { connectionsApi } from '@/features/connections/connections.api';
import { matchingApi } from '@/features/matching/matching.api';
import { ConnectionControlMenu } from '@/features/connections/components/ConnectionControlMenu';
import type { Connection } from '@/features/connections/types';
import type { Match } from '@/features/matching/types';
import {
  Button, Card, Dropdown, EmptyState, PageHeader,
  Skeleton,
  PageTransition, FadeIn, LoadingScreen,
} from '@/components/ui';
import { Users, Search, RefreshCw, Building2, CheckCircle2, ArrowLeftRight, Lightbulb, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';

export default function MatchesPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading matches..." />}>
      <MatchesContent />
    </Suspense>
  );
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const preselectedConnectionId = searchParams.get('connection');

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(preselectedConnectionId || '');
  const [resolvedMatches, setResolvedMatches] = useState<Match[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [processingDecision, setProcessingDecision] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    try {
      const response = await connectionsApi.getAll({ includeMuted: true });
      const activeConnections = response.data.filter(c => c.status === 'accepted');
      setConnections(activeConnections);

      setSelectedConnectionId((currentConnectionId) => {
        const preferredConnectionId = currentConnectionId || preselectedConnectionId || '';
        if (
          preferredConnectionId &&
          activeConnections.some((connection) => connection.id === preferredConnectionId)
        ) {
          return preferredConnectionId;
        }
        return activeConnections[0]?.id ?? '';
      });
    } catch {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [preselectedConnectionId]);

  const loadMatches = useCallback(async () => {
    if (!selectedConnectionId) return;

    setLoadingMatches(true);
    try {
      const response = await matchingApi.getMatches(selectedConnectionId);
      setResolvedMatches(response.data.resolved || []);
      setSuggestedMatches(response.data.suggested || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load matches'));
      setResolvedMatches([]);
      setSuggestedMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, [selectedConnectionId]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (!selectedConnectionId) {
      return;
    }
    void loadMatches();
  }, [selectedConnectionId, loadMatches]);

  const handleMatchDecision = async (match: Match, decision: 'accepted' | 'rejected') => {
    const matchKey = `${match.yourAccountId}-${match.theirAccountId}`;
    setProcessingDecision(matchKey);
    setSuggestedMatches(prev => prev.filter(m =>
      m.yourAccountId !== match.yourAccountId || m.theirAccountId !== match.theirAccountId
    ));

    if (decision === 'accepted') {
      setResolvedMatches(prev => [...prev, { ...match, matchType: 'accepted' as const }]);
    }

    try {
      await matchingApi.setMatchDecision(selectedConnectionId, {
        yourAccountId: match.yourAccountId,
        theirAccountId: match.theirAccountId,
        decision,
      });

      if (decision === 'accepted') {
        toast.success(`Accepted match: ${match.accountName}`);
      } else {
        toast.success('Rejected match suggestion');
      }
    } catch {
      toast.error('Failed to update match decision');
      await loadMatches();
    } finally {
      setProcessingDecision(null);
    }
  };

  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  const connectionOptions = [
    { value: '', label: '-- Select a connection --', disabled: true },
    ...connections.map((c) => ({
      value: c.id,
      label: `${c.otherUser.name} (${c.otherUser.email})${c.isMuted ? ' • Muted' : ''}`,
    })),
  ];

  const handleMuteConnection = async (connectionId: string) => {
    try {
      await connectionsApi.mute(connectionId);
      toast.success('Connection muted');
      await loadConnections();
    } catch (error) {
      toast.error('Failed to mute connection');
      throw error;
    }
  };

  const handleUnmuteConnection = async (connectionId: string) => {
    try {
      await connectionsApi.unmute(connectionId);
      toast.success('Connection unmuted');
      await loadConnections();
    } catch (error) {
      toast.error('Failed to unmute connection');
      throw error;
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await connectionsApi.delete(connectionId);
      toast.success('Connection removed');
      setResolvedMatches([]);
      setSuggestedMatches([]);
      await loadConnections();
    } catch (error) {
      toast.error('Failed to remove connection');
      throw error;
    }
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
      <PageHeader
        title="Account Matches"
        description="Find account overlaps with your connections"
        backHref="/dashboard"
      />
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
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-visible">
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
                        <div className="flex items-center gap-2">
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
                          {selectedConnection && (
                            <ConnectionControlMenu
                              connection={selectedConnection}
                              onMute={handleMuteConnection}
                              onUnmute={handleUnmuteConnection}
                              onRemove={handleRemoveConnection}
                              variant="light"
                            />
                          )}
                        </div>
                      </div>

                      {/* Connection Selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="text-indigo-200 text-sm font-medium shrink-0">Partner:</span>
                        <Dropdown
                          aria-label="Select connection"
                          value={selectedConnectionId}
                          onChange={(value) => setSelectedConnectionId(value)}
                          options={connectionOptions}
                          placeholder="-- Select a connection --"
                          variant="light"
                          className="sm:min-w-64"
                        />
                      </div>
                      {selectedConnection?.isMuted && (
                        <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/90 px-3 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            Muted
                          </span>
                          <p className="mt-1 text-xs sm:text-sm text-amber-800">
                            This connection is hidden from your account view. It will automatically reappear if new overlaps are found.
                          </p>
                        </div>
                      )}
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
                    ) : resolvedMatches.length === 0 && suggestedMatches.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl">
                        <EmptyState
                          icon={Search}
                          title="No matching accounts found"
                          description={`Make sure both you and ${selectedConnection?.otherUser.name} have published account lists.`}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Suggestions Block */}
                        {suggestedMatches.length > 0 && (
                          <FadeIn>
                            <div className="mb-5 p-4 bg-linear-to-r from-indigo-50 to-violet-50 border border-indigo-200/60 rounded-xl">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                  <Lightbulb className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-indigo-900">
                                    {suggestedMatches.length} Suggested Match{suggestedMatches.length !== 1 ? 'es' : ''}
                                  </div>
                                  <div className="text-sm text-indigo-700/80 mt-0.5">
                                    These look like the same company — confirm to add them to your matches
                                  </div>
                                </div>
                              </div>

                              {/* Suggested Match Cards */}
                              <div className="space-y-3">
                                {suggestedMatches.map((match) => {
                                  const matchKey = `${match.yourAccountId}-${match.theirAccountId}`;
                                  const isProcessing = processingDecision === matchKey;

                                  return (
                                    <div
                                      key={matchKey}
                                      className="bg-white rounded-lg border border-indigo-200/60 p-4 shadow-sm"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        {/* Account Info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/15">
                                            <Building2 className="w-4 h-4 text-white" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="font-medium text-slate-900 truncate">
                                              {match.accountName}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[11px] font-medium ring-1 ring-sky-200/50">
                                                You: {match.yourAccountName}
                                              </span>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[11px] font-medium ring-1 ring-violet-200/50">
                                                Them: {match.theirAccountName}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 sm:shrink-0">
                                          <Button
                                            onClick={() => handleMatchDecision(match, 'rejected')}
                                            variant="outline"
                                            size="sm"
                                            disabled={isProcessing}
                                            className="flex-1 sm:flex-none text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer"
                                          >
                                            <X className="w-4 h-4 sm:mr-1" />
                                            <span className="sm:inline">Reject</span>
                                          </Button>
                                          <Button
                                            onClick={() => handleMatchDecision(match, 'accepted')}
                                            variant="primary"
                                            size="sm"
                                            disabled={isProcessing}
                                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                          >
                                            <Check className="w-4 h-4 sm:mr-1" />
                                            <span className="sm:inline">Accept</span>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </FadeIn>
                        )}

                        {/* Summary Banner */}
                        {resolvedMatches.length > 0 && (
                        <FadeIn>
                          <div className="mb-4 p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-emerald-900">
                                  Found {resolvedMatches.length} matching account{resolvedMatches.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-emerald-700/80 mt-0.5">
                                  These accounts appear in both of your lists
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200/60">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {resolvedMatches.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </FadeIn>
                        )}

                        {/* Column Headers (desktop) */}
                        {resolvedMatches.length > 0 && (
                        <div className="hidden sm:flex items-center gap-4 px-1 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="w-8 text-center">#</div>
                          <div className="flex-1">Account</div>
                          <div className="w-20 text-center">Match</div>
                        </div>
                        )}

                        <div className="divide-y divide-slate-100">
                          <AnimatePresence initial={false}>
                            {resolvedMatches.map((match, index) => (
                              <motion.div
                                key={`${match.yourAccountId}-${match.theirAccountId}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                              >
                                {/* Desktop Row */}
                                <div className="hidden sm:flex items-center gap-4 py-3.5 px-1 group hover:bg-indigo-50/40 rounded-lg transition-colors duration-150 -mx-1 sm:px-2">
                                  {/* Rank */}
                                  <div className="w-8 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                      {index + 1}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/15">
                                      <Building2 className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-medium text-slate-900 truncate block">
                                        {match.accountName}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="w-20 text-center shrink-0">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200/60">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Exact
                                    </span>
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
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Exact
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </PageTransition>
        )}
    </main>
  );
}
