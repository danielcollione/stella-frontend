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
}

export interface SuggestionItem {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}