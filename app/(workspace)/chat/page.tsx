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
} from "lucide-react";
import { authService } from "@/services/authService";
import type { ChatMessage } from "@/types/chat";
import { useAppShell } from "@/components/layout/AppShell";
import { playSendSound, playReceiveSound } from "@/utils/sound";
import { chatService } from "@/services/chat/chatService";
import { ChatMessageContent } from "@/components/features/ChatMessageContent";
import Image from "next/image";
import { SuggestionPills } from "@/components/features/SuggestionPills";
import { SecureImage } from "@/components/ui/SecureImage";
import { PageContent } from "@/components/layout/PageContent";
import { CopyMessageButton } from "@/components/ui/CopyMessageButton";

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
      <img 
        ref={imageRef}
        alt="Preview" 
        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-stone-200/80 shadow-sm" 
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${file.name}`}
        title="Remover foto"
        className="absolute -top-1.5 -right-1.5 bg-white text-stone-500 hover:text-red-600 border border-stone-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
      >
        ✕
      </button>
    </div>
  );
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newestMessageId, setNewestMessageId] = useState<string | number | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<Set<string>>(new Set());
  const feedbackRequests = useRef(new Set<string>());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, lastMessage?.id, lastMessage?.content, isLoading]);

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
        String(item.id) === messageId ? { ...item, feedback } : item));
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
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    playSendSound();

    const userText = input;
    const filesToSend = selectedFiles;

    setInput("");
    setSelectedFiles([]);

    const optimisticImageUrls = filesToSend.map((f) => URL.createObjectURL(f));

    const userMsg: ChatMessage = {
      sender: "USER",
      content: userText || undefined,
      imageUrls: optimisticImageUrls.length > 0 ? optimisticImageUrls : undefined,
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

      const responseMessage = await chatService.sendMessage(
        threadId,
        userText || undefined,
        filesToSend.length > 0 ? filesToSend : undefined
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
      setMessages((prev) => [
        ...prev,
        {
          sender: "STELLA",
          content:
            "Desculpe, ocorreu um erro ao processar o seu pedido no servidor. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

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
            <span className="text-xs font-medium text-stone-500 bg-stone-200/50 px-3 py-1 rounded-full border border-stone-300/40">
              Estilista Ativa
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
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
                          <SecureImage
                            key={i}
                            src={url}
                            alt={`Upload ${i}`}
                            className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-xl border border-stone-200/30 shadow-sm"
                          />
                        ))}
                      </div>
                    )}

                    {msg.content && (
                      <div className="bg-stone-900 text-stone-50 px-5 py-3.5 rounded-2xl rounded-tr-xs text-sm leading-relaxed shadow-sm">
                        {msg.content}
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

                    <ChatMessageContent
                      content={msg.content || ""}
                      isStella={true}
                      isNew={String(msg.id) === String(newestMessageId)}
                    />

                    <div className="flex items-center gap-3 pt-1 text-stone-400">
                      <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-white text-[10px] font-serif italic">
                        S
                      </div>
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
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3 text-stone-500 text-xs py-2">
              <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-white text-[10px] font-serif italic animate-pulse">
                S
              </div>
              <span className="animate-pulse">
                A Stella está a analisar o seu estilo...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 sm:p-6 bg-[#FAF8F5]">
          {threads.length === 0 && messages.length === 0 && (
            <SuggestionPills onSelectSuggestion={(prompt) => setInput(prompt)} />
          )}

          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto mb-3 pb-2 scrollbar-none px-1">
              <AnimatePresence>
                {selectedFiles.map((file, idx) => (
                  <motion.div
                    key={`${file.name}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <ThumbnailPreview
                      file={file}
                      onRemove={() => handleRemoveFile(idx)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="bg-white border border-stone-200/90 rounded-3xl p-2 shadow-sm focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400/20 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Envie uma mensagem ou anexe fotos do seu look..."
              className="w-full px-4 pt-2 pb-3 text-sm bg-transparent focus:outline-none placeholder:text-stone-400 text-stone-900 font-light"
            />

            <div className="flex items-center justify-between pt-1 border-t border-stone-100 px-1">
              <div className="flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
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
                disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                className="p-2.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </form>
        </footer>
      </PageContent>
    </div>
  );
}