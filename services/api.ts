import axios from 'axios';
import { clearSession, getSessionToken } from '@/utils/session';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// Interceptor para injetar o JWT automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.url?.startsWith('/chat/')) {
      window.location.replace('/login');
      throw new axios.CanceledError('Sessao ausente ou expirada.');
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && typeof window !== 'undefined') {
      const status = error.response?.status;
      if (error.config?.url?.startsWith('/chat/') && (status === 401 || status === 403)) {
        clearSession();
        window.location.replace('/login?reason=access-denied');
      }
    }
    return Promise.reject(error);
  },
);