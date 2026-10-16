"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { lockPageScroll } from "@/utils/scrollLock";

// Popovers (ex: Select) precisam ser renderizados DENTRO do <dialog>: fora dele ficam atrás da top layer e inertes
const ModalPortalContext = createContext<HTMLElement | null>(null);

export function useModalPortalContainer() {
  return useContext(ModalPortalContext);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  // false enquanto há uma operação em andamento (upload, salvamento): Esc, clique fora e o X ficam bloqueados
  dismissible?: boolean;
  // false quando o conteúdo cuida da própria rolagem (ex: formulário com rodapé fixo, fora da área que rola)
  scrollBody?: boolean;
}

/**
 * Modal sobre o <dialog> nativo: foco preso, Esc, fundo inerte e camada superior vêm do navegador.
 * No celular vira um bottom sheet.
 */
export function Modal({ open, onClose, title, description, children, dismissible = true, scrollBody = true }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Ref estável: uma função inline seria chamada a cada render e atualizaria o estado em loop
  const attachDialog = useCallback((node: HTMLDialogElement | null) => {
    dialogRef.current = node;
    setPortalContainer(node);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Enquanto a janela está aberta, a página de trás não rola
    const unlock = open ? lockPageScroll() : undefined;
    // Ao navegar, a rota é preservada oculta (não desmontada): um <dialog> modal esquecido aberto
    // deixaria a página seguinte inteira inerte. Fecha na limpeza; reabre sozinho se a rota voltar.
    return () => {
      unlock?.();
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={attachDialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      // O clique no backdrop tem o próprio <dialog> como alvo; o conteúdo fica num wrapper interno
      onClick={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
      // O <dialog> é só o contêiner (sem transform/overflow, para não recortar nem reposicionar os popovers);
      // visual, animação e rolagem ficam no painel interno
      // No celular o <dialog> ocupa exatamente a área visível da tela (acima do teclado, quando ele está
      // aberto) e a folha fica presa à base dela: nada arrasta para os lados nem escapa para baixo do teclado
      className="m-auto w-[calc(100%-2rem)] max-w-3xl overflow-visible border-0 bg-transparent p-0 text-stone-900 outline-none backdrop:bg-stone-900/35 backdrop:backdrop-blur-[2px] max-sm:fixed max-sm:inset-x-0 max-sm:top-[var(--stella-vv-top,0px)] max-sm:m-0 max-sm:h-[var(--stella-vvh,100dvh)] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:items-end max-sm:overflow-hidden max-sm:open:flex"
    >
      <ModalPortalContext.Provider value={portalContainer}>
      <div className="flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-[#FAF8F5] shadow-[0_24px_64px_rgba(28,25,23,0.18),0_4px_16px_rgba(28,25,23,0.06)] transition-[opacity,translate] duration-200 ease-out starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none max-sm:max-h-[94%] max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200/70 px-6 pb-4 pt-5 sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="font-serif text-2xl italic tracking-tight text-stone-900">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-stone-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Fechar"
            title="Fechar"
            className="-mr-2 shrink-0 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </header>
        <div className={scrollBody ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain" : "flex min-h-0 flex-1 flex-col overflow-hidden"}>{children}</div>
      </div>
      </ModalPortalContext.Provider>
    </dialog>
  );
}
