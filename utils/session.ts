const tokenKey = '@stella:token';

export function clearSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(tokenKey);
  }
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = window.localStorage.getItem(tokenKey);
  if (!token) return null;

  try {
    const segments = token.split('.');
    if (segments.length !== 3 || segments.some((segment) => !segment)) {
      throw new Error('Invalid token');
    }
    const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    if (!claims || typeof claims !== 'object' || Array.isArray(claims)) {
      throw new Error('Invalid token payload');
    }
    if (claims.exp !== undefined &&
        (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now())) {
      throw new Error('Expired token');
    }
    return token;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSessionToken(token: string) {
  window.localStorage.setItem(tokenKey, token);
  if (!getSessionToken()) {
    throw new Error('O servidor retornou um token de acesso invalido ou expirado.');
  }
}