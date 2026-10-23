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

    // Requests that already handle this 403 themselves, and must NOT be
    // hijacked. /auth/login returns its own activation token in the body, so
    // exchanging a session here would either use a stale token for the wrong
    // account or fail and bounce a perfectly good sign-in back to /login.
    // The activation endpoints are excluded for the obvious reason.
    const url = error.config?.url ?? '';
    const selfHandled =
      url.includes('/auth/login') || url.includes('/auth/activation/');

    if (
      error.response?.status === 403 &&
      data?.code === 'PHONE_VERIFICATION_REQUIRED' &&
      !selfHandled &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/verify-phone')
    ) {
      try {
        const res = await api.post('/auth/activation/from-session');

        // Usually nothing has been sent, and the screen asks before texting
        // anyone. The exception is a number change started on the profile
        // screen: that send un-verified the session, and this hand-off is the
        // 403 it caused — the user is already holding a code.
        //
        // The server decides, from the account's own row: a client marker is
        // written when the send RESOLVES, and the 403 can arrive first.
        storeActivation({
          token: res.data.activationToken,
          email: res.data.email,
          phoneHint: res.data.phoneHint,
          needsPhoneNumber: res.data.needsPhoneNumber,
          codeSent: Boolean(res.data.codeOutstanding),
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
