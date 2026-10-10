import axios from 'axios';
import { storeActivation } from './activation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiBaseUrl = API_BASE.replace(/\/$/, '');

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
  async (error) => {
    // An ALREADY-ACTIVE session hitting the activation gate. The token is
    // still valid, so 401 would be wrong — we trade it for an activation
    // token and send the user to verify, keeping them signed in.
    const data = error.response?.data as
      | { code?: string; email?: string; phoneHint?: string | null; needsPhoneNumber?: boolean }
      | undefined;

    if (
      error.response?.status === 403 &&
      data?.code === 'PHONE_VERIFICATION_REQUIRED' &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/verify-phone')
    ) {
      try {
        const res = await api.post('/auth/activation/from-session');
        storeActivation({
          token: res.data.activationToken,
          email: res.data.email,
          phoneHint: res.data.phoneHint,
          needsPhoneNumber: res.data.needsPhoneNumber,
          // Nothing has been sent. The screen asks before texting anyone.
          codeSent: false,
        });
        window.location.href = '/verify-phone';
      } catch {
        // Could not bootstrap activation — fall back to a clean sign-in.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const publicPaths = ['/about', '/privacy', '/terms', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-phone'];
      const isPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p));
      if (!isPublicPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
