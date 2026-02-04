'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { accountListsApi, type AccountList, type Account } from '@/lib/api';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                  </p>
                  <span className="text-gray-400">•</span>
                  <span className={`text-sm font-medium ${
                    list.status === 'active' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    {list.status === 'active' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {list.status === 'draft' && !editing && (
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  variant="success"
                  size="md"
                  isLoading={publishing}
                >
                  Publish
                </Button>
              )}
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="danger"
                size="md"
                isLoading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <CardHeader className="p-0">
              <CardTitle>Accounts</CardTitle>
              <CardDescription>
                {editing ? 'Edit your account list' : 'View and manage your accounts'}
              </CardDescription>
            </CardHeader>
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                size="md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit List
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditing(false);
                    loadList(); // Reset changes
                  }}
                  variant="outline"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdits}
                  variant="primary"
                  size="md"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <div key={account.id} className="flex gap-3 items-start">
                  <Input
                    type="text"
                    value={account.accountName}
                    onChange={(e) => handleAccountChange(index, 'accountName', e.target.value)}
                    placeholder="Account name"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={account.type || ''}
                    onChange={(e) => handleAccountChange(index, 'type', e.target.value)}
                    placeholder="Type (optional)"
                    className="w-48"
                  />
                  <Button
                    onClick={() => handleRemoveAccount(index)}
                    variant="ghost"
                    size="md"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              ))}
              <button
                onClick={handleAddAccount}
                className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">{account.accountName}</span>
                    </div>
                    {account.type && (
                      <span className="text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                        {account.type}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
