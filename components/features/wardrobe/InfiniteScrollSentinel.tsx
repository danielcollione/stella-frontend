"use client";

import { useEffect, useRef } from "react";

/**
 * Marcador invisível no fim da lista: quando chega perto da área visível, pede a próxima página.
 * A margem faz o carregamento começar antes do fim, para a rolagem não "bater" no final.
 */
export function InfiniteScrollSentinel({ onVisible, disabled, rootMargin = "800px 0px", root, watch }: {
  onVisible: () => void;
  disabled?: boolean;
  rootMargin?: string;
  root?: Element | null; // contêiner com rolagem; sem ele, usa o ancestral mais próximo que rola
  watch?: unknown; // muda quando chega uma página nova: reobserva, caso o marcador continue visível
}) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onVisible);

  useEffect(() => {
    callbackRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const node = ref.current;
    if (!node || disabled) return;
    // A margem só antecipa o carregamento se for medida no contêiner que rola (no app, a área da página,
    // não a janela): com a janela como referência, o recorte do contêiner anularia a margem
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) callbackRef.current();
    }, { root: root ?? scrollParent(node), rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, rootMargin, root, watch]);

  return <div ref={ref} aria-hidden="true" className="h-px w-full" />;
}

function scrollParent(node: HTMLElement): Element | null {
  for (let current = node.parentElement; current; current = current.parentElement) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === "auto" || overflowY === "scroll") return current;
  }
  return null;
}
