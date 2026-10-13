"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { StellaMark } from "@/components/ui/StellaMark";

// O que a Stella "está fazendo" enquanto responde. A primeira aparece sempre; as demais se alternam
const PHRASES = [
  "Pensando no seu look",
  "Abrindo o seu guarda-roupa",
  "Conferindo o clima de hoje",
  "Olhando a sua agenda",
  "Combinando cores e texturas",
  "Lembrando do que você gosta",
  "Escolhendo os acessórios",
  "Dando os últimos retoques",
];

const INTERVAL_MS = 2600;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Indicador de que a Stella está respondendo: as frases se revezam com uma troca suave (a que sai sobe e
 * perde o foco, a que entra chega de baixo), e três pontos pulsam em sequência ao lado.
 */
export function ThinkingStatus() {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % PHRASES.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div role="status" aria-label="A Stella está respondendo" className="stella-message-in flex items-center gap-3 py-2 text-xs text-stone-500 [animation-delay:250ms]">
      <motion.span
        animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.55], scale: [0.96, 1, 0.96] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="shrink-0"
      >
        <StellaMark size={28} decorative />
      </motion.span>
      {/* A altura fixa evita que a linha "pule" enquanto uma frase sai e a outra entra */}
      <span aria-hidden="true" className="relative flex h-5 items-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8, filter: reducedMotion ? "none" : "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -8, filter: reducedMotion ? "none" : "blur(4px)" }}
            transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: EASE }}
            className="whitespace-nowrap font-serif text-sm italic text-stone-600"
          >
            {PHRASES[index]}
          </motion.span>
        </AnimatePresence>
        <span className="ml-1 flex items-end gap-[3px] pb-[3px]">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-[3px] w-[3px] rounded-full bg-stone-400"
              animate={reducedMotion ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: dot * 0.22, ease: "easeInOut" }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}
