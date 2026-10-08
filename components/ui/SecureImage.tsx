"use client";

import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { api } from "@/services/api";

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SecureImage({ src, alt, className = "" }: SecureImageProps) {
  // Se for uma visualização local (blob: ou data:), derivamos o estado diretamente durante o render
  const isLocal = src?.startsWith("blob:") || src?.startsWith("data:");

  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Se não houver src ou se for uma imagem local, não executamos o fetch assíncrono
    if (!src || isLocal) return;

    let isMounted = true;
    let createdObjectUrl: string | null = null;
    const controller = new AbortController();

    const fetchImage = async () => {
      try {
        setHasError(false);
        const baseUrl = api.defaults.baseURL;
        if (!baseUrl) throw new Error("URL da API nao configurada.");

        const imageUrl = new URL(src, `${baseUrl}/`);
        const token = authService.getToken();
        const response = await fetch(imageUrl.href, {
          headers: token && imageUrl.origin === new URL(baseUrl).origin
            ? { Authorization: `Bearer ${token}` }
            : undefined,
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Acesso negado ou imagem não encontrada");

        const blob = await response.blob();
        if (isMounted) {
          createdObjectUrl = URL.createObjectURL(blob);
          setFetchedUrl(createdObjectUrl);
        }
      } catch (error) {
        if (!isMounted || controller.signal.aborted) return;
        console.error("Erro ao carregar imagem segura:", error);
        setHasError(true);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      controller.abort();
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [src, isLocal]);

  // Se for local usa o próprio src, caso contrário usa a URL resolvida pelo fetch
  const displayUrl = isLocal ? src : fetchedUrl;

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-stone-200 text-stone-400 text-xs ${className}`}>
        Falha ao carregar
      </div>
    );
  }

  if (!displayUrl) {
    return <div className={`animate-pulse bg-stone-200 ${className}`} />;
  }

  return <img src={displayUrl} alt={alt} className={className} />;
}