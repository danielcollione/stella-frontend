import { getSessionToken } from "@/utils/session";

/**
 * O que cada aba já mostrou, guardado na memória enquanto o app está aberto: ao voltar para a aba, a tela aparece
 * na hora com esses dados e a busca de sempre atualiza por trás (como num app nativo, sem o esqueleto a cada troca).
 * Vale só para a sessão atual: outra conta (ou sair e entrar) começa do zero. Recarregar a página também zera.
 */
const store = new Map<string, { value: unknown; at: number }>();
let owner: string | null = null;

function sameSession(): boolean {
  const token = getSessionToken();
  if (token !== owner) {
    store.clear();
    owner = token;
  }
  return token !== null;
}

/** O valor guardado, se houver e for mais novo que maxAgeMs (ex: fotos com endereço que expira). */
export function readCache<T>(key: string, maxAgeMs = Infinity): T | undefined {
  if (typeof window === "undefined" || !sameSession()) return undefined;
  const entry = store.get(key);
  if (!entry || Date.now() - entry.at > maxAgeMs) return undefined;
  return entry.value as T;
}

export function writeCache<T>(key: string, value: T): void {
  if (typeof window === "undefined" || !sameSession()) return;
  store.set(key, { value, at: Date.now() });
}
