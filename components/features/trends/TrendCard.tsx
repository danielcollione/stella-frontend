"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, Lock } from "lucide-react";
import { ImageViewer } from "@/components/ui/ImageViewer";
import type { Trend, TrendBadge, TrendKind, TrendOwnedItem } from "@/types/trends";

export const BADGES: Record<TrendBadge, { label: string; className: string; bar: string }> = {
  INVESTMENT: { label: "Investimento", className: "bg-stone-900 text-stone-50", bar: "bg-stone-900" },
  SEASON: { label: "Da estação", className: "bg-[#EFE6D6] text-stone-800", bar: "bg-[#CDB892]" },
  FLEETING: { label: "Passageira", className: "bg-[#F3E1D8] text-[#8A4B32]", bar: "bg-[#D9967A]" },
  EMERGING: { label: "Chegando", className: "border border-stone-300 bg-white text-stone-600", bar: "bg-stone-300" },
};

const KINDS: Record<TrendKind, string> = {
  COLOR: "Cor",
  SILHOUETTE: "Modelagem",
  PIECE: "Peça",
  PRINT: "Estampa",
  FABRIC: "Tecido e textura",
  STYLING: "Jeito de usar",
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function TrendBadgeChip({ badge }: { badge: TrendBadge }) {
  const { label, className } = BADGES[badge] ?? BADGES.SEASON;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${className}`}>{label}</span>;
}

/**
 * Uma tendência no slide: as ilustrações que a classificam em cima e, embaixo, o selo, o nome, o texto completo, a
 * presença na imprensa e as peças da pessoa que já combinam.
 */
export function TrendCard({ trend, position }: { trend: Trend; position: number }) {
  if (trend.locked) return <LockedTrendCard trend={trend} />;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <TrendCollage trend={trend} />
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <p className="flex items-center gap-2 text-[11px] text-stone-400">
          <span className="font-serif text-sm italic text-stone-300">{String(position).padStart(2, "0")}</span>
          {KINDS[trend.kind] ?? "Tendência"}
        </p>
        <h3 className="mt-1 flex items-center gap-2 font-serif text-xl italic leading-tight tracking-tight text-stone-900">
          {trend.colorHex && <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-stone-300/70" style={{ backgroundColor: trend.colorHex }} />}
          {trend.name}
        </h3>
        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-stone-600">{trend.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-stone-100 pt-3">
          {trend.pressLevel > 0 ? <PressMeter level={trend.pressLevel} mentions={trend.pressMentions} /> : <span />}
          <Owned trend={trend} />
        </div>
        {trend.badge === "INVESTMENT" && (
          <button
            type="button"
            onClick={() => document.getElementById("compras")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="stella-hit mt-3 inline-flex items-center gap-1.5 self-start text-xs text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowDown size={12} />
            <span className="underline decoration-stone-300 underline-offset-4">Ver sugestões de compra</span>
          </button>
        )}
      </div>
    </article>
  );
}

// Tendência dos planos pagos: a ilustração e o texto embaçados (o texto nem vem do servidor) e um convite discreto
function LockedTrendCard({ trend }: { trend: Trend }) {
  return (
    <Link href="/planos" aria-label="Assine o Atelier ou o Couture para ver esta tendência" className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <div aria-hidden="true" className="pointer-events-none flex flex-1 select-none flex-col blur-[6px]">
        <TrendCollage trend={trend} />
        <div className="space-y-2.5 px-4 pb-4 pt-4">
          <span className="block h-2.5 w-16 rounded-full bg-stone-200" />
          <span className="block h-5 w-40 rounded-full bg-stone-300/80" />
          <span className="block h-2.5 w-full rounded-full bg-stone-200" />
          <span className="block h-2.5 w-11/12 rounded-full bg-stone-200" />
          <span className="block h-2.5 w-4/5 rounded-full bg-stone-200" />
          <span className="block h-2.5 w-2/3 rounded-full bg-stone-200" />
        </div>
      </div>
      <LockBadge text="Assine para ver a tendência" />
    </Link>
  );
}

// Cadeado discreto sobre o conteúdo embaçado: vidro fosco, sem cor forte, convidando a conhecer os planos
export function LockBadge({ text }: { text: string }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-medium text-stone-800 shadow-sm backdrop-blur-md transition-colors group-hover:bg-white">
        <Lock size={13} className="text-stone-500" />
        {text}
      </span>
    </span>
  );
}

// Presença na imprensa: cinco barrinhas, relativas à tendência mais citada da estação
function PressMeter({ level, mentions }: { level: number; mentions: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-stone-500" title="Matérias e manchetes do último mês e meio que citam a tendência">
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <span key={step} className={`w-1 rounded-full ${step <= level ? "bg-stone-800" : "bg-stone-200"}`} style={{ height: `${6 + step * 2}px` }} />
        ))}
      </span>
      <span>Citada em {plural(mentions, "matéria", "matérias")}</span>
    </div>
  );
}

// "Você tem": as peças da pessoa nesta tendência; cada uma abre a foto
function Owned({ trend }: { trend: Trend }) {
  if (trend.ownedCount === 0) return null;
  if (trend.ownedLocked) {
    return (
      <Link href="/planos" className="stella-hit flex items-center gap-1.5 text-[11px] text-stone-500 transition-colors hover:text-stone-900">
        <Lock size={12} className="text-stone-400" />
        Você tem {plural(trend.ownedCount, "peça", "peças")} aqui
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-stone-500">Você tem</span>
      <ul className="flex -space-x-1.5 sm:-space-x-2">
        {trend.owned.slice(0, 4).map((item) => (
          <li key={item.id}>
            <PieceThumb item={item} className="h-10 w-10 rounded-full ring-2 ring-white sm:h-8 sm:w-8" />
          </li>
        ))}
      </ul>
      {trend.ownedCount > 4 && <span className="text-[11px] text-stone-500">+{trend.ownedCount - 4}</span>}
    </div>
  );
}

// Peça da pessoa; ao tocar, abre a foto original em tela cheia (como no guarda-roupa e nos eventos)
export function PieceThumb({ item, className = "", caption, children }: {
  item: TrendOwnedItem;
  className?: string;
  caption?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!item.imageUrl}
        title={item.name}
        aria-label={`Abrir a foto de ${item.name}`}
        className={`group block overflow-hidden bg-stone-100 text-left ${className}`}
      >
        {item.thumbnailUrl && (
          // Fotos do R2 com endereço temporário: o otimizador de imagens do Next não ajuda aqui
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnailUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        )}
        {children}
      </button>
      {item.imageUrl && (
        <ImageViewer open={open} onClose={() => setOpen(false)} label={item.name}>
          <figure className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} className="max-h-[calc(100dvh-8rem)] max-w-full rounded-xl object-contain shadow-2xl" />
            <figcaption className="mt-3 text-center text-sm text-white/90">
              {item.name}
              {caption && <span className="block text-xs text-white/60">{caption}</span>}
            </figcaption>
          </figure>
        </ImageViewer>
      )}
    </>
  );
}

// Enquanto a ilustração própria não fica pronta, a mais parecida do banco ocupa o lugar dela
export const STAND_INS: Record<string, string> = {
  "calca-capri": "calca-reta-alfaiataria",
  "blusa-renda": "blusa-gola-laco",
  "tenis-corrida": "tenis",
  "camisa-xadrez": "camisa-oxford",
  "camisa-ampla-masculina": "camisa-linho-masculina",
  "cardigan": "trico-masculino",
  "trico-leve": "trico-masculino",
  "corselet": "cropped",
  "colete-alfaiataria": "styling-sobreposicao",
};

/**
 * As ilustrações que classificam a tendência: a principal ocupando o topo do card e, no canto, até duas menores.
 * Sem ilustração, a cor da tendência ou um fundo creme com o nome, no mesmo formato.
 */
function TrendCollage({ trend }: { trend: Trend }) {
  const keys = [...new Set(trend.illustrationKeys.map((key) => STAND_INS[key] ?? key))];
  const [main, ...others] = keys;
  return (
    <div className="relative">
      {main ? <Illustration name={main} trend={trend} className="aspect-[4/3] w-full object-cover" /> : <Fallback trend={trend} />}
      <span className="absolute left-3 top-3">
        <TrendBadgeChip badge={trend.badge} />
      </span>
      {others.length > 0 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {others.slice(0, 2).map((name) => (
            <Illustration key={name} name={name} trend={trend} className="h-12 w-12 rounded-xl object-cover shadow-sm ring-2 ring-white" />
          ))}
        </div>
      )}
    </div>
  );
}

function Illustration({ name, trend, className }: { name: string; trend: Trend; className: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);

  // O erro de carregamento pode acontecer antes de o React assumir a página: confere de novo ao montar
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) return className.includes("aspect") ? <Fallback trend={trend} /> : null;
  return (
    // Arquivos estáticos já exportados em 800×800
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={`/tendencias/${name}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setMissing(true)}
      className={`bg-[#F1E9DC] ${className}`}
    />
  );
}

function Fallback({ trend }: { trend: Trend }) {
  if (trend.colorHex) {
    return (
      <div aria-hidden="true" className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: trend.colorHex }}>
        {/* Feixe de luz na diagonal, como nas ilustrações */}
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.32)_28%,transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_62%,rgba(28,25,23,0.10)_62%)]" />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="relative aspect-[4/3] w-full overflow-hidden bg-[#F1E9DC]">
      <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.55)_30%,transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(150deg,transparent_58%,rgba(166,124,82,0.14)_58%)]" />
    </div>
  );
}
