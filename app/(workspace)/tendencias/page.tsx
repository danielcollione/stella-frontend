"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { AlertCircle, Info, X } from "lucide-react";
import { StellaMark } from "@/components/ui/StellaMark";
import { PageContent } from "@/components/layout/PageContent";
import { Rail } from "@/components/features/trends/Rail";
import { SectionNav } from "@/components/features/trends/SectionNav";
import type { PageSection } from "@/components/features/trends/SectionNav";
import { LooksChatShortcut, SeasonLooks } from "@/components/features/trends/SeasonLooks";
import { SeasonPalette } from "@/components/features/trends/SeasonPalette";
import { SeasonShopping } from "@/components/features/trends/SeasonShopping";
import { RatingButton } from "@/components/features/feedback/RatingButton";
import { SeasonSplit } from "@/components/features/trends/SeasonSplit";
import { SeasonWardrobe } from "@/components/features/trends/SeasonWardrobe";
import { TrendCard } from "@/components/features/trends/TrendCard";
import { TrendFeed } from "@/components/features/trends/TrendFeed";
import { FloatingMenu } from "@/components/features/trends/PostCarousel";
import { trendsService } from "@/services/trends/trendsService";
import { readCache, writeCache } from "@/utils/screenCache";
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
  // Voltando para a aba: a estação que estava na tela aparece na hora (as fotos das peças da pessoa expiram, por
  // isso o limite de tempo) e a busca de sempre atualiza por trás
  const [data, setData] = useState<Trends | null>(() => readCache<Trends>("trends:season", 10 * 60 * 1000) ?? null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    trendsService.load(controller.signal)
      .then((loaded) => {
        setData(loaded);
        writeCache("trends:season", loaded);
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
          <header className="mb-3 hidden items-end justify-between gap-4 lg:flex">
            <div className="hidden items-center gap-2 lg:flex">
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
              icon={<StellaPreparing />}
              bareIcon
              title="A Stella está preparando a estação"
              description="Ela está lendo o que a imprensa de moda e as passarelas brasileiras trouxeram. Volte em breve para ver as tendências e como elas conversam com o seu armário."
              action={<Link href="/wardrobe" className={buttonClass}>Ir para o guarda-roupa</Link>}
            />
          )}

          {data?.available && <Season data={data} />}
          {data?.available && <RatingButton />}
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
      <section id="estacao" aria-label="A estação" className="grid grid-cols-1 scroll-mt-20 gap-6 lg:grid-cols-2 lg:gap-12">
        {/* No computador, a coluna acompanha a altura do "Seu armário": o texto no alto e a paleta e o método
            embaixo, na mesma linha de base do botão ao lado, sem espaço sobrando */}
        <div className="flex flex-col gap-5 sm:gap-6 lg:justify-between">
          {/* Justificado, com hifenização em português para não abrir buracos entre as palavras */}
          <p className="text-justify font-serif text-xl italic leading-snug text-stone-800 [hyphens:auto] sm:text-2xl lg:text-[26px]">{data.summary}</p>
          <div className="flex flex-col gap-5 sm:gap-6">
          <SeasonPalette palette={data.palette ?? []} />
          <MethodNote sources={data.sourcesConsidered}>
            Para montar esta leitura, a Stella analisou {data.sourcesConsidered} fontes: matérias e manchetes das principais
            publicações de moda do Brasil, a cobertura das semanas de moda internacionais (sempre adaptada ao nosso clima)
            e o que os brasileiros estão buscando para comprar. Uma tendência só entra quando é confirmada por pelo menos
            duas fontes diferentes.{data.updatedAt && ` Última atualização: ${dayMonth(data.updatedAt)}.`}
          </MethodNote>
          </div>
        </div>
        <SeasonWardrobe data={data} />
      </section>

      <section id="tendencias" aria-labelledby="trends-title" className="scroll-mt-20 border-t border-stone-200/80 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">O que está em alta</p>
        <h2 id="trends-title" className="mt-1 font-serif text-[30px] italic leading-tight tracking-tight text-stone-900">As tendências da estação</h2>
        {/* Celular e tablet: uma tendência por vez, como um post; o que cada selo significa abre na bolinha colorida */}
        <div className="mt-3 lg:hidden">
          <TrendFeed trends={data.trends} />
        </div>
        <div className="mt-4 hidden lg:block">
          <SeasonSplit trends={data.trends} />
        </div>
        <div className="mt-6 hidden lg:block">
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
        <h2 id="looks-title" className="mt-1 font-serif text-[30px] italic leading-tight tracking-tight text-stone-900">Looks com as suas peças e as tendências</h2>
        <div className="mt-4">
          <SeasonLooks />
        </div>
        <div className="mt-6">
          <LooksChatShortcut />
        </div>
      </section>

      <section id="compras" aria-labelledby="shopping-title" className="scroll-mt-20 border-t border-stone-200/80 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Compras da semana</p>
        <h2 id="shopping-title" className="mt-1 font-serif text-[30px] italic leading-tight tracking-tight text-stone-900">Peças para somar ao seu armário</h2>
        <div className="mt-4">
          <SeasonShopping />
        </div>
      </section>

      <p className="text-center text-xs text-stone-400">A Stella é uma inteligência artificial e pode cometer erros.</p>
    </div>
    </>
  );
}

function Notice({ icon, bareIcon, title, description, action }: {
  icon: ReactNode;
  bareIcon?: boolean;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      {bareIcon ? <span className="mb-4">{icon}</span> : (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">{icon}</span>
      )}
      <h2 className="font-serif text-2xl italic text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{description}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div role="status" aria-label="Carregando tendências" className="space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-40 animate-pulse rounded-3xl bg-stone-200/50" />
        <div className="h-40 animate-pulse rounded-3xl bg-stone-200/50" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((index) => <div key={index} className="aspect-[3/4] w-44 animate-pulse rounded-2xl bg-stone-200/50" />)}
      </div>
    </div>
  );
}

// A Stella trabalhando (o mesmo traço animado do chat) enquanto a estação é preparada; parada com "reduzir movimento"
function StellaPreparing() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return <StellaMark size={56} decorative />;
  return (
    // <img> simples para o Next não converter a animação em imagem parada
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/stella-thinking.webp" alt="" aria-hidden="true" width={56} height={56} draggable={false} className="select-none" />
  );
}

/**
 * Como a Stella montou a leitura: uma linha discreta que abre num menu pequeno flutuante, o mesmo das outras
 * explicações da aba (no celular e no computador).
 */
function MethodNote({ sources, children }: { sources: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-[13px] leading-relaxed text-stone-500">
      <div className="relative max-w-lg">
        <FloatingMenu open={open} onClose={() => setOpen(false)} label="Como a Stella montou esta leitura">
          <div className="flex items-start justify-between gap-3">
            <p className="font-serif text-base italic text-stone-900">Como a Stella montou esta leitura</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" title="Fechar" className="stella-hit -mr-1 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
              <X size={15} />
            </button>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">{children}</p>
        </FloatingMenu>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="stella-hit flex items-center gap-1.5 text-[12px] text-stone-400 transition-colors hover:text-stone-600"
        >
          <Info size={13} />
          Como a Stella montou esta leitura · {sources} fontes
        </button>
      </div>
    </div>
  );
}
