"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Shirt } from "lucide-react";

interface WardrobeSaveToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  locked?: boolean; // plano sem o recurso: vira um atalho para os planos
}

export function WardrobeSaveToggle({ enabled, onChange, locked }: WardrobeSaveToggleProps) {
  const reducedMotion = useReducedMotion();
  if (locked) {
    return (
      <Link
        href="/planos"
        title="Salvar fotos do chat no guarda-roupa é um recurso dos planos Atelier e Couture"
        className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 py-1 pl-2.5 pr-1.5 text-xs font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700"
      >
        <Lock aria-hidden="true" className="h-3.5 w-3.5 text-stone-400" />
        <span className="hidden sm:inline">Salvar no guarda-roupa</span>
        <span className="sm:hidden">Guarda-roupa</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">Atelier</span>
      </Link>
    );
  }
  const title = enabled
    ? "As fotos enviadas serão salvas no seu guarda-roupa"
    : "As fotos enviadas não serão salvas no guarda-roupa";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      title={title}
      className={`group inline-flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] ${enabled ? "border-stone-300 bg-white text-stone-800 shadow-2xs" : "border-stone-200/80 bg-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700"}`}
    >
      <Shirt aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 transition-colors ${enabled ? "text-stone-900" : "text-stone-400"}`} />
      <span className="hidden sm:inline">Salvar no guarda-roupa</span>
      <span className="sm:hidden">Guarda-roupa</span>
      <span aria-hidden="true" className={`relative flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${enabled ? "bg-stone-900" : "bg-stone-200"}`}>
        <motion.span
          className="h-3 w-3 rounded-full bg-white shadow-sm"
          animate={{ x: enabled ? 12 : 0 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 35 }}
        />
      </span>
    </button>
  );
}
