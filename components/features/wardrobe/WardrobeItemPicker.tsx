"use client";

import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { LoaderCircle, Search, X } from "lucide-react";
import { InfiniteScrollSentinel } from "@/components/features/wardrobe/InfiniteScrollSentinel";
import { MentionThumb } from "@/components/features/mentions/MentionInput";
import { useMentionSearch } from "@/components/features/mentions/useMentionSearch";
import { CATEGORY_LABELS, STATUS_LABELS, displayName } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingItem } from "@/types/wardrobe";

interface WardrobeItemPickerProps {
  id?: string;
  value: ClothingItem[];
  onChange: (items: ClothingItem[]) => void;
  max: number;
  disabled?: boolean;
  placeholder?: string;
  // Esconde as peças escolhidas (quando a tela já as mostra de outro jeito)
  hideSelected?: boolean;
}

/**
 * Escolha de peças do guarda-roupa: a pessoa busca pelo nome e vê a miniatura de cada peça, como no "@" do chat.
 */
export function WardrobeItemPicker({ id, value, onChange, max, disabled, placeholder = "Buscar no guarda-roupa", hideSelected }: WardrobeItemPickerProps) {
  const listboxId = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [listElement, setListElement] = useState<HTMLUListElement | null>(null);
  const search = useMentionSearch(open ? text : null);
  const full = value.length >= max;

  const results = useMemo(() => {
    const chosen = new Set(value.map((item) => item.id));
    return search.items.filter((item) => !chosen.has(item.id));
  }, [search.items, value]);
  const active = Math.min(activeIndex, results.length - 1);

  function add(item: ClothingItem) {
    if (full) return;
    onChange([...value, item]);
    setText("");
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.preventDefault(); // nunca envia o formulário em volta
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation(); // fecha só a lista, não a modal
      setOpen(false);
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length > 0) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      if (step === 1 && active >= results.length - 3 && search.hasMore) void search.loadMore();
      const next = (active + step + results.length) % results.length;
      setActiveIndex(next);
      listElement?.querySelector(`#${CSS.escape(`${listboxId}-${next}`)}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && results.length > 0 && !full) {
      add(results[active]);
    }
  }

  function renderList() {
    const message = (content: string) => <p className="px-4 py-4 text-sm text-stone-500">{content}</p>;
    if (full) return message(`Você pode escolher até ${max} peças.`);
    if (search.status === "error") return message("Não foi possível carregar seu guarda-roupa.");
    if (!search.hasResults) {
      return <p role="status" className="flex items-center gap-2 px-4 py-4 text-sm text-stone-500"><LoaderCircle size={14} className="animate-spin" />Carregando peças...</p>;
    }
    if (search.wardrobeEmpty) {
      return (
        <p className="px-4 py-4 text-sm text-stone-500">
          Seu guarda-roupa ainda está vazio.{" "}
          <Link href="/wardrobe" onMouseDown={(event) => event.preventDefault()} className="font-medium text-stone-800 underline underline-offset-4">Adicionar peças</Link>
        </p>
      );
    }
    if (results.length === 0 && !search.stale && !search.hasMore) return message("Nenhuma peça encontrada.");

    return (
      <ul ref={setListElement} id={listboxId} role="listbox" aria-label="Peças do guarda-roupa" className={`max-h-64 overflow-y-auto overscroll-contain p-1.5 transition-opacity ${search.stale ? "opacity-60" : ""}`}>
        {results.map((item, index) => (
          <li
            key={item.id}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={index === active}
            // mousedown + preventDefault: escolhe sem tirar o foco do campo
            onMouseDown={(event) => {
              event.preventDefault();
              add(item);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${index === active ? "bg-stone-100" : ""}`}
          >
            <MentionThumb item={item} className="h-10 w-10 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-800">{displayName(item)}</p>
              <p className="truncate text-xs text-stone-400">
                {CATEGORY_LABELS[item.category].singular}
                {item.status !== "AVAILABLE" && ` · ${STATUS_LABELS[item.status]}`}
              </p>
            </div>
          </li>
        ))}
        {search.hasMore && (
          <li role="presentation">
            <InfiniteScrollSentinel onVisible={() => void search.loadMore()} root={listElement} rootMargin="0px 0px 160px 0px" disabled={!listElement || search.loadingMore} watch={results.length} />
            {search.loadingMore && <p className="flex items-center justify-center gap-2 py-2.5 text-xs text-stone-400"><LoaderCircle size={12} className="animate-spin" />Carregando mais...</p>}
          </li>
        )}
      </ul>
    );
  }

  return (
    <div>
      {!hideSelected && value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((item) => (
            <li key={item.id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-1.5 text-xs text-stone-700">
              <MentionThumb item={item} className="h-7 w-7" />
              <span className="truncate">{displayName(item)}</span>
              <button type="button" onClick={() => onChange(value.filter((chosen) => chosen.id !== item.id))} disabled={disabled} aria-label={`Remover ${displayName(item)}`} className="rounded-full p-0.5 text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700 disabled:opacity-50">
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search aria-hidden="true" size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          id={id}
          type="text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open && results.length > 0 ? `${listboxId}-${active}` : undefined}
          className="w-full rounded-lg border border-stone-200/90 bg-white py-3 pl-10 pr-3.5 text-sm text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100"
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200/90 bg-white text-left shadow-[0_12px_32px_rgba(28,25,23,0.10),0_2px_8px_rgba(28,25,23,0.04)]">
            {renderList()}
          </div>
        )}
      </div>
    </div>
  );
}
