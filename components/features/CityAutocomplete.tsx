"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Check, LoaderCircle, MapPin } from "lucide-react";
import { geoService, toCoordinates } from "@/services/geo/geoService";
import type { CitySuggestion } from "@/services/geo/geoService";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export interface CityValue {
  cityName: string;
  cityCoordinates: string; // vazio quando a pessoa digitou livremente sem escolher uma sugestão
}

interface CityAutocompleteProps {
  id?: string;
  value: CityValue;
  onChange: (value: CityValue) => void;
  placeholder?: string;
  disabled?: boolean;
  inputClassName: string;
}

/**
 * Campo de cidade com sugestões do mundo inteiro. Ao escolher uma sugestão, preenche também latitude/longitude.
 * Texto livre continua aceito (sem coordenadas), para nunca bloquear o cadastro.
 */
export function CityAutocomplete({ id, value, onChange, placeholder, disabled, inputClassName }: CityAutocompleteProps) {
  const listboxId = useId();
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    controllerRef.current?.abort();
  }, []);

  // Busca com debounce: só consulta a API quando a pessoa pausa a digitação
  function scheduleSearch(query: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    controllerRef.current?.abort();
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus("idle");
      setOpen(false);
      return;
    }
    setStatus("loading");
    setOpen(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const found = await geoService.searchCities(query.trim(), controller.signal);
        if (controller.signal.aborted) return;
        setResults(found);
        setActiveIndex(0);
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
      }
      setStatus("done");
    }, DEBOUNCE_MS);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const cityName = event.target.value;
    onChange({ cityName, cityCoordinates: "" });
    scheduleSearch(cityName);
  }

  function select(city: CitySuggestion) {
    onChange({ cityName: city.label, cityCoordinates: toCoordinates(city) });
    setOpen(false);
    setResults([]);
    setStatus("idle");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[Math.min(activeIndex, results.length - 1)]);
    }
  }

  const confirmed = value.cityCoordinates !== "" && value.cityName.trim() !== "";
  const activeId = open && results.length > 0 ? `${listboxId}-${Math.min(activeIndex, results.length - 1)}` : undefined;

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value.cityName}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        onFocus={() => {
          if (!confirmed && value.cityName.trim().length >= MIN_QUERY_LENGTH && results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        maxLength={255}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={activeId}
        className={`${inputClassName} pr-11`}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true">
        {status === "loading" ? <LoaderCircle size={16} className="animate-spin" />
          : confirmed ? <Check size={16} className="text-stone-900" /> : <MapPin size={16} />}
      </span>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200/90 bg-white text-left shadow-[0_12px_32px_rgba(28,25,23,0.10),0_2px_8px_rgba(28,25,23,0.04)]">
          {status === "loading" && results.length === 0 ? (
            <p role="status" className="flex items-center gap-2 px-4 py-3.5 text-sm text-stone-500">
              <LoaderCircle size={14} className="animate-spin" />Buscando cidades...
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-stone-500">Nenhuma cidade encontrada. Você pode manter o que digitou.</p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Cidades sugeridas" className="max-h-64 overflow-y-auto p-1.5">
              {results.map((city, index) => {
                const active = index === Math.min(activeIndex, results.length - 1);
                const detail = [city.state !== city.name ? city.state : null, city.country].filter(Boolean).join(", ");
                return (
                  <li
                    key={`${city.label}-${city.latitude}`}
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={active}
                    // mousedown + preventDefault: escolhe sem tirar o foco do campo
                    onMouseDown={(event) => {
                      event.preventDefault();
                      select(city);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active ? "bg-stone-100" : ""}`}
                  >
                    <MapPin size={15} className="shrink-0 text-stone-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-800">{city.name}</p>
                      {detail && <p className="truncate text-xs text-stone-400">{detail}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
