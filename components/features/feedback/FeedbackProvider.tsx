"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RatingCard } from "@/components/features/feedback/RatingCard";
import { feedbackService } from "@/services/feedback/feedbackService";
import { onGoodMoment } from "@/utils/goodMoment";
import type { AppRating, RatingSource } from "@/types/feedback";

/** Depois do momento bom, um respiro antes do convite (no chat, a resposta da Stella aparece primeiro). */
const INVITE_DELAY_MS = 3500;

interface FeedbackContextValue {
  // null enquanto carrega
  status: AppRating | null;
  panelOpen: boolean;
  open: (source: RatingSource) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useFeedback deve ser usado dentro do FeedbackProvider.");
  return value;
}

/**
 * Avaliação da Stella em todo o app: busca a situação ao abrir (o que também conta o dia de uso), mostra o convite
 * automático logo depois de um momento bom (a partir do 2º dia, de novo a cada 5 dias sem resposta) e abre o mesmo
 * cartão pelo Perfil e pelo botão da aba Tendências. Depois da primeira avaliação, nada aparece sozinho.
 */
export function FeedbackProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [status, setStatus] = useState<AppRating | null>(null);
  const [source, setSource] = useState<RatingSource | null>(null);
  const inviteUsed = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    feedbackService.status(controller.signal).then(setStatus).catch(() => undefined);
    return () => controller.abort();
  }, [enabled]);

  const open = useCallback((next: RatingSource) => setSource(next), []);

  // Convite automático: uma vez por abertura do app, logo depois do próximo momento bom
  useEffect(() => {
    if (!status?.invite || inviteUsed.current) return;
    let timer: number | undefined;
    const stop = onGoodMoment(() => {
      if (inviteUsed.current) return;
      inviteUsed.current = true;
      timer = window.setTimeout(() => {
        setSource((current) => current ?? "INVITE");
        void feedbackService.inviteShown().catch(() => undefined);
      }, INVITE_DELAY_MS);
    });
    return () => {
      stop();
      if (timer) window.clearTimeout(timer);
    };
  }, [status]);

  const saved = useCallback((rating: AppRating) => setStatus(rating), []);
  const close = useCallback(() => setSource(null), []);
  // No chat, o campo de mensagem fica embaixo: no celular, o cartão aparece no alto
  const onChat = pathname?.startsWith("/chat");

  return (
    <FeedbackContext.Provider value={{ status, panelOpen: source !== null, open }}>
      {children}
      <AnimatePresence>
        {source && (
          <motion.div
            key="rating-panel"
            layoutId="stella-rating"
            role="dialog"
            aria-label="Avaliar a Stella"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 18, scale: reducedMotion ? 1 : 0.96, filter: reducedMotion ? "none" : "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : 0.97, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-x-3 z-40 mx-auto max-w-[380px] overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_24px_60px_-20px_rgba(28,25,23,0.35)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:top-auto sm:w-[360px] ${onChat ? "top-[calc(env(safe-area-inset-top)+4.5rem)]" : "bottom-[calc(env(safe-area-inset-bottom)+1rem)]"}`}
          >
            <RatingCard
              source={source}
              initial={status?.rating ? status : null}
              onSaved={saved}
              onClose={close}
              dismissLabel={source === "INVITE" ? "Agora não" : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
}
