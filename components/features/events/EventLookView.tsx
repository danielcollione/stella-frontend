"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, ShoppingBag, Shirt, Sparkles } from "lucide-react";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import type { EventLook } from "@/types/events";
import type { ClothingItem } from "@/types/wardrobe";

interface EventLookViewProps {
  looks: EventLook[]; // mais recente primeiro
  index: number;
  chosenLookId: string | null;
  choosing: boolean;
  onIndexChange: (index: number) => void;
  onChoose: (look: EventLook) => void;
}

export function EventLookView({ looks, index, chosenLookId, choosing, onIndexChange, onChoose }: EventLookViewProps) {
  const reducedMotion = useReducedMotion();
  const look = looks[index];
  const total = looks.length;
  const number = total - index; // numeração cronológica: o primeiro look gerado é o 1
  const chosen = look.id === chosenLookId;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">O look da Stella</p>
        {total > 1 && (
          <div className="flex items-center gap-1" aria-label="Looks gerados">
            <button type="button" onClick={() => onIndexChange(index + 1)} disabled={index >= total - 1} aria-label="Look anterior" className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums text-stone-500" aria-live="polite">{number} de {total}</span>
            <button type="button" onClick={() => onIndexChange(index - 1)} disabled={index <= 0} aria-label="Próximo look" className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={look.id}
          initial={{ opacity: 0, x: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reducedMotion ? 0 : -12 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-serif text-2xl italic leading-snug tracking-tight text-stone-900 sm:text-3xl">{look.headline}</h3>
            {chosen ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                <Check size={13} /> Seu look escolhido
              </span>
            ) : (
              <button type="button" onClick={() => onChoose(look)} disabled={choosing} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900 disabled:opacity-60">
                {choosing ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
                Vou com este
              </button>
            )}
          </div>

          {look.items.length > 0 && (
            <div className="mt-5">
              <p className="mb-2.5 text-xs font-medium text-stone-500">Do seu guarda-roupa</p>
              <ul className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
                {look.items.map((item) => <LookItem key={item.id} item={item} />)}
              </ul>
            </div>
          )}

          {look.shoppingSuggestions.length > 0 && (
            <div className="mt-5">
              <p className="mb-2.5 text-xs font-medium text-stone-500">Para completar</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {look.shoppingSuggestions.map((suggestion) => (
                  <li key={suggestion} className="flex items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-3.5 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500"><ShoppingBag size={14} strokeWidth={1.75} /></span>
                    <span className="min-w-0">
                      <span className="block text-sm text-stone-800">{suggestion}</span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">Sugestão de compra</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-l-2 border-stone-200 pl-4 text-sm leading-relaxed text-stone-700">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
                ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
              }}
            >
              {look.styling}
            </ReactMarkdown>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

function LookItem({ item }: { item: ClothingItem }) {
  const [failed, setFailed] = useState<string | null>(null);
  const name = displayName(item);
  return (
    <li className="w-28 shrink-0 snap-start sm:w-auto">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100">
        {failed === item.imageUrl ? (
          <div className="flex h-full items-center justify-center text-stone-300"><Shirt size={24} strokeWidth={1.25} /></div>
        ) : (
          // URLs pré-assinadas do R2 expiram: <img> simples, sem o otimizador do Next
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={name} loading="lazy" decoding="async" onError={() => setFailed(item.imageUrl)} className="h-full w-full object-cover" />
        )}
      </div>
      <p className="mt-1.5 truncate text-center text-[10px] font-medium uppercase tracking-[0.08em] text-stone-600" title={name}>{name}</p>
    </li>
  );
}

const GENERATING_STEPS = [
  "Abrindo o seu guarda-roupa",
  "Pensando no dress code",
  "Harmonizando cores e texturas",
  "Escolhendo os acessórios",
  "Finalizando os detalhes",
];

// Enquanto a Stella monta o look (alguns segundos): peças "se revelando" e frases que mudam
export function GeneratingLook() {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, GENERATING_STEPS.length - 1)), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div role="status" className="flex flex-col items-center py-6 text-center">
      <div className="flex items-end gap-3" aria-hidden="true">
        {[0, 1, 2].map((tile) => (
          <motion.span
            key={tile}
            className={`block rounded-2xl border border-stone-200/80 bg-gradient-to-b from-stone-100 to-stone-200/70 ${tile === 1 ? "h-32 w-24" : "h-24 w-[4.5rem]"}`}
            animate={reducedMotion ? undefined : { y: [0, -6, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: tile * 0.25, ease: "easeInOut" }}
          />
        ))}
      </div>
      <p className="mt-6 inline-flex items-center gap-2 text-sm text-stone-700">
        <Sparkles size={15} className="animate-pulse text-stone-900" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            {GENERATING_STEPS[step]}…
          </motion.span>
        </AnimatePresence>
      </p>
      <p className="mt-1 text-xs text-stone-400">A Stella está montando o seu look.</p>
    </div>
  );
}
