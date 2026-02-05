'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<AccountList | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadList();
  }, [listId]);

  const loadList = async () => {
    try {
      const response = await accountListsApi.getOne(listId);
      setList(response.data);
      if (response.data.accounts) {
        setAccounts(response.data.accounts);
      }
    } catch (error) {
      toast.error('Failed to load account list');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await accountListsApi.publish(listId);
      toast.success('Account list published!');
      loadList();
    } catch (error) {
      toast.error('Failed to publish list');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this account list?')) {
      return;
    }

    setDeleting(true);
    try {
      await accountListsApi.delete(listId);
      toast.success('Account list deleted');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to delete list');
      setDeleting(false);
    }
  };

  const handleSaveEdits = async () => {
    try {
      const accountsData = accounts.map(acc => ({
        accountName: acc.accountName,
        type: acc.type || undefined,
      }));
      await accountListsApi.updateAccounts(listId, accountsData);
      toast.success('Changes saved!');
      setEditing(false);
      loadList();
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleAddAccount = () => {
    setAccounts([...accounts, { id: `temp-${Date.now()}`, accountName: '', type: null }]);
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleAccountChange = (index: number, field: 'accountName' | 'type', value: string) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value || null };
    setAccounts(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Loading account list...</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium flex-shrink-0">
                ← <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{list.name}</h1>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                  </p>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs sm:text-sm font-medium ${
                    list.status === 'active' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    {list.status === 'active' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              {list.status === 'draft' && !editing && (
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  variant="success"
                  size="sm"
                  isLoading={publishing}
                >
                  Publish
                </Button>
              )}
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="danger"
                size="sm"
                isLoading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">Accounts</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {editing ? 'Edit your account list' : 'View and manage your accounts'}
              </CardDescription>
            </CardHeader>
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                size="sm"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditing(false);
                    loadList();
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdits}
                  variant="primary"
                  size="sm"
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No accounts yet</p>
              <p className="text-sm text-gray-400 mt-2">Click "Edit List" to add accounts</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div>
                <table className="w-full">
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
                      {editing && (
                        <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-semibold text-slate-200 uppercase tracking-wider w-10 sm:w-20">
                          <span className="sr-only sm:not-sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map((account, index) => (
                      <tr
                        key={account.id}
                        className={`
                          transition-colors duration-150
                          ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                          ${editing ? '' : 'hover:bg-slate-100/70'}
                        `}
                      >
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-slate-600 text-sm font-medium">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3">
                          {editing ? (
                            <input
                              type="text"
                              value={account.accountName}
                              onChange={(e) => handleAccountChange(index, 'accountName', e.target.value)}
                              placeholder="Account name"
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all text-slate-900 placeholder-slate-400"
                            />
                          ) : (
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="hidden sm:flex w-8 h-8 rounded-md bg-slate-700 items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {account.accountName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-800 text-sm sm:text-base">{account.accountName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                          {editing ? (
                            <input
                              type="text"
                              value={account.type || ''}
                              onChange={(e) => handleAccountChange(index, 'type', e.target.value)}
                              placeholder="Type"
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all text-slate-900 placeholder-slate-400"
                            />
                          ) : (
                            account.type ? (
                              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {account.type}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )
                          )}
                        </td>
                        {editing && (
                          <td className="px-2 sm:px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveAccount(index)}
                              className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-slate-50 px-3 sm:px-6 py-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{accounts.length}</span> account{accounts.length !== 1 ? 's' : ''}
                  </p>
                  {editing && (
                    <button
                      onClick={handleAddAccount}
                      className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-all"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Add Account</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
