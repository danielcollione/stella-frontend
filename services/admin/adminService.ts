import { api } from "@/services/api";
import type { AdminOverview } from "@/types/admin";

export const adminService = {
  // Números do painel interno (o back-end responde 404 para quem não é administrador)
  async overview(days: number, signal?: AbortSignal): Promise<AdminOverview> {
    const { data } = await api.get<AdminOverview>("/admin/overview", { params: { days }, signal });
    return data;
  },
};
