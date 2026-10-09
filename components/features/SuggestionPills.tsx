"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SuggestionItem } from "@/types/chat";
import { suggestionService } from "@/services/suggestion/suggestionService";

const VISIBLE = 3;
const ROTATE_MS = 10_000;

interface SuggestionPillsProps {
  onSelectSuggestion: (promptText: string) => void;
}

/**
 * Três balões que vão alternando sem repetir. Primeiro os personalizados (evento próximo, clima, peças do
 * guarda-roupa), depois as sugestões gerais. Sem dados da pessoa (ou sem conexão), só as gerais.
 */
export function SuggestionPills({ onSelectSuggestion }: SuggestionPillsProps) {
  const [pool, setPool] = useState<SuggestionItem[] | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    suggestionService.fetchPersonalized(controller.signal)
      .then((personalized) => setPool(suggestionService.buildPool(personalized)))
      .catch(() => {
        if (!controller.signal.aborted) setPool(suggestionService.buildPool([]));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!pool || pool.length <= VISIBLE) return;
    const interval = setInterval(() => setOffset((current) => (current + VISIBLE) % pool.length), ROTATE_MS);
    return () => clearInterval(interval);
  }, [pool]);

  // Janela circular de 3 sobre a lista: percorre todas antes de repetir
  const visible = pool
    ? Array.from({ length: Math.min(VISIBLE, pool.length) }, (_, index) => pool[(offset + index) % pool.length])
    : [];

  return (
    <div className="flex items-center overflow-x-auto pb-3 scrollbar-none min-h-[44px]">
      <AnimatePresence mode="wait">
        {visible.length > 0 && (
          <motion.div
            key={visible.map((item) => item.id).join("-")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex items-center gap-2"
          >
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSuggestion(item.prompt)}
                className="whitespace-nowrap text-xs bg-white border border-stone-200/80 hover:border-stone-400 hover:bg-stone-50 active:scale-95 px-4 py-2 rounded-full text-stone-700 transition-all shadow-2xs font-medium"
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
