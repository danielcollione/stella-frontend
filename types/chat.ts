import type { ClothingItem } from "@/types/wardrobe";
import type { PlanLimitError } from "@/types/billing";

export interface ChatThread {
  id: string;
  title?: string;
  createdAt?: string;
}

export type FeedbackReason = 'TOO_FORMAL' | 'TOO_CASUAL' | 'NOT_MY_STYLE' | 'WRONG_WEATHER' | 'COLORS' | 'OTHER';

export interface ChatMessage {
  id?: string | number;
  sender: 'USER' | 'STELLA';
  content?: string;
  payloadJson?: string | null;
  imageUrls?: string[]; // fotos originais
  thumbnailUrls?: string[]; // miniaturas para a conversa (mesma ordem de imageUrls)
  feedback?: 'LIKE' | 'DISLIKE' | 'NONE';
  feedbackReason?: FeedbackReason | null; // motivo opcional do "não gostei"
  wardrobeResult?: WardrobeSaveResult;
  mentionedItems?: ClothingItem[]; // do usuário: peças marcadas com "@"; da Stella: peças do guarda-roupa que ela indicou
  planLimit?: PlanLimitError; // resposta local quando o plano não permitiu a mensagem (HTTP 402)
  retry?: ChatRetry; // resposta local quando o envio falhou por rede ou servidor: guarda o que reenviar
}

// O que a pessoa tinha enviado quando o servidor não respondeu, para o botão "Tentar de novo"
export interface ChatRetry {
  text: string;
  files: File[];
  mentions: ClothingItem[];
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