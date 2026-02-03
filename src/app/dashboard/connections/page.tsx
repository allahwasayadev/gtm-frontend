'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectionsApi, type Connection } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  const [newConnectionEmail, setNewConnectionEmail] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      setConnections(response.data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await connectionsApi.create(newConnectionEmail);
      toast.success('Connection request sent!');
      setNewConnectionEmail('');
      setShowNewConnectionForm(false);
      loadConnections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send connection request');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptConnection = async (id: string) => {
    try {
      await connectionsApi.accept(id);
      toast.success('Connection accepted!');
      loadConnections();
    } catch (error) {
      toast.error('Failed to accept connection');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      await connectionsApi.delete(id);
      toast.success('Connection removed');
      loadConnections();
    } catch (error) {
      toast.error('Failed to remove connection');
    }
  };

  const pendingReceived = connections.filter(c => c.status === 'pending' && !c.isSender);
  const pendingSent = connections.filter(c => c.status === 'pending' && c.isSender);
  const accepted = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Connections
              </h1>
            </div>
            <button
              onClick={() => setShowNewConnectionForm(!showNewConnectionForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + New Connection
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Connection Form */}
        {showNewConnectionForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Send Connection Request</h2>
            <form onSubmit={handleCreateConnection} className="flex gap-3">
              <input
                type="email"
                required
                value={newConnectionEmail}
                onChange={(e) => setNewConnectionEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Sending...' : 'Send Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewConnectionForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Pending Requests (Received) */}
        {pendingReceived.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                {pendingReceived.length}
              </span>
              Pending Requests
            </h2>
            <div className="space-y-3">
              {pendingReceived.map((connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{connection.otherUser.name}</div>
                    <div className="text-sm text-gray-500">{connection.otherUser.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptConnection(connection.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeleteConnection(connection.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Connections */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Active Connections</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : accepted.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤝</div>
              <p className="text-gray-500 mb-4">No active connections yet</p>
              <button
                onClick={() => setShowNewConnectionForm(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Send Your First Connection Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accepted.map((connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{connection.otherUser.name}</div>
                    <div className="text-sm text-gray-500">{connection.otherUser.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Connected on {new Date(connection.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/matches?connection=${connection.id}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Matches
                    </Link>
                    <button
                      onClick={() => handleDeleteConnection(connection.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Sent Requests</h2>
            <div className="space-y-3">
              {pendingSent.map((connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{connection.otherUser.name}</div>
                    <div className="text-sm text-gray-500">{connection.otherUser.email}</div>
                    <div className="text-xs text-gray-400 mt-1">Pending approval</div>
                  </div>
                  <button
                    onClick={() => handleDeleteConnection(connection.id)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
