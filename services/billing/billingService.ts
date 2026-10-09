import axios from "axios";
import { api } from "@/services/api";
import type { BillingInterval, BillingStatus, Plan, PlanCode, PlanLimitError } from "@/types/billing";

export const billingService = {
  async listPlans(signal?: AbortSignal): Promise<Plan[]> {
    const { data } = await api.get<Plan[]>("/plans", { signal });
    return data;
  },

  async status(signal?: AbortSignal): Promise<BillingStatus> {
    const { data } = await api.get<BillingStatus>("/billing/me", { signal });
    return data;
  },

  // Devolve a URL do Stripe Checkout; o front redireciona
  async startCheckout(planCode: PlanCode, interval: BillingInterval): Promise<string> {
    const { data } = await api.post<{ url: string }>("/billing/checkout", { planCode, interval });
    return data.url;
  },

  // Portal do Stripe: trocar de plano, atualizar cartão, faturas e cancelamento
  async openPortal(): Promise<string> {
    const { data } = await api.post<{ url: string }>("/billing/portal");
    return data.url;
  },
};

/** Reconhece o HTTP 402 do back-end (limite do plano atingido ou recurso de outro plano). */
export function planLimitFrom(failure: unknown): PlanLimitError | null {
  if (!axios.isAxiosError(failure) || failure.response?.status !== 402) return null;
  const data = failure.response.data as Partial<PlanLimitError & { error: string }> | undefined;
  return {
    message: data?.error ?? "Este recurso não está disponível no seu plano.",
    entitlementKey: data?.entitlementKey ?? "",
    planCode: (data?.planCode as PlanCode) ?? "FREE",
    limit: data?.limit ?? 0,
  };
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 });
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
