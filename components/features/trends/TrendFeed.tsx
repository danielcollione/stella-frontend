"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { BADGES, KINDS, LockBadge, Owned, PressMeter, TrendBadgeChip, TrendCollage } from "@/components/features/trends/TrendCard";
import { MEANINGS } from "@/components/features/trends/SeasonSplit";
import { FloatingMenu, POST_SLIDE, PostAction, PostCarousel } from "@/components/features/trends/PostCarousel";
import type { Trend } from "@/types/trends";

/**
 * Celular e tablet, como um post do Instagram: só as ilustrações arrastam para o lado (com as bolinhas logo embaixo);
 * o selo, as ações e o texto ficam fixos no lugar e trocam junto com a tendência que está na tela. O que cada selo
 * significa abre num menu pequeno ao tocar na bolinha colorida.
 */
export function TrendFeed({ trends }: { trends: Trend[] }) {
  const [active, setActive] = useState(0);
  const current = trends[Math.min(Number.isFinite(active) ? active : 0, trends.length - 1)] ?? trends[0];
  if (!current) return null;

  return (
    <div>
      <header className="flex min-h-[40px] items-center gap-2">
        <TrendBadgeChip badge={current.badge} />
        <span className="min-w-0 flex-1 truncate text-xs text-stone-500">{current.locked ? "Tendência" : KINDS[current.kind] ?? "Tendência"}</span>
      </header>
      <PostCarousel label="Tendências da estação" count={trends.length} onActiveChange={setActive}>
        {trends.map((trend) => (
          <li key={trend.id} className={POST_SLIDE}>
            {trend.locked ? (
              <Link href="/planos" aria-label="Assine o Atelier ou o Couture para ver esta tendência" className="group relative block overflow-hidden sm:rounded-2xl">
                <div aria-hidden="true" className="pointer-events-none select-none blur-[6px]"><TrendCollage trend={trend} hideBadge /></div>
                <LockBadge text="Assine para ver a tendência" />
              </Link>
            ) : (
              <div className="overflow-hidden sm:rounded-2xl"><TrendCollage trend={trend} hideBadge /></div>
            )}
          </li>
        ))}
      </PostCarousel>
      <TrendDetails key={current.id} trend={current} />
    </div>
  );
}

// Abaixo das ilustrações: a bolinha do selo (abre o que ele significa), a presença na imprensa, as peças da pessoa e,
// nas de investimento, o atalho para as sugestões de compra; depois o nome e o texto com "mais"
function TrendDetails({ trend }: { trend: Trend }) {
  const [meaning, setMeaning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const badge = BADGES[trend.badge] ?? BADGES.SEASON;

  return (
    <div className="mt-1">
      <div className="relative">
        <FloatingMenu open={meaning} onClose={() => setMeaning(false)} label={`O que significa ${badge.label}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 font-serif text-base italic text-stone-900">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${badge.bar}`} />
              {badge.label}
            </p>
            <button type="button" onClick={() => setMeaning(false)} aria-label="Fechar" title="Fechar" className="stella-hit -mr-1 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
              <X size={15} />
            </button>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">{MEANINGS[trend.badge]}</p>
        </FloatingMenu>

        <div className="flex min-h-[56px] items-center gap-3">
          <button
            type="button"
            onClick={() => setMeaning(true)}
            aria-label={`O que significa ${badge.label}`}
            title={`O que significa ${badge.label}`}
            className="stella-hit flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-stone-200 transition-transform active:scale-90"
          >
            <span className={`h-3.5 w-3.5 rounded-full ${badge.bar}`} />
          </button>
          {!trend.locked && trend.pressLevel > 0 && <PressMeter level={trend.pressLevel} mentions={trend.pressMentions} />}
          <span className="flex-1" />
          {!trend.locked && <Owned trend={trend} />}
          {trend.badge === "INVESTMENT" && !trend.locked && (
            <PostAction
              onClick={() => document.getElementById("compras")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              icon={<ShoppingBag size={20} strokeWidth={1.6} />}
            >
              Comprar
            </PostAction>
          )}
        </div>
      </div>

      {trend.locked ? (
        <Link href="/planos" className="block pb-1 text-sm text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-800">
          Assine para ver esta e as outras tendências da estação
        </Link>
      ) : (
        <div className="pb-1">
          <h3 className="flex items-center gap-2 mt-4 font-serif text-[30px] font-semibold italic leading-tight tracking-tight text-stone-900">
            {trend.colorHex && <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-stone-300/70" style={{ backgroundColor: trend.colorHex }} />}
            {trend.name}
          </h3>
          <p className={`mt-1 text-sm leading-relaxed text-stone-600 ${expanded ? "" : "line-clamp-2"}`}>{trend.description}</p>
          {!expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="stella-hit text-sm text-stone-400 hover:text-stone-700">mais</button>
          )}
        </div>
      )}
    </div>
  );
}
