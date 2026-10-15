"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Menu, RefreshCw } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { parseIsoDate } from "@/services/events/eventCatalog";
import { adminService } from "@/services/admin/adminService";
import type { AdminOverview, TrendAdmin } from "@/types/admin";

const PERIODS = [7, 30, 90] as const;

const PLAN_NAMES: Record<string, string> = { FREE: "Provador", ATELIER: "Atelier", COUTURE: "Couture" };

const KIND_NAMES: Record<string, string> = {
  "chat.message": "Mensagem no chat",
  "chat.photo": "Mensagem com foto",
  "event.look": "Look de evento",
  "wardrobe.analyze": "Análise de peça",
  "wardrobe.duplicate": "Checagem de peça repetida",
  "chat.palette_memory": "Memória de paleta",
  "chat.taste_profile": "Perfil de gosto",
  "outfit.look": "Look (motor antigo)",
  "trends.synthesis": "Relatório de tendências",
};

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usd = (value: number, digits = 2) => `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const shortDay = (iso: string) => parseIsoDate(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export default function AdminPage() {
  const { openMobileMenu, user } = useAppShell();
  const [days, setDays] = useState<number>(30);
  const [loaded, setLoaded] = useState<{ days: number; data: AdminOverview } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user?.admin) return;
    const controller = new AbortController();
    adminService.overview(days, controller.signal)
      .then((data) => {
        setLoaded({ days, data });
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [days, user?.admin]);

  const data = loaded?.data ?? null;
  const loading = loaded?.days !== days && !failed;

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8 lg:px-10">
        <PageContent stagger>
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={openMobileMenu} aria-label="Abrir menu" title="Abrir menu" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:hidden">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Uso interno</p>
                <h1 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Painel</h1>
              </div>
            </div>
            {user?.admin && (
              <div role="radiogroup" aria-label="Período" className="mb-1 inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-2xs">
                {PERIODS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    role="radio"
                    aria-checked={days === period}
                    onClick={() => setDays(period)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${days === period ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}
                  >
                    {period} dias
                  </button>
                ))}
              </div>
            )}
          </header>

          {!user?.admin ? (
            <Notice title="Página não encontrada" text="Este endereço não existe ou não está disponível para a sua conta." />
          ) : failed ? (
            <Notice title="Não conseguimos carregar o painel" text="Verifique sua conexão e recarregue a página." />
          ) : !data ? (
            <p role="status" className="py-16 text-center text-sm text-stone-500">Carregando...</p>
          ) : (
            <div className={`space-y-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Usuários" value={String(data.users.total)} detail={`${data.users.newInPeriod} novos em ${data.days} dias`} />
                <Stat label="Assinantes" value={String(subscribers(data))} detail={data.users.trialing > 0 ? `${data.users.trialing} em teste grátis` : "nenhum em teste grátis"} />
                <Stat label="Receita mensal estimada" value={brl(monthlyRevenue(data))} detail="assinantes × preço mensal" />
                <Stat label={`Custo de IA em ${data.days} dias`} value={brl(data.ai.totalUsd * data.usdToBrl)} detail={`${usd(data.ai.totalUsd)} · ${data.ai.calls} chamadas`} />
              </div>

              <Card title="Funil" hint={`Visitas à página inicial e, das contas criadas em ${data.days} dias, quantas chegaram a cada passo`}>
                <Funnel funnel={data.funnel} />
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Novos usuários por dia">
                  <Bars points={data.usage.map((day) => ({ day: day.day, value: data.users.newPerDay.find((entry) => entry.day === day.day)?.count ?? 0 }))} format={(value) => String(value)} />
                </Card>
                <Card title="Custo de IA por dia" hint="Estimativa a partir dos tokens registrados">
                  <Bars points={data.usage.map((day) => ({ day: day.day, value: day.aiCostUsd }))} format={(value) => usd(value)} />
                </Card>
                <Card title="Mensagens por dia">
                  <Bars points={data.usage.map((day) => ({ day: day.day, value: day.messages }))} format={(value) => String(value)} />
                </Card>
                <Card title="Peças cadastradas e looks de evento por dia">
                  <Bars points={data.usage.map((day) => ({ day: day.day, value: day.items + day.eventLooks }))} format={(value) => String(value)} />
                  <p className="mt-3 text-xs text-stone-400">
                    No período: {sum(data.usage, "items")} peças · {sum(data.usage, "eventLooks")} looks de evento · {sum(data.usage, "photos")} mensagens com foto
                  </p>
                </Card>
              </div>

              <Card title="Planos" hint={`Custo médio de IA por usuário em ${data.days} dias, comparado com o preço mensal`}>
                <Table
                  head={["Plano", "Usuários", "Preço mensal", "IA por usuário", "Sobra por usuário"]}
                  rows={data.plans.map((plan) => [
                    PLAN_NAMES[plan.plan] ?? plan.plan,
                    String(plan.users),
                    plan.monthlyPriceBrl > 0 ? brl(plan.monthlyPriceBrl) : "—",
                    brl(plan.averageAiCostBrl),
                    plan.monthlyPriceBrl > 0 ? <Margin key="margin" value={plan.monthlyPriceBrl - plan.averageAiCostBrl} /> : "—",
                  ])}
                />
                <p className="mt-3 text-xs text-stone-400">A sobra não desconta a taxa do Stripe, impostos nem os custos fixos. Câmbio usado: R$ {data.usdToBrl.toFixed(2)}.</p>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Custo de IA por tipo de chamada">
                  <Table
                    head={["Tipo", "Chamadas", "Média", "Total"]}
                    rows={data.ai.byKind.map((kind) => [
                      <span key="kind">{KIND_NAMES[kind.kind] ?? kind.kind}<span className="block text-[11px] text-stone-400">{kind.model}</span></span>,
                      String(kind.calls),
                      usd(kind.averageUsd, 4),
                      usd(kind.totalUsd),
                    ])}
                    empty="Nenhuma chamada de IA no período."
                  />
                </Card>
                <Card title="Quem mais gastou" hint="Os 10 usuários de maior custo de IA no período">
                  <Table
                    head={["Usuário", "Plano", "Chamadas", "Custo"]}
                    rows={data.topUsers.map((entry) => [
                      <span key="email" className="break-all">{entry.email}</span>,
                      PLAN_NAMES[entry.plan] ?? entry.plan,
                      String(entry.calls),
                      brl(entry.aiCostUsd * data.usdToBrl),
                    ])}
                    empty="Nenhum uso de IA no período."
                  />
                </Card>
              </div>

              <TrendEngine />
            </div>
          )}
        </PageContent>
      </main>
    </div>
  );
}

function subscribers(data: AdminOverview): number {
  return data.plans.filter((plan) => plan.monthlyPriceBrl > 0).reduce((total, plan) => total + plan.users, 0);
}

function monthlyRevenue(data: AdminOverview): number {
  return data.plans.reduce((total, plan) => total + plan.users * plan.monthlyPriceBrl, 0);
}

function sum(usage: AdminOverview["usage"], field: "items" | "eventLooks" | "photos"): number {
  return usage.reduce((total, day) => total + day[field], 0);
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-3xl border border-dashed border-stone-200 bg-white/60 px-6 py-14 text-center">
      <AlertCircle size={22} strokeWidth={1.5} className="text-stone-400" />
      <p className="mt-3 text-sm font-medium text-stone-800">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{text}</p>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-2 font-serif text-3xl italic leading-none tracking-tight text-stone-900">{value}</p>
      <p className="mt-2 text-xs text-stone-500">{detail}</p>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-stone-200/80 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:px-6">
      <h2 className="font-serif text-xl italic tracking-tight text-stone-900">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Gráfico de barras simples: uma barra por dia, altura proporcional ao maior valor do período
function Bars({ points, format }: { points: { day: string; value: number }[]; format: (value: number) => string }) {
  const max = Math.max(...points.map((point) => point.value), 0);
  if (max === 0) return <p className="py-8 text-center text-sm text-stone-400">Sem movimento no período.</p>;
  return (
    <div>
      <div className="flex h-32 items-end gap-px" role="img" aria-label={`Maior valor: ${format(max)}`}>
        {points.map((point) => (
          <div key={point.day} title={`${shortDay(point.day)}: ${format(point.value)}`} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-t-sm bg-stone-800/85 transition-colors hover:bg-stone-900" style={{ height: point.value > 0 ? `${Math.max(3, (point.value / max) * 100)}%` : "0" }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-stone-400">
        <span>{shortDay(points[0].day)}</span>
        <span>pico: {format(max)}</span>
        <span>{shortDay(points[points.length - 1].day)}</span>
      </div>
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-stone-400">{empty ?? "Sem dados."}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-400">
            {head.map((title, index) => <th key={title} className={`py-2 font-semibold ${index === 0 ? "pr-3" : "px-3 text-right"}`}>{title}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-stone-100 last:border-0">
              {row.map((cell, index) => <td key={index} className={`py-2.5 align-top ${index === 0 ? "pr-3 text-stone-800" : "px-3 text-right tabular-nums text-stone-600"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Margin({ value }: { value: number }) {
  return <span className={value >= 0 ? "text-emerald-700" : "text-red-700"}>{brl(value)}</span>;
}

const FUNNEL_STEPS: { key: keyof AdminOverview["funnel"]; label: string }[] = [
  { key: "visits", label: "Visitas à página inicial" },
  { key: "signups", label: "Contas criadas" },
  { key: "onboarded", label: "Concluíram os primeiros passos" },
  { key: "chatted", label: "Mandaram a primeira mensagem" },
  { key: "addedItem", label: "Cadastraram a primeira peça" },
  { key: "plannedEvent", label: "Criaram um evento" },
  { key: "subscribed", label: "Assinaram ou estão em teste" },
];

// Cada linha mostra o total do passo, a barra proporcional ao maior passo e quanto do passo anterior chegou até ali
function Funnel({ funnel }: { funnel: AdminOverview["funnel"] }) {
  const largest = Math.max(1, ...FUNNEL_STEPS.map((step) => funnel[step.key]));
  return (
    <ol className="space-y-3">
      {FUNNEL_STEPS.map((step, index) => {
        const value = funnel[step.key];
        const previous = index > 0 ? funnel[FUNNEL_STEPS[index - 1].key] : 0;
        return (
          <li key={step.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-stone-700">{step.label}</span>
              <span className="shrink-0 tabular-nums text-stone-900">
                {value}
                {index > 0 && previous > 0 && <span className="ml-2 text-xs text-stone-400">{Math.round((value / previous) * 100)}% do passo anterior</span>}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-stone-800" style={{ width: `${value > 0 ? Math.max(1.5, (value / largest) * 100) : 0}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const AUDIENCE_NAMES: Record<string, string> = { FEMININE: "Feminino", MASCULINE: "Masculino" };
const BADGE_NAMES: Record<string, string> = { INVESTMENT: "Investimento", SEASON: "Da estação", FLEETING: "Passageira", EMERGING: "Chegando" };
const TREND_KIND_NAMES: Record<string, string> = { COLOR: "Cor", SILHOUETTE: "Modelagem", PIECE: "Peça", PRINT: "Estampa", FABRIC: "Tecido", STYLING: "Styling" };
const DISMISS_NAMES: Record<string, string> = { NOT_MY_STYLE: "estilo", COLOR: "cor", BUDGET: "orçamento", ROUTINE: "rotina", SEM_MOTIVO: "sem motivo" };
const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "nunca");

// Motor de tendências: o que foi coletado, os relatórios publicados (para conferir a qualidade) e o botão de rodar agora.
// Enquanto uma execução está em andamento, a situação é recarregada a cada 5 segundos.
function TrendEngine() {
  const [data, setData] = useState<TrendAdmin | null>(null);
  const [failed, setFailed] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    adminService.trends(signal)
      .then((next) => {
        setData(next);
        setFailed(false);
      })
      .catch(() => {
        if (!signal?.aborted) setFailed(true);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!data?.running) return;
    const timer = window.setInterval(() => load(), 5000);
    return () => window.clearInterval(timer);
  }, [data?.running, load]);

  const run = async () => {
    setStarting(true);
    try {
      await adminService.runTrends();
      load();
    } catch {
      setFailed(true);
    } finally {
      setStarting(false);
    }
  };

  const running = data?.running || starting;

  return (
    <Card title="Motor de tendências" hint="Coleta semanal das fontes; relatório novo a cada estação e atualização mensal">
      {failed && !data ? (
        <p className="py-6 text-center text-sm text-stone-400">Não conseguimos carregar o motor de tendências.</p>
      ) : !data ? (
        <p role="status" className="py-6 text-center text-sm text-stone-400">Carregando...</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-sm text-stone-600">
              <p>
                Última coleta: <span className="text-stone-900">{dateTime(data.lastCollection)}</span> · {data.material.articles} matérias com texto ·{" "}
                {data.material.headlines} manchetes · {data.material.searchTerms} buscas do Mercado Livre
              </p>
              {data.material.byOutlet.length > 0 && (
                <p className="mt-1 text-xs text-stone-400">{data.material.byOutlet.map((outlet) => `${outlet.outlet} (${outlet.count})`).join(" · ")}</p>
              )}
              {data.lastRunSummary && <p className="mt-2 text-xs text-stone-500">Última execução manual: {data.lastRunSummary}</p>}
            </div>
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={14} className={running ? "animate-spin" : ""} />
              {running ? "Rodando (alguns minutos)..." : "Rodar agora"}
            </button>
          </div>

          {data.reports.length === 0 ? (
            <p className="rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Nenhum relatório publicado ainda.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.reports.map((report) => (
                <div key={report.audience} className="rounded-2xl border border-stone-200/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                    {AUDIENCE_NAMES[report.audience] ?? report.audience} · {report.seasonLabel}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {report.runType === "SEASONAL" ? "Estação nova" : "Atualização do mês"} · {dateTime(report.createdAt)} · {report.sourcesConsidered} fontes · {report.model}
                  </p>
                  <p className="mt-3 text-sm italic text-stone-700">{report.summary}</p>
                  <ol className="mt-4 space-y-3">
                    {report.trends.map((trend) => (
                      <li key={trend.name} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-1 h-4 w-4 shrink-0 rounded-full border border-stone-200"
                          style={{ background: trend.colorHex ?? "transparent" }}
                        />
                        <div className="min-w-0 text-sm">
                          <p className="text-stone-900">
                            {trend.name}
                            <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">{BADGE_NAMES[trend.badge] ?? trend.badge}</span>
                          </p>
                          <p className="text-stone-600">{trend.description}</p>
                          <div className="mt-0.5 text-[11px] text-stone-400">
                            {TREND_KIND_NAMES[trend.kind] ?? trend.kind} · {trend.gender === "UNISEX" ? "unissex" : AUDIENCE_NAMES[trend.gender]?.toLowerCase()} ·{" "}
                            {trend.illustrationKeys.length > 0 ? trend.illustrationKeys.join(", ") : "sem ilustração"} · {trend.keywords.join(", ")} ·{" "}
                            <details className="inline">
                              <summary className="inline cursor-pointer underline underline-offset-2">{trend.sourceCount} fontes</summary>
                              <span className="block break-all">
                                {trend.sourceUrls.map((url) => (url.startsWith("http") ? <a key={url} href={url} target="_blank" rel="noreferrer" className="block hover:text-stone-700">{url}</a> : <span key={url} className="block">{url}</span>))}
                              </span>
                            </details>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {data.shopping && (
            <div className="rounded-2xl border border-stone-200/80 px-4 py-4 text-sm text-stone-600">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Compras · últimos 30 dias</p>
              <p className="mt-2">
                <span className="font-serif text-2xl italic text-stone-900">{data.shopping.bought}</span> “Comprei”
                <span className="text-stone-400"> ({data.shopping.boughtTotal} desde o início)</span> · {data.shopping.lists} listas ·{" "}
                {data.shopping.suggestions} sugestões · {data.shopping.have} “Já tenho” · {data.shopping.dismissed} “Não é para mim”
              </p>
              {data.shopping.dismissReasons.length > 0 && (
                <p className="mt-1 text-xs text-stone-400">
                  Motivos: {data.shopping.dismissReasons.map((reason) => `${DISMISS_NAMES[reason.outlet] ?? reason.outlet} (${reason.count})`).join(" · ")}
                </p>
              )}
            </div>
          )}

          <Table
            head={["Execução", "Público", "Resultado", "Modelo"]}
            rows={data.recentRuns.map((runRow) => [
              <span key="when">{dateTime(runRow.createdAt)}<span className="block text-[11px] text-stone-400">{runRow.runType === "SEASONAL" ? "Estação nova" : "Atualização"} · {runRow.seasonLabel}</span></span>,
              AUDIENCE_NAMES[runRow.audience] ?? runRow.audience,
              runRow.status === "PUBLISHED"
                ? <span key="status" className="text-emerald-700">Publicado ({runRow.trends})</span>
                : <span key="status" className="text-red-700" title={runRow.error ?? ""}>Não publicado<span className="block max-w-xs text-[11px] text-stone-400">{runRow.error}</span></span>,
              runRow.model ?? "—",
            ])}
            empty="Nenhuma execução ainda."
          />
        </div>
      )}
    </Card>
  );
}
