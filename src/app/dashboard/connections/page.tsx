'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectionsApi, type Connection } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your network and collaboration partners</p>
              </div>
            </div>
            <Button
              onClick={() => setShowNewConnectionForm(!showNewConnectionForm)}
              variant="primary"
              size="md"
            >
              + New Connection
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Connection Form */}
        {showNewConnectionForm && (
          <Card className="mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle>Send Connection Request</CardTitle>
              <CardDescription>Enter your colleague's email to send a connection request</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateConnection} className="flex gap-3 mt-4">
              <Input
                type="email"
                required
                value={newConnectionEmail}
                onChange={(e) => setNewConnectionEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={creating}
                variant="primary"
                size="md"
                isLoading={creating}
              >
                Send Request
              </Button>
              <Button
                type="button"
                onClick={() => setShowNewConnectionForm(false)}
                variant="outline"
                size="md"
              >
                Cancel
              </Button>
            </form>
          </Card>
        )}

        {/* Pending Requests (Received) */}
        {pendingReceived.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 font-bold">{pendingReceived.length}</span>
              </div>
              <div>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Connection requests waiting for your response</CardDescription>
              </div>
            </div>
            <div className="space-y-3">
              {pendingReceived.map((connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 bg-white border border-amber-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{connection.otherUser.name}</div>
                      <div className="text-sm text-gray-500">{connection.otherUser.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptConnection(connection.id)}
                      variant="success"
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeleteConnection(connection.id)}
                      variant="outline"
                      size="sm"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Connections */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
            <CardDescription>Your accepted connections and collaboration partners</CardDescription>
          </CardHeader>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12 mt-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500">Loading connections...</p>
            </div>
          ) : accepted.length === 0 ? (
            <div className="text-center py-12 mt-4 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No active connections yet</h3>
              <p className="text-gray-500 mb-6">Start connecting with colleagues to find account overlaps</p>
              <Button
                onClick={() => setShowNewConnectionForm(true)}
                variant="primary"
                size="lg"
              >
                Send Your First Connection Request
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {accepted.map((connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{connection.otherUser.name}</div>
                      <div className="text-sm text-gray-500">{connection.otherUser.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Connected on {new Date(connection.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/matches?connection=${connection.id}`}>
                      <Button variant="primary" size="sm">
                        View Matches
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleDeleteConnection(connection.id)}
                      variant="danger"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
              <CardDescription>Connection requests waiting for approval</CardDescription>
            </CardHeader>
            <div className="space-y-3 mt-4">
              {pendingSent.map((connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{connection.otherUser.name}</div>
                      <div className="text-sm text-gray-500">{connection.otherUser.email}</div>
                      <div className="text-xs text-sky-600 mt-1 font-medium">Pending approval</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteConnection(connection.id)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
