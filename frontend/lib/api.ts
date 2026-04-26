import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — Handle Auth Errors ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),
};

// ─── Resume API ────────────────────────────────────────────────────────────────
export const resumeAPI = {
  upload: (formData: FormData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  list: () => api.get('/resume'),

  get: (id: string) => api.get(`/resume/${id}`),

  delete: (id: string) => api.delete(`/resume/${id}`),
};

// ─── Analyze API ───────────────────────────────────────────────────────────────
export const analyzeAPI = {
  run: (data: {
    resumeId: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }) => api.post('/analyze', data),
};

// ─── Results API ───────────────────────────────────────────────────────────────
export const resultsAPI = {
  list: (page = 1, limit = 10) =>
    api.get('/results', { params: { page, limit } }),

  get: (id: string) => api.get(`/results/${id}`),

  delete: (id: string) => api.delete(`/results/${id}`),

  stats: () => api.get('/results/stats/summary'),
};
