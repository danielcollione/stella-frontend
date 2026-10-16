/**
 * Código único (ex: a conversa nova do chat). crypto.randomUUID só existe em endereço seguro (https ou localhost):
 * aberto pela rede local em http, ele não existe e o clique quebrava sem fazer nada. Aí usa uma alternativa.
 */
export function uniqueId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
