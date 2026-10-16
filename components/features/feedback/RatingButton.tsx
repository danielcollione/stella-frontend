"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useFeedback } from "@/components/features/feedback/FeedbackProvider";

/** Quanto tempo na tela antes de o botão aparecer. */
const APPEAR_AFTER_MS = 10_000;
/**
 * Botão flutuante "Avaliar a Stella" (Tendências e Planejador): para quem ainda não avaliou, surge em toda visita
 * depois de alguns segundos na tela, saindo do desfoque com um brilho que o atravessa uma vez, e se transforma no
 * cartão de avaliação ao tocar. O X esconde só nesta visita.
 */
export function RatingButton() {
  const { status, panelOpen, open } = useFeedback();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pending = status !== null && status.rating === null;

  useEffect(() => {
    if (!pending || dismissed) return;
    const timer = window.setTimeout(() => setVisible(true), APPEAR_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [pending, dismissed]);

  const show = visible && pending && !dismissed && !panelOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="rating-button"
          layoutId="stella-rating"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 24, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          transition={reducedMotion ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 22, mass: 0.9 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-30 sm:bottom-6 sm:right-6"
        >
          {/* Aura dourada e suave atrás do botão */}
          <span aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,126,0.45),transparent)] blur-md" />
          <div className="relative flex items-center overflow-hidden rounded-full bg-stone-900 shadow-[0_14px_34px_-10px_rgba(28,25,23,0.55)]">
            <button
              type="button"
              onClick={() => open("TRENDS")}
              className="flex items-center gap-2 py-2.5 pl-4 pr-2.5 text-sm font-medium text-white"
            >
              <Star size={15} strokeWidth={1.6} className="fill-[#C9A27E] text-[#C9A27E]" />
              Avaliar a Stella
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Agora não"
              title="Agora não"
              className="stella-hit mr-1.5 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={13} />
            </button>
            {/* Um brilho que atravessa o botão uma vez, logo depois de ele aparecer */}
            {!reducedMotion && (
              <motion.span
                aria-hidden="true"
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ delay: 0.45, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
