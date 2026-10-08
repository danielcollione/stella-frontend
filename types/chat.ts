import type { ClothingItem } from "@/types/wardrobe";

export interface ChatThread {
  id: string;
  title?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id?: string | number;
  sender: 'USER' | 'STELLA';
  content?: string;
  payloadJson?: string | null;
  imageUrls?: string[];
  feedback?: 'LIKE' | 'DISLIKE' | 'NONE';
  wardrobeResult?: WardrobeSaveResult;
  mentionedItems?: ClothingItem[]; // peças do guarda-roupa marcadas com "@"
}

// Resultado do "salvar no guarda-roupa" devolvido no payload da resposta da Stella
export interface WardrobeSaveResult {
  savedItemIds: string[];
  duplicateItemIds: string[];
  failedCount: number;
}

export interface SuggestionItem {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}