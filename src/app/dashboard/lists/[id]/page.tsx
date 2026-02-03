'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { accountListsApi, type AccountList, type Account } from '@/lib/api';
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
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
                <p className="text-sm text-gray-500">
                  {accounts.length} accounts • Status: {list.status}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {list.status === 'draft' && !editing && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Accounts</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Edit List
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    loadList(); // Reset changes
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdits}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <div key={account.id} className="flex gap-3">
                  <input
                    type="text"
                    value={account.accountName}
                    onChange={(e) => handleAccountChange(index, 'accountName', e.target.value)}
                    placeholder="Account name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={account.type || ''}
                    onChange={(e) => handleAccountChange(index, 'type', e.target.value)}
                    placeholder="Type (optional)"
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleRemoveAccount(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddAccount}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                + Add Account
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No accounts yet</p>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{account.accountName}</span>
                    {account.type && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {account.type}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
