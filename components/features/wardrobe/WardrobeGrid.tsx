import type { ReactNode } from "react";
import { WardrobeItemCard } from "@/components/features/wardrobe/WardrobeItemCard";
import type { ClothingItem } from "@/types/wardrobe";

// Hairlines entre as peças, como um catálogo editorial. Cada célula desenha a borda direita e inferior;
// a margem negativa esconde as bordas da última coluna/linha sob a moldura, e linhas incompletas ficam limpas.
const frameClass = "overflow-hidden border-y border-stone-200/80 bg-white sm:rounded-2xl sm:border";
const listClass = "-mb-px -mr-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
const cellClass = "border-b border-r border-stone-200/80";

// Primeira "dobra" do grid carrega com prioridade; o resto é lazy
const PRIORITY_ITEMS = 10;

interface WardrobeGridProps {
  id: string;
  labelledBy: string;
  items: readonly ClothingItem[];
  onImageError: () => void;
  onSelect: (item: ClothingItem) => void;
}

export function WardrobeGrid({ id, labelledBy, items, onImageError, onSelect }: WardrobeGridProps) {
  return (
    <div className={frameClass}>
      <ul id={id} role="tabpanel" aria-labelledby={labelledBy} className={listClass}>
        {items.map((item, index) => (
          <li key={item.id} className={cellClass}>
            <WardrobeItemCard item={item} priority={index < PRIORITY_ITEMS} onImageError={onImageError} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WardrobeGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando o guarda-roupa" className={frameClass}>
      <div className={listClass}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`flex flex-col bg-white ${cellClass}`}>
          <div className="aspect-[4/5] animate-pulse bg-stone-100" />
          <div className="space-y-1.5 px-3 py-3">
            <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-stone-100" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-stone-100" />
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export function WardrobeMessage({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div className="mx-5 flex flex-col items-center rounded-2xl border border-dashed border-stone-200 bg-white/60 px-6 py-16 text-center sm:mx-0">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">{icon}</div>
      <h2 className="font-serif text-xl italic text-stone-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
