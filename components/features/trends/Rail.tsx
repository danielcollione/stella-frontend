"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Faixa que rola de lado (slide): no celular, com o dedo; no computador, também pelas setas, que só aparecem
 * quando há mais conteúdo para aquele lado.
 */
export function Rail({ label, children, tone = "light" }: { label: string; children: ReactNode; tone?: "light" | "dark" }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges({ start: list.scrollLeft <= 4, end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure, children]);

  const scrollBy = (direction: 1 | -1) => {
    const list = listRef.current;
    if (list) list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = tone === "dark"
    ? "bg-stone-800/90 text-stone-100 hover:bg-stone-700"
    : "border border-stone-200 bg-white/95 text-stone-700 shadow-sm hover:text-stone-900";

  return (
    <div className="relative">
      <ul ref={listRef} aria-label={label} onScroll={measure} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
        {children}
      </ul>
      {!edges.start && (
        <button type="button" onClick={() => scrollBy(-1)} aria-label="Ver anteriores" className={`absolute -left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors sm:flex ${arrow}`}>
          <ChevronLeft size={16} />
        </button>
      )}
      {!edges.end && (
        <button type="button" onClick={() => scrollBy(1)} aria-label="Ver próximos" className={`absolute -right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors sm:flex ${arrow}`}>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
