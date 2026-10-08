"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, MessageSquare, PanelLeft, PanelLeftClose, Plus, Shirt, Trash2, X } from "lucide-react";
import { authService } from "@/services/authService";
import { chatService } from "@/services/chat/chatService";
import type { UserResponseDto } from "@/types/auth";
import type { ChatThread } from "@/types/chat";

interface AppShellContextValue {
  user: UserResponseDto | null;
  setUser: Dispatch<SetStateAction<UserResponseDto | null>>;
  threads: ChatThread[];
  setThreads: Dispatch<SetStateAction<ChatThread[]>>;
  threadsReady: boolean;
  activeThreadId: string | null;
  setActiveThreadId: Dispatch<SetStateAction<string | null>>;
  openMobileMenu: () => void;
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
  const initials = user?.name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]).join("").toUpperCase() || "U";

  function newChat() {
    closeMenu();
    setActiveThreadId(null);
    router.push(`/chat?new=${crypto.randomUUID()}`);
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
      <div className={`flex flex-col w-full ${mobile ? "gap-5" : "gap-4"}`}>
        <div className={`flex items-center justify-between ${mobile ? "" : "w-full min-h-[40px]"}`}>
          {mobile ? <span className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900">stella</span> : (
            <AnimatePresence initial={false}>{expanded && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900 whitespace-nowrap pl-1">stella</motion.span>}</AnimatePresence>
          )}
          <button type="button" onClick={toggle} aria-label={mobile ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"} title={mobile ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"} className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors ml-auto shrink-0">
            {mobile ? <X className="w-5 h-5" /> : expanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>
        </div>
        <button type="button" onClick={newChat} title="Nova conversa" className={mobile ? "flex items-center gap-3 w-full px-4 py-3 bg-stone-900 text-white rounded-2xl font-medium text-sm shadow-sm active:scale-95 transition-transform" : "flex items-center gap-3 bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-sm transition-all shadow-2xs w-full px-3.5 py-3 rounded-2xl justify-start overflow-hidden active:scale-[0.98]"}>
          <Plus className={`w-5 h-5 shrink-0 ${mobile ? "" : "text-stone-900"}`} />
          <MenuLabel visible={expanded}>Nova conversa</MenuLabel>
        </button>
        <Link href="/wardrobe" onClick={closeMenu} title="Guarda-roupa" aria-current={pathname === "/wardrobe" ? "page" : undefined} className={`${mobile ? "flex items-center gap-3 w-full px-4 py-2.5 text-stone-700 hover:bg-stone-200/60 rounded-xl font-medium text-sm transition-colors" : "flex items-center gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition-all w-full px-3.5 py-2.5 rounded-xl justify-start overflow-hidden active:scale-[0.98]"} ${pathname === "/wardrobe" ? (mobile ? "bg-stone-200/70 text-stone-900" : "bg-stone-100 text-stone-900") : ""}`}>
          <Shirt className="w-5 h-5 shrink-0" />
          <MenuLabel visible={expanded}>Guarda-roupa</MenuLabel>
        </Link>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="mt-2 flex flex-col overflow-hidden">
              <span className="text-[11px] font-semibold text-stone-400 px-2 uppercase tracking-wider mb-2">Recentes</span>
              <div className={`overflow-y-auto space-y-1 pr-1 ${mobile ? "max-h-[calc(100dvh-320px)]" : "max-h-[calc(100dvh-300px)]"}`}>
                {threads.length === 0 ? <p className="text-xs text-stone-400 px-2 py-2 italic">Nenhuma conversa recente</p> : threads.map((thread) => (
                  <motion.div key={thread.id} whileHover={{ x: 2 }} className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${pathname === "/chat" && activeThreadId === thread.id ? "bg-stone-200/70 text-stone-900 font-semibold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}>
                    <Link href={`/chat?thread=${encodeURIComponent(thread.id)}`} onClick={() => { setActiveThreadId(thread.id); closeMenu(); }} className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                      <span className="truncate">{thread.title || "Conversa com Stella"}</span>
                    </Link>
                    {!mobile && <button type="button" onClick={() => void deleteThread(thread.id)} aria-label={`Excluir ${thread.title || "conversa"}`} title="Excluir conversa" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-stone-400 hover:text-red-600 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
                  </motion.div>
                ))}
                {error && <p role="alert" className="px-2 py-2 text-xs text-red-700">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={`flex items-center w-full justify-between border-t ${mobile ? "border-stone-200 pt-4" : "border-stone-200/60 pt-3"}`}>
        <Link href="/profile" onClick={closeMenu} title={user?.name || "Meu perfil"} aria-label="Abrir meu perfil" aria-current={pathname === "/profile" ? "page" : undefined} className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg hover:bg-stone-100 transition-colors p-1">
          <div className="w-8 h-8 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-semibold text-stone-700 shrink-0">{initials}</div>
          <MenuLabel visible={expanded} className="text-xs font-medium text-stone-800 truncate">{user?.name || "Meu perfil"}</MenuLabel>
        </Link>
        <button type="button" onClick={() => void authService.logout()} aria-label="Sair da conta" title="Sair da conta" className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"><LogOut className="w-4 h-4" /></button>
      </div>
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

  useEffect(() => {
    if (!authService.getToken()) router.replace("/login");
  }, [router, pathname]);

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
    <AppShellContext.Provider value={{ user, setUser, threads, setThreads, threadsReady, activeThreadId, setActiveThreadId, openMobileMenu: () => setMobileMenuOpen(true) }}>
      <div className="flex h-dvh bg-[#FAF8F5] text-stone-900 overflow-hidden font-sans">
        <motion.aside initial={false} animate={{ width: expanded ? 256 : 68 }} transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }} className="hidden md:flex shrink-0 flex-col justify-between bg-white/80 backdrop-blur-md border-r border-stone-200/80 py-5 px-3 z-20 overflow-hidden">
          <SidebarContent expanded={expanded} toggle={() => setExpanded(!expanded)} closeMenu={() => setMobileMenuOpen(false)} />
        </motion.aside>
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <motion.button type="button" aria-label="Fechar menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 350, damping: 35 }} className="relative w-72 max-w-[80%] bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between p-5 z-10 border-r border-stone-200">
                <SidebarContent mobile expanded toggle={() => setMobileMenuOpen(false)} closeMenu={() => setMobileMenuOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <div className="flex-1 min-w-0 h-full overflow-y-auto">
          {user ? children : <main className="h-full flex flex-col items-center justify-center gap-4 px-6 text-stone-600" role={error ? "alert" : "status"}>{error || "Carregando..."}{error && <button type="button" onClick={() => window.location.reload()} className="text-sm underline">Tentar novamente</button>}</main>}
        </div>
      </div>
    </AppShellContext.Provider>
  );
}