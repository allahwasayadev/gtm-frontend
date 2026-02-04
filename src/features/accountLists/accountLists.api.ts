import { api } from '@/lib/axios';
import type { AccountList } from './types';

export const accountListsApi = {
  upload: (file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    return api.post<AccountList>('/account-lists/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get<AccountList[]>('/account-lists'),
  getOne: (id: string) => api.get<AccountList>(`/account-lists/${id}`),
  updateAccounts: (id: string, accounts: Array<{ accountName: string; type?: string }>) =>
    api.put<AccountList>(`/account-lists/${id}/accounts`, { accounts }),
  publish: (id: string) => api.post(`/account-lists/${id}/publish`),
  delete: (id: string) => api.delete(`/account-lists/${id}`),
};
