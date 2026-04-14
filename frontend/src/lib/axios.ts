import axios from 'axios';

const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname === 'samarpan-quiz.vercel.app' || 
   window.location.hostname.endsWith('.vercel.app'));

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isProduction ? 'https://samarpan-9rt8.onrender.com' : 'http://localhost:5001');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in headers
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

export default api;
