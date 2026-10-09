"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wardrobeService } from "@/services/wardrobe/wardrobeService";
import type { ClothingItem } from "@/types/wardrobe";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 150;
// URLs das fotos são pré-assinadas (15 min): resultados guardados valem menos que isso
const CACHE_TTL_MS = 5 * 60 * 1000;

interface Results {
  term: string;
  items: ClothingItem[];
  hasMore: boolean;
  allCount: number;
  loadedAt: number;
}

export type MentionSearchStatus = "idle" | "loading" | "ready" | "error";

/**
 * Busca paginada das peças para o "@": pede ao servidor só o que combina com o que foi digitado, 20 por vez,
 * e guarda os resultados recentes por termo, para apagar e redigitar ser instantâneo. Enquanto a busca nova
 * não chega, os resultados anteriores continuam na lista (sem piscar).
 */
export function useMentionSearch(term: string | null) {
  const [results, setResults] = useState<Results | null>(null);
  const [status, setStatus] = useState<MentionSearchStatus>("idle");
  const [loadingMore, setLoadingMore] = useState(false);
  const cacheRef = useRef(new Map<string, Results>());
  const controllerRef = useRef<AbortController | null>(null);
  const moreRef = useRef(false);
  const normalized = term === null ? null : term.trim().toLowerCase();

  useEffect(() => {
    if (normalized === null) return;
    const cached = cacheRef.current.get(normalized);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      void Promise.resolve().then(() => {
        setResults(cached);
        setStatus("ready");
      });
      return;
    }
    const controller = new AbortController();
    // Primeira abertura do "@" busca na hora; enquanto digita, espera uma pausa curta
    const timer = window.setTimeout(async () => {
      controllerRef.current?.abort();
      controllerRef.current = controller;
      setStatus("loading");
      try {
        const page = await wardrobeService.pageItems({ query: normalized, size: PAGE_SIZE, signal: controller.signal });
        if (controller.signal.aborted) return;
        const next = { term: normalized, items: page.items, hasMore: page.hasMore, allCount: page.allCount, loadedAt: Date.now() };
        cacheRef.current.set(normalized, next);
        setResults(next);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, results === null ? 0 : DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // "results" só define o atraso inicial; não deve disparar uma nova busca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  const loadMore = useCallback(async () => {
    if (!results || !results.hasMore || moreRef.current || results.term !== normalized) return;
    moreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = Math.floor(results.items.length / PAGE_SIZE);
      const page = await wardrobeService.pageItems({ query: results.term, page: nextPage, size: PAGE_SIZE });
      const known = new Set(results.items.map((item) => item.id));
      const next = {
        ...results,
        items: [...results.items, ...page.items.filter((item) => !known.has(item.id))],
        hasMore: page.hasMore,
      };
      cacheRef.current.set(results.term, next);
      setResults((current) => (current?.term === next.term ? next : current));
    } catch {
      // O próximo scroll tenta de novo
    } finally {
      moreRef.current = false;
      setLoadingMore(false);
    }
  }, [results, normalized]);

  return {
    items: results?.items ?? [],
    hasMore: results?.hasMore ?? false,
    // Guarda-roupa vazio só se a resposta disser (não durante o carregamento)
    wardrobeEmpty: results !== null && results.allCount === 0,
    hasResults: results !== null,
    // A lista na tela ainda é de outra busca
    stale: results !== null && results.term !== normalized,
    status,
    loadingMore,
    loadMore,
  };
}
