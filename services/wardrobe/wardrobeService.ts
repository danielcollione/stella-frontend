import axios from "axios";
import { api } from "@/services/api";
import type { ClothingItem, ClothingStatus, UpdateClothingItemRequest } from "@/types/wardrobe";

interface ListItemsOptions {
  status?: ClothingStatus;
  query?: string;
  signal?: AbortSignal;
}

// 409 do back-end: a foto corresponde a uma peça que o usuário já tem
export class DuplicateClothingItemError extends Error {
  constructor(public readonly existingItem: ClothingItem, public readonly matchType: "SAME_PHOTO" | "SAME_GARMENT") {
    super("Esta peça já está no seu guarda-roupa.");
    this.name = "DuplicateClothingItemError";
  }
}

// Mensagem de erro do back-end (GlobalExceptionHandler devolve { error }) ou um fallback amigável
export function apiErrorMessage(failure: unknown, fallback: string): string {
  if (axios.isAxiosError(failure)) {
    const data: unknown = failure.response?.data;
    if (data && typeof data === "object") {
      const { error, fieldErrors } = data as { error?: unknown; fieldErrors?: unknown };
      if (fieldErrors && typeof fieldErrors === "object") {
        const first = Object.values(fieldErrors)[0];
        if (typeof first === "string") return first;
      }
      if (typeof error === "string" && error.trim() && failure.response?.status !== 500) return error;
    }
  }
  return fallback;
}

export const wardrobeService = {
  // Lista as peças do usuário logado (mais recentes primeiro)
  async listItems({ status, query, signal }: ListItemsOptions = {}): Promise<ClothingItem[]> {
    const response = await api.get<ClothingItem[]>("/wardrobe/items", {
      params: { status, q: query?.trim() || undefined },
      signal,
    });
    return response.data;
  },

  // Envia a foto: o back-end sanitiza, analisa com IA, barra duplicatas e devolve a peça já cadastrada
  async createItem(file: File, options: { allowDuplicate?: boolean; signal?: AbortSignal } = {}): Promise<ClothingItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.allowDuplicate) formData.append("allowDuplicate", "true");
    try {
      const response = await api.post<ClothingItem>("/wardrobe/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: options.signal,
      });
      return response.data;
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 409) {
        const { existingItem, matchType } = failure.response.data as {
          existingItem: ClothingItem; matchType: "SAME_PHOTO" | "SAME_GARMENT";
        };
        throw new DuplicateClothingItemError(existingItem, matchType);
      }
      throw failure;
    }
  },

  async updateItem(id: string, request: UpdateClothingItemRequest): Promise<ClothingItem> {
    const response = await api.put<ClothingItem>(`/wardrobe/items/${encodeURIComponent(id)}`, request);
    return response.data;
  },

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/wardrobe/items/${encodeURIComponent(id)}`);
  },
};
