"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { StellaMark } from "@/components/ui/StellaMark";

// O que a Stella "está fazendo" enquanto responde, conforme o que a pessoa mandou (decidido aqui mesmo, por palavras
// da mensagem, sem custo de IA). A primeira frase aparece sempre; as demais se alternam.
export type ThinkingContext = "look" | "photo" | "general";

const PHRASES: Record<ThinkingContext, string[]> = {
  look: [
    "Pensando no seu look",
    "Abrindo o seu guarda-roupa",
    "Conferindo o clima de hoje",
    "Olhando a sua agenda",
    "Combinando cores e texturas",
    "Lembrando do que você gosta",
    "Escolhendo os acessórios",
    "Dando os últimos retoques",
  ],
  photo: [
    "Olhando a sua foto",
    "Reparando nas cores e nos tecidos",
    "Observando o caimento",
    "Comparando com o seu estilo",
    "Organizando o que vi",
    "Dando os últimos retoques",
  ],
  general: [
    "Pensando na sua pergunta",
    "Organizando as ideias",
    "Buscando referências",
    "Conferindo os detalhes",
    "Escrevendo a resposta",
    "Dando os últimos retoques",
  ],
};

// Palavras que indicam pedido de look, roupa ou combinação (sem acento, minúsculas)
const LOOK_WORDS = /\b(look|looks|roupa|roupas|vestir|visto|usar|combina|combinar|combinacao|produc|evento|festa|casamento|jantar|trabalho|entrevista|guarda roupa|guarda-roupa|peca|pecas|outfit|montar|monte|sugest|o que eu uso|o que usar)/;

/** Decide o tom das frases pela mensagem que a pessoa acabou de mandar. */
export function thinkingContext(text: string | undefined, hasPhotos: boolean, hasMentions: boolean): ThinkingContext {
  if (hasPhotos) return "photo";
  if (hasMentions) return "look";
  const normalized = (text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return LOOK_WORDS.test(normalized) ? "look" : "general";
}

const INTERVAL_MS = 2600;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Indicador de que a Stella está respondendo: o traço dela ganha vida (o dedo toca o queixo, pensativa) e as
 * frases se revezam com uma troca suave (a que sai sobe e perde o foco, a que entra chega de baixo), cada uma
 * atravessada por um brilho (.stella-shimmer).
 */
export function ThinkingStatus({ context = "general" }: { context?: ThinkingContext }) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const phrases = PHRASES[context];

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % phrases.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [phrases]);

  return (
    <div role="status" aria-label="A Stella está respondendo" className="stella-message-in flex items-center gap-3 py-2 text-xs text-stone-500 [animation-delay:250ms]">
      {reducedMotion ? <StellaMark size={28} decorative /> : (
        // Mesmo traço do StellaMark pequeno, animado; <img> simples para o Next não converter em imagem parada
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/stella-thinking.webp" alt="" aria-hidden="true" width={28} height={28} draggable={false} className="shrink-0 select-none" />
      )}
      {/* A altura fixa evita que a linha "pule" enquanto uma frase sai e a outra entra */}
      <span aria-hidden="true" className="relative flex h-5 items-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8, filter: reducedMotion ? "none" : "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -8, filter: reducedMotion ? "none" : "blur(4px)" }}
            transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: EASE }}
            className="stella-shimmer whitespace-nowrap pr-0.5 font-serif text-sm italic"
          >
            {phrases[index % phrases.length]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
