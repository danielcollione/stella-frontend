// Espelha o TrendsDto: a aba Tendências de quem está logado
export type TrendBadge = "INVESTMENT" | "SEASON" | "FLEETING" | "EMERGING";
export type TrendKind = "COLOR" | "SILHOUETTE" | "PIECE" | "PRINT" | "FABRIC" | "STYLING";

// Peça da pessoa: miniatura para a lista, foto original para abrir em tela cheia
export interface TrendOwnedItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  imageUrl: string | null;
}

// Peça em alta, com o selo da tendência em que entrou (o nome da tendência não vem: soaria como descrição da peça)
export interface TrendInsightPiece extends TrendOwnedItem {
  badge: TrendBadge | "";
}

// "Seu armário na estação": as peças em alta. No plano gratuito (locked), só as miniaturas, para aparecer embaçadas
export interface TrendInsight {
  pieces: TrendInsightPiece[];
  locked: boolean;
  // Nenhuma peça entrou em tendência: vem a que mais conversa com a estação
  closest: boolean;
}

export interface Trend {
  id: string;
  kind: TrendKind;
  name: string;
  description: string;
  badge: TrendBadge;
  colorHex: string | null;
  // Até 3 ilustrações que classificam a tendência, a mais fiel primeiro
  illustrationKeys: string[];
  // Presença na imprensa: matérias e manchetes que citam a tendência, e o nível de 1 a 5 (0 = sem contagem)
  pressMentions: number;
  pressLevel: number;
  ownedCount: number;
  owned: TrendOwnedItem[];
  // A pessoa tem peças nesta tendência, mas só vê quais nos planos pagos
  ownedLocked: boolean;
  // Tendência só dos planos pagos: vem sem nome e sem texto, para aparecer embaçada
  locked: boolean;
}

export interface Trends {
  available: boolean;
  seasonLabel: string | null;
  summary: string | null;
  // Paleta de cores da estação (de 4 a 6), das mais fortes para as menos
  palette: { name: string; hex: string }[];
  updatedAt: string | null;
  sourcesConsidered: number;
  wardrobe: { items: number };
  // Nulo enquanto o guarda-roupa está vazio
  insight: TrendInsight | null;
  trends: Trend[];
}

// Espelha o TrendLooksDto: a seção "Seus looks da estação"
export type LookOccasion = "VARIADOS" | "TRABALHO" | "CASUAL" | "FIM_DE_SEMANA" | "NOITE" | "EVENTO";
export type LookTrendLevel = "DISCRETO" | "EQUILIBRADO" | "NA_MODA";
export type LookSwapReason = "TOO_FORMAL" | "TOO_CASUAL" | "NOT_MY_STYLE" | "WRONG_WEATHER" | "COLORS" | "OTHER";

export interface TrendLook {
  id: string;
  title: string;
  occasion: string;
  reasoning: string;
  trends: { name: string; badge: TrendBadge }[];
  items: TrendOwnedItem[];
  // Peça para completar o look (só quando a rodada permitiu sugestão de compra)
  purchase: string | null;
  wornToday: boolean;
}

export interface TrendLooks {
  // false no plano gratuito
  enabled: boolean;
  rounds: { used: number; limit: number; resetsOn: string };
  advancedFilters: boolean;
  // false quando o guarda-roupa ainda não forma nem um look
  canBuildLook: boolean;
  round: {
    id: string;
    createdAt: string;
    occasion: LookOccasion;
    useWeather: boolean;
    trendLevel: LookTrendLevel;
    allowPurchase: boolean;
    swapsUsed: number;
    swapsLimit: number;
  } | null;
  looks: TrendLook[];
}

export interface LookFilters {
  occasion: LookOccasion;
  useWeather: boolean;
  trendLevel: LookTrendLevel;
  allowPurchase: boolean;
}

// Espelha o TrendShoppingDto: a seção "Compras" (Couture)
export type ShoppingMark = "HAVE" | "BOUGHT" | "DISMISSED";
export type ShoppingDismissReason = "NOT_MY_STYLE" | "COLOR" | "BUDGET" | "ROUTINE";

export interface ShoppingSuggestion {
  id: string;
  name: string;
  trendName: string;
  badge: TrendBadge;
  reasoning: string;
  colorHex: string | null;
  illustrationKey: string | null;
  // O que vai para a busca nas lojas
  searchTerm: string;
  // Peças da pessoa que combinam com a sugestão
  pairsWith: TrendOwnedItem[];
  // VISIBLE = sem marcação; as outras ficaram na tela marcadas
  status: "VISIBLE" | ShoppingMark;
  dismissReason: ShoppingDismissReason | null;
}

export interface TrendShopping {
  // false fora do Couture
  enabled: boolean;
  // false enquanto não há tendências publicadas
  available: boolean;
  // true quando a lista da semana ainda não foi montada
  pending: boolean;
  renewsOn: string | null;
  suggestions: ShoppingSuggestion[];
  reserveLeft: number;
}
