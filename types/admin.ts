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

// Espelha o TrendAdminDto: situação do motor de tendências no painel interno
export interface TrendAdminTrend {
  kind: string;
  name: string;
  description: string;
  badge: string;
  gender: string;
  colorHex: string | null;
  illustrationKeys: string[];
  keywords: string[];
  sourceCount: number;
  sourceUrls: string[];
}

export interface TrendAdmin {
  running: boolean;
  lastCollection: string | null;
  lastRunSummary: string | null;
  material: { articles: number; headlines: number; searchTerms: number; byOutlet: { outlet: string; count: number }[] };
  reports: {
    audience: string;
    seasonLabel: string;
    runType: string;
    summary: string;
    sourcesConsidered: number;
    model: string;
    createdAt: string;
    trends: TrendAdminTrend[];
  }[];
  recentRuns: { audience: string; seasonLabel: string; runType: string; status: string; model: string | null; error: string | null; createdAt: string; trends: number }[];
  // Compras inteligentes nos últimos 30 dias ("bought" = "Comprei"; boughtTotal desde o início)
  shopping: {
    lists: number;
    suggestions: number;
    bought: number;
    have: number;
    dismissed: number;
    boughtTotal: number;
    dismissReasons: { outlet: string; count: number }[];
  };
}
