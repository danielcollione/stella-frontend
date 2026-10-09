"use client";

import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { FeedbackReason } from "@/types/chat";

export const FEEDBACK_REASONS: readonly { value: FeedbackReason; label: string }[] = [
  { value: "TOO_FORMAL", label: "Formal demais" },
  { value: "TOO_CASUAL", label: "Casual demais" },
  { value: "NOT_MY_STYLE", label: "Não é meu estilo" },
  { value: "WRONG_WEATHER", label: "Não combina com o clima" },
  { value: "COLORS", label: "Não gostei das cores" },
  { value: "OTHER", label: "Outro" },
];

// Depois do "não gostei": um toque diz à Stella o que ajustar (opcional, sem custo de IA)
export function FeedbackReasonPicker({ onPick, onDismiss, disabled }: {
  onPick: (reason: FeedbackReason) => void;
  onDismiss: () => void;
  disabled?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      role="group"
      aria-label="O que não funcionou?"
      className="mt-2 flex flex-wrap items-center gap-1.5"
    >
      <span className="mr-1 text-xs text-stone-500">O que não funcionou?</span>
      {FEEDBACK_REASONS.map((reason) => (
        <button
          key={reason.value}
          type="button"
          onClick={() => onPick(reason.value)}
          disabled={disabled}
          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 disabled:opacity-50"
        >
          {reason.label}
        </button>
      ))}
      <button type="button" onClick={onDismiss} aria-label="Pular" title="Pular" className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-700">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
