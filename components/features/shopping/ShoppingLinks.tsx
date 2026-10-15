"use client";

import { MapPin, Search, ShoppingBag } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { amazonSearchUrl, nearbyStoresUrl } from "@/services/shopping/shoppingLinks";

// No celular, um pouco maiores (≈36px) para o dedo; a área de toque chega a 44px pela camada invisível
const LINK_CLASS = "stella-hit inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-[13px] sm:px-3 sm:py-1 sm:text-xs font-medium text-stone-700 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900";

// Onde encontrar uma peça sugerida: busca online (link de parceiro) e lojas perto
export function ShoppingLinks({ suggestion }: { suggestion: string }) {
  const { user } = useAppShell();

  return (
    <span className="flex flex-wrap gap-2">
      <a href={amazonSearchUrl(suggestion, user?.fashionPreference)} target="_blank" rel="sponsored noopener noreferrer" className={LINK_CLASS}>
        <Search aria-hidden="true" className="h-3.5 w-3.5 text-stone-500" />
        Buscar online
      </a>
      <a href={nearbyStoresUrl(suggestion, user?.fashionPreference)} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-stone-500" />
        Ver lojas perto
      </a>
    </span>
  );
}

export function PartnerLinkNote() {
  return (
    <p className="text-[11px] leading-relaxed text-stone-400">
      “Buscar online” é um link de parceiro: como Associada da Amazon, a Stella ganha com compras qualificadas.
    </p>
  );
}

// Abaixo da resposta da Stella no chat: as peças que ela marcou como sugestão de compra
export function ChatShoppingSuggestions({ suggestions }: { suggestions: string[] }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="stella-message-in space-y-2.5 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">
        <ShoppingBag aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
        Onde encontrar
      </p>
      <ul className="space-y-2.5">
        {suggestions.map((suggestion) => (
          <li key={suggestion} className="space-y-1.5">
            <span className="block text-sm text-stone-800">{suggestion}</span>
            <ShoppingLinks suggestion={suggestion} />
          </li>
        ))}
      </ul>
      <PartnerLinkNote />
    </div>
  );
}
