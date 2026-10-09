"use client";

import { useState, useEffect, useEffectEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Shirt,
  Menu,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  X,
} from "lucide-react";
import { authService } from "@/services/authService";
import type { ChatMessage, FeedbackReason } from "@/types/chat";
import { useAppShell } from "@/components/layout/AppShell";
import { playSendSound, playReceiveSound } from "@/utils/sound";
import { chatService } from "@/services/chat/chatService";
import { ChatMessageContent } from "@/components/features/ChatMessageContent";
import Image from "next/image";
import { SuggestionPills } from "@/components/features/SuggestionPills";
import { SecureImage } from "@/components/ui/SecureImage";
import { PageContent } from "@/components/layout/PageContent";
import { CopyMessageButton } from "@/components/ui/CopyMessageButton";
import { WardrobeSaveToggle } from "@/components/features/WardrobeSaveToggle";
import { WardrobeSaveResult } from "@/components/features/WardrobeSaveResult";
import { useSaveToWardrobePreference } from "@/utils/wardrobePreference";
import { compressImage } from "@/utils/imageCompression";
import { MentionInput, MENTIONS_PER_CONVERSATION } from "@/components/features/mentions/MentionInput";
import { StellaMark } from "@/components/ui/StellaMark";
import { FeedbackReasonPicker } from "@/components/features/FeedbackReasonPicker";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { PlanLimitNotice } from "@/components/features/billing/PlanLimitNotice";
import { planLimitFrom } from "@/services/billing/billingService";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import { MentionedItems, MentionedText } from "@/components/features/mentions/MentionedContent";
import type { ClothingItem } from "@/types/wardrobe";

// Distância do fim da conversa em que ainda se considera que a pessoa "está lá embaixo"
const FOLLOW_THRESHOLD_PX = 120;

function ThumbnailPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const preview = URL.createObjectURL(file);
    image.src = preview;
    return () => {
      image.removeAttribute("src");
      URL.revokeObjectURL(preview);
    };
  }, [file]);

  return (
    <div className="relative group shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        alt="Foto anexada"
        className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-2xl border border-stone-200/80 bg-stone-100"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${file.name}`}
        title="Remover foto"
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/70 text-white shadow-sm backdrop-blur-sm transition-opacity hover:bg-stone-900 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Só fotos: o seletor do sistema às vezes deixa escolher qualquer arquivo (ex: "Todos os arquivos")
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i;

function isImageFile(file: File): boolean {
  // HEIC do iPhone às vezes chega sem tipo; a extensão resolve
  return file.type.startsWith("image/") || (file.type === "" && IMAGE_EXTENSIONS.test(file.name));
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedThread = searchParams.get("thread");
  const newConversation = searchParams.get("new");
  const { user: currentUser, threads, setThreads, threadsReady, activeThreadId, setActiveThreadId, openMobileMenu } = useAppShell();
  const [isInitializing, setIsInitializing] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mentions, setMentions] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newestMessageId, setNewestMessageId] = useState<string | number | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<Set<string>>(new Set());
  const [saveToWardrobe, setSaveToWardrobe] = useSaveToWardrobePreference();
  // Salvar do chat é recurso dos planos pagos; no Provador o toggle vira um atalho para os planos
  const saveLocked = (currentUser?.plan ?? "FREE") === "FREE";
  const mentionsUsedInConversation = messages.reduce(
    (total, message) => total + (message.sender === "USER" ? message.mentionedItems?.length ?? 0 : 0), 0);
  const feedbackRequests = useRef(new Set<string>());
  // "Não gostei" recém-marcado: mostra os motivos logo abaixo daquela resposta
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reasonThanks, setReasonThanks] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [attachNotice, setAttachNotice] = useState("");
  const [draggingFiles, setDraggingFiles] = useState(false);
  const attachNoticeTimer = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];

  const conversationRef = useRef<HTMLElement>(null);
  // Segue o fim da conversa (como no ChatGPT) enquanto a pessoa está lá embaixo; se ela rolar para cima para
  // reler, para de seguir até voltar ao fim ou enviar uma nova mensagem
  const followBottomRef = useRef(true);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  function handleConversationScroll() {
    const element = conversationRef.current;
    if (!element) return;
    followBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < FOLLOW_THRESHOLD_PX;
  }

  // Mensagem nova (enviada ou recebida) ou "Stella pensando": vai até o fim
  useEffect(() => {
    if (lastMessage?.sender === "USER") followBottomRef.current = true;
    if (followBottomRef.current) scrollToBottom();
  }, [messages.length, lastMessage?.id, lastMessage?.sender, isLoading]);

  // A resposta aparece palavra por palavra e as fotos carregam depois: acompanha o crescimento do conteúdo
  useEffect(() => {
    const element = conversationRef.current;
    if (!element) return;
    const follow = () => {
      if (followBottomRef.current) element.scrollTop = element.scrollHeight;
    };
    const observer = new MutationObserver(follow);
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    // "load" de imagens não sobe pela árvore; na fase de captura dá para ouvir no contêiner
    element.addEventListener("load", follow, true);
    return () => {
      observer.disconnect();
      element.removeEventListener("load", follow, true);
    };
    // A conversa só existe depois do "Carregando...": liga o observador quando ela aparece
  }, [isInitializing]);

  async function handleFeedback(message: ChatMessage, selected: 'LIKE' | 'DISLIKE') {
    if (message.sender !== 'STELLA' || !message.id) return;
    const messageId = String(message.id);
    if (feedbackRequests.current.has(messageId)) return;
    const previous = message.feedback ?? 'NONE';
    const feedback = previous === selected ? 'NONE' : selected;
    feedbackRequests.current.add(messageId);
    setPendingFeedback((current) => new Set(current).add(messageId));
    setMessages((current) => current.map((item) =>
      String(item.id) === messageId ? { ...item, feedback } : item));

    try {
      await chatService.sendFeedback(messageId, feedback);
      setMessages((current) => current.map((item) =>
        String(item.id) === messageId ? { ...item, feedback, feedbackReason: null } : item));
      setReasonThanks(null);
      setReasonFor(feedback === "DISLIKE" ? messageId : (current) => (current === messageId ? null : current));
    } catch {
      setMessages((current) => current.map((item) =>
        String(item.id) === messageId && item.feedback === feedback
          ? { ...item, feedback: previous } : item));
    } finally {
      feedbackRequests.current.delete(messageId);
      setPendingFeedback((current) => {
        const next = new Set(current);
        next.delete(messageId);
        return next;
      });
    }
  }

  async function handleFeedbackReason(message: ChatMessage, reason: FeedbackReason) {
    if (!message.id) return;
    const messageId = String(message.id);
    setReasonFor(null);
    setReasonThanks(messageId);
    setMessages((current) => current.map((item) =>
      String(item.id) === messageId ? { ...item, feedbackReason: reason } : item));
    window.setTimeout(() => setReasonThanks((current) => (current === messageId ? null : current)), 2500);
    try {
      await chatService.sendFeedback(messageId, "DISLIKE", reason);
    } catch {
      // O "não gostei" já está salvo; sem o motivo, a Stella ainda aprende com o sinal
    }
  }

  const loadConversation = useEffectEvent(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    const selected = newConversation ? undefined : requestedThread
      ? threads.find((thread) => thread.id === requestedThread)
      : threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
    if (!selected) {
      setActiveThreadId(null);
      setMessages([]);
      setInput("");
      setSelectedFiles([]);
      setIsInitializing(false);
      return;
    }
    try {
      const history = await chatService.getThreadMessages(selected.id, signal);
      if (signal.aborted) return;
      setActiveThreadId(selected.id);
      setMessages(history);
    } catch (failure) {
      if (signal.aborted || axios.isCancel(failure)) return;
      console.error("Erro ao carregar mensagens da conversa:", failure);
    } finally {
      if (!signal.aborted && authService.getToken()) setIsInitializing(false);
    }
  });

  useEffect(() => {
    if (!currentUser) return;
    if (!currentUser.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    if (!threadsReady) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => loadConversation(controller.signal));
    return () => controller.abort();
  }, [router, currentUser, threadsReady, requestedThread, newConversation]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0 && mentions.length === 0) || isLoading) return;

    playSendSound();

    const userText = input;
    const filesToSend = selectedFiles;
    const mentionsToSend = mentions;

    setInput("");
    setSelectedFiles([]);
    setMentions([]);

    const optimisticImageUrls = filesToSend.map((f) => URL.createObjectURL(f));

    const userMsg: ChatMessage = {
      sender: "USER",
      content: userText || undefined,
      imageUrls: optimisticImageUrls.length > 0 ? optimisticImageUrls : undefined,
      mentionedItems: mentionsToSend.length > 0 ? mentionsToSend : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let threadId = activeThreadId;

      if (!threadId) {
        const titleSnippet =
          userText.length > 25
            ? userText.substring(0, 25) + "..."
            : "Análise Visual";
        const newThread = await chatService.createThread(titleSnippet);
        threadId = newThread.id;
        setActiveThreadId(threadId);
        setThreads((prev) => [newThread, ...prev]);
      }

      // Fotos reduzidas e convertidas para JPEG no próprio aparelho antes do upload
      const compressedFiles = await Promise.all(filesToSend.map(compressImage));
      const responseMessage = await chatService.sendMessage(
        threadId,
        userText || undefined,
        compressedFiles.length > 0 ? compressedFiles : undefined,
        { saveToWardrobe: saveToWardrobe && !saveLocked, wardrobeItemIds: mentionsToSend.map((item) => item.id) },
      );

      playReceiveSound();

      const msgId = responseMessage.id || Date.now();
      setNewestMessageId(msgId);

      setMessages((prev) => [
        ...prev,
        { ...responseMessage, id: String(msgId) },
      ]);
    } catch (error) {
      console.error("Erro no envio:", error);
      playReceiveSound();
      // Limite do plano (402): convite para os planos, no lugar de uma mensagem de erro
      const planLimit = planLimitFrom(error);
      setMessages((prev) => [
        ...prev,
        planLimit
          ? { sender: "STELLA", content: planLimit.message, planLimit }
          : {
              sender: "STELLA",
              content: apiErrorMessage(error, "Desculpe, ocorreu um erro ao processar o seu pedido no servidor. Tente novamente."),
            },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    const images = files.filter(isImageFile);
    if (images.length > 0) setSelectedFiles((prev) => [...prev, ...images]);
    if (images.length < files.length) {
      setAttachNotice(images.length === 0
        ? "Só é possível anexar fotos."
        : "Alguns arquivos foram ignorados: só é possível anexar fotos.");
      if (attachNoticeTimer.current) window.clearTimeout(attachNoticeTimer.current);
      attachNoticeTimer.current = window.setTimeout(() => setAttachNotice(""), 4000);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
  };

  // Colar (Ctrl+V) ou arrastar fotos para a caixa de mensagem
  function handlePaste(event: React.ClipboardEvent<HTMLFormElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return; // texto colado segue normal
    event.preventDefault();
    addFiles(files);
  }

  function handleDrop(event: React.DragEvent<HTMLFormElement>) {
    if (event.dataTransfer.files.length === 0) return;
    event.preventDefault();
    setDraggingFiles(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (isInitializing) {
    return <main className="h-full flex items-center justify-center text-stone-600" role="status">Carregando...</main>;
  }

  return (
    <div className="flex h-full bg-[#FAF8F5] text-stone-900 overflow-hidden font-sans">
      

      

      <PageContent fadeOnly className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full relative">
        <header className="sticky top-0 bg-[#FAF8F5]/90 backdrop-blur-md px-4 sm:px-6 py-4 flex justify-between items-center z-10 border-b border-stone-200/40">
          <div className="flex items-center gap-3">
            <button
              onClick={openMobileMenu}
              className="md:hidden p-2 text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900 md:hidden">
              stella
            </span>
          </div>

          <div className="flex items-center gap-2">
            <WardrobeSaveToggle enabled={saveToWardrobe} onChange={setSaveToWardrobe} locked={saveLocked} />
          </div>
        </header>

        <main ref={conversationRef} onScroll={handleConversationScroll} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center my-auto py-16">
              <div className="w-30 h-30 sm:w-36 sm:h-36 rounded-full bg-white border border-stone-200/80 flex items-center justify-center mb-4 shadow-sm overflow-hidden shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Stella Logo"
                  width={350}
                  height={350}
                  className="object-contain w-full h-full scale-120"
                  priority
                />
              </div>

              <h2 className="text-2xl font-serif text-stone-900">
                Olá, {currentUser?.name.split(" ")[0] || "voce"}
              </h2>
              <p className="text-sm text-stone-500 mt-1 font-light max-w-sm">
                Como posso elevar o seu estilo hoje? Envie uma foto do seu look
                ou faça uma pergunta.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === "USER" ? "items-end" : "items-start"
                }`}
              >
                {msg.sender === "USER" ? (
                  <div className="flex flex-col items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {msg.imageUrls.map((url, i) => (
                          // Miniatura na conversa; tocar abre a foto original em tela cheia
                          <button
                            key={i}
                            type="button"
                            onClick={() => setViewerImage(url)}
                            aria-label="Ampliar foto"
                            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                          >
                            <SecureImage
                              src={msg.thumbnailUrls?.[i] ?? url}
                              alt={`Foto enviada ${i + 1}`}
                              className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-xl border border-stone-200/30 shadow-sm"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.mentionedItems && msg.mentionedItems.length > 0 && (
                      <MentionedItems items={msg.mentionedItems} />
                    )}

                    {msg.content && (
                      <div className="bg-stone-900 text-stone-50 px-5 py-3.5 rounded-2xl rounded-tr-xs text-sm leading-relaxed shadow-sm">
                        <MentionedText content={msg.content} items={msg.mentionedItems} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[90%] sm:max-w-[85%] space-y-3">
                    {msg.payloadJson && (
                      <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Shirt className="w-4 h-4 text-stone-700" />
                            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                              Análise Visual
                            </span>
                          </div>
                          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                            Concluída
                          </span>
                        </div>

                        <div className="text-xs text-stone-600 font-mono bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/60 overflow-x-auto">
                          {msg.payloadJson}
                        </div>
                      </div>
                    )}

                    {msg.planLimit ? (
                      <PlanLimitNotice message={msg.planLimit.message} />
                    ) : (
                      <ChatMessageContent
                        content={msg.content || ""}
                        isStella={true}
                        isNew={String(msg.id) === String(newestMessageId)}
                      />
                    )}

                    {msg.wardrobeResult && <WardrobeSaveResult result={msg.wardrobeResult} />}

                    {!msg.planLimit && <div className="flex items-center justify-between gap-3 pt-1 text-stone-400">
                      <StellaMark size={28} decorative />
                      <div className="flex items-center gap-1">
                        <CopyMessageButton text={msg.content || ""} />
                        <button
                          type="button"
                          onClick={() => void handleFeedback(msg, "LIKE")}
                          disabled={!msg.id || pendingFeedback.has(String(msg.id))}
                          aria-pressed={msg.feedback === "LIKE"}
                          aria-label={msg.feedback === "LIKE" ? "Remover gostei" : "Gostei da resposta"}
                          title={msg.feedback === "LIKE" ? "Remover gostei" : "Gostei da resposta"}
                          className={`p-1.5 rounded-md transition-colors disabled:cursor-not-allowed ${msg.feedback === "LIKE" ? "text-stone-900 bg-stone-200/70" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleFeedback(msg, "DISLIKE")}
                          disabled={!msg.id || pendingFeedback.has(String(msg.id))}
                          aria-pressed={msg.feedback === "DISLIKE"}
                          aria-label={msg.feedback === "DISLIKE" ? "Remover nao gostei" : "Nao gostei da resposta"}
                          title={msg.feedback === "DISLIKE" ? "Remover nao gostei" : "Nao gostei da resposta"}
                          className={`p-1.5 rounded-md transition-colors disabled:cursor-not-allowed ${msg.feedback === "DISLIKE" ? "text-stone-900 bg-stone-200/70" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"}`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>}
                    <AnimatePresence>
                      {reasonFor === String(msg.id) && msg.feedback === "DISLIKE" && (
                        <FeedbackReasonPicker
                          onPick={(reason) => void handleFeedbackReason(msg, reason)}
                          onDismiss={() => setReasonFor(null)}
                        />
                      )}
                    </AnimatePresence>
                    {reasonThanks === String(msg.id) && (
                      <p role="status" className="mt-2 text-xs italic text-stone-500">Obrigada! Vou levar isso em conta.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3 text-stone-500 text-xs py-2">
              <StellaMark size={28} decorative className="animate-pulse" />
              <span className="animate-pulse">
                A Stella está a analisar o seu estilo...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 sm:p-6 bg-[#FAF8F5]">
          {!isInitializing && !activeThreadId && messages.length === 0 && (
            <SuggestionPills onSelectSuggestion={(prompt) => setInput(prompt)} />
          )}

          {attachNotice && (
            <p role="status" className="mb-2 px-2 text-xs text-stone-500">{attachNotice}</p>
          )}

          <form
            onSubmit={handleSend}
            onPaste={handlePaste}
            onDragOver={(event) => {
              if (!event.dataTransfer.types.includes("Files")) return;
              event.preventDefault();
              setDraggingFiles(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingFiles(false);
            }}
            onDrop={handleDrop}
            className={`bg-white border rounded-3xl p-2 shadow-sm focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400/20 transition-all ${draggingFiles ? "border-stone-500 ring-2 ring-stone-300/40" : "border-stone-200/90"}`}
          >
            {/* Fotos anexadas ficam dentro da caixa, acima do texto */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none px-2 pt-2 pb-1">
                <AnimatePresence>
                  {selectedFiles.map((file, idx) => (
                    <motion.div
                      key={`${file.name}-${file.lastModified}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ThumbnailPreview file={file} onRemove={() => handleRemoveFile(idx)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <MentionInput
              remainingInConversation={Math.max(0, MENTIONS_PER_CONVERSATION - mentionsUsedInConversation)}
              value={input}
              onChange={setInput}
              mentions={mentions}
              onMentionsChange={setMentions}
              placeholder="Envie uma mensagem, anexe fotos ou use @ para citar uma peça..."
            />

            <div className="flex items-center justify-between pt-1 border-t border-stone-100 px-1">
              <div className="flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.heic,.heif"
                  aria-label="Anexar fotos"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Anexar fotos</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={(!input.trim() && selectedFiles.length === 0 && mentions.length === 0) || isLoading}
                className="p-2.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </form>
        </footer>
      </PageContent>
      <ImageViewer open={viewerImage !== null} onClose={() => setViewerImage(null)} label="Foto enviada">
        {viewerImage && (
          <SecureImage src={viewerImage} alt="Foto enviada" className="max-h-[calc(100dvh-5rem)] max-w-full rounded-xl object-contain shadow-2xl" />
        )}
      </ImageViewer>
    </div>
  );
}