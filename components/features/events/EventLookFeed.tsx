"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CloudSun, LoaderCircle, Pencil, ShoppingBag, Sparkle, Sparkles } from "lucide-react";
import { markGoodMoment } from "@/utils/goodMoment";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import { PieceThumb } from "@/components/features/trends/TrendCard";
import { PostAction } from "@/components/features/trends/PostCarousel";
import { PartnerLinkNote, ShoppingLinks } from "@/components/features/shopping/ShoppingLinks";
import { WardrobePickerDialog } from "@/components/features/wardrobe/WardrobePickerDialog";
import { MAX_EVENT_ITEMS } from "@/types/events";
import type { EventLook } from "@/types/events";
import type { ClothingItem } from "@/types/wardrobe";

/**
 * Os looks do evento no formato de post, no celular e no computador: a colagem das peças, o "Vou com este" e a
 * edição numa linha de ações, e a legenda enxuta (a análise abre num "mais"; o "como usar" já vem aberto). Entre os
 * looks gerados, as setas e o "2 de 3" no alto.
 */
export function EventLookFeed({ looks, initialIndex = 0, chosenLookId, choosing, onChoose, editable, busy, onEditItems }: {
  looks: EventLook[];
  // O look que aparece ao abrir (o escolhido para o evento)
  initialIndex?: number;
  chosenLookId: string | null;
  choosing: boolean;
  onChoose: (look: EventLook) => void;
  editable?: boolean;
  busy?: boolean;
  onEditItems?: (look: EventLook, items: ClothingItem[]) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(initialIndex);
  const safeIndex = Math.min(Math.max(0, index), looks.length - 1);
  const current = looks[safeIndex];
  const total = looks.length;
  const number = total - safeIndex; // numeração cronológica: o primeiro look gerado é o 1

  return (
    <div>
      {/* Entre os looks gerados, as setas e o "2 de 3", como sempre foi */}
      <header className="flex min-h-[36px] items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">O look da Stella</p>
        {total > 1 && (
          <div className="flex items-center gap-1" aria-label="Looks gerados">
            <button type="button" onClick={() => setIndex(safeIndex + 1)} disabled={safeIndex >= total - 1} aria-label="Look anterior" className="stella-hit rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums text-stone-500" aria-live="polite">{number} de {total}</span>
            <button type="button" onClick={() => setIndex(safeIndex - 1)} disabled={safeIndex <= 0} aria-label="Próximo look" className="stella-hit rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </header>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reducedMotion ? 0 : -12 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Celular: a colagem 4:3 na largura da tela. Do tablet em diante: as peças lado a lado, ocupando a largura */}
          <div className="-mx-4 overflow-hidden sm:hidden"><EventLookCollage look={current} /></div>
          <EventLookRow look={current} />
          <EventLookDetails
            look={current}
            chosen={current.id === chosenLookId}
            choosing={choosing}
            onChoose={onChoose}
            canEdit={Boolean(editable && onEditItems)}
            busy={busy}
            onEditItems={onEditItems}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Tablet e computador: as peças lado a lado, todas do mesmo tamanho, preenchendo a largura (cada uma abre em tela cheia)
function EventLookRow({ look }: { look: EventLook }) {
  if (look.items.length === 0) {
    return (
      <div className="hidden items-center justify-center rounded-2xl bg-[#F1E9DC] px-8 py-12 text-center sm:flex">
        <p className="font-serif text-lg italic leading-snug text-stone-700">{look.headline}</p>
      </div>
    );
  }
  const items = look.items.slice(0, 6);
  return (
    <ul className="hidden gap-2 sm:grid" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 3)}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <PieceThumb
            item={{ id: item.id, name: displayName(item), thumbnailUrl: item.thumbnailUrl ?? null, imageUrl: item.imageUrl ?? null }}
            className="aspect-[3/4] w-full rounded-2xl"
          />
          <p className="mt-1.5 truncate text-center text-[10px] font-medium uppercase tracking-[0.08em] text-stone-500" title={displayName(item)}>{displayName(item)}</p>
        </li>
      ))}
    </ul>
  );
}

// As peças do look numa colagem 4:3 (cada uma abre em tela cheia); sem peças do guarda-roupa, os básicos sugeridos
function EventLookCollage({ look }: { look: EventLook }) {
  const photos = look.items.slice(0, 4);
  const extra = look.items.length - photos.length;
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-[#F1E9DC] px-8 text-center">
        <p className="font-serif text-lg italic leading-snug text-stone-700">{look.headline}</p>
      </div>
    );
  }
  const layout = photos.length === 1 ? "grid-cols-1" : photos.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2";
  return (
    <ul className={`grid aspect-[4/3] gap-[3px] bg-stone-100 ${layout}`}>
      {photos.map((item, index) => (
        <li key={item.id} className={`relative min-h-0 ${photos.length === 3 && index === 0 ? "row-span-2" : ""}`}>
          <PieceThumb item={{ id: item.id, name: displayName(item), thumbnailUrl: item.thumbnailUrl ?? null, imageUrl: item.imageUrl ?? null }} className="h-full w-full" />
          {index === photos.length - 1 && extra > 0 && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-900/45 font-serif text-xl italic text-white">+{extra}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function EventLookDetails({ look, chosen, choosing, onChoose, canEdit, busy, onEditItems }: {
  look: EventLook;
  chosen: boolean;
  choosing: boolean;
  onChoose: (look: EventLook) => void;
  canEdit: boolean;
  busy?: boolean;
  onEditItems?: (look: EventLook, items: ClothingItem[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-1">
      <div className="-mx-2 flex min-h-[56px] items-center gap-1 px-2">
        {chosen ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5E8B6E]/35 bg-[#F1F6F2] px-3 py-1.5 text-xs font-medium text-[#2F4A38]">
            <Check size={13} className="text-[#4E7A5E]" /> Vou com este
          </span>
        ) : (
          <button
            type="button"
            onClick={() => { onChoose(look); markGoodMoment(); }}
            disabled={choosing}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900 disabled:opacity-60"
          >
            {choosing ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
            Vou com este
          </button>
        )}
        <span className="flex-1" />
        {canEdit && (
          <PostAction onClick={() => setEditing(true)} disabled={busy} icon={<Pencil size={19} strokeWidth={1.6} />}>
            {look.items.length > 0 ? "Editar peças" : "Adicionar"}
          </PostAction>
        )}
      </div>

      <div className="pb-2">
        <h3 className="mt-4 font-serif text-[30px] font-semibold italic leading-tight tracking-tight text-stone-900">{look.headline}</h3>
        {look.weatherSummary && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-stone-400">
            <CloudSun size={12} />{look.weatherSummary}
          </p>
        )}
        {look.analysis && (
          <>
            <p className={`mt-1.5 text-sm italic leading-relaxed text-stone-600 ${expanded ? "" : "line-clamp-2"}`}>{look.analysis}</p>
            {!expanded && <button type="button" onClick={() => setExpanded(true)} className="stella-hit text-sm text-stone-400 hover:text-stone-700">mais</button>}
          </>
        )}

        {look.basics.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#8A6A4A]">
              <Sparkles aria-hidden="true" size={13} className="text-[#C9A27E]" />
              {look.items.length > 0 ? "Com básicos que você já deve ter" : "Básicos que você já deve ter"}
            </p>
            {/* Em dourado, com um brilho que passa por cada etiqueta em momentos diferentes: completam o look */}
            <ul className="flex flex-wrap gap-2">
              {look.basics.map((basic, index) => (
                <li
                  key={basic}
                  style={{ "--stella-chip-delay": `${index * 0.6}s` } as CSSProperties}
                  className="stella-gold-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-stone-800"
                >
                  <Sparkle aria-hidden="true" size={10} className="shrink-0 fill-[#C9A27E] text-[#C9A27E]" />
                  {basic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {look.shoppingSuggestions.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-stone-500">Para elevar o look</p>
            <ul className="space-y-2">
              {look.shoppingSuggestions.map((suggestion) => (
                <li key={suggestion} className="space-y-2">
                  <p className="flex items-center gap-2 text-[13px] text-stone-800">
                    <ShoppingBag size={14} className="shrink-0 text-stone-400" />{suggestion}
                  </p>
                  <ShoppingLinks suggestion={suggestion} />
                </li>
              ))}
            </ul>
            <div className="mt-2"><PartnerLinkNote /></div>
          </div>
        )}

        {look.styling && (
          <div className="mt-3 border-l-2 border-stone-200 pl-3.5 text-sm leading-relaxed text-stone-700">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
                ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
              }}
            >
              {look.styling}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {editing && (
        <WardrobePickerDialog
          title="Peças do look"
          description="Toque para tirar ou acrescentar peças. Ao salvar, a Stella comenta as suas escolhas."
          initial={look.items}
          max={MAX_EVENT_ITEMS}
          confirmLabel="Salvar e ouvir a Stella"
          note="Usa 1 mensagem do seu plano"
          requireChange
          onClose={() => setEditing(false)}
          onConfirm={(items) => {
            setEditing(false);
            onEditItems?.(look, items);
          }}
        />
      )}
    </div>
  );
}
