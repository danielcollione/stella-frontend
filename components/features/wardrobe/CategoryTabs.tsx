"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CategoryTab<Value extends string> {
  value: Value;
  label: string;
  count: number;
}

interface CategoryTabsProps<Value extends string> {
  tabs: readonly CategoryTab<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  controls: string;
}

export function CategoryTabs<Value extends string>({ tabs, value, onChange, controls }: CategoryTabsProps<Value>) {
  const reducedMotion = useReducedMotion();
  const tabRefs = useRef(new Map<Value, HTMLButtonElement>());
  const listRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  // Abas que não cabem: setas e esmaecido nas bordas indicam que há mais para os lados
  const updateEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const left = list.scrollLeft > 4;
    const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 4;
    setEdges((current) => (current.left === left && current.right === right ? current : { left, right }));
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    // Mouse sem rolagem lateral: a roda (vertical) passa a rolar as abas para os lados
    const onWheel = (event: WheelEvent) => {
      if (list.scrollWidth <= list.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const before = list.scrollLeft;
      list.scrollLeft += event.deltaY;
      if (list.scrollLeft !== before) event.preventDefault(); // nas pontas, a página volta a rolar normalmente
    };
    list.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      list.removeEventListener("wheel", onWheel);
    };
  }, [updateEdges]);

  useEffect(updateEdges, [tabs, updateEdges]);

  // A aba escolhida sempre fica visível (ex: aberta pela URL ou pelo teclado)
  useEffect(() => {
    tabRefs.current.get(value)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [value, reducedMotion]);

  function scrollBy(direction: 1 | -1) {
    const list = listRef.current;
    if (list) list.scrollBy({ left: direction * list.clientWidth * 0.7, behavior: reducedMotion ? "auto" : "smooth" });
  }

  // Navegação por teclado do padrão WAI-ARIA de abas (setas, Home e End)
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.value === value);
    const nextIndex = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = tabs[nextIndex].value;
    onChange(next);
    tabRefs.current.get(next)?.focus();
  }

  return (
    <div className="relative">
    <div
      ref={listRef}
      role="tablist"
      aria-label="Categorias do guarda-roupa"
      onKeyDown={handleKeyDown}
      onScroll={updateEdges}
      className="flex items-end gap-6 overflow-x-auto overscroll-x-contain scrollbar-none border-b border-stone-200/80 px-5 sm:px-0"
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.value, node);
              else tabRefs.current.delete(tab.value);
            }}
            type="button"
            role="tab"
            id={`wardrobe-tab-${tab.value}`}
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={`relative shrink-0 whitespace-nowrap pb-3 pt-1 text-sm outline-none transition-colors focus-visible:text-stone-900 focus-visible:underline focus-visible:underline-offset-4 ${selected ? "font-medium text-stone-900" : "text-stone-400 hover:text-stone-700"}`}
          >
            {tab.label}
            <span className="ml-1.5 text-[11px] tabular-nums text-stone-400">{tab.count}</span>
            {selected && (
              <motion.span
                layoutId="wardrobe-tab-indicator"
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                className="absolute inset-x-0 -bottom-px h-[1.5px] bg-stone-900"
              />
            )}
          </button>
        );
      })}
    </div>
    {edges.left && <EdgeButton side="left" onClick={() => scrollBy(-1)} />}
    {edges.right && <EdgeButton side="right" onClick={() => scrollBy(1)} />}
    </div>
  );
}

function EdgeButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const left = side === "left";
  return (
    <div className={`pointer-events-none absolute inset-y-0 flex w-14 items-start pt-0.5 ${left ? "left-0 justify-start bg-gradient-to-r" : "right-0 justify-end bg-gradient-to-l"} from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent`}>
      {/* Fora da navegação por Tab: o teclado já percorre as abas com as setas */}
      <button
        type="button"
        tabIndex={-1}
        onClick={onClick}
        aria-label={left ? "Ver categorias anteriores" : "Ver mais categorias"}
        className="pointer-events-auto rounded-full border border-stone-200/80 bg-white p-1 text-stone-500 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900"
      >
        {left ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
}
