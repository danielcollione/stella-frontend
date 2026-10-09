"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { AtSign, LoaderCircle, Shirt, X } from "lucide-react";
import { wardrobeService } from "@/services/wardrobe/wardrobeService";
import { CATEGORY_LABELS, STATUS_LABELS, displayName, matchesQuery } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingItem } from "@/types/wardrobe";

// Limites alinhados ao back-end (ChatService.MAX_MENTIONED_ITEMS)
export const MAX_MENTIONS = 5;
// Limite por conversa, igual em todos os planos (chat.mentions.per_conversation)
export const MENTIONS_PER_CONVERSATION = 15;
const MAX_RESULTS = 8;
// URLs das fotos são pré-assinadas (15 min): recarrega o catálogo antes de expirarem
const CATALOG_TTL_MS = 10 * 60 * 1000;

// "@" no início ou depois de espaço, seguido do que a pessoa está digitando até o cursor
const MENTION_PATTERN = /(?:^|\s)@([^@\n]{0,40})$/;

export function mentionToken(item: ClothingItem) {
  return `@${displayName(item)}`;
}

// Divide o texto em trechos comuns e "@Nome" de peças mencionadas (os nomes mais longos primeiro)
export function splitByMentions(content: string, items: ClothingItem[]): { text: string; mention: boolean }[] {
  const tokens = [...new Set(items.map(mentionToken))].sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return [{ text: content, mention: false }];
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return content
    .split(new RegExp(`(${escaped.join("|")})`, "g"))
    .filter((text) => text.length > 0)
    .map((text) => ({ text, mention: tokens.includes(text) }));
}

interface ActiveQuery {
  start: number; // posição do "@"
  end: number; // posição do cursor
  text: string;
}

interface MentionInputProps {
  // Quantas peças ainda podem ser marcadas nesta conversa (limite por conversa, aplicado só no front)
  remainingInConversation?: number;
  value: string;
  onChange: (value: string) => void;
  mentions: ClothingItem[];
  onMentionsChange: (mentions: ClothingItem[]) => void;
  placeholder?: string;
}

export function MentionInput({ value, onChange, mentions, onMentionsChange, placeholder, remainingInConversation = Infinity }: MentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [catalog, setCatalog] = useState<ClothingItem[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const loadedAtRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState<ActiveQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => () => controllerRef.current?.abort(), []);

  // Carrega o guarda-roupa só quando a pessoa digita "@" pela primeira vez (ou quando as URLs envelheceram)
  async function ensureCatalog() {
    const fresh = catalogStatus === "ready" && Date.now() - loadedAtRef.current < CATALOG_TTL_MS;
    if (fresh || catalogStatus === "loading") return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setCatalogStatus("loading");
    try {
      const items = await wardrobeService.listItems({ signal: controller.signal });
      if (controller.signal.aborted) return;
      loadedAtRef.current = Date.now();
      setCatalog(items.filter((item) => item.status !== "ARCHIVED"));
      setCatalogStatus("ready");
    } catch {
      if (!controller.signal.aborted) setCatalogStatus("error");
    }
  }

  const results = useMemo(() => {
    if (!query) return [];
    const mentionedIds = new Set(mentions.map((item) => item.id));
    return catalog
      .filter((item) => !mentionedIds.has(item.id) && matchesQuery(item, query.text))
      .slice(0, MAX_RESULTS);
  }, [catalog, query, mentions]);

  // Com espaço na busca e nenhum resultado, a pessoa provavelmente só escreveu "@" no texto: fecha a lista
  const open = query !== null && !(catalogStatus === "ready" && results.length === 0 && /\s/.test(query.text));
  const conversationLimitReached = mentions.length >= remainingInConversation;
  const limitReached = mentions.length >= MAX_MENTIONS || conversationLimitReached;

  function detectQuery(nextValue: string, caret: number): ActiveQuery | null {
    const match = MENTION_PATTERN.exec(nextValue.slice(0, caret));
    if (!match) return null;
    const text = match[1];
    return { start: caret - text.length - 1, end: caret, text };
  }

  function syncQuery(nextValue: string, caret: number | null) {
    const next = caret === null ? null : detectQuery(nextValue, caret);
    setQuery(next);
    setActiveIndex(0);
    if (next) void ensureCatalog();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    onChange(nextValue);
    // Peça cujo "@Nome" foi apagado do texto deixa de ser mencionada
    const kept = mentions.filter((item) => nextValue.includes(mentionToken(item)));
    if (kept.length !== mentions.length) onMentionsChange(kept);
    syncQuery(nextValue, event.target.selectionStart);
  }

  function select(item: ClothingItem) {
    if (!query || limitReached) return;
    const token = `${mentionToken(item)} `;
    const nextValue = value.slice(0, query.start) + token + value.slice(query.end);
    const caret = query.start + token.length;
    onChange(nextValue);
    onMentionsChange([...mentions, item]);
    setQuery(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(caret, caret);
    });
  }

  function removeMention(item: ClothingItem) {
    const token = mentionToken(item);
    onChange(value.replace(`${token} `, "").replace(token, ""));
    onMentionsChange(mentions.filter((existing) => existing.id !== item.id));
    inputRef.current?.focus();
  }

  // O espelho acompanha a rolagem horizontal do campo quando o texto passa da largura
  function syncMirrorScroll() {
    requestAnimationFrame(() => {
      if (mirrorRef.current && inputRef.current) mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setQuery(null);
      return;
    }
    if (results.length === 0 || limitReached) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + results.length) % results.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      // Enter escolhe a peça em vez de enviar a mensagem
      event.preventDefault();
      select(results[Math.min(activeIndex, results.length - 1)]);
    }
  }

  const activeOptionId = open && results.length > 0 ? `${listboxId}-${Math.min(activeIndex, results.length - 1)}` : undefined;

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-4 w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_12px_32px_rgba(28,25,23,0.10),0_2px_8px_rgba(28,25,23,0.04)]">
          <div className="flex items-center gap-1.5 border-b border-stone-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
            <AtSign size={12} />
            Seu guarda-roupa
          </div>
          <MentionResults
            listboxId={listboxId}
            status={catalogStatus}
            hasCatalog={catalog.length > 0}
            results={results}
            activeIndex={activeIndex}
            limitReached={limitReached}
            conversationLimitReached={conversationLimitReached}
            onHover={setActiveIndex}
            onSelect={select}
          />
        </div>
      )}

      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2">
          {mentions.map((item) => (
            <span key={item.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 py-0.5 pl-0.5 pr-1 text-xs text-stone-700">
              <MentionThumb item={item} className="h-5 w-5" />
              <span className="truncate">{displayName(item)}</span>
              <button type="button" onClick={() => removeMention(item)} aria-label={`Remover menção a ${displayName(item)}`} className="rounded-full p-0.5 text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
      {/* Camada espelho: um <input> não colore trechos do texto, então o texto visível é desenhado aqui,
          com as menções destacadas, e o campo por cima fica com texto transparente (só o cursor aparece).
          Mesma fonte, tamanho e padding do campo; o destaque não muda peso nem espaçamento para não desalinhar o cursor. */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-4 pt-2 pb-3 text-sm font-light text-stone-900"
      >
        {splitByMentions(value, mentions).map((part, index) => part.mention
          ? <span key={index} className="rounded-[4px] bg-[#EDE3D6] text-stone-950 [box-shadow:0_0_0_2px_#EDE3D6]">{part.text}</span>
          : <span key={index}>{part.text}</span>)}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => {
          handleChange(event);
          syncMirrorScroll();
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={syncMirrorScroll}
        onScroll={syncMirrorScroll}
        onSelect={syncMirrorScroll}
        onClick={(event) => syncQuery(value, event.currentTarget.selectionStart)}
        onBlur={() => setQuery(null)}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        className="relative w-full px-4 pt-2 pb-3 text-sm bg-transparent focus:outline-none placeholder:text-stone-400 text-transparent caret-stone-900 font-light selection:bg-stone-300/60"
      />
      </div>
    </div>
  );
}

function MentionResults({ listboxId, status, hasCatalog, results, activeIndex, limitReached, conversationLimitReached, onHover, onSelect }: {
  listboxId: string;
  status: "idle" | "loading" | "ready" | "error";
  hasCatalog: boolean;
  results: ClothingItem[];
  activeIndex: number;
  limitReached: boolean;
  conversationLimitReached: boolean;
  onHover: (index: number) => void;
  onSelect: (item: ClothingItem) => void;
}) {
  const message = (text: string) => <p className="px-4 py-4 text-sm text-stone-500">{text}</p>;

  if (status === "loading" && !hasCatalog) {
    return <p role="status" className="flex items-center gap-2 px-4 py-4 text-sm text-stone-500"><LoaderCircle size={14} className="animate-spin" />Carregando peças...</p>;
  }
  if (status === "error") return message("Não foi possível carregar seu guarda-roupa.");
  if (conversationLimitReached) return message(`Você já marcou ${MENTIONS_PER_CONVERSATION} peças nesta conversa. Comece uma nova conversa para marcar outras.`);
  if (limitReached) return message(`Você pode mencionar até ${MAX_MENTIONS} peças por mensagem.`);
  if (status === "ready" && !hasCatalog) {
    return (
      <div className="px-4 py-4 text-sm text-stone-500">
        Seu guarda-roupa ainda está vazio.{" "}
        {/* onMouseDown evita o blur do campo antes da navegação */}
        <Link href="/wardrobe" onMouseDown={(event) => event.preventDefault()} className="font-medium text-stone-800 underline underline-offset-4">Adicionar peças</Link>
      </div>
    );
  }
  if (results.length === 0) return message("Nenhuma peça encontrada.");

  return (
    <ul id={listboxId} role="listbox" aria-label="Peças do guarda-roupa" className="max-h-72 overflow-y-auto p-1.5">
      {results.map((item, index) => {
        const active = index === Math.min(activeIndex, results.length - 1);
        return (
          <li
            key={item.id}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={active}
            // mousedown + preventDefault: escolhe sem tirar o foco do campo de texto
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(item);
            }}
            onMouseEnter={() => onHover(index)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${active ? "bg-stone-100" : ""}`}
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
        );
      })}
    </ul>
  );
}

export function MentionThumb({ item, className = "" }: { item: ClothingItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-stone-300 ${className}`}>
      {failed ? <Shirt size={12} /> : (
        // URL pré-assinada do R2: <img> simples, sem o otimizador do Next
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
    </span>
  );
}
