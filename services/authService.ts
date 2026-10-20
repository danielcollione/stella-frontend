import { api } from '@/services/api';
import axios from 'axios';
import type { AuthResponseDto, RegisterRequest, UpdateProfileRequestDto, UserResponseDto } from '@/types/auth';
import type { SavedPalette } from '@/types/chat';
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

  // "Esqueci minha senha": o servidor responde igual exista a conta ou não
  async sendPasswordResetCode(email: string): Promise<void> {
    try {
      await api.post('/auth/password-reset/code', { email: email.trim() });
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel enviar o codigo agora. Tente novamente.');
    }
  },

  // Troca a senha com o código recebido por e-mail e já entra na conta
  resetPassword(email: string, code: string, newPassword: string): Promise<UserResponseDto> {
    if (new TextEncoder().encode(newPassword).length > 72) {
      return Promise.reject(new Error('A senha deve ter no maximo 72 bytes.'));
    }
    return authenticate('/auth/password-reset', { email: email.trim(), code: code.trim(), newPassword },
      'Nao foi possivel criar a nova senha. Tente novamente.');
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

  // Confirmação de e-mail (opcional): confere o código de 6 dígitos e devolve o perfil já confirmado
  async verifyEmail(code: string): Promise<UserResponseDto> {
    try {
      const { data } = await api.post<UserResponseDto>('/auth/me/email-verification', { code: code.trim() });
      return data;
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel confirmar o codigo. Tente novamente.');
    }
  },

  async sendVerificationCode(): Promise<void> {
    try {
      await api.post('/auth/me/email-verification/code');
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel enviar o codigo agora. Tente novamente.');
    }
  },

  // Foto de perfil: o servidor guarda só o quadrado do centro da foto, sem edição
  async uploadAvatar(file: File): Promise<UserResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post<UserResponseDto>('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel enviar a foto. Tente outra.');
    }
  },

  async removeAvatar(): Promise<UserResponseDto> {
    try {
      const { data } = await api.delete<UserResponseDto>('/auth/me/avatar');
      return data;
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel tirar a foto agora. Tente novamente.');
    }
  },

  // Paleta de cores que a pessoa salvou a partir de uma análise da Stella (null: nenhuma salva)
  async getPalette(signal?: AbortSignal): Promise<SavedPalette | null> {
    try {
      const response = await api.get<SavedPalette | ''>('/auth/me/palette', { signal });
      return response.status === 204 || !response.data ? null : response.data;
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel carregar sua paleta.');
    }
  },

  // A Stella deixa de considerar a coloração nos looks e nas compras
  async clearPalette(): Promise<void> {
    try {
      await api.delete('/auth/me/palette');
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel apagar sua paleta agora. Tente novamente.');
    }
  },

  // Exclui a conta e todos os dados; em seguida encerra a sessão e volta para a página inicial
  async deleteAccount(password?: string): Promise<void> {
    try {
      await api.post('/auth/me/deletion', { password: password ?? '' });
    } catch (error: unknown) {
      throw authError(error, 'Nao foi possivel excluir a conta agora. Tente novamente.');
    }
    clearSession();
    if (typeof window !== 'undefined') window.location.replace('/');
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