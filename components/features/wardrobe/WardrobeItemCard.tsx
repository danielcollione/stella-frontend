"use client";

import { useState } from "react";
import { Shirt } from "lucide-react";
import { STATUS_LABELS, displayDetails, displayName } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingItem } from "@/types/wardrobe";

interface WardrobeItemCardProps {
  item: ClothingItem;
  priority?: boolean;
  onImageError: () => void;
  onSelect: (item: ClothingItem) => void;
}

type ImageState = "loading" | "loaded" | "failed";

export function WardrobeItemCard({ item, priority, onImageError, onSelect }: WardrobeItemCardProps) {
  // O estado da imagem é ligado à URL: quando a URL pré-assinada é renovada, a foto tenta carregar de novo
  // A grade usa a miniatura (leve); a foto original fica para quando a peça é aberta
  const src = item.thumbnailUrl ?? item.imageUrl;
  const [image, setImage] = useState<{ url: string; state: ImageState }>({ url: src, state: "loading" });
  const imageState = image.url === src ? image.state : "loading";
  const name = displayName(item);
  const details = displayDetails(item);
  const inactive = item.status !== "AVAILABLE";

  return (
    <figure className="group relative flex h-full flex-col bg-white">
      {/* Botão "esticado" sobre o card: o card inteiro abre a edição, sem aninhar <figure> dentro de <button> */}
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={`Editar ${name}`}
        className="absolute inset-0 z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400"
      />
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {imageState === "loading" && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-stone-100" />}
        {imageState === "failed" ? (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <Shirt aria-hidden="true" size={32} strokeWidth={1.25} />
          </div>
        ) : (
          // URLs pré-assinadas do R2 expiram: <img> simples evita que o otimizador do Next guarde URLs vencidas
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            draggable={false}
            onLoad={() => setImage({ url: src, state: "loaded" })}
            onError={() => {
              setImage({ url: src, state: "failed" });
              onImageError();
            }}
            className={`h-full w-full object-cover transition-[opacity,transform,filter] duration-500 ease-out motion-safe:group-hover:scale-[1.03] ${imageState === "loaded" ? "opacity-100" : "opacity-0"} ${inactive ? "grayscale-[35%]" : ""}`}
          />
        )}
        {inactive && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-stone-600 shadow-2xs backdrop-blur-sm">
            {STATUS_LABELS[item.status]}
          </span>
        )}
      </div>
      <figcaption className="flex min-h-[3.25rem] flex-col justify-center px-3 py-2.5 transition-colors group-hover:bg-stone-50/80">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-stone-800" title={name}>{name}</p>
        {details && <p className="mt-0.5 truncate text-[11px] lowercase text-stone-400 first-letter:uppercase">{details}</p>}
      </figcaption>
    </figure>
  );
}
