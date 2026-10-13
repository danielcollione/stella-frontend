"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { InfiniteScrollSentinel } from "@/components/features/wardrobe/InfiniteScrollSentinel";
import { useWardrobeItems } from "@/components/features/wardrobe/useWardrobeItems";
import { CATEGORY_LABELS, CATEGORY_ORDER, displayName } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingCategory, ClothingItem } from "@/types/wardrobe";

interface WardrobePickerDialogProps {
  title: string;
  description?: string;
  initial: ClothingItem[];
  max: number;
  confirmLabel: string;
  // Aviso curto ao lado do botão (ex: "Usa 1 mensagem do seu plano")
  note?: string;
  // Só habilita o botão quando a seleção mudou em relação à inicial
  requireChange?: boolean;
  onConfirm: (items: ClothingItem[]) => void;
  onClose: () => void;
}

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Escolha de peças do guarda-roupa pela foto: uma grade com busca e filtro por categoria, em que tocar numa
 * peça marca ou desmarca. Pensada para o celular (não exige teclado) e usada igual no computador.
 */
export function WardrobePickerDialog({ title, description, initial, max, confirmLabel, note, requireChange, onConfirm, onClose }: WardrobePickerDialogProps) {
  const [selected, setSelected] = useState<ClothingItem[]>(initial);
  const [category, setCategory] = useState<ClothingCategory | "ALL">("ALL");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(text), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text]);

  const { items, meta, status, refreshing, loadingMore, loadMore, retry } =
    useWardrobeItems({ scope: "ACTIVE", category: category === "ALL" ? undefined : category, query });

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);
  const full = selected.length >= max;
  const changed = selected.map((item) => item.id).join() !== initial.map((item) => item.id).join();
  const categories = CATEGORY_ORDER.filter((value) => (meta?.categoryCounts[value] ?? 0) > 0 || value === category);
  const wardrobeEmpty = status === "ready" && meta?.allCount === 0;

  function toggle(item: ClothingItem) {
    setSelected((current) => {
      if (current.some((chosen) => chosen.id === item.id)) return current.filter((chosen) => chosen.id !== item.id);
      return current.length >= max ? current : [...current, item];
    });
  }

  const chipClass = (active: boolean) => `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"}`;

  return (
    <Modal open onClose={onClose} title={title} description={description}>
      <div className="flex min-h-[62dvh] flex-col">
        {/* Busca e categorias ficam presas no topo enquanto a grade rola */}
        <div className="sticky top-0 z-10 space-y-3 border-b border-stone-200/70 bg-[#FAF8F5]/95 px-5 pb-3 pt-4 backdrop-blur-sm sm:px-7">
          <label className="relative block">
            <span className="sr-only">Buscar no guarda-roupa</span>
            <Search aria-hidden="true" size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Buscar pelo nome, cor ou marca"
              autoComplete="off"
              className="h-11 w-full rounded-full border border-stone-200/90 bg-white pl-10 pr-10 text-sm text-stone-900 outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 [&::-webkit-search-cancel-button]:hidden"
            />
            {text && (
              <button type="button" onClick={() => setText("")} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                <X size={14} />
              </button>
            )}
          </label>
          {categories.length > 1 && (
            <div role="radiogroup" aria-label="Categoria" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none sm:-mx-7 sm:px-7">
              <button type="button" role="radio" aria-checked={category === "ALL"} onClick={() => setCategory("ALL")} className={chipClass(category === "ALL")}>Tudo</button>
              {categories.map((value) => (
                <button key={value} type="button" role="radio" aria-checked={category === value} onClick={() => setCategory(value)} className={chipClass(category === value)}>
                  {CATEGORY_LABELS[value].plural}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 px-5 py-4 sm:px-7">
          {/* As escolhidas aparecem primeiro, com o × para tirar: quem abre para editar costuma querer remover
              alguma, e não deveria ter de procurá-la na grade */}
          {selected.length > 0 && (
            <section aria-label="Peças escolhidas" className="mb-5 rounded-2xl border border-stone-200/80 bg-white p-3">
              <p className="mb-2.5 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Escolhidas</p>
              <ul className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-0.5 pt-2 scrollbar-none">
                {selected.map((item) => {
                  const name = displayName(item);
                  return (
                    <li key={item.id} className="relative w-[4.5rem] shrink-0">
                      <span className="block aspect-[4/5] overflow-hidden rounded-lg bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnailUrl ?? item.imageUrl} alt="" draggable={false} className="h-full w-full object-cover" />
                      </span>
                      <button type="button" onClick={() => toggle(item)} aria-label={`Tirar ${name}`} title="Tirar" className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition-colors hover:border-red-200 hover:text-red-700">
                        <X size={12} strokeWidth={2.5} />
                      </button>
                      <span className="mt-1 block truncate text-[10px] text-stone-600" title={name}>{name}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {status === "loading" && (
            <div role="status" aria-label="Carregando peças" className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-xl bg-stone-200/60" />)}
            </div>
          )}

          {status === "error" && (
            <p className="py-10 text-center text-sm text-stone-500">
              Não foi possível abrir seu guarda-roupa.{" "}
              <button type="button" onClick={retry} className="font-medium text-stone-800 underline underline-offset-4">Tentar novamente</button>
            </p>
          )}

          {wardrobeEmpty && (
            <p className="py-10 text-center text-sm leading-relaxed text-stone-500">
              Seu guarda-roupa ainda está vazio.<br />
              <Link href="/wardrobe" className="font-medium text-stone-800 underline underline-offset-4">Adicionar peças</Link>
            </p>
          )}

          {status === "ready" && !wardrobeEmpty && items.length === 0 && !refreshing && (
            <p className="py-10 text-center text-sm text-stone-500">Nenhuma peça encontrada com esse filtro.</p>
          )}

          {status === "ready" && items.length > 0 && (
            <ul className={`grid grid-cols-3 gap-x-3 gap-y-4 transition-opacity sm:grid-cols-4 md:grid-cols-5 ${refreshing ? "opacity-60" : ""}`}>
              {items.map((item) => {
                const checked = selectedIds.has(item.id);
                const blocked = full && !checked;
                const name = displayName(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={name}
                      disabled={blocked}
                      onClick={() => toggle(item)}
                      className="group block w-full text-left outline-none disabled:cursor-not-allowed"
                    >
                      <span className={`relative block aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 transition-[box-shadow,opacity] group-focus-visible:ring-2 group-focus-visible:ring-stone-400 ${checked ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-[#FAF8F5]" : ""} ${blocked ? "opacity-40" : ""}`}>
                        {/* URL pré-assinada do R2 (expira): <img> simples, sem o otimizador do Next */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnailUrl ?? item.imageUrl} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
                        <span aria-hidden="true" className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${checked ? "border-stone-900 bg-stone-900 text-white" : "border-white/80 bg-white/70 text-transparent backdrop-blur-sm"}`}>
                          <Check size={13} strokeWidth={3} />
                        </span>
                      </span>
                      <span className="mt-1.5 block truncate text-[11px] font-medium text-stone-700" title={name}>{name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <InfiniteScrollSentinel onVisible={() => void loadMore()} disabled={!meta?.hasMore || refreshing || status !== "ready"} watch={items.length} />
          {loadingMore && <p role="status" className="flex items-center justify-center gap-2 py-4 text-xs text-stone-400"><LoaderCircle size={13} className="animate-spin" />Carregando mais peças...</p>}
        </div>

        {/* Resumo e confirmação sempre à vista, na base */}
        <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-stone-200/70 bg-[#FAF8F5]/95 px-5 py-3.5 backdrop-blur-sm sm:px-7">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-800">
              {selected.length === 0 ? "Nenhuma peça escolhida" : `${selected.length} ${selected.length === 1 ? "peça escolhida" : "peças escolhidas"}`}
              {full && <span className="font-normal text-stone-500"> · limite de {max}</span>}
            </p>
            {note && <p className="text-[11px] text-stone-400">{note}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900">Cancelar</button>
            <button type="button" onClick={() => onConfirm(selected)} disabled={requireChange && !changed} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40">
              {confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}
