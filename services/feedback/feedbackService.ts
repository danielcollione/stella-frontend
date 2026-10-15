import { api } from "@/services/api";
import type { AppRating, AppRatingAdmin, RatingSource } from "@/types/feedback";

export const feedbackService = {
  // Situação da avaliação; o app pede ao abrir (conta o dia de uso para o convite)
  async status(signal?: AbortSignal): Promise<AppRating> {
    const { data } = await api.get<AppRating>("/feedback", { signal });
    return data;
  },

  async save(rating: number, comment: string, source: RatingSource): Promise<AppRating> {
    const { data } = await api.put<AppRating>("/feedback", { rating, comment, source });
    return data;
  },

  // O convite automático apareceu: o próximo só daqui a alguns dias, se a pessoa não avaliar
  async inviteShown(): Promise<void> {
    await api.post("/feedback/invite-shown");
  },

  async admin(signal?: AbortSignal): Promise<AppRatingAdmin> {
    const { data } = await api.get<AppRatingAdmin>("/admin/feedback", { signal });
    return data;
  },
};
