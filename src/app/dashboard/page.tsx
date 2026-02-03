'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi, connectionsApi, type AccountList, type Connection } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [accountLists, setAccountLists] = useState<AccountList[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
      setAccountLists(listsRes.data);
      setConnections(connectionsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  const pendingConnections = connections.filter(c => c.status === 'pending');
  const activeConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              GTM Account Mapper
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Hi, {user.name}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-3xl font-bold mb-1">{accountLists.length}</div>
            <div className="text-purple-100">Account Lists</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-3xl font-bold mb-1">{activeConnections.length}</div>
            <div className="text-pink-100">Active Connections</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-3xl font-bold mb-1">{pendingConnections.length}</div>
            <div className="text-blue-100">Pending Requests</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/upload"
              className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <div className="text-3xl">📤</div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-purple-600">Upload List</div>
                <div className="text-sm text-gray-500">Add a new account list</div>
              </div>
            </Link>
            <Link
              href="/dashboard/connections"
              className="flex items-center gap-3 p-4 border-2 border-pink-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all group"
            >
              <div className="text-3xl">🤝</div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-pink-600">Connections</div>
                <div className="text-sm text-gray-500">Manage your connections</div>
              </div>
            </Link>
            <Link
              href="/dashboard/matches"
              className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="text-3xl">🎯</div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-600">View Matches</div>
                <div className="text-sm text-gray-500">See account overlaps</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Account Lists */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Account Lists</h2>
            <Link
              href="/dashboard/upload"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Upload New
            </Link>
          </div>
          {loadingData ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : accountLists.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500 mb-4">No account lists yet</p>
              <Link
                href="/dashboard/upload"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Upload Your First List
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accountLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/dashboard/lists/${list.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{list.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {list._count?.accounts || 0} accounts • {list.status}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
