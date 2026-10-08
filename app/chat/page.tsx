"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Shirt,
  MessageSquare,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  Trash2,
} from "lucide-react";
import { authService } from "@/services/authService";
import { ChatMessage, ChatThread } from "@/types/chat";
import { playSendSound, playReceiveSound } from "@/utils/sound";
import { chatService } from "@/services/chat/chatService";
import { ChatMessageContent } from "@/components/features/ChatMessageContent";
import Image from "next/image";
import { SuggestionPills } from "@/components/features/SuggestionPills";
import { SecureImage } from "@/components/ui/SecureImage";

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
  const [isInitializing, setIsInitializing] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newestMessageId, setNewestMessageId] = useState<string | number | null>(null);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!authService.getToken()) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    async function loadInitialThreads() {
      try {
        const userThreads = await chatService.getThreads(controller.signal);
        if (controller.signal.aborted) return;
        setThreads(userThreads);

        if (userThreads.length > 0) {
          const latestThread = userThreads[0];
          setActiveThreadId(latestThread.id);
          const history = await chatService.getThreadMessages(latestThread.id, controller.signal);
          if (controller.signal.aborted) return;
          setMessages(history);
        }
      } catch (err) {
        if (controller.signal.aborted || axios.isCancel(err)) return;
        console.log("Histórico não disponível:", err);
      } finally {
        if (!controller.signal.aborted && authService.getToken()) setIsInitializing(false);
      }
    }
    loadInitialThreads();
    return () => controller.abort();
  }, [router]);

  const handleNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setIsMobileMenuOpen(false);
  };

  const handleSelectThread = async (threadId: string) => {
    if (threadId === activeThreadId) return;
    setActiveThreadId(threadId);
    setIsMobileMenuOpen(false);
    try {
      const history = await chatService.getThreadMessages(threadId);
      setMessages(history);
    } catch (err) {
      console.error("Erro ao carregar mensagens da conversa:", err);
    }
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    try {
      await chatService.deleteThread(threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Erro ao eliminar conversa:", err);
    }
  };

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
    return <main className="min-h-screen flex items-center justify-center text-stone-600" role="status">Carregando...</main>;
  }

  return (
    <div className="flex h-screen bg-[#FAF8F5] text-stone-900 overflow-hidden font-sans">
      <motion.aside
        initial={false}
        animate={{ width: isSidebarExpanded ? 256 : 68 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
        className="hidden md:flex flex-col justify-between bg-white/80 backdrop-blur-md border-r border-stone-200/80 py-5 px-3 z-20 overflow-hidden"
      >
        <div className="flex flex-col w-full gap-4">
          <div className="flex items-center justify-between w-full min-h-[40px]">
            <AnimatePresence initial={false}>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900 whitespace-nowrap pl-1"
                >
                  stella
                </motion.span>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors ml-auto shrink-0"
            >
              {isSidebarExpanded ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center gap-3 bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-sm transition-all shadow-2xs w-full px-3.5 py-3 rounded-2xl justify-start overflow-hidden active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 text-stone-900 shrink-0" />
            <AnimatePresence initial={false}>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  Nova conversa
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button className="flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98]">
            <Shirt className="w-5 h-5 shrink-0" />
            <AnimatePresence initial={false}>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  Guarda-roupa
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence initial={false}>
            {isSidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="mt-2 flex flex-col overflow-hidden"
              >
                <span className="text-[11px] font-semibold text-stone-400 px-2 uppercase tracking-wider mb-2">
                  Recentes
                </span>
                <div className="overflow-y-auto max-h-[calc(100vh-300px)] space-y-1 pr-1">
                  {threads.length === 0 ? (
                    <p className="text-xs text-stone-400 px-2 py-2 italic">
                      Nenhuma conversa recente
                    </p>
                  ) : (
                    threads.map((thread) => (
                      <motion.div
                        key={thread.id}
                        onClick={() => handleSelectThread(thread.id)}
                        whileHover={{ x: 2 }}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                          activeThreadId === thread.id
                            ? "bg-stone-200/70 text-stone-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                          <span className="truncate">
                            {thread.title || "Conversa com Stella"}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteThread(e, thread.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center border-t border-stone-200/60 pt-3 w-full justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-semibold text-stone-700 shrink-0">
              D
            </div>
            <AnimatePresence initial={false}>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-medium text-stone-800 truncate"
                >
                  Daniel
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => authService.logout()}
            aria-label="Sair da conta"
            title="Sair da conta"
            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative w-72 max-w-[80%] bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between p-5 z-10 border-r border-stone-200"
            >
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900">
                    stella
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-stone-500 hover:text-stone-900 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-stone-900 text-white rounded-2xl font-medium text-sm shadow-sm active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nova conversa</span>
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-stone-700 hover:bg-stone-200/60 rounded-xl font-medium text-sm transition-colors">
                  <Shirt className="w-5 h-5" />
                  <span>Guarda-roupa</span>
                </button>
                <div className="mt-2 flex flex-col overflow-hidden">
                  <span className="text-[11px] font-semibold text-stone-400 px-2 uppercase tracking-wider mb-2">
                    Recentes
                  </span>
                  <div className="overflow-y-auto max-h-[calc(100vh-320px)] space-y-1">
                    {threads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => handleSelectThread(thread.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs ${
                          activeThreadId === thread.id
                            ? "bg-stone-200 text-stone-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                          <span className="truncate">
                            {thread.title || "Conversa com Stella"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-700">
                    D
                  </div>
                  <span className="text-xs font-medium text-stone-800">
                    Daniel
                  </span>
                </div>
                <button
                  onClick={() => authService.logout()}
                  aria-label="Sair da conta"
                  title="Sair da conta"
                  className="p-2 text-stone-400 hover:text-red-600 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full relative">
        <header className="sticky top-0 bg-[#FAF8F5]/90 backdrop-blur-md px-4 sm:px-6 py-4 flex justify-between items-center z-10 border-b border-stone-200/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
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
                Olá, Daniel
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
                        <button className="p-1.5 hover:text-stone-700 hover:bg-stone-200/50 rounded-md transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 hover:text-stone-700 hover:bg-stone-200/50 rounded-md transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 hover:text-stone-700 hover:bg-stone-200/50 rounded-md transition-colors">
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
          <SuggestionPills onSelectSuggestion={(prompt) => setInput(prompt)} />

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
      </div>
    </div>
  );
}