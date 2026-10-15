import { api } from "@/services/api";
import type { LookFilters, LookSwapReason, ShoppingDismissReason, ShoppingMark, TrendLooks, TrendShopping, Trends } from "@/types/trends";

export const trendsService = {
  // Relatório da estação cruzado com o guarda-roupa (abrir a aba não usa IA)
  async load(signal?: AbortSignal): Promise<Trends> {
    const { data } = await api.get<Trends>("/trends", { signal });
    return data;
  },

  // Looks da estação: rodadas da semana e os looks da rodada mais recente
  async looks(signal?: AbortSignal): Promise<TrendLooks> {
    const { data } = await api.get<TrendLooks>("/trends/looks", { signal });
    return data;
  },

  // Rodada nova com os filtros (a Stella leva alguns segundos para montar)
  async generateLooks(filters: LookFilters): Promise<TrendLooks> {
    const { data } = await api.post<TrendLooks>("/trends/looks", filters, { timeout: 180_000 });
    return data;
  },

  async swapLook(lookId: string, reason: LookSwapReason | null): Promise<TrendLooks> {
    const { data } = await api.post<TrendLooks>(`/trends/looks/${lookId}/swap`, { reason }, { timeout: 120_000 });
    return data;
  },

  // "Usei hoje": registra o look no diário de uso (ou desfaz)
  async setWorn(lookId: string, worn: boolean): Promise<TrendLooks> {
    const { data } = worn
      ? await api.post<TrendLooks>(`/trends/looks/${lookId}/wear`)
      : await api.delete<TrendLooks>(`/trends/looks/${lookId}/wear`);
    return data;
  },

  // Compras: as sugestões da semana (sem IA)
  async shopping(signal?: AbortSignal): Promise<TrendShopping> {
    const { data } = await api.get<TrendShopping>("/trends/shopping", { signal });
    return data;
  },

  // Na primeira visita da semana, a Stella monta a lista (leva alguns segundos); depois devolve a mesma
  async generateShopping(): Promise<TrendShopping> {
    const { data } = await api.post<TrendShopping>("/trends/shopping", null, { timeout: 180_000 });
    return data;
  },

  // "Já tenho", "Comprei" ou "Não é para mim": com replace, a próxima da reserva entra no lugar; sem, o card fica marcado
  async markSuggestion(id: string, status: ShoppingMark, reason: ShoppingDismissReason | null, replace: boolean): Promise<TrendShopping> {
    const { data } = await api.post<TrendShopping>(`/trends/shopping/${id}/mark`, { status, reason, replace });
    return data;
  },

  async unmarkSuggestion(id: string): Promise<TrendShopping> {
    const { data } = await api.delete<TrendShopping>(`/trends/shopping/${id}/mark`);
    return data;
  },
};
