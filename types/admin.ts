// Espelha o AdminOverviewDto: painel interno, só para administradores
export interface AdminOverview {
  days: number;
  usdToBrl: number;
  users: {
    total: number;
    newInPeriod: number;
    trialing: number;
    byPlan: { plan: string; users: number }[];
    newPerDay: { day: string; count: number }[];
  };
  // Visitas à página inicial e, das contas criadas no período, quantas chegaram a cada passo
  funnel: { visits: number; signups: number; onboarded: number; chatted: number; addedItem: number; plannedEvent: number; subscribed: number };
  usage: { day: string; messages: number; photos: number; items: number; eventLooks: number; aiCostUsd: number }[];
  ai: {
    totalUsd: number;
    calls: number;
    byKind: { kind: string; model: string; calls: number; averageUsd: number; totalUsd: number }[];
  };
  plans: { plan: string; users: number; monthlyPriceBrl: number; averageAiCostBrl: number }[];
  topUsers: { email: string; plan: string; calls: number; aiCostUsd: number }[];
}
