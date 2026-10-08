export type ClothingCategory = 'TOP' | 'BOTTOM' | 'FOOTWEAR' | 'OUTERWEAR' | 'ACCESSORY' | 'ONE_PIECE';

export type ClothingStatus = 'AVAILABLE' | 'LAUNDRY' | 'ARCHIVED';

export type ClothingFormality = 'CASUAL' | 'SMART_CASUAL' | 'BUSINESS_CASUAL' | 'FORMAL' | 'BLACK_TIE';

// Espelha o ClothingItemResponseDto do back-end
export interface ClothingItem {
  id: string;
  imageUrl: string; // URL pré-assinada do R2, expira em 15 minutos
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
