"use client";

import { useState } from "react";
import { Shirt } from "lucide-react";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingItem } from "@/types/wardrobe";

function Thumb({ item, onOpen }: { item: ClothingItem; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const name = displayName(item);

  return (
    <li className="w-16">
      <button
        type="button"
        onClick={onOpen}
        disabled={failed}
        aria-label={`Ampliar foto: ${name}`}
        className="group block w-full text-left outline-none"
      >
        <span className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-stone-200/80 bg-stone-100 text-stone-300 transition-colors group-hover:border-stone-300 group-focus-visible:ring-2 group-focus-visible:ring-stone-400">
          {failed ? <Shirt size={16} strokeWidth={1.5} /> : (
            // URL pré-assinada do R2: <img> simples, sem o otimizador do Next
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl ?? item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => setFailed(true)} />
          )}
        </span>
        <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-stone-500">{name}</span>
      </button>
    </li>
  );
}

// Abaixo da resposta da Stella no chat: a foto das peças do guarda-roupa que ela indicou
export function RecommendedItems({ items }: { items?: ClothingItem[] }) {
  const [viewing, setViewing] = useState<ClothingItem | null>(null);
  if (!items || items.length === 0) return null;

  return (
    <div className="stella-message-in space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">Do seu guarda-roupa</p>
      <ul className="flex flex-wrap gap-3">
        {items.map((item) => <Thumb key={item.id} item={item} onOpen={() => setViewing(item)} />)}
      </ul>
      <ImageViewer open={viewing !== null} onClose={() => setViewing(null)} label={viewing ? displayName(viewing) : "Peça do guarda-roupa"}>
        {viewing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewing.imageUrl} alt={displayName(viewing)} className="max-h-[calc(100dvh-5rem)] max-w-full rounded-xl object-contain shadow-2xl" />
        )}
      </ImageViewer>
    </div>
  );
}
