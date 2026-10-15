"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Menu, Sparkles } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { Rail } from "@/components/features/trends/Rail";
import { SectionNav } from "@/components/features/trends/SectionNav";
import type { PageSection } from "@/components/features/trends/SectionNav";
import { LooksChatShortcut, SeasonLooks } from "@/components/features/trends/SeasonLooks";
import { SeasonPalette } from "@/components/features/trends/SeasonPalette";
import { SeasonShopping } from "@/components/features/trends/SeasonShopping";
import { SeasonSplit } from "@/components/features/trends/SeasonSplit";
import { SeasonWardrobe } from "@/components/features/trends/SeasonWardrobe";
import { TrendCard } from "@/components/features/trends/TrendCard";
import { trendsService } from "@/services/trends/trendsService";
import type { Trends } from "@/types/trends";

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:scale-[0.98]";
// Seções da página (a barra do topo leva até elas)
const SECTIONS: PageSection[] = [
  { id: "estacao", label: "A estação" },
  { id: "tendencias", label: "Tendências" },
  { id: "looks", label: "Seus looks" },
  { id: "compras", label: "Compras" },
];

const dayMonth = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

export default function TrendsPage() {
  const { openMobileMenu } = useAppShell();
  const [data, setData] = useState<Trends | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    trendsService.load(controller.signal)
      .then((loaded) => {
        setData(loaded);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8 lg:px-10">
        <PageContent stagger>
          <header className="mb-3 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={openMobileMenu} aria-label="Abrir menu" title="Abrir menu" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:hidden">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">{data?.seasonLabel ?? "A estação no Brasil"}</p>
                <h1 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Tendências</h1>
              </div>
            </div>
          </header>

          {failed && !data && (
            <Notice
              icon={<AlertCircle size={22} strokeWidth={1.5} />}
              title="Não conseguimos carregar as tendências"
              description="Verifique sua conexão e tente novamente."
              action={<button type="button" onClick={() => { setFailed(false); setAttempt((current) => current + 1); }} className={buttonClass}>Tentar novamente</button>}
            />
          )}

          {!data && !failed && <Skeleton />}

          {data && !data.available && (
            <Notice
              icon={<Sparkles size={22} strokeWidth={1.5} />}
              title="A Stella está preparando a estação"
              description="Ela está lendo o que a imprensa de moda e as passarelas brasileiras trouxeram. Volte em breve para ver as tendências e como elas conversam com o seu armário."
              action={<Link href="/wardrobe" className={buttonClass}>Ir para o guarda-roupa</Link>}
            />
          )}

          {data?.available && <Season data={data} />}
        </PageContent>
      </main>
    </div>
  );
}

// A estação (texto, paleta e as peças da pessoa), as tendências num slide, os looks e as compras, numa página só
function Season({ data }: { data: Trends }) {
  return (
    <>
    <SectionNav sections={SECTIONS} />
    <div className="space-y-10">
      <section id="estacao" aria-label="A estação" className="grid scroll-mt-20 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-6">
          <p className="font-serif text-xl italic leading-snug text-stone-800 sm:text-2xl lg:text-[26px]">{data.summary}</p>
          <SeasonPalette palette={data.palette ?? []} />
          <p className="text-[13px] leading-relaxed text-stone-500">
            Para montar esta leitura, a Stella analisou {data.sourcesConsidered} fontes: matérias e manchetes das principais
            publicações de moda do Brasil, a cobertura das semanas de moda internacionais (sempre adaptada ao nosso clima)
            e o que os brasileiros estão buscando para comprar. Uma tendência só entra quando é confirmada por pelo menos
            duas fontes diferentes.{data.updatedAt && ` Última atualização: ${dayMonth(data.updatedAt)}.`}
          </p>
        </div>
        <SeasonWardrobe data={data} />
      </section>

      <section id="tendencias" aria-labelledby="trends-title" className="scroll-mt-20 border-t border-stone-200/80 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">O que está em alta</p>
        <h2 id="trends-title" className="mt-1 font-serif text-2xl italic tracking-tight text-stone-900">As tendências da estação</h2>
        <div className="mt-4">
          <SeasonSplit trends={data.trends} />
        </div>
        <div className="mt-6">
          <Rail label="Tendências da estação">
            {data.trends.map((trend, index) => (
              <li key={trend.id} className="flex w-[272px] shrink-0 snap-start sm:w-[300px]">
                <TrendCard trend={trend} position={index + 1} />
              </li>
            ))}
          </Rail>
        </div>
      </section>

      <section id="looks" aria-labelledby="looks-title" className="scroll-mt-20 border-t border-stone-200/80 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Seus looks da estação</p>
        <h2 id="looks-title" className="mt-1 font-serif text-2xl italic tracking-tight text-stone-900">Looks com as suas peças e as tendências</h2>
        <div className="mt-4">
          <SeasonLooks />
        </div>
        <div className="mt-6">
          <LooksChatShortcut />
        </div>
      </section>

      <section id="compras" aria-labelledby="shopping-title" className="scroll-mt-20 border-t border-stone-200/80 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Compras da semana</p>
        <h2 id="shopping-title" className="mt-1 font-serif text-2xl italic tracking-tight text-stone-900">Peças para somar ao seu armário</h2>
        <div className="mt-4">
          <SeasonShopping />
        </div>
      </section>

      <p className="text-center text-xs text-stone-400">A Stella é uma inteligência artificial e pode cometer erros.</p>
    </div>
    </>
  );
}

function Notice({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">{icon}</span>
      <h2 className="font-serif text-2xl italic text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{description}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div role="status" aria-label="Carregando tendências" className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-40 animate-pulse rounded-3xl bg-stone-200/50" />
        <div className="h-40 animate-pulse rounded-3xl bg-stone-200/50" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((index) => <div key={index} className="aspect-[3/4] w-44 animate-pulse rounded-2xl bg-stone-200/50" />)}
      </div>
    </div>
  );
}
