'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { connectionsApi, matchingApi, type Connection, type Match } from '@/lib/api';
import { Button, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function MatchesPage() {
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

      // Auto-select first connection if preselected not found
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Matches</h1>
              <p className="text-sm text-gray-600 mt-1">Find account overlaps with your connections</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <Card className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Connections</h2>
            <p className="text-gray-500 mb-6">
              You need to have active connections to see account matches.
            </p>
            <Link href="/dashboard/connections">
              <Button variant="primary" size="lg">
                Manage Connections
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Connection Selector */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Connection</CardTitle>
                <CardDescription>Choose a connection to view matching accounts</CardDescription>
              </CardHeader>
              <select
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="mt-4 w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">-- Select a connection --</option>
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.otherUser.name} ({connection.otherUser.email})
                  </option>
                ))}
              </select>
            </Card>

            {/* Matches Display */}
            {selectedConnectionId && (
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <CardHeader className="p-0">
                    <CardTitle>Matches with {selectedConnection?.otherUser.name}</CardTitle>
                    <CardDescription>Account overlaps between your lists</CardDescription>
                  </CardHeader>
                  <Button
                    onClick={loadMatches}
                    variant="outline"
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>

                {loadingMatches ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-gray-500">Finding matches...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No matching accounts found</h3>
                    <p className="text-sm text-gray-500">
                      Make sure both you and {selectedConnection?.otherUser.name} have published account lists.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-900">
                            Found {matches.length} matching account{matches.length !== 1 ? 's' : ''}!
                          </div>
                          <div className="text-sm text-emerald-700 mt-1">
                            These accounts appear in both of your lists
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {matches.map((match, index) => (
                        <div
                          key={index}
                          className="p-5 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {match.accountName}
                              </h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-sky-50 rounded-lg">
                              <div className="text-sky-700 font-medium mb-1">Your classification</div>
                              <div className="font-semibold text-sky-900">
                                {match.type || 'Not specified'}
                              </div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-purple-700 font-medium mb-1">Their classification</div>
                              <div className="font-semibold text-purple-900">
                                {match.theirType || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
