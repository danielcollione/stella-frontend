export type ClothingCategory = 'TOP' | 'BOTTOM' | 'FOOTWEAR' | 'OUTERWEAR' | 'ACCESSORY' | 'ONE_PIECE';

export type ClothingStatus = 'AVAILABLE' | 'LAUNDRY' | 'ARCHIVED';

export type ClothingFormality = 'CASUAL' | 'SMART_CASUAL' | 'BUSINESS_CASUAL' | 'FORMAL' | 'BLACK_TIE';

// Espelha o ClothingItemResponseDto do back-end
export interface ClothingItem {
  id: string;
  imageUrl: string; // foto original (URL pré-assinada do R2, temporária)
  thumbnailUrl?: string | null; // miniatura leve para listas; ausente em peças antigas ainda sem miniatura
  name: string | null;
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
}

// Espelha o UpdateClothingItemRequestDto: a foto não é editável
export interface UpdateClothingItemRequest {
  name: string | null;
  category: ClothingCategory;
  color: string | null;
  style: string | null;
  formality: ClothingFormality | null;
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
