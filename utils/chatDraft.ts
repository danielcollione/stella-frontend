// Rascunho para abrir uma conversa nova já com a mensagem escrita e peças marcadas (ex: "montar um look com as
// tendências"). Fica no sessionStorage só até o chat abrir: a pessoa revisa e envia, nada é mandado sozinho.
const draftKey = '@stella:chat-draft';

export interface ChatDraft {
  // Mesmo valor do ?new= da conversa nova, para o rascunho não vazar para outra conversa
  conversation: string;
  // Texto antes e depois das peças, que entram no meio como "@Nome"
  before: string;
  after: string;
  itemIds: string[];
}

export function saveChatDraft(draft: ChatDraft) {
  try {
    window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
  } catch {
    // Sem sessionStorage (modo privado), a conversa abre vazia
  }
}

/** Lê e apaga o rascunho da conversa indicada (null se não houver). */
export function takeChatDraft(conversation: string): ChatDraft | null {
  try {
    const raw = window.sessionStorage.getItem(draftKey);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ChatDraft;
    if (draft.conversation !== conversation) return null;
    window.sessionStorage.removeItem(draftKey);
    return draft;
  } catch {
    return null;
  }
}
