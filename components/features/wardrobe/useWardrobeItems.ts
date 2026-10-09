"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";
import { wardrobeService } from "@/services/wardrobe/wardrobeService";
import type { ClothingCategory, ClothingItem, WardrobePage, WardrobeScope } from "@/types/wardrobe";

// As URLs das fotos são pré-assinadas e expiram em 15 min no back-end: renovamos antes disso
const URL_REFRESH_AFTER_MS = 10 * 60 * 1000;
const IMAGE_ERROR_REFRESH_COOLDOWN_MS = 30 * 1000;
const MAX_REFRESH_SIZE = 120; // mesmo teto do back-end (ClothingItemService.MAX_PAGE_SIZE)

export type WardrobeLoadStatus = "loading" | "ready" | "error";

export interface WardrobeFilters {
  scope: WardrobeScope;
  category?: ClothingCategory;
  query: string;
}

interface State {
  key: string; // filtros desta lista; quando mudam, a lista recomeça da página 0
  items: ClothingItem[];
  page: number;
  meta: Omit<WardrobePage, "items" | "page" | "size"> | null;
  status: WardrobeLoadStatus;
}

function splitPage(page: WardrobePage) {
  const { items, total, hasMore, allCount, activeCount, categoryCounts } = page;
  return { items, meta: { total, hasMore, allCount, activeCount, categoryCounts } };
}

/**
 * Guarda-roupa paginado para infinite scroll: a primeira página vem ao mudar os filtros e as seguintes com
 * loadMore(). Ao trocar de filtro, a lista anterior continua na tela até a nova chegar (sem piscar).
 */
export function useWardrobeItems(filters: WardrobeFilters, pageSize = 40) {
  const key = `${filters.scope}|${filters.category ?? ""}|${filters.query.trim().toLowerCase()}`;
  const [state, setState] = useState<State>({ key: "", items: [], page: 0, meta: null, status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedAtRef = useRef(0);
  const lastImageRefreshRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const moreControllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  const filtersRef = useRef(filters);
  // Callbacks estáveis leem sempre o estado e os filtros atuais
  useLayoutEffect(() => {
    stateRef.current = state;
    filtersRef.current = filters;
  });

  // Recarrega do início; "size" maior serve para renovar as URLs das peças já carregadas de uma vez
  const reload = useCallback(async (mode: "foreground" | "background", size = pageSize) => {
    controllerRef.current?.abort();
    moreControllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const current = filtersRef.current;
    const requestKey = `${current.scope}|${current.category ?? ""}|${current.query.trim().toLowerCase()}`;
    try {
      const page = await wardrobeService.pageItems({ ...current, page: 0, size, signal: controller.signal });
      if (controller.signal.aborted) return;
      loadedAtRef.current = Date.now();
      const { items, meta } = splitPage(page);
      // Renovação com página maior: segue a paginação normal a partir do que já veio
      setState({ key: requestKey, items, page: Math.max(0, Math.ceil(items.length / pageSize) - 1), meta, status: "ready" });
    } catch (failure) {
      if (controller.signal.aborted || axios.isCancel(failure)) return;
      if (mode === "foreground") setState((previous) => ({ ...previous, key: requestKey, status: "error" }));
    }
  }, [pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => reload("foreground"));
  }, [key, reload]);

  const loadMore = useCallback(async () => {
    const current = stateRef.current;
    if (current.status !== "ready" || !current.meta?.hasMore || moreControllerRef.current) return;
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setLoadingMore(true);
    try {
      // Páginas de tamanho fixo: a próxima começa depois de tudo o que já está na tela
      const nextPage = Math.floor(current.items.length / pageSize);
      const page = await wardrobeService.pageItems({ ...filtersRef.current, page: nextPage, size: pageSize, signal: controller.signal });
      if (controller.signal.aborted) return;
      const { items, meta } = splitPage(page);
      setState((previous) => {
        if (previous.key !== current.key) return previous;
        const known = new Set(previous.items.map((item) => item.id));
        return { ...previous, items: [...previous.items, ...items.filter((item) => !known.has(item.id))], page: nextPage, meta };
      });
    } catch {
      // Falha ao carregar mais: o próximo scroll tenta de novo
    } finally {
      if (moreControllerRef.current === controller) moreControllerRef.current = null;
      setLoadingMore(false);
    }
  }, [pageSize]);

  // Volta para a aba depois de um tempo: renova as URLs das fotos já carregadas
  useEffect(() => {
    function refreshIfStale() {
      if (document.visibilityState === "visible" && Date.now() - loadedAtRef.current > URL_REFRESH_AFTER_MS) {
        void reload("background", Math.min(MAX_REFRESH_SIZE, Math.max(pageSize, stateRef.current.items.length)));
      }
    }
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      controllerRef.current?.abort();
      moreControllerRef.current?.abort();
    };
  }, [reload, pageSize]);

  // Foto quebrada normalmente significa URL expirada: busca URLs novas (no máximo a cada 30s)
  const handleImageError = useCallback(() => {
    if (Date.now() - lastImageRefreshRef.current < IMAGE_ERROR_REFRESH_COOLDOWN_MS) return;
    lastImageRefreshRef.current = Date.now();
    void reload("background", Math.min(MAX_REFRESH_SIZE, Math.max(pageSize, stateRef.current.items.length)));
  }, [reload, pageSize]);

  // Depois de criar/editar/excluir: atualiza na hora e recarrega em segundo plano (contagens e filtros)
  const upsertItem = useCallback((item: ClothingItem) => {
    setState((previous) => ({
      ...previous,
      items: previous.items.some((existing) => existing.id === item.id)
        ? previous.items.map((existing) => (existing.id === item.id ? item : existing))
        : [item, ...previous.items],
    }));
    void reload("background", Math.min(MAX_REFRESH_SIZE, Math.max(pageSize, stateRef.current.items.length + 1)));
  }, [reload, pageSize]);

  const removeItem = useCallback((id: string) => {
    setState((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== id) }));
    void reload("background", Math.min(MAX_REFRESH_SIZE, Math.max(pageSize, stateRef.current.items.length)));
  }, [reload, pageSize]);

  const retry = useCallback(() => {
    setState((previous) => ({ ...previous, status: "loading" }));
    void reload("foreground");
  }, [reload]);

  const firstLoad = state.meta === null && state.status !== "error";
  return {
    items: state.items,
    meta: state.meta,
    status: firstLoad ? "loading" as const : state.status,
    // Filtro trocado e a nova página ainda não chegou: a lista anterior fica na tela, esmaecida
    refreshing: state.key !== key && state.meta !== null,
    loadingMore,
    loadMore,
    retry,
    handleImageError,
    upsertItem,
    removeItem,
  };
}
