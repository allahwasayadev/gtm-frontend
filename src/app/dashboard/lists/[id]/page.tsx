'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import {
  Button, Card, Badge, EmptyState,
  DashboardHeader, SkeletonTable, Skeleton, PageTransition,
} from '@/components/ui';
import { Pencil, X, Plus, FileText, Save, List } from 'lucide-react';
import toast from 'react-hot-toast';

const avatarColors = [
  'from-indigo-500 to-violet-500 shadow-indigo-500/15',
  'from-sky-500 to-blue-500 shadow-sky-500/15',
  'from-emerald-500 to-teal-500 shadow-emerald-500/15',
  'from-amber-500 to-orange-500 shadow-amber-500/15',
  'from-rose-500 to-pink-500 shadow-rose-500/15',
  'from-violet-500 to-purple-500 shadow-violet-500/15',
];

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
      const accountsData = accounts.map((acc) => ({
        accountName: acc.accountName,
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
    setAccounts([
      ...accounts,
      { id: `temp-${Date.now()}`, accountName: '' },
    ]);
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleAccountChange = (
    index: number,
    value: string,
  ) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], accountName: value };
    setAccounts(updated);
  };

  if (loading) {
    return (
      <>
        <header className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <Skeleton className="h-4 w-12" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton variant="rect" className="h-8 w-20" />
                <Skeleton variant="rect" className="h-8 w-20" />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton variant="rect" className="h-8 w-16" />
            </div>
            <SkeletonTable rows={6} />
          </div>
        </main>
      </>
    );
  }

  if (!list) {
    return null;
  }

  const statusBadge = list.status === 'active'
    ? <Badge variant="success">Published</Badge>
    : list.status === 'archived'
    ? <Badge variant="default">Archived</Badge>
    : <Badge variant="outline">Draft</Badge>;

  return (
    <>
      <DashboardHeader
        title={list.name}
        description={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
        backHref="/dashboard"
        actions={
          <>
            {statusBadge}
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
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageTransition>
          <Card>
            {/* Premium Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                  <List className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">Accounts</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {editing
                      ? 'Edit account names below'
                      : 'View and manage your accounts'}
                  </p>
                </div>
              </div>
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
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
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl">
                <EmptyState
                  icon={FileText}
                  title="No accounts yet"
                  description='Click "Edit" to add accounts'
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/60">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th
                        scope="col"
                        className="hidden sm:table-cell px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14"
                      >
                        #
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                      >
                        Account
                      </th>
                      {editing && (
                        <th
                          scope="col"
                          className="px-2 sm:px-4 py-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10 sm:w-16"
                        >
                          <span className="sr-only sm:not-sr-only">
                            Del
                          </span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {accounts.map((account, index) => {
                      const colorClass = avatarColors[index % avatarColors.length];
                      return (
                        <tr
                          key={account.id}
                          className={`group transition-colors duration-150 ${editing ? 'bg-white' : 'bg-white hover:bg-slate-50/80'}`}
                        >
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap align-top">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold group-hover:bg-slate-200/80 group-hover:text-slate-500 transition-colors">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 py-3 align-top">
                            {editing ? (
                              <input
                                type="text"
                                value={account.accountName}
                                onChange={(e) =>
                                  handleAccountChange(
                                    index,
                                    e.target.value,
                                  )
                                }
                                placeholder="Account name"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:shadow-sm focus:bg-white transition-all text-slate-900 placeholder-slate-400 bg-slate-50/50"
                              />
                            ) : (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`hidden sm:flex w-8 h-8 rounded-lg bg-linear-to-br ${colorClass} items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md`}>
                                  {account.accountName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-700 text-sm sm:text-base group-hover:text-slate-900 transition-colors">
                                  {account.accountName}
                                </span>
                              </div>
                            )}
                          </td>
                          {editing && (
                            <td className="px-2 sm:px-4 py-3 text-center align-top">
                              <button
                                onClick={() => handleRemoveAccount(index)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="bg-slate-50/60 px-3 sm:px-5 py-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {accounts.length}
                      </span>{' '}
                      account{accounts.length !== 1 ? 's' : ''}
                    </p>
                    {editing && (
                      <button
                        onClick={handleAddAccount}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Add Account</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </PageTransition>
      </main>
    </>
  );
}
