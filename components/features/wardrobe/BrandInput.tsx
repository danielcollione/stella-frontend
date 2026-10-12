"use client";

import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { BRAND_SUGGESTIONS } from "@/services/wardrobe/brandCatalog";

const MAX_SUGGESTIONS = 6;
const MAX_LENGTH = 80; // mesmo limite do back-end (UpdateClothingItemRequestDto)

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

const CATALOG = [...new Set(BRAND_SUGGESTIONS)].map((name) => ({ name, key: normalize(name) }));

interface BrandInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputClassName: string;
}

/**
 * Campo de marca: texto livre, com sugestões das marcas mais comuns enquanto a pessoa digita.
 * A escolha é sempre de quem cadastra; nenhuma marca é obrigatória nem precisa estar na lista.
 */
export function BrandInput({ id, value, onChange, disabled, inputClassName }: BrandInputProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Quem começa com o texto vem antes de quem só o contém ("ni" -> Nike antes de Uniqlo)
  const results = useMemo(() => {
    const term = normalize(value);
    if (!term) return [];
    const starts = CATALOG.filter((brand) => brand.key.startsWith(term));
    const contains = CATALOG.filter((brand) => !brand.key.startsWith(term) && brand.key.includes(term));
    const found = [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
    return found.length === 1 && found[0].key === term ? [] : found;
  }, [value]);

  const visible = open && results.length > 0;
  const active = Math.min(activeIndex, results.length - 1);

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!visible) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation(); // fecha só as sugestões, não a modal
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((active + step + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[active].name);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        placeholder="Ex: Zara"
        disabled={disabled}
        autoComplete="off"
        maxLength={MAX_LENGTH}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={visible ? listboxId : undefined}
        aria-activedescendant={visible ? `${listboxId}-${active}` : undefined}
        className={inputClassName}
      />

      {visible && (
        <ul id={listboxId} role="listbox" aria-label="Marcas sugeridas" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-1.5 text-left shadow-[0_12px_32px_rgba(28,25,23,0.10),0_2px_8px_rgba(28,25,23,0.04)]">
          {results.map((brand, index) => (
            <li
              key={brand.key}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown + preventDefault: escolhe sem tirar o foco do campo
              onMouseDown={(event) => {
                event.preventDefault();
                select(brand.name);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer truncate rounded-xl px-3 py-2 text-sm text-stone-800 transition-colors ${index === active ? "bg-stone-100" : ""}`}
            >
              {brand.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
