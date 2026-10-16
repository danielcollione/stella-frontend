"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, LoaderCircle, Shirt } from "lucide-react";
import { PageContent } from "@/components/layout/PageContent";
import { colorSwatch } from "@/services/wardrobe/colorSwatch";
import { CATEGORY_LABELS, displayName } from "@/services/wardrobe/wardrobeCatalog";
import { apiErrorMessage, wardrobeService } from "@/services/wardrobe/wardrobeService";
import type { ClothingItem, WardrobeStats } from "@/types/wardrobe";

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:scale-[0.98]";
const linkClass = "font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 transition-colors hover:decoration-stone-600";

export default function WardrobeStatsPage() {
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    wardrobeService.stats(controller.signal)
      .then((loaded) => {
        setStats(loaded);
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
          <header className="mb-7 flex items-end justify-between gap-4">
            <div className="hidden items-center gap-2 lg:flex">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Seu acervo em números</p>
                <h1 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Painéis</h1>
              </div>
            </div>
            <Link href="/wardrobe" className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900">
              <ArrowLeft size={15} />
              Guarda-roupa
            </Link>
          </header>

          {failed && !stats && (
            <Notice
              icon={<AlertCircle size={22} strokeWidth={1.5} />}
              title="Não conseguimos montar seus painéis"
              description="Verifique sua conexão e tente novamente."
              action={<button type="button" onClick={() => { setFailed(false); setAttempt((current) => current + 1); }} className={buttonClass}>Tentar novamente</button>}
            />
          )}

          {!stats && !failed && <Skeleton />}

          {stats && stats.totalItems === 0 && (
            <Notice
              icon={<Shirt size={22} strokeWidth={1.5} />}
              title="Seus painéis começam com a primeira peça"
              description="Cadastre suas roupas e a Stella mostra aqui o que há no seu armário, o que você mais usa e o que anda esquecido."
              action={<Link href="/wardrobe" className={buttonClass}>Ir para o guarda-roupa</Link>}
            />
          )}

          {stats && stats.totalItems > 0 && <Dashboard stats={stats} onStats={setStats} />}
        </PageContent>
      </main>
    </div>
  );
}

function Dashboard({ stats, onStats }: { stats: WardrobeStats; onStats: (stats: WardrobeStats) => void }) {
  const usage = percent(stats.wornItems, stats.totalItems);
  const hasWears = stats.looksLogged > 0;

  return (
    <div className="space-y-10">
      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Peças no armário" value={String(stats.totalItems)} note={stats.newItemsCount > 0 ? `${plural(stats.newItemsCount, "nova", "novas")} nos últimos ${stats.newItemsDays} dias` : "Sem contar as arquivadas"} />
        <Metric
          label="Valor do guarda-roupa"
          value={stats.pricedItems > 0 ? brl(stats.wardrobeValue) : "—"}
          note={stats.pricedItems > 0 ? `${stats.pricedItems} de ${plural(stats.totalItems, "peça", "peças")} com preço` : "Informe o preço ao editar uma peça"}
        />
        <Metric label="Uso do guarda-roupa" value={`${usage}%`} note={`${stats.wornItems} de ${plural(stats.totalItems, "peça já usada", "peças já usadas")}`}>
          <div aria-hidden="true" className="mt-3 h-1 overflow-hidden rounded-full bg-stone-200/80">
            <div className="h-full rounded-full bg-stone-800 transition-[width] duration-700 ease-out" style={{ width: `${usage}%` }} />
          </div>
        </Metric>
        <Metric label="Looks usados" value={String(stats.looksLogged)} note="Registrados no seu diário de uso" />
      </section>

      {stats.newItems.length > 0 && (
        <Group title="Novas peças" hint={`Chegaram nos últimos ${stats.newItemsDays} dias`}>
          <Panel>
            <ItemStrip items={stats.newItems} caption={(item) => (item.createdAt ? shortDate(item.createdAt) : "")} />
          </Panel>
        </Group>
      )}

      <Group title="O que há no seu armário" hint="Como suas peças se dividem">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel title="Categorias">
            <BarList rows={stats.categories.map(({ category, count }) => ({ label: CATEGORY_LABELS[category].plural, count }))} total={stats.totalItems} />
          </Panel>
          <Panel title="Cores">
            {stats.colors.length > 0 ? <ColorChart colors={stats.colors} /> : <Hint>As cores aparecem aqui conforme a Stella analisa suas peças.</Hint>}
          </Panel>
          <Panel title="Marcas favoritas">
            {stats.brands.length > 0
              ? <BarList rows={stats.brands} total={stats.brands[0].count} />
              : <Hint>Nenhuma marca ainda. Informe a marca ao editar uma peça para ver aqui as que mais aparecem.</Hint>}
          </Panel>
        </div>
      </Group>

      <Group title="Como você usa" hint="A partir dos looks do seu diário de uso">
        {!hasWears ? (
          <Panel>
            <div className="mx-auto max-w-xl py-6 text-center">
              <p className="font-serif text-xl italic text-stone-800">Seu diário de uso ainda está em branco</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Um look entra no diário quando você marca “Vou com esse” no look de um evento do{" "}
                <Link href="/eventos" className={linkClass}>planejador</Link> e o dia do evento chega. A partir daí, aparecem aqui suas peças mais usadas, as esquecidas e os pares que você mais repete.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel title="Mais usadas">
              <ItemStrip items={stats.mostWorn} caption={wearCaption} detail={costPerWear} />
            </Panel>
            <Panel title="Menos usadas" hint="Entre as disponíveis, as paradas há mais tempo">
              <ItemStrip items={stats.leastWorn} caption={wearCaption} detail={(item) => (item.lastWornAt ? `Último uso em ${shortDate(item.lastWornAt)}` : null)} />
            </Panel>
            <Panel title="Pares mais repetidos" hint="Peças que você mais usa juntas" className="lg:col-span-2">
              {stats.pairs.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  {stats.pairs.map((pair) => (
                    <li key={`${pair.first.id}-${pair.second.id}`} className="flex items-center gap-3.5">
                      <div className="flex shrink-0">
                        <Thumb item={pair.first} className="w-14" />
                        <Thumb item={pair.second} className="-ml-3 w-14 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-stone-800">{displayName(pair.first)} <span className="text-stone-400">+</span> {displayName(pair.second)}</p>
                        <p className="mt-0.5 text-xs text-stone-500">Juntas em {plural(pair.timesTogether, "look", "looks")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <Hint>Os pares aparecem quando um look do diário tem duas ou mais peças do seu guarda-roupa.</Hint>}
            </Panel>
          </div>
        )}
        {hasWears && <ResetWearDiary onReset={onStats} />}
      </Group>

      <Group title="Há mais tempo com você" hint="As peças cadastradas há mais tempo">
        <Panel>
          <ItemStrip items={stats.longestOwned} caption={(item) => (item.createdAt ? `Desde ${monthYear(item.createdAt)}` : "")} />
        </Panel>
      </Group>
    </div>
  );
}

// Para quando os números não batem com a realidade (ex: trocou de look na última hora): recomeça a contagem
function ResetWearDiary({ onReset }: { onReset: (stats: WardrobeStats) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function reset() {
    setPending(true);
    setError("");
    try {
      onReset(await wardrobeService.resetWearDiary());
    } catch (failure) {
      setError(apiErrorMessage(failure, "Não foi possível zerar o diário agora. Tente novamente."));
      setPending(false);
    }
  }

  return (
    <div className="mt-4 px-1 text-xs text-stone-500">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>Zerar o diário apaga os looks usados e as contagens das peças. Os eventos até hoje não voltam a contar. Continuar?</span>
          <span className="flex items-center gap-1.5">
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="rounded-full px-3 py-1.5 font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">Não</button>
            <button type="button" onClick={() => void reset()} disabled={pending} className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60">
              {pending && <LoaderCircle size={12} className="animate-spin" />}
              Zerar diário
            </button>
          </span>
        </div>
      ) : (
        <p>
          Os números não batem com o que você usou de verdade?{" "}
          <button type="button" onClick={() => setConfirming(true)} className={linkClass}>Zerar diário de uso</button>
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    </div>
  );
}

function wearCaption(item: ClothingItem): string {
  const times = item.timesWorn ?? 0;
  return times === 0 ? "Ainda sem uso" : `Usada ${plural(times, "vez", "vezes")}`;
}

function costPerWear(item: ClothingItem): string | null {
  const times = item.timesWorn ?? 0;
  return item.purchasePrice != null && times > 0 ? `${brl(item.purchasePrice / times)} por uso` : null;
}

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <h2 className="font-serif text-2xl italic tracking-tight text-stone-900">{title}</h2>
        <p className="text-xs text-stone-400">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Panel({ title, hint, className = "", children }: { title?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{title}</h3>
          {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Metric({ label, value, note, children }: { label: string; value: string; note: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-2 truncate font-serif text-3xl tabular-nums tracking-tight text-stone-900 sm:text-4xl">{value}</p>
      {children}
      <p className="mt-2 text-xs leading-snug text-stone-500">{note}</p>
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="py-4 text-sm leading-relaxed text-stone-500">{children}</p>;
}

function Thumb({ item, className = "" }: { item: ClothingItem; className?: string }) {
  return (
    <span className={`block aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 ${className}`}>
      {/* URL pré-assinada do R2 (expira): <img> simples, sem o otimizador do Next */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.thumbnailUrl ?? item.imageUrl} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
    </span>
  );
}

// Faixa de peças com rolagem lateral: no celular cabem ~3 por vez
function ItemStrip({ items, caption, detail }: { items: ClothingItem[]; caption: (item: ClothingItem) => string; detail?: (item: ClothingItem) => string | null }) {
  return (
    <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
      {items.map((item) => {
        const name = displayName(item);
        const extra = detail?.(item);
        return (
          <li key={item.id} className="w-28 shrink-0 sm:w-32">
            <Thumb item={item} />
            <p className="mt-2 truncate text-xs font-medium text-stone-800" title={name}>{name}</p>
            <p className="mt-0.5 truncate text-[11px] text-stone-500">{caption(item)}</p>
            {extra && <p className="truncate text-[11px] text-stone-400">{extra}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function BarList({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-stone-700">{row.label}</span>
            <span className="shrink-0 tabular-nums text-stone-500">{row.count}</span>
          </div>
          <div aria-hidden="true" className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-stone-700" style={{ width: `${Math.max(3, percent(row.count, total))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_RADIUS = 52;
const DONUT_LENGTH = 2 * Math.PI * DONUT_RADIUS;

function ColorChart({ colors }: { colors: { label: string; count: number }[] }) {
  const total = colors.reduce((sum, color) => sum + color.count, 0);
  const slices = colors.map((color, index) => {
    const before = colors.slice(0, index).reduce((sum, previous) => sum + previous.count, 0);
    return { ...color, tone: colorSwatch(color.label), length: (color.count / total) * DONUT_LENGTH, offset: (before / total) * DONUT_LENGTH };
  });
  const favorites = colors.filter((color) => color.label !== "Outras").slice(0, 2).map((color) => color.label.toLowerCase());

  return (
    <div>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 140 140" role="img" aria-label="Distribuição das cores do guarda-roupa" className="h-32 w-32 shrink-0 -rotate-90">
          {/* Contorno: mantém visíveis as fatias claras (branco, creme) sobre o fundo branco */}
          <circle cx="70" cy="70" r={DONUT_RADIUS + 10} fill="none" stroke="#E7E5E4" strokeWidth="1" />
          <circle cx="70" cy="70" r={DONUT_RADIUS - 10} fill="none" stroke="#E7E5E4" strokeWidth="1" />
          {slices.map((slice) => (
            <circle
              key={slice.label}
              cx="70"
              cy="70"
              r={DONUT_RADIUS}
              fill="none"
              stroke={slice.tone}
              strokeWidth="19"
              strokeDasharray={`${Math.max(0, slice.length - 1.5)} ${DONUT_LENGTH}`}
              strokeDashoffset={-slice.offset}
            />
          ))}
        </svg>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center gap-2 text-xs">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full border border-stone-300/70" style={{ backgroundColor: slice.tone }} />
              <span className="truncate text-stone-700">{capitalize(slice.label)}</span>
              <span className="ml-auto shrink-0 tabular-nums text-stone-400">{percent(slice.count, total)}%</span>
            </li>
          ))}
        </ul>
      </div>
      {favorites.length > 0 && (
        <p className="mt-4 text-xs text-stone-500">
          {favorites.length === 2 ? "Suas cores mais presentes são " : "Sua cor mais presente é "}
          <span className="font-medium text-stone-800">{favorites.join(" e ")}</span>.
        </p>
      )}
    </div>
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
    <div role="status" aria-label="Carregando painéis" className="space-y-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-stone-200/50" />)}
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-stone-200/50" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-stone-200/50" />)}
      </div>
    </div>
  );
}
