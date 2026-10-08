import { api } from '@/services/api';
import axios from 'axios';
import type { AuthResponseDto, RegisterRequest, UpdateProfileRequestDto, UserResponseDto } from '@/types/auth';
import { requestGoogleAuthorizationCode } from '@/utils/google';
import { clearSession, getSessionToken, saveSessionToken } from '@/utils/session';

function authError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const fieldErrors = data?.fieldErrors;
    const message = fieldErrors && typeof fieldErrors === 'object'
      ? Object.values(fieldErrors).filter((value) => typeof value === 'string').join(' ')
      : data?.message || data?.error;
    return new Error(typeof message === 'string' && message ? message : fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
}

async function authenticate(path: string, payload: unknown, fallback: string): Promise<UserResponseDto> {
  try {
    const { data } = await api.post<AuthResponseDto>(path, payload,
      path === '/auth/google' ? { headers: { 'X-Requested-With': 'XmlHttpRequest' } } : undefined);
    if (typeof data?.token !== 'string' || !data.token.trim() ||
        typeof data.user?.id !== 'string' || typeof data.user?.email !== 'string' ||
        typeof data.user?.onboardingCompleted !== 'boolean') {
      throw new Error('O servidor retornou uma resposta de autenticacao invalida.');
    }
    saveSessionToken(data.token);
    return data.user;
  } catch (error: unknown) {
    throw authError(error, fallback);
  }
}

export const authService = {
  login(email: string, password: string): Promise<UserResponseDto> {
    return authenticate('/auth/login', { email: email.trim(), password },
      'Erro ao efetuar login. Verifique as credenciais.');
  },

  register(request: RegisterRequest): Promise<UserResponseDto> {
    if (request.password.length < 8 || !/[A-Z]/.test(request.password) || !/[0-9]/.test(request.password)) {
      return Promise.reject(new Error('A senha deve ter pelo menos 8 caracteres, uma letra maiuscula e um numero.'));
    }
    if (new TextEncoder().encode(request.password).length > 72) {
      return Promise.reject(new Error('A senha deve ter no maximo 72 bytes.'));
    }
    return authenticate('/auth/register', {
      ...request,
      name: request.name.trim(),
      email: request.email.trim(),
    }, 'Erro ao criar conta. Tente novamente.');
  },

  async loginWithGoogle(idToken?: string): Promise<UserResponseDto> {
    const payload = idToken ? { idToken } : { code: await requestGoogleAuthorizationCode() };
    return authenticate('/auth/google', payload,
      'Falha na autenticacao com o Google.');
  },

  async getCurrentUser(signal?: AbortSignal): Promise<UserResponseDto> {
    try {
      const { data } = await api.get<UserResponseDto>('/auth/me', { signal });
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0)) {
        clearSession();
      }
      throw authError(error, 'Nao foi possivel carregar seu perfil.');
    }
  },

  async updateOnboarding(profile: UpdateProfileRequestDto): Promise<UserResponseDto> {
    try {
      const { data } = await api.put<UserResponseDto>('/auth/me/onboarding', {
        ...profile,
        name: profile.name?.trim(),
        cityName: profile.cityName.trim(),
        cityCoordinates: profile.cityCoordinates?.trim() || undefined,
      });
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0)) {
        clearSession();
      }
      throw authError(error, 'Nao foi possivel salvar seu perfil. Tente novamente.');
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put('/auth/me/password', { currentPassword, newPassword });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0)) {
        clearSession();
      }
      throw authError(error, 'Nao foi possivel alterar sua senha. Tente novamente.');
    }
  },

  getToken(): string | null {
    return getSessionToken();
  },

  async logout(): Promise<void> {
    try {
      if (getSessionToken()) await api.post('/auth/logout', undefined, { timeout: 5000 });
    } catch {
    } finally {
      clearSession();
      if (typeof window !== 'undefined') window.location.replace('/login');
    }
  },
};