"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CloudSun, LoaderCircle, Pencil, ShoppingBag, Shirt, Sparkles, X } from "lucide-react";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { PartnerLinkNote, ShoppingLinks } from "@/components/features/shopping/ShoppingLinks";
import { WardrobeItemPicker } from "@/components/features/wardrobe/WardrobeItemPicker";
import { MAX_EVENT_ITEMS } from "@/types/events";
import type { EventLook } from "@/types/events";
import type { ClothingItem } from "@/types/wardrobe";

interface EventLookViewProps {
  looks: EventLook[]; // mais recente primeiro
  index: number;
  chosenLookId: string | null;
  choosing: boolean;
  onIndexChange: (index: number) => void;
  onChoose: (look: EventLook) => void;
  // Edição das peças do look (eventos que ainda não passaram): ao salvar, a Stella opina sobre a nova combinação
  editable?: boolean;
  busy?: boolean;
  onEditItems?: (look: EventLook, items: ClothingItem[]) => void;
}

export function EventLookView({ looks, index, chosenLookId, choosing, onIndexChange, onChoose, editable, busy, onEditItems }: EventLookViewProps) {
  const reducedMotion = useReducedMotion();
  const look = looks[index];
  const total = looks.length;
  const number = total - index; // numeração cronológica: o primeiro look gerado é o 1
  const chosen = look.id === chosenLookId;
  // O rascunho vale só para o look em que foi aberto: trocar de look descarta a edição
  const [draft, setDraft] = useState<{ lookId: string; items: ClothingItem[] } | null>(null);
  const editing = draft?.lookId === look.id ? draft.items : null;
  const canEdit = Boolean(editable && onEditItems);
  const changed = editing !== null && editing.map((item) => item.id).join() !== look.items.map((item) => item.id).join();

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

          {(look.analysis || look.weatherSummary) && (
            <div className="mt-3 rounded-2xl bg-[#FAF8F5] px-4 py-3">
              {look.weatherSummary && (
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-500">
                  <CloudSun size={13} className="text-stone-400" />{look.weatherSummary}
                </p>
              )}
              {look.analysis && <p className={`text-sm italic leading-relaxed text-stone-600 ${look.weatherSummary ? "mt-1" : ""}`}>{look.analysis}</p>}
            </div>
          )}

          {(look.items.length > 0 || canEdit) && (
            <div className="mt-5">
              <div className="mb-2.5 flex min-h-6 items-center justify-between gap-3">
                <p className="text-xs font-medium text-stone-500">Do seu guarda-roupa</p>
                {canEdit && editing === null && (
                  <button type="button" onClick={() => setDraft({ lookId: look.id, items: look.items })} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">
                    <Pencil size={12} /> {look.items.length > 0 ? "Editar peças" : "Adicionar peças"}
                  </button>
                )}
              </div>
              {/* A barra de edição fica acima das peças: busca e botões sempre à vista, sem rolar a tela */}
              <AnimatePresence initial={false}>
                {editing && (
                  <LookEditBar
                    key="edit-bar"
                    items={editing}
                    canSave={changed && !busy}
                    onChange={(items) => setDraft({ lookId: look.id, items })}
                    onCancel={() => setDraft(null)}
                    onSave={() => {
                      setDraft(null);
                      onEditItems?.(look, editing);
                    }}
                  />
                )}
              </AnimatePresence>
              {(editing ?? look.items).length > 0 && (
                <ul className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
                  {(editing ?? look.items).map((item) => (
                    <LookItem
                      key={item.id}
                      item={item}
                      onRemove={editing ? () => setDraft({ lookId: look.id, items: editing.filter((kept) => kept.id !== item.id) }) : undefined}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}

          {look.basics.length > 0 && (
            <div className="mt-5">
              <p className="mb-2.5 text-xs font-medium text-stone-500">{look.items.length > 0 ? "Com básicos que você já deve ter" : "Básicos que você já deve ter"}</p>
              <ul className="flex flex-wrap gap-2">
                {look.basics.map((basic) => (
                  <li key={basic} className="rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-700">{basic}</li>
                ))}
              </ul>
            </div>
          )}

          {look.shoppingSuggestions.length > 0 && (
            <div className="mt-5">
              <p className="mb-2.5 text-xs font-medium text-stone-500">Para elevar o look</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {look.shoppingSuggestions.map((suggestion) => (
                  <li key={suggestion} className="space-y-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-3.5 py-3">
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500"><ShoppingBag size={14} strokeWidth={1.75} /></span>
                      <span className="min-w-0">
                        <span className="block text-sm text-stone-800">{suggestion}</span>
                        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">Sugestão de compra</span>
                      </span>
                    </span>
                    <ShoppingLinks suggestion={suggestion} />
                  </li>
                ))}
              </ul>
              <div className="mt-2.5"><PartnerLinkNote /></div>
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

function LookEditBar({ items, canSave, onChange, onCancel, onSave }: {
  items: ClothingItem[];
  canSave: boolean;
  onChange: (items: ClothingItem[]) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const reducedMotion = useReducedMotion();
  // Enquanto a barra abre ou fecha, o conteúdo é recortado; depois, a lista de sugestões pode sair dos limites dela
  const [settled, setSettled] = useState(false);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onAnimationStart={() => setSettled(false)}
      onAnimationComplete={() => setSettled(true)}
      style={{ overflow: settled ? "visible" : "hidden" }}
      className="relative z-20"
    >
      <motion.div
        initial={{ y: reducedMotion ? 0 : -8 }}
        animate={{ y: 0 }}
        exit={{ y: reducedMotion ? 0 : -8 }}
        transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 rounded-2xl bg-[#FAF8F5] p-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <WardrobeItemPicker value={items} onChange={onChange} max={MAX_EVENT_ITEMS} placeholder="Adicionar peça do guarda-roupa" hideSelected />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-1.5">
            <button type="button" onClick={onCancel} className="rounded-full px-3.5 py-2.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900">Cancelar</button>
            <button type="button" onClick={onSave} disabled={!canSave} className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40">
              <Sparkles size={12} /> Salvar e ouvir a Stella
            </button>
          </div>
        </div>
        <p className="mt-2 px-1 text-[11px] text-stone-400">Toque no × para tirar uma peça. Ao salvar, a Stella comenta as suas escolhas (usa 1 mensagem do seu plano).</p>
      </motion.div>
    </motion.div>
  );
}

function LookItem({ item, onRemove }: { item: ClothingItem; onRemove?: () => void }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const name = displayName(item);
  const src = item.thumbnailUrl ?? item.imageUrl;
  return (
    <li className="relative w-28 shrink-0 snap-start sm:w-auto">
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Tirar ${name} do look`} title="Tirar do look" className="stella-message-in absolute right-1.5 top-1.5 z-10 rounded-full bg-white/95 p-1 text-stone-600 shadow-sm transition-colors hover:bg-white hover:text-red-700">
          <X size={13} />
        </button>
      )}
      {/* Miniatura no look; tocar abre a foto original */}
      <button type="button" onClick={() => setViewerOpen(true)} aria-label={`Ampliar ${name}`} className="block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
        {failed === src ? (
          <span className="flex h-full items-center justify-center text-stone-300"><Shirt size={24} strokeWidth={1.25} /></span>
        ) : (
          // URLs pré-assinadas do R2 expiram: <img> simples, sem o otimizador do Next
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setFailed(src)} className="h-full w-full object-cover" />
        )}
      </button>
      <p className="mt-1.5 truncate text-center text-[10px] font-medium uppercase tracking-[0.08em] text-stone-600" title={name}>{name}</p>
      <ImageViewer open={viewerOpen} onClose={() => setViewerOpen(false)} label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={name} className="max-h-[calc(100dvh-5rem)] max-w-full rounded-xl object-contain shadow-2xl" />
      </ImageViewer>
    </li>
  );
}

const GENERATING_STEPS = [
  "Consultando a previsão do tempo",
  "Entendendo a ocasião",
  "Abrindo o seu guarda-roupa",
  "Harmonizando cores e texturas",
  "Finalizando os detalhes",
];

// Enquanto a Stella monta o look (alguns segundos): peças "se revelando" e frases que mudam
export function GeneratingLook({ caption = "A Stella está montando o seu look." }: { caption?: string }) {
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
      <p className="mt-1 text-xs text-stone-400">{caption}</p>
    </div>
  );
}
