import { api } from '@/services/api';
import axios from 'axios';
import { clearSession, getSessionToken, saveSessionToken } from '@/utils/session';

export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token } = response.data;

      if (typeof token !== 'string' || !token.trim()) {
        throw new Error('O servidor nao retornou o token de acesso esperado.');
      }
      saveSessionToken(token);

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          'Erro ao efetuar login. Verifique as credenciais.';
        throw new Error(message);
      }
      if (error instanceof Error) throw error;
      throw new Error('Ocorreu um erro inesperado ao efetuar login.');
    }
  },

  getToken(): string | null {
    return getSessionToken();
  },

  logout() {
    clearSession();
    if (typeof window !== 'undefined') window.location.replace('/login');
  },
};