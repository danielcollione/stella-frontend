"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

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
    <div
      role="tablist"
      aria-label="Categorias do guarda-roupa"
      onKeyDown={handleKeyDown}
      className="flex items-end gap-6 overflow-x-auto scrollbar-none border-b border-stone-200/80 px-5 sm:px-0"
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
  );
}
