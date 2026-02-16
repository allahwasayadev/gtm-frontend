'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { connectionsApi } from '@/features/connections/connections.api';
import { matchingApi } from '@/features/matching/matching.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import type { Connection } from '@/features/connections/types';
import type { AccountMatchesMap } from '@/features/matching/types';
import {
  Button, Card, CardHeader, CardTitle, CardDescription,
  SkeletonCard, SkeletonTable,
  PageTransition, StaggerList, StaggerItem, FadeIn, LoadingScreen,
  AccountMatchTooltip,
} from '@/components/ui';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([]);
  const [activeList, setActiveList] = useState<AccountList | null>(null);
  const [matchesMap, setMatchesMap] = useState<AccountMatchesMap>({});
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
      setConnections(connectionsRes.data);

      // Find the first active list and load its accounts
      const active = listsRes.data.find((l) => l.status === 'active');
      const listToShow = active || listsRes.data[0];

      if (listToShow) {
        const listDetail = await accountListsApi.getOne(listToShow.id);
        setActiveList(listDetail.data);
        setActiveAccounts(listDetail.data.accounts || []);
      }

      // Load all matches map (only works if user has active list + connections)
      try {
        const matchesRes = await matchingApi.getAllMatches();
        setMatchesMap(matchesRes.data);
      } catch {
        // Silently ignore - matches may not be available yet
      }
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
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  const pendingConnections = connections.filter(c => c.status === 'pending');
  const activeConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">GTM Account Mapper</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Welcome, <Link href="/dashboard/profile" className="text-indigo-600 hover:text-indigo-700 font-medium">{user.name}</Link>!
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="flex-shrink-0">
              <span className="hidden sm:inline">Log Out</span>
              <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageTransition>
          {/* Quick Stats */}
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StaggerItem>
                <Card hover>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Account List</p>
                      <p className="text-3xl font-bold text-gray-900">{activeList ? 1 : 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
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
              </StaggerItem>
              <StaggerItem>
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
              </StaggerItem>
            </StaggerList>
          )}

          {/* Quick Actions */}
          <FadeIn delay={0.15}>
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
          </FadeIn>

          {/* PRIMARY: Account List Table */}
          <FadeIn delay={0.2}>
            <Card className="mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-base sm:text-lg">
                    {activeList ? activeList.name : 'Your Accounts'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {activeList
                      ? `${activeAccounts.length} account${activeAccounts.length !== 1 ? 's' : ''} • ${activeList.status === 'active' ? 'Published' : 'Draft'}`
                      : 'Upload an account list to get started'}
                    {Object.keys(matchesMap).length > 0 && (
                      <span className="ml-2 text-indigo-600">
                        • Hover company names to see matches
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <div className="flex gap-2 sm:flex-shrink-0">
                  {activeList && (
                    <Link href={`/dashboard/lists/${activeList.id}`}>
                      <Button variant="outline" size="sm">
                        Edit List
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard/upload">
                    <Button variant="primary" size="sm">
                      + Upload New
                    </Button>
                  </Link>
                </div>
              </div>

              {loadingData ? (
                <SkeletonTable rows={6} />
              ) : !activeList || activeAccounts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No accounts yet</h3>
                  <p className="text-gray-500 mb-6">Get started by uploading your first account list</p>
                  <Link href="/dashboard/upload">
                    <Button variant="primary" size="lg">
                      Upload Your First List
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-0">
                    <thead>
                      <tr className="bg-slate-800">
                        <th scope="col" className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider w-14">
                          #
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                          Account Name
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider w-20 sm:w-40">
                          Type
                        </th>
                        <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider" style={{ width: '220px' }}>
                          Matched Reps
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeAccounts.map((account, index) => {
                        const partners = matchesMap[account.id] || [];
                        return (
                          <tr
                            key={account.id}
                            className={`
                              transition-colors duration-150
                              ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                              hover:bg-slate-100/70
                            `}
                          >
                            <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-slate-600 text-sm font-medium">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="hidden sm:flex w-8 h-8 rounded-md bg-slate-700 items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                  {account.accountName.charAt(0).toUpperCase()}
                                </div>
                                <AccountMatchTooltip partners={partners}>
                                  <span className="font-medium text-slate-800 text-sm sm:text-base">
                                    {account.accountName}
                                  </span>
                                </AccountMatchTooltip>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                              {account.type ? (
                                <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  {account.type}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3">
                              {partners.length > 0 ? (
                                <div className="flex items-center gap-1 max-w-[160px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                  <span className="text-xs font-medium text-slate-700 truncate">
                                    {partners.map(p => p.partnerCompany ? `${p.partnerName} – ${p.partnerCompany}` : p.partnerName).join(', ')}
                                  </span>
                                  {partners.length > 1 && (
                                    <span className="flex-shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1">
                                      {partners.length}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="bg-slate-50 px-3 sm:px-6 py-2.5 border-t border-slate-200">
                    <p className="text-xs sm:text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{activeAccounts.length}</span> account{activeAccounts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </FadeIn>

        </PageTransition>
      </main>
    </div>
  );
}
