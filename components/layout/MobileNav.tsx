"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Menu, Shirt, TrendingUp } from "lucide-react";
import { StellaMark } from "@/components/ui/StellaMark";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { focusedField } from "@/components/layout/ViewportVars";
import type { UserResponseDto } from "@/types/auth";

/**
 * Navegação do celular e do tablet (o app só funciona em pé): um topo igual em todas as telas, com o menu à
 * esquerda e o nome da tela no meio, e a barra de abas flutuante embaixo. No computador continua o menu lateral.
 */

// Nome de cada tela no topo (o primeiro prefixo que bater vale)
const TITLES: [string, string][] = [
  ["/wardrobe/painel", "Painéis"],
  ["/wardrobe", "Guarda-roupa"],
  ["/eventos", "Planejador"],
  ["/tendencias", "Tendências"],
  ["/profile", "Perfil"],
  ["/planos", "Planos"],
  ["/assinatura", "Assinatura"],
  ["/admin", "Painel"],
];

export function MobileTopBar({ onMenu, onLeftSlot, onRightSlot }: {
  onMenu: () => void;
  // Lugares onde cada tela pode pôr as próprias ações (ver TopBarActions)
  onLeftSlot: (element: HTMLDivElement | null) => void;
  onRightSlot: (element: HTMLDivElement | null) => void;
}) {
  const pathname = usePathname();
  const onChat = pathname.startsWith("/chat");
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1];

  return (
    <div className="relative z-20 flex h-14 shrink-0 items-center gap-1.5 border-b border-stone-200/50 bg-[#FAF8F5]/90 px-2.5 backdrop-blur-md lg:hidden">
      <button type="button" onClick={onMenu} aria-label="Abrir menu" title="Abrir menu" className="rounded-xl p-2 text-stone-700 transition-colors active:bg-stone-200/60">
        <Menu size={20} />
      </button>
      <div ref={onLeftSlot} className="flex min-w-0 items-center" />
      {/* O nome fica sempre no centro da tela, qualquer que seja o tamanho das ações dos lados; no chat, o
          espaço fica para o clima e para o "Salvar no guarda-roupa" */}
      {!onChat && <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[22px] font-semibold italic tracking-tight text-stone-900">
        {title ?? "stella"}
      </p>}
      <div ref={onRightSlot} className="ml-auto flex items-center gap-1" />
    </div>
  );
}

/** Põe ações de uma tela no topo do celular (à esquerda, depois do menu, ou à direita). */
export function TopBarActions({ slot, children }: { slot: HTMLElement | null; children: ReactNode }) {
  return slot ? createPortal(children, slot) : null;
}

/** Teclado aberto no celular: a barra de abas sai de cena e o campo fica colado no teclado. */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    let timer: number | undefined;
    const check = () => setOpen(Boolean(focusedField()));
    // Ao trocar de um campo para outro, o foco passa por "nenhum" por um instante: confere depois
    const onFocusOut = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, 60);
    };
    document.addEventListener("focusin", check);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusin", check);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
  return open;
}

export function MobileTabBar({ hidden, user, activeThreadId, onNewChat }: {
  hidden: boolean;
  user: UserResponseDto | null;
  activeThreadId: string | null;
  onNewChat: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const onChat = pathname.startsWith("/chat");
  const emailPending = user?.emailVerified === false;

  // A Stella, no meio: de outra tela, volta à conversa em andamento; já no chat, começa uma conversa nova
  const openStella = () => {
    if (onChat) onNewChat();
    else router.push(activeThreadId ? `/chat?thread=${encodeURIComponent(activeThreadId)}` : "/chat");
  };

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.nav
          key="tab-bar"
          aria-label="Navegação principal"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 24, transition: { duration: 0.15 } }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="stella-tab-bar fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-30 mx-auto flex max-w-md items-stretch justify-between rounded-[1.75rem] border border-stone-200/80 bg-white/95 p-1 shadow-[0_14px_36px_-14px_rgba(28,25,23,0.35)] backdrop-blur-xl lg:hidden"
        >
          <Tab href="/wardrobe" label="Guarda-roupa" active={pathname.startsWith("/wardrobe")} icon={<Shirt size={21} strokeWidth={1.6} />} />
          <Tab href="/eventos" label="Planejador" active={pathname.startsWith("/eventos")} icon={<CalendarCheck size={21} strokeWidth={1.6} />} />
          <Tab
            onClick={openStella}
            label="Stella"
            ariaLabel={onChat ? "Nova conversa com a Stella" : "Conversar com a Stella"}
            active={onChat}
            icon={<StellaMark size={30} decorative className="-my-1" />}
          />
          <Tab href="/tendencias" label="Tendências" active={pathname.startsWith("/tendencias")} icon={<TrendingUp size={21} strokeWidth={1.6} />} />
          <Tab
            href="/profile"
            label="Perfil"
            active={pathname.startsWith("/profile")}
            icon={(
              <span className="relative flex">
                <UserAvatar user={user} className="h-[22px] w-[22px] text-[9px]" />
                {emailPending && <span aria-label="E-mail ainda não confirmado" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />}
              </span>
            )}
          />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

function Tab({ href, onClick, label, ariaLabel, active, icon }: {
  href?: string;
  onClick?: () => void;
  label: string;
  ariaLabel?: string;
  active: boolean;
  icon: ReactNode;
}) {
  const className = `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.4rem] px-1 py-1.5 text-[10px] font-medium transition-colors ${active ? "text-stone-900" : "text-stone-500 active:text-stone-800"}`;
  const content = (
    <>
      {/* A aba aberta ganha um fundo suave que desliza de uma aba para a outra */}
      {active && <motion.span layoutId="stella-tab" aria-hidden="true" className="absolute inset-0 rounded-[1.4rem] bg-stone-100" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
      <span className="relative flex h-6 items-center justify-center">{icon}</span>
      <span className="relative max-w-full truncate">{label}</span>
    </>
  );
  if (href) {
    return <Link href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
  }
  return <button type="button" onClick={onClick} aria-label={ariaLabel} aria-current={active ? "page" : undefined} className={className}>{content}</button>;
}
