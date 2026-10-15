export type ClothingCategory = 'TOP' | 'BOTTOM' | 'FOOTWEAR' | 'OUTERWEAR' | 'ACCESSORY' | 'ONE_PIECE' | 'SWIMWEAR';

export type ClothingStatus = 'AVAILABLE' | 'LAUNDRY' | 'ARCHIVED';

export type ClothingFormality = 'CASUAL' | 'SMART_CASUAL' | 'BUSINESS_CASUAL' | 'FORMAL' | 'BLACK_TIE';

// Espelha o ClothingItemResponseDto do back-end
export interface ClothingItem {
  id: string;
  imageUrl: string; // foto original (URL pré-assinada do R2, temporária)
  thumbnailUrl?: string | null; // miniatura leve para listas; ausente em peças antigas ainda sem miniatura
  name: string | null;
  brand: string | null; // informada pela pessoa; a IA não preenche
  category: ClothingCategory;
  color: string | null;
  style: string | null;
  formality: ClothingFormality | null;
  status: ClothingStatus;
  purchasePrice: number | null;
  timesWorn: number | null;
  lastWornAt: string | null;
  metadataJson: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Só na resposta do cadastro: a foto foi salva sem a análise da Stella e a pessoa preenche os dados
  analysisSkipped?: boolean | null;
  // A Stella tirou o fundo e a foto original ainda está guardada (por pouco tempo): a revisão oferece voltar para ela
  originalPhotoAvailable?: boolean | null;
}

// Espelha o UpdateClothingItemRequestDto: a foto não é editável
export interface UpdateClothingItemRequest {
  name: string | null;
  brand: string | null;
  category: ClothingCategory;
  color: string | null;
  style: string | null;
  formality: ClothingFormality | null;
  purchasePrice: number | null; // quanto a pessoa pagou (opcional)
  status: ClothingStatus;
}

// "ACTIVE" = tudo que está no armário (disponível + lavanderia); ou uma situação específica
export type WardrobeScope = 'ACTIVE' | ClothingStatus;

// Espelha o WardrobePageDto: uma página do infinite scroll e as contagens da tela
export interface WardrobePage {
  items: ClothingItem[];
  page: number;
  size: number;
  total: number; // peças que atendem a todos os filtros
  hasMore: boolean;
  allCount: number; // todas as peças (estado "guarda-roupa vazio")
  activeCount: number; // não arquivadas (cabeçalho)
  categoryCounts: Partial<Record<ClothingCategory, number>>; // por categoria, dentro da situação, sem a busca
}

// Espelha o WardrobeStatsDto: os painéis do guarda-roupa (peças arquivadas ficam de fora)
export interface WardrobeStats {
  totalItems: number;
  wornItems: number; // usadas ao menos uma vez
  looksLogged: number; // looks registrados no diário de uso
  wardrobeValue: number; // soma das peças com preço informado
  pricedItems: number;
  newItemsDays: number;
  newItemsCount: number;
  newItems: ClothingItem[];
  categories: { category: ClothingCategory; count: number }[];
  colors: { label: string; count: number }[];
  brands: { label: string; count: number }[];
  mostWorn: ClothingItem[];
  leastWorn: ClothingItem[];
  pairs: { first: ClothingItem; second: ClothingItem; timesTogether: number }[];
  longestOwned: ClothingItem[];
}
