"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SuggestionItem } from "@/types/chat";
import { SUGGESTIONS_POOL, suggestionService } from "@/services/suggestion/suggestionService";

interface SuggestionPillsProps {
  onSelectSuggestion: (promptText: string) => void;
}

export function SuggestionPills({ onSelectSuggestion }: SuggestionPillsProps) {
  // 1. Estado inicial determinístico (SSR safe)
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionItem[]>(
    () => SUGGESTIONS_POOL.slice(0, 3)
  );

  useEffect(() => {
    // 2. Altera as pílulas periodicamente. A primeira troca ocorre após o intervalo (10s),
    // garantindo que não exista setState síncrono no mount do Effect.
    const interval = setInterval(() => {
      setCurrentSuggestions((prev) => {
        const activeIds = prev.map((item) => item.id);
        return suggestionService.getRandomSet(3, activeIds);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center overflow-x-auto pb-3 scrollbar-none min-h-[44px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSuggestions.map((s) => s.id).join("-")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y:-8 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="flex items-center gap-2"
        >
          {currentSuggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSuggestion(item.prompt)}
              className="cursor-pointer whitespace-nowrap text-xs bg-white border border-stone-200/80 hover:border-stone-400 hover:bg-stone-50 active:scale-95 px-4 py-2 rounded-full text-stone-700 transition-all shadow-2xs font-medium"
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}