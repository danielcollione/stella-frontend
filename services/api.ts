import axios from 'axios';
import { clearSession, getSessionToken } from '@/utils/session';

// Rotas que exigem sessão: sem token (ou com 401/403) o usuário volta para o login
const PROTECTED_PREFIXES = ['/chat/', '/wardrobe/'];

function isProtected(url?: string) {
  return PROTECTED_PREFIXES.some((prefix) => url?.startsWith(prefix));
}

// Endereço da API por ambiente (NEXT_PUBLIC_API_URL). Em desenvolvimento, sem a variável, usa o back-end local;
// em produção a ausência quebra o build de propósito, para nunca publicar um front apontando para localhost.
function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:8080/api/v1';
  throw new Error('NEXT_PUBLIC_API_URL não configurada para o build de produção.');
}

export const api = axios.create({
  baseURL: resolveApiUrl(),
});

// Interceptor para injetar o JWT automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isProtected(config.url)) {
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
      if (isProtected(error.config?.url) && (status === 401 || status === 403)) {
        clearSession();
        window.location.replace('/login?reason=access-denied');
      }
    }
    return Promise.reject(error);
  },
);