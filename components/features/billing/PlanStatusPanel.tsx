"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, LoaderCircle, Settings2, Sparkles } from "lucide-react";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import { billingService, formatDate } from "@/services/billing/billingService";
import type { BillingStatus, UsageItem } from "@/types/billing";

export function PlanStatusPanel() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    billingService.status(controller.signal).then(setBilling).catch(() => {
      if (!controller.signal.aborted) setLoadError(true);
    });
    return () => controller.abort();
  }, []);

  async function manage() {
    setOpening(true);
    setError("");
    try {
      window.location.assign(await billingService.openPortal());
    } catch (failure) {
      setError(apiErrorMessage(failure, "Não foi possível abrir o gerenciamento da assinatura agora."));
      setOpening(false);
    }
  }

  if (loadError) {
    return <p role="alert" className="rounded-2xl border border-dashed border-stone-200 bg-white/60 px-5 py-8 text-center text-sm text-stone-500">Não foi possível carregar seu plano agora.</p>;
  }
  if (!billing) {
    return <div role="status" aria-label="Carregando plano" className="h-64 animate-pulse rounded-2xl border border-stone-200/70 bg-white" />;
  }

  const free = billing.planCode === "FREE";
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200/70 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Seu plano</p>
            <h2 className="mt-1 font-serif text-3xl italic tracking-tight text-stone-900">{billing.planName}</h2>
          </div>
          <Sparkles size={20} className="mt-1 text-stone-300" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">{describe(billing)}</p>
        {billing.status === "PAST_DUE" && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Não conseguimos cobrar seu cartão. Atualize a forma de pagamento para não perder os recursos do plano.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {billing.canManageSubscription && !free && (
            <button type="button" onClick={() => void manage()} disabled={opening} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
              {opening ? <LoaderCircle size={15} className="animate-spin" /> : <Settings2 size={15} />}Gerenciar assinatura
            </button>
          )}
          <Link href="/planos" className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium ${free ? "bg-stone-900 text-white hover:bg-stone-800" : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"}`}>
            {free ? "Conhecer os planos" : "Ver planos"}
          </Link>
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      </section>

      <section>
        <p className="mb-3 px-1 text-xs font-medium text-stone-500">
          Uso neste período (desde {formatDate(billing.usagePeriodStart) ?? "o início do mês"})
        </p>
        <div className="space-y-3 rounded-2xl border border-stone-200/70 bg-white p-6">
          {billing.usage.map((item) => <UsageBar key={item.key} item={item} />)}
        </div>
      </section>
    </div>
  );
}

function UsageBar({ item }: { item: UsageItem }) {
  const ratio = item.limit > 0 ? Math.min(1, item.used / item.limit) : 1;
  const nearLimit = ratio >= 0.85;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-stone-700">{item.label}</span>
        <span className={`tabular-nums text-xs ${nearLimit ? "text-amber-700" : "text-stone-400"}`}>
          {item.used} de {item.limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={item.limit} aria-valuenow={item.used}>
        <div className={`h-full rounded-full transition-[width] duration-500 ${nearLimit ? "bg-amber-500" : "bg-stone-900"}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function describe(billing: BillingStatus): string {
  const periodEnd = formatDate(billing.currentPeriodEnd);
  const trialEnd = formatDate(billing.trialEnd);
  if (billing.planCode === "FREE") {
    return billing.trialEligible
      ? "Você está no plano gratuito. Experimente o Atelier ou o Couture com dias grátis durante o lançamento."
      : "Você está no plano gratuito.";
  }
  if (billing.status === "TRIALING" && trialEnd) {
    return billing.cancelAtPeriodEnd
      ? `Teste grátis até ${trialEnd}. O cancelamento já está agendado: não haverá cobrança.`
      : `Teste grátis até ${trialEnd}. A primeira cobrança acontece nessa data.`;
  }
  if (billing.cancelAtPeriodEnd && periodEnd) {
    return `Cancelamento agendado: você mantém os recursos até ${periodEnd}.`;
  }
  const cycle = billing.interval === "YEARLY" ? "Plano anual" : "Plano mensal";
  return periodEnd ? `${cycle}. Próxima renovação em ${periodEnd}.` : cycle;
}
