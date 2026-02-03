'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { connectionsApi, matchingApi, type Connection, type Match } from '@/lib/api';
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Account Matches
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : connections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Connections</h2>
            <p className="text-gray-500 mb-6">
              You need to have active connections to see account matches.
            </p>
            <Link
              href="/dashboard/connections"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Connections
            </Link>
          </div>
        ) : (
          <>
            {/* Connection Selector */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Connection
              </label>
              <select
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select a connection --</option>
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.otherUser.name} ({connection.otherUser.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Matches Display */}
            {selectedConnectionId && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">
                    Matches with {selectedConnection?.otherUser.name}
                  </h2>
                  <button
                    onClick={loadMatches}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {loadingMatches ? (
                  <div className="text-center py-12 text-gray-500">Finding matches...</div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-500 mb-2">No matching accounts found</p>
                    <p className="text-sm text-gray-400">
                      Make sure both you and {selectedConnection?.otherUser.name} have published account lists.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <div className="font-semibold text-green-900">
                            Found {matches.length} matching account{matches.length !== 1 ? 's' : ''}!
                          </div>
                          <div className="text-sm text-green-700">
                            These accounts appear in both of your lists
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {matches.map((match, index) => (
                        <div
                          key={index}
                          className="p-4 border-2 border-purple-200 bg-purple-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {match.accountName}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 mb-1">Your classification:</div>
                              <div className="font-medium text-purple-700">
                                {match.type || 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Their classification:</div>
                              <div className="font-medium text-purple-700">
                                {match.theirType || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
