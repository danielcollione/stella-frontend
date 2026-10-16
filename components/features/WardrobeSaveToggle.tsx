"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Shirt } from "lucide-react";

interface WardrobeSaveToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  locked?: boolean; // plano sem o recurso: vira um atalho para os planos
  compact?: boolean; // caixa de mensagem do celular: a frase inteira, em letra menor
}

const EXPLANATION = "Cada foto de roupa que você envia no chat é cadastrada automaticamente no seu guarda-roupa.";

export function WardrobeSaveToggle({ enabled, onChange, locked, compact }: WardrobeSaveToggleProps) {
  const reducedMotion = useReducedMotion();
  if (locked) {
    return (
      <Link
        href="/planos"
        title={`${EXPLANATION} Disponível nos planos Atelier e Couture.`}
                className={`inline-flex items-center gap-2 rounded-full border border-stone-200/80 py-1.5 ${compact ? "pl-2.5 text-[12px]" : "pl-3 text-sm"} pr-1.5 font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700`}
      >
        <Lock aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-400" />
        {compact ? <span className="whitespace-nowrap pr-1.5">Salvar no guarda-roupa</span> : <>
          <span className="hidden sm:inline">Salvar no guarda-roupa</span>
          <span className="sm:hidden">Guarda-roupa</span>
        </>}
        {!compact && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Atelier</span>}
      </Link>
    );
  }
  const title = enabled ? EXPLANATION : `${EXPLANATION} Está desligado agora.`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      title={title}
      className={`group inline-flex items-center rounded-full border py-1.5 ${compact ? "gap-2 pl-3 text-[12px]" : "gap-2.5 pl-3 text-sm"} pr-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] ${enabled ? "border-[#5E8B6E]/35 bg-[#F1F6F2] text-[#2F4A38] shadow-2xs" : "border-stone-200/80 bg-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700"}`}
    >
      <Shirt aria-hidden="true" className={`h-4 w-4 shrink-0 transition-colors ${enabled ? "text-[#4E7A5E]" : "text-stone-400"}`} />
      {compact ? <span className="whitespace-nowrap">Salvar no guarda-roupa</span> : <>
        <span className="hidden sm:inline">Salvar no guarda-roupa</span>
        <span className="sm:hidden">Guarda-roupa</span>
      </>}
      {/* Verde-sálvia quando ligado: discreto e no tom da paleta do app */}
      <span aria-hidden="true" className={`relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${enabled ? "bg-[#5E8B6E]" : "bg-stone-200"}`}>
        <motion.span
          className="h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ x: enabled ? 16 : 0 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 35 }}
        />
      </span>
    </button>
  );
}
