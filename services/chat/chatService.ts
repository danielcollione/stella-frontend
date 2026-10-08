import { ChatMessage, ChatThread, WardrobeSaveResult } from "@/types/chat";
import { api } from "@/services/api";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseWardrobeResult(value: unknown): WardrobeSaveResult | null {
  if (!value || typeof value !== "object") return null;
  const { savedItemIds, duplicateItemIds, failedCount } = value as Record<string, unknown>;
  if (!isStringArray(savedItemIds) || !isStringArray(duplicateItemIds) || typeof failedCount !== "number") return null;
  return { savedItemIds, duplicateItemIds, failedCount };
}

function normalizeMessage(message: ChatMessage): ChatMessage {
  if (message.imageUrls?.length || !message.payloadJson) return message;

  try {
    const payload: unknown = JSON.parse(message.payloadJson);
    // Resposta da Stella com o resultado do guarda-roupa: vira dado estruturado, não um bloco de JSON na tela
    if (payload && typeof payload === "object" && "wardrobe" in payload) {
      const wardrobeResult = parseWardrobeResult(payload.wardrobe);
      return { ...message, payloadJson: null, wardrobeResult: wardrobeResult ?? undefined };
    }
    if (!payload || typeof payload !== "object" ||
        !("imageUrls" in payload) || !Array.isArray(payload.imageUrls)) {
      return message;
    }

    return {
      ...message,
      imageUrls: payload.imageUrls.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0,
      ),
    };
  } catch {
    return message;
  }
}

export const chatService = {
  // Listar todas as conversas
  async getThreads(signal?: AbortSignal): Promise<ChatThread[]> {
    const response = await api.get("/chat/threads", { signal });
    return response.data;
  },

  // Criar uma nova conversa
  async createThread(title?: string): Promise<ChatThread> {
    const response = await api.post("/chat/threads", null, {
      params: title ? { title } : {},
    });
    return response.data;
  },

  // Buscar mensagens de uma conversa específica
  async getThreadMessages(threadId: string, signal?: AbortSignal): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/chat/threads/${threadId}/messages`, { signal });
    return response.data.map(normalizeMessage);
  },

  // Enviar mensagem (Texto, Foto ou Ambos) para uma conversa
  async sendMessage(
    threadId: string,
    content?: string,
    files?: File[],
    options: { saveToWardrobe?: boolean; wardrobeItemIds?: string[] } = {},
  ): Promise<ChatMessage> {
    const formData = new FormData();

    if (content) {
      formData.append("content", content);
    }

    // Só faz sentido com fotos: o back-end analisa cada uma e salva a peça no guarda-roupa
    if (options.saveToWardrobe && files && files.length > 0) {
      formData.append("saveToWardrobe", "true");
    }

    // Peças mencionadas com "@": o back-end valida a posse e envia a foto de cada uma para a Stella
    options.wardrobeItemIds?.forEach((id) => formData.append("wardrobeItemIds", id));

    // Anexa múltiplos ficheiros sob a mesma chave 'files'
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const response = await api.post(
      `/chat/threads/${threadId}/messages`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return normalizeMessage(response.data);
  },

  async sendFeedback(messageId: string, feedback: NonNullable<ChatMessage['feedback']>): Promise<void> {
    await api.post(`/chat/messages/${encodeURIComponent(messageId)}/feedback`, { feedback });
  },

  // Apagar conversa
  async deleteThread(threadId: string): Promise<void> {
    await api.delete(`/chat/threads/${threadId}`);
  },
};
