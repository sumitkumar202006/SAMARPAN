import axios from 'axios';

const isProd = process.env.NODE_ENV === 'production';
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isProd ? 'https://samarpan-9rt8.onrender.com' : 'http://localhost:5001');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('samarpanUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }
  return config;
});

// ── Response interceptor: fire UpgradeModal on 402 quota_exceeded ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      const data = error.response.data;
      // Dispatch a custom browser event so UpgradeModalProvider can catch it
      // without needing a direct React context reference here.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samarpan:quota_exceeded', {
          detail: {
            resource: data.error === 'feature_locked' ? data.feature : (data.resource || 'aiGenerations'),
            plan:     data.plan || 'free',
            used:     data.used,
            limit:    data.limit,
            message:  data.message,
          }
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
