'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { connectionsApi } from '@/features/connections/connections.api';
import type { AccountList } from '@/features/accountLists/types';
import type { Connection } from '@/features/connections/types';
import { Button, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingConnections = connections.filter(c => c.status === 'pending');
  const activeConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GTM Account Mapper</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user.name}!</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="md">
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Account Lists</p>
                <p className="text-3xl font-bold text-gray-900">{accountLists.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Active Connections</p>
                <p className="text-3xl font-bold text-gray-900">{activeConnections.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-900">{pendingConnections.length}</p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account lists and connections</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link href="/dashboard/upload">
              <Button variant="outline" size="lg" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Upload List</div>
                  <div className="text-sm text-gray-500 font-normal">Add a new account list</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/connections">
              <Button variant="outline" size="lg" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Connections</div>
                  <div className="text-sm text-gray-500 font-normal">Manage your connections</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/matches">
              <Button variant="outline" size="lg" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">View Matches</div>
                  <div className="text-sm text-gray-500 font-normal">See account overlaps</div>
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Account Lists */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <CardHeader className="p-0">
              <CardTitle>Your Account Lists</CardTitle>
              <CardDescription>View and manage your uploaded account lists</CardDescription>
            </CardHeader>
            <Link href="/dashboard/upload">
              <Button variant="primary" size="sm">
                + Upload New
              </Button>
            </Link>
          </div>
          {loadingData ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500">Loading your lists...</p>
            </div>
          ) : accountLists.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No account lists yet</h3>
              <p className="text-gray-500 mb-6">Get started by uploading your first account list</p>
              <Link href="/dashboard/upload">
                <Button variant="primary" size="lg">
                  Upload Your First List
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accountLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/dashboard/lists/${list.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{list.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {list._count?.accounts || 0} accounts
                          <span className="mx-2">•</span>
                          <span className={list.status === 'active' ? 'text-emerald-600 font-medium' : 'text-gray-600'}>
                            {list.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {new Date(list.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <div className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        View details →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
