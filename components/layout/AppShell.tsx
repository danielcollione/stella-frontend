"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, ChartNoAxesColumn, Gem, LogOut, MessageSquare, PanelLeft, PanelLeftClose, Plus, Shirt, Trash2, TrendingUp, X } from "lucide-react";
import { StellaMark } from "@/components/ui/StellaMark";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { FeedbackProvider } from "@/components/features/feedback/FeedbackProvider";
import { InstallCard } from "@/components/features/install/InstallCard";
import { MobileTabBar, MobileTopBar, useKeyboardOpen } from "@/components/layout/MobileNav";
import { authService } from "@/services/authService";
import { chatService } from "@/services/chat/chatService";
import type { UserResponseDto } from "@/types/auth";
import type { ChatThread } from "@/types/chat";
import { uniqueId } from "@/utils/uniqueId";

interface AppShellContextValue {
  user: UserResponseDto | null;
  setUser: Dispatch<SetStateAction<UserResponseDto | null>>;
  threads: ChatThread[];
  setThreads: Dispatch<SetStateAction<ChatThread[]>>;
  threadsReady: boolean;
  activeThreadId: string | null;
  setActiveThreadId: Dispatch<SetStateAction<string | null>>;
  // Lugares no topo do celular onde cada tela põe as próprias ações (ver TopBarActions)
  topBarLeft: HTMLElement | null;
  topBarRight: HTMLElement | null;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const value = useContext(AppShellContext);
  if (!value) throw new Error("useAppShell must be used inside AppShell.");
  return value;
}

function MenuLabel({ visible, children, className = "whitespace-nowrap overflow-hidden text-ellipsis" }: {
  visible: boolean; children: ReactNode; className?: string;
}) {
  return <AnimatePresence initial={false}>{visible && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className={className}>{children}</motion.span>}</AnimatePresence>;
}

function SidebarContent({ expanded, mobile, toggle, closeMenu }: {
  expanded: boolean; mobile?: boolean; toggle: () => void; closeMenu: () => void;
}) {
  const { user, threads, setThreads, activeThreadId, setActiveThreadId } = useAppShell();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");
  // Conversa aguardando o segundo toque para ser excluída (só no menu do celular)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  // Cadastro por e-mail e senha que ainda não confirmou o código: lembrete discreto ao lado do nome
  const emailPending = user?.emailVerified === false;

  function newChat() {
    closeMenu();
    setActiveThreadId(null);
    router.push(`/chat?new=${uniqueId()}`);
  }

  async function deleteThread(threadId: string) {
    setError("");
    try {
      await chatService.deleteThread(threadId);
      setThreads((current) => current.filter((thread) => thread.id !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        if (pathname === "/chat") newChat();
      }
    } catch {
      setError("Nao foi possivel excluir a conversa.");
    }
  }

  return (
    <>
      {/* min-h-0 + flex-1: só a lista de conversas rola; o perfil fica sempre fixo no rodapé da barra */}
      <div className={`flex min-h-0 flex-1 flex-col w-full ${mobile ? "gap-5" : "gap-4"}`}>
        <div className={`flex items-center justify-between ${mobile ? "" : "w-full min-h-[40px]"}`}>
          {mobile || expanded ? (
            <Link href="/chat" onClick={closeMenu} aria-label="Stella" className="flex items-center gap-2.5 rounded-xl pl-1 pr-2 py-0.5 transition-opacity hover:opacity-80">
              <StellaMark size={36} decorative />
              <span className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900 whitespace-nowrap">stella</span>
            </Link>
          ) : (
            // Recolhido: o logo ocupa o topo; ao passar o mouse vira o botão de expandir
            <button type="button" onClick={toggle} aria-label="Expandir menu" title="Expandir menu" className="group relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-stone-100">
              <StellaMark size={34} decorative className="transition-opacity group-hover:opacity-0" />
              <PanelLeft className="absolute w-5 h-5 text-stone-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          {(mobile || expanded) && (
            <button type="button" onClick={toggle} aria-label={mobile ? "Fechar menu" : "Recolher menu"} title={mobile ? "Fechar menu" : "Recolher menu"} className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors ml-auto shrink-0">
              {mobile ? <X className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
        </div>
        <button type="button" onClick={newChat} title="Nova conversa" className={mobile ? "flex items-center gap-3 w-full px-4 py-3 bg-stone-900 text-white rounded-2xl font-medium text-sm shadow-sm active:scale-95 transition-transform" : "flex items-center gap-3 bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-sm transition-all shadow-2xs w-full px-3.5 py-3 rounded-2xl justify-start overflow-hidden active:scale-[0.98]"}>
          <Plus className={`w-5 h-5 shrink-0 ${mobile ? "" : "text-stone-900"}`} />
          <MenuLabel visible={expanded}>Nova conversa</MenuLabel>
        </button>
        {/* No celular e no tablet, as telas principais e o perfil ficam na barra de abas: o menu guarda a nova
            conversa, os planos e as conversas */}
        {!mobile && <>
        <Link href="/wardrobe" onClick={closeMenu} title="Guarda-roupa" aria-current={pathname.startsWith("/wardrobe") ? "page" : undefined} className={`flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98] ${pathname.startsWith("/wardrobe") ? "bg-stone-100 text-stone-900" : ""}`}>
          <Shirt className="w-5 h-5 shrink-0" />
          <MenuLabel visible={expanded}>Guarda-roupa</MenuLabel>
        </Link>
        <Link href="/eventos" onClick={closeMenu} title="Planejador" aria-current={pathname === "/eventos" ? "page" : undefined} className={`flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98] ${pathname === "/eventos" ? "bg-stone-100 text-stone-900" : ""}`}>
          <CalendarCheck className="w-5 h-5 shrink-0" />
          <MenuLabel visible={expanded}>Planejador</MenuLabel>
        </Link>
        <Link href="/tendencias" onClick={closeMenu} title="Tendências" aria-current={pathname === "/tendencias" ? "page" : undefined} className={`flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98] ${pathname === "/tendencias" ? "bg-stone-100 text-stone-900" : ""}`}>
          <TrendingUp className="w-5 h-5 shrink-0" />
          <MenuLabel visible={expanded}>Tendências</MenuLabel>
        </Link>
        </>}
        <Link href="/planos" onClick={closeMenu} title="Planos" aria-current={pathname === "/planos" ? "page" : undefined} className={`${mobile ? "flex items-center gap-3 w-full px-4 py-2.5 text-stone-700 hover:bg-stone-200/60 rounded-xl font-medium text-sm transition-colors" : "flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98]"} ${pathname === "/planos" ? (mobile ? "bg-stone-200/70 text-stone-900" : "bg-stone-100 text-stone-900") : ""}`}>
          <Gem className="w-5 h-5 shrink-0" />
          <MenuLabel visible={expanded}>Planos</MenuLabel>
        </Link>
        {user?.admin && (
          <Link href="/admin" onClick={closeMenu} title="Painel" aria-current={pathname === "/admin" ? "page" : undefined} className={`${mobile ? "flex items-center gap-3 w-full px-4 py-2.5 text-stone-700 hover:bg-stone-200/60 rounded-xl font-medium text-sm transition-colors" : "flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98]"} ${pathname === "/admin" ? (mobile ? "bg-stone-200/70 text-stone-900" : "bg-stone-100 text-stone-900") : ""}`}>
            <ChartNoAxesColumn className="w-5 h-5 shrink-0" />
            <MenuLabel visible={expanded}>Painel</MenuLabel>
          </Link>
        )}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
              <span className="text-[11px] font-semibold text-stone-400 px-2 uppercase tracking-wider mb-2">Recentes</span>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-1 pr-1">
                {threads.length === 0 ? <p className="text-xs text-stone-400 px-2 py-2 italic">Nenhuma conversa recente</p> : threads.map((thread) => (
                  <motion.div key={thread.id} whileHover={{ x: 2 }} className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${pathname === "/chat" && activeThreadId === thread.id ? "bg-stone-200/70 text-stone-900 font-semibold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}>
                    <Link href={`/chat?thread=${encodeURIComponent(thread.id)}`} onClick={() => { setActiveThreadId(thread.id); closeMenu(); }} className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                      <span className="truncate">{thread.title || "Conversa com Stella"}</span>
                    </Link>
                    {mobile ? (
                      // No toque não existe "passar o mouse": o botão fica sempre visível e pede um segundo toque
                      // para confirmar, já que a exclusão não tem volta
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmingDelete === thread.id) {
                            setConfirmingDelete(null);
                            void deleteThread(thread.id);
                          } else {
                            setConfirmingDelete(thread.id);
                          }
                        }}
                        onBlur={() => setConfirmingDelete((current) => (current === thread.id ? null : current))}
                        aria-label={confirmingDelete === thread.id ? `Confirmar exclusão de ${thread.title || "conversa"}` : `Excluir ${thread.title || "conversa"}`}
                        className={`-mr-1.5 ml-1 flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 transition-colors ${confirmingDelete === thread.id ? "bg-red-600 text-[11px] font-medium text-white" : "text-stone-400 active:bg-stone-200/70"}`}
                      >
                        {confirmingDelete === thread.id ? "Excluir?" : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <button type="button" onClick={() => void deleteThread(thread.id)} aria-label={`Excluir ${thread.title || "conversa"}`} title="Excluir conversa" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-stone-400 hover:text-red-600 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </motion.div>
                ))}
                {error && <p role="alert" className="px-2 py-2 text-xs text-red-700">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!mobile && <div className="flex shrink-0 items-center w-full justify-between border-t border-stone-200/60 mt-3 pt-3">
        <Link href="/profile" onClick={closeMenu} title={user?.name || "Meu perfil"} aria-label="Abrir meu perfil" aria-current={pathname === "/profile" ? "page" : undefined} className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg hover:bg-stone-100 transition-colors p-1">
          <div className="relative shrink-0">
            <UserAvatar user={user} className="h-8 w-8 text-xs" />
            {/* Menu recolhido: o lembrete de confirmar o e-mail fica no canto do avatar */}
            {emailPending && !expanded && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold leading-none text-white ring-2 ring-white">!</span>}
          </div>
          <MenuLabel visible={expanded} className="text-xs font-medium text-stone-800 truncate">{user?.name || "Meu perfil"}</MenuLabel>
          {emailPending && expanded && <span role="img" aria-label="E-mail ainda não confirmado" title="Confirme o seu e-mail no perfil" className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold leading-none text-white">!</span>}
        </Link>
        <button type="button" onClick={() => void authService.logout()} aria-label="Sair da conta" title="Sair da conta" className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"><LogOut className="w-4 h-4" /></button>
      </div>}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [threadsReady, setThreadsReady] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [topBarLeft, setTopBarLeft] = useState<HTMLDivElement | null>(null);
  const [topBarRight, setTopBarRight] = useState<HTMLDivElement | null>(null);
  const keyboardOpen = useKeyboardOpen();

  function newChat() {
    setActiveThreadId(null);
    router.push(`/chat?new=${uniqueId()}`);
  }

  useEffect(() => {
    if (!authService.getToken()) router.replace("/login");
  }, [router, pathname]);

  // Marca a página como "aplicativo" (tela fixa, sem rolagem do documento): ver ViewportVars
  useEffect(() => {
    document.documentElement.classList.add("stella-app");
    return () => document.documentElement.classList.remove("stella-app");
  }, []);

  useEffect(() => {
    if (!authService.getToken()) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    async function loadWorkspace() {
      try {
        const currentUser = await authService.getCurrentUser(controller.signal);
        if (controller.signal.aborted) return;
        setUser(currentUser);
        try {
          const history = await chatService.getThreads(controller.signal);
          if (!controller.signal.aborted) setThreads(history);
        } catch {
        } finally {
          if (!controller.signal.aborted) setThreadsReady(true);
        }
      } catch (failure) {
        if (controller.signal.aborted) return;
        if (!authService.getToken()) router.replace("/login");
        else setError(failure instanceof Error ? failure.message : "Nao foi possivel carregar sua conta.");
      }
    }
    void loadWorkspace();
    return () => controller.abort();
  }, [router]);

  return (
    <AppShellContext.Provider value={{ user, setUser, threads, setThreads, threadsReady, activeThreadId, setActiveThreadId, topBarLeft, topBarRight }}>
      <FeedbackProvider enabled={Boolean(user?.onboardingCompleted)}>
      {/* A altura acompanha a área visível: com o teclado aberto no celular, o app encolhe e o campo de
          mensagem fica logo acima dele. As margens seguras cobrem o recorte e a barra de início do iPhone */}
      <div className="flex h-[var(--stella-vvh,100dvh)] bg-[#FAF8F5] text-stone-900 overflow-hidden font-sans pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <motion.aside initial={false} animate={{ width: expanded ? 256 : 68 }} transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }} className="hidden lg:flex shrink-0 flex-col justify-between bg-white/80 backdrop-blur-md border-r border-stone-200/80 py-5 px-3 z-20 overflow-hidden">
          <SidebarContent expanded={expanded} toggle={() => setExpanded(!expanded)} closeMenu={() => setMobileMenuOpen(false)} />
        </motion.aside>
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.button type="button" aria-label="Fechar menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-stone-900/40" onClick={() => setMobileMenuOpen(false)} />
              {/* Deslize curto e direto, como o menu de um app nativo (sem mola e sem desfoque atrás) */}
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }} className="relative w-72 max-w-[80%] bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between p-5 z-10 border-r border-stone-200">
                <SidebarContent mobile expanded toggle={() => setMobileMenuOpen(false)} closeMenu={() => setMobileMenuOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Só rola na vertical: um item mais largo que a tela (faixa de previsão, tabela, carrossel) não pode
            deixar a página inteira arrastar para os lados. Os carrosséis rolam dentro de si mesmos */}
        <div className="flex min-w-0 flex-1 flex-col">
        {user && <MobileTopBar onMenu={() => setMobileMenuOpen(true)} onLeftSlot={setTopBarLeft} onRightSlot={setTopBarRight} />}
        {/* No celular, o fim de cada tela deixa espaço para a barra de abas (que some com o teclado aberto) */}
        <div className={`stella-scroll-area min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${user && !keyboardOpen ? "max-lg:pb-[4.75rem]" : ""}`}>
          {user ? children : (
            // Enquanto a conta carrega, a mesma imagem da tela de abertura (logo e nome), para a passagem do
            // ícone até o app ser contínua
            <main className="h-full flex flex-col items-center justify-center gap-4 px-6 text-stone-600" role={error ? "alert" : "status"} aria-label={error ? undefined : "Carregando a Stella"}>
              {error ? (
                <>
                  {error}
                  <button type="button" onClick={() => window.location.reload()} className="text-sm underline">Tentar novamente</button>
                </>
              ) : (
                <motion.div animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center">
                  <StellaMark size={96} decorative />
                  <span className="-mt-1 font-serif text-2xl font-semibold italic tracking-tight text-stone-900">stella</span>
                </motion.div>
              )}
            </main>
          )}
        </div>
        </div>
        {user && <MobileTabBar hidden={keyboardOpen || mobileMenuOpen} user={user} activeThreadId={activeThreadId} onNewChat={newChat} />}
        {user && <InstallCard hidden={keyboardOpen || mobileMenuOpen} />}
      </div>
      </FeedbackProvider>
    </AppShellContext.Provider>
  );
}