import { api } from "@/services/api";
import type { AdminOverview, TrendAdmin } from "@/types/admin";

export const adminService = {
  // Números do painel interno (o back-end responde 404 para quem não é administrador)
  async overview(days: number, signal?: AbortSignal): Promise<AdminOverview> {
    const { data } = await api.get<AdminOverview>("/admin/overview", { params: { days }, signal });
    return data;
  },

  // Motor de tendências: material coletado, relatórios publicados e últimas execuções
  async trends(signal?: AbortSignal): Promise<TrendAdmin> {
    const { data } = await api.get<TrendAdmin>("/admin/trends", { signal });
    return data;
  },

  // Coleta e gera os relatórios agora, em segundo plano. false = já havia uma execução em andamento
  async runTrends(): Promise<boolean> {
    const { status } = await api.post("/admin/trends/run", null, { validateStatus: (code) => code === 202 || code === 409 });
    return status === 202;
  },
};
