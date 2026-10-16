"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Fotos do mesmo tipo, no celular e no tablet, como no Instagram: cada foto ocupa a largura da tela (no tablet, uma
 * coluna confortável) e a pessoa arrasta para a próxima, com as bolinhas e o "1 de 4" logo embaixo. O texto e as ações
 * ficam fixos abaixo e trocam junto (onActiveChange). As partes diferentes da página seguem uma embaixo da outra.
 */
export function PostCarousel({ label, count, children, onActiveChange }: {
  label: string;
  count: number;
  children: ReactNode;
  // Avisa qual post está na tela (o texto e as ações embaixo das fotos acompanham)
  onActiveChange?: (index: number) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const measure = useCallback(() => {
    const list = listRef.current;
    const first = list?.firstElementChild as HTMLElement | null;
    if (!list || !first) return;
    const step = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(list).columnGap) || 0);
    // Escondido (ex: no computador) ou ainda sem tamanho: não há o que medir
    if (!(step > 0)) return;
    const index = Math.min(count - 1, Math.max(0, Math.round(list.scrollLeft / step)));
    if (index === activeRef.current) return;
    activeRef.current = index;
    setActive(index);
    onActiveChange?.(index);
  }, [count, onActiveChange]);

  const go = (index: number) => {
    const list = listRef.current;
    const target = list?.children[index] as HTMLElement | undefined;
    if (list && target) list.scrollTo({ left: target.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft || "0"), behavior: "smooth" });
  };

  return (
    <div className="-mx-4 sm:-mx-8">
      <ul
        ref={listRef}
        onScroll={measure}
        aria-label={label}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain sm:scroll-px-8 sm:gap-4 sm:px-8"
      >
        {children}
      </ul>
      {count > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5">
            {Array.from({ length: count }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => go(index)}
                aria-label={`Ir para ${index + 1} de ${count}`}
                aria-current={index === active ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-4 bg-stone-800" : "w-1.5 bg-stone-300"}`}
              />
            ))}
          </span>
          <span className="text-[11px] tabular-nums text-stone-400" aria-live="polite">{active + 1} de {count}</span>
        </div>
      )}
    </div>
  );
}

/** Um post do carrossel: a largura da tela no celular, uma coluna no tablet. */
export const POST_SLIDE = "w-full shrink-0 snap-start sm:w-[400px]";

// Ação do post: ícone com uma palavra pequena embaixo (botão, ou link para as lojas)
export function PostAction({ onClick, disabled, active, href, sponsored, icon, children }: {
  onClick?: () => void;
  disabled?: boolean;
  // A ação cujo menu está aberto fica destacada
  active?: boolean;
  href?: string;
  sponsored?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  const className = `flex min-w-[52px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[10.5px] transition-colors active:bg-stone-200/50 disabled:opacity-40 [&>svg]:text-stone-800 ${active ? "bg-stone-200/60 text-stone-800" : "text-stone-500"}`;
  if (href) {
    return <a href={href} target="_blank" rel={sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"} className={className}>{icon}{children}</a>;
  }
  return <button type="button" onClick={onClick} disabled={disabled} className={className}>{icon}{children}</button>;
}

/**
 * Menu pequeno que flutua logo acima da linha de ações do post (confirmar marcação, motivo da troca). A linha de ações
 * fica no lugar; tocar fora fecha, menos enquanto a ação está sendo gravada (locked).
 */
export function FloatingMenu({ open, locked, onClose, label, children }: {
  open: boolean;
  locked?: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Fechar"
            onClick={() => !locked && onClose()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 cursor-default bg-transparent"
          />
          <motion.div
            key="menu"
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-full z-30 mb-1.5 flex origin-bottom flex-col rounded-2xl border border-stone-200/80 bg-white/95 px-3.5 py-3 shadow-[0_12px_32px_-12px_rgba(28,25,23,0.3)] backdrop-blur-md"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
