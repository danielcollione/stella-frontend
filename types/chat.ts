import type { ClothingItem } from "@/types/wardrobe";
import type { PlanLimitError } from "@/types/billing";

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
  planLimit?: PlanLimitError; // resposta local quando o plano não permitiu a mensagem (HTTP 402)
}

// Resultado do "salvar no guarda-roupa" devolvido no payload da resposta da Stella
export interface WardrobeSaveResult {
  savedItemIds: string[];
  duplicateItemIds: string[];
  failedCount: number;
  limitReached?: boolean; // guarda-roupa cheio no plano atual
  planRequired?: boolean; // salvar do chat é recurso dos planos pagos
}

export interface SuggestionItem {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}