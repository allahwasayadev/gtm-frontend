'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import type { AccountList, Account } from '@/features/accountLists/types';
import {
  Button, Card, Badge, EmptyState,
  PageHeader, SkeletonTable, Skeleton, PageTransition, ConfirmationModal,
} from '@/components/ui';
import { Pencil, X, Plus, FileText, Save, List } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const response = await accountListsApi.getOne(listId);
      setList(response.data);
      if (response.data.accounts) {
        setAccounts(response.data.accounts);
      }
    } catch {
      toast.error('Failed to load account list');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [listId, router]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const listsRes = await accountListsApi.getAll();
      const hadPublishedBefore = listsRes.data.some((l) => l.status === 'active');
      await accountListsApi.publish(listId);
      await loadList();
      if (!hadPublishedBefore) {
        setShowPublishSuccessModal(true);
      } else {
        toast.success('Account list published!');
      }
    } catch {
      toast.error('Failed to publish list');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await accountListsApi.delete(listId);
      toast.success('Account list deleted');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete list');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSaveEdits = async () => {
    // One write at a time: without this, repeated clicks sent repeated PUTs and
    // Cancel could land mid-write.
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const accountsData = accounts.map((acc) => ({
        accountName: acc.accountName,
      }));
      await accountListsApi.updateAccounts(listId, accountsData);
      toast.success('Changes saved!');
      setEditing(false);
      await loadList();
    } catch {
      toast.error('Failed to save changes');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <Skeleton variant="rect" className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-hairline shadow-card p-6">
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <PageHeader
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
              onClick={() => setShowDeleteModal(true)}
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
      <PageTransition>
          <Card>
            {/* Premium Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-hairline">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-accent rounded-md flex items-center justify-center shrink-0 shadow-e2">
                  <List className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-ink">Accounts</h3>
                  <p className="text-xs sm:text-sm text-ink-3 mt-0.5">
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
                      void loadList();
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdits}
                    variant="primary"
                    size="sm"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    {!isSaving && <Save className="w-3.5 h-3.5 mr-1.5" />}
                    {isSaving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="border-2 border-dashed border-hairline rounded-md">
                {/* While editing, removing the last row used to take the table
                    and its Add Account footer with it, leaving no way back. */}
                <EmptyState
                  icon={FileText}
                  title="No accounts yet"
                  description={editing ? 'Add your first account to this list.' : 'Click "Edit" to add accounts'}
                  action={
                    editing ? (
                      <Button type="button" variant="primary" size="sm" onClick={handleAddAccount}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Account
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-hairline">
                <table className="w-full">
                  <thead>
                    <tr className="bg-sunken/60 border-b border-hairline">
                      <th
                        scope="col"
                        className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold text-ink-3 uppercase tracking-wider w-14"
                      >
                        #
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-5 py-2.5 text-left text-xs font-semibold text-ink-3 uppercase tracking-wider"
                      >
                        Account
                      </th>
                      {editing && (
                        <th
                          scope="col"
                          className="px-2 sm:px-4 py-2.5 text-center text-xs font-semibold text-ink-3 uppercase tracking-wider w-10 sm:w-16"
                        >
                          <span className="sr-only sm:not-sr-only">
                            Del
                          </span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {accounts.map((account, index) => {
                      return (
                        <tr
                          key={account.id}
                          className={`group transition-colors duration-150 ${editing ? 'bg-surface' : 'bg-surface hover:bg-sunken/80'}`}
                        >
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap align-top">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-2 text-ink-3 text-xs font-semibold group-hover:bg-surface-2/80 group-hover:text-ink-3 transition-colors">
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
                                className="w-full min-h-[44px] px-3 border border-control rounded-sm text-base text-ink bg-surface transition-colors focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent placeholder:text-ink-3"
                              />
                            ) : (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="font-medium text-ink-2 text-sm sm:text-base group-hover:text-ink transition-colors">
                                  {account.accountName}
                                </span>
                              </div>
                            )}
                          </td>
                          {editing && (
                            <td className="px-2 sm:px-4 py-3 text-center align-top">
                              <button
                                onClick={() => handleRemoveAccount(index)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-all duration-200"
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
                <div className="bg-sunken/60 px-3 sm:px-5 py-2.5 border-t border-hairline">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-ink-3">
                      <span className="font-semibold text-ink-2">
                        {accounts.length}
                      </span>{' '}
                      account{accounts.length !== 1 ? 's' : ''}
                    </p>
                    {editing && (
                      <button
                        onClick={handleAddAccount}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-accent hover:text-accent-ink hover:bg-accent-soft rounded-lg transition-all"
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Account List"
        description={`Are you sure you want to delete "${list.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        intent="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
          }
        }}
      />

      <ConfirmationModal
        isOpen={showPublishSuccessModal}
        title="List published"
        description="Your account list is now live. Go to the dashboard to see matches and manage connections."
        confirmLabel="Go to Dashboard"
        cancelLabel="Stay"
        intent="default"
        onConfirm={() => {
          setShowPublishSuccessModal(false);
          router.push('/dashboard');
        }}
        onClose={() => setShowPublishSuccessModal(false)}
      />
    </main>
  );
}
