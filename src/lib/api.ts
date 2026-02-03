import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AccountList {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  accounts?: Account[];
  _count?: { accounts: number };
}

export interface Account {
  id: string;
  accountName: string;
  type: string | null;
}

export interface Connection {
  id: string;
  status: string;
  createdAt: string;
  otherUser: User;
  isSender: boolean;
}

export interface Match {
  accountName: string;
  yourAccountId: string;
  theirAccountId: string;
  type: string | null;
  theirType: string | null;
}

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  getProfile: () => api.get<User>('/auth/profile'),
};

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

export const connectionsApi = {
  create: (receiverEmail: string) =>
    api.post<Connection>('/connections', { receiverEmail }),
  getAll: () => api.get<Connection[]>('/connections'),
  accept: (id: string) => api.post(`/connections/${id}/accept`),
  delete: (id: string) => api.delete(`/connections/${id}`),
};

export const matchingApi = {
  getMatches: (connectionId: string) =>
    api.get<Match[]>(`/matching/connections/${connectionId}`),
};
