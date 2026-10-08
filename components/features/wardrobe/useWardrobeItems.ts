"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { wardrobeService } from "@/services/wardrobe/wardrobeService";
import type { ClothingItem } from "@/types/wardrobe";

// As URLs das fotos são pré-assinadas e expiram em 15 min no back-end: renovamos antes disso
const URL_REFRESH_AFTER_MS = 10 * 60 * 1000;
const IMAGE_ERROR_REFRESH_COOLDOWN_MS = 30 * 1000;

// "background" = renovação silenciosa: se falhar, mantém a lista atual na tela
type LoadMode = "foreground" | "background";

export type WardrobeLoadStatus = "loading" | "ready" | "error";

export function useWardrobeItems() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [status, setStatus] = useState<WardrobeLoadStatus>("loading");
  const loadedAtRef = useRef(0);
  const lastImageRefreshRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: LoadMode) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const next = await wardrobeService.listItems({ signal: controller.signal });
      if (controller.signal.aborted) return;
      loadedAtRef.current = Date.now();
      setItems(next);
      setStatus("ready");
    } catch (failure) {
      if (controller.signal.aborted || axios.isCancel(failure)) return;
      if (mode === "foreground") setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Mesmo padrão da página do chat: o fetch começa fora do corpo síncrono do efeito
    void Promise.resolve().then(() => load("foreground"));

    function refreshIfStale() {
      if (document.visibilityState === "visible" && Date.now() - loadedAtRef.current > URL_REFRESH_AFTER_MS) {
        void load("background");
      }
    }
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      controllerRef.current?.abort();
    };
  }, [load]);

  // Foto quebrada normalmente significa URL expirada: busca URLs novas (no máximo a cada 30s)
  const handleImageError = useCallback(() => {
    if (Date.now() - lastImageRefreshRef.current < IMAGE_ERROR_REFRESH_COOLDOWN_MS) return;
    lastImageRefreshRef.current = Date.now();
    void load("background");
  }, [load]);

  // Atualizações locais após criar/editar/excluir, sem recarregar a lista inteira
  const upsertItem = useCallback((item: ClothingItem) => {
    setItems((current) => current.some((existing) => existing.id === item.id)
      ? current.map((existing) => (existing.id === item.id ? item : existing))
      : [item, ...current]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    void load("foreground");
  }, [load]);

  return { items, status, retry, handleImageError, upsertItem, removeItem };
}
