// Espelha o FeedbackDto: a avaliação da pessoa (nula se ainda não avaliou) e se o convite automático deve aparecer
export interface AppRating {
  rating: number | null;
  comment: string | null;
  invite: boolean;
}

// De onde veio a avaliação: convite automático, aba Tendências ou Perfil
export type RatingSource = "INVITE" | "TRENDS" | "PROFILE";

// Espelha o FeedbackAdminDto do painel interno
export interface AppRatingAdmin {
  average: number;
  total: number;
  counts: Record<string, number>;
  recent: {
    rating: number;
    comment: string | null;
    source: RatingSource;
    plan: string | null;
    name: string | null;
    email: string | null;
    updatedAt: string;
  }[];
}
