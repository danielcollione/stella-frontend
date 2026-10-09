"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, LoaderCircle, Menu, Minus, ShieldCheck } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import { billingService, formatPrice } from "@/services/billing/billingService";
import type { BillingInterval, BillingStatus, Plan } from "@/types/billing";

export default function PlansPage() {
  const { openMobileMenu } = useAppShell();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [interval, setBillingInterval] = useState<BillingInterval>("MONTHLY");
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const checkoutCanceled = searchParams.get("checkout") === "cancelado";

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([billingService.listPlans(controller.signal), billingService.status(controller.signal)])
      .then(([loadedPlans, loadedBilling]) => {
        setPlans(loadedPlans);
        setBilling(loadedBilling);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, []);

  const subscribed = billing !== null && billing.planCode !== "FREE";

  async function choose(plan: Plan) {
    setActionError("");
    setPendingPlan(plan.code);
    try {
      // Já assinante: troca de plano, cartão e cancelamento ficam no portal seguro do Stripe
      const url = subscribed ? await billingService.openPortal() : await billingService.startCheckout(plan.code, interval);
      window.location.assign(url);
    } catch (failure) {
      setActionError(apiErrorMessage(failure, "Não foi possível abrir o pagamento agora. Tente novamente em instantes."));
      setPendingPlan(null);
    }
  }

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <PageContent stagger>
          <div className="mb-2 flex items-center md:hidden">
            <button type="button" onClick={openMobileMenu} aria-label="Abrir menu" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-100">
              <Menu size={20} />
            </button>
          </div>

          <header className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Planos</p>
            <h1 className="mt-2 font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">Uma estilista para cada momento</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Comece no Provador e evolua quando quiser. Sem fidelidade: cancele quando desejar.
            </p>

            <div role="radiogroup" aria-label="Periodicidade" className="mt-8 inline-flex rounded-full border border-stone-200/90 bg-white p-1 shadow-2xs">
              {(["MONTHLY", "YEARLY"] as const).map((value) => {
                const selected = interval === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setBillingInterval(value)}
                    className={`relative rounded-full px-5 py-2 text-xs font-medium transition-colors ${selected ? "text-white" : "text-stone-500 hover:text-stone-800"}`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="interval-pill"
                        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                        className="absolute inset-0 rounded-full bg-stone-900"
                      />
                    )}
                    <span className="relative">
                      {value === "MONTHLY" ? "Mensal" : "Anual"}
                      {value === "YEARLY" && <span className={`ml-1.5 ${selected ? "text-stone-300" : "text-emerald-700"}`}>−25%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </header>

          {checkoutCanceled && (
            <p role="status" className="mx-auto mb-6 max-w-xl rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm text-stone-600">
              O pagamento não foi concluído. Você pode tentar novamente quando quiser.
            </p>
          )}
          {actionError && (
            <p role="alert" className="mx-auto mb-6 flex max-w-xl items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />{actionError}
            </p>
          )}

          {loadError ? (
            <p role="alert" className="mx-auto max-w-md rounded-2xl border border-dashed border-stone-200 bg-white/60 px-6 py-12 text-center text-sm text-stone-500">
              Não foi possível carregar os planos. Verifique sua conexão e recarregue a página.
            </p>
          ) : !plans || !billing ? (
            <div className="grid gap-5 lg:grid-cols-3" role="status" aria-label="Carregando planos">
              {[0, 1, 2].map((index) => <div key={index} className="h-[30rem] animate-pulse rounded-3xl border border-stone-200/80 bg-white" />)}
            </div>
          ) : (
            <div className="grid items-stretch gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.code}
                  plan={plan}
                  interval={interval}
                  current={billing.planCode === plan.code}
                  subscribed={subscribed}
                  trialEligible={billing.trialEligible}
                  pending={pendingPlan === plan.code}
                  disabled={pendingPlan !== null}
                  onChoose={() => void choose(plan)}
                />
              ))}
            </div>
          )}

          <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-stone-400">
            <ShieldCheck size={14} />
            Pagamento seguro pelo Stripe. No teste grátis, a primeira cobrança acontece só ao fim do período de teste.
          </p>
        </PageContent>
      </main>
    </div>
  );
}

function PlanCard({ plan, interval, current, subscribed, trialEligible, pending, disabled, onChoose }: {
  plan: Plan;
  interval: BillingInterval;
  current: boolean;
  subscribed: boolean;
  trialEligible: boolean;
  pending: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const free = plan.code === "FREE";
  const price = interval === "MONTHLY" ? plan.monthlyPriceCents : plan.yearlyPriceCents;
  const monthlyEquivalent = interval === "YEARLY" && !free ? formatPrice(Math.round(plan.yearlyPriceCents / 12)) : null;
  const showTrial = !free && !subscribed && trialEligible && plan.trialDays > 0;

  let action: React.ReactNode;
  if (current) {
    action = <span className="block rounded-full border border-stone-200 py-3 text-center text-sm font-medium text-stone-500">Seu plano atual</span>;
  } else if (free) {
    action = subscribed
      ? <span className="block py-3 text-center text-xs text-stone-400">Disponível se você cancelar a assinatura</span>
      : null;
  } else {
    action = (
      <button
        type="button"
        onClick={onChoose}
        disabled={disabled}
        className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${plan.highlight ? "bg-stone-900 text-white hover:bg-stone-800" : "border border-stone-300 bg-white text-stone-800 hover:border-stone-500"}`}
      >
        {pending && <LoaderCircle size={15} className="animate-spin" />}
        {subscribed ? `Mudar para ${plan.name}` : showTrial ? `Começar ${plan.trialDays} dias grátis` : `Assinar ${plan.name}`}
      </button>
    );
  }

  return (
    <article className={`relative flex flex-col rounded-3xl border bg-white p-7 shadow-[0_1px_2px_rgba(28,25,23,0.03)] ${plan.highlight ? "border-stone-900 shadow-[0_18px_48px_rgba(28,25,23,0.10)] lg:-translate-y-2" : "border-stone-200/80"}`}>
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          Mais escolhido
        </span>
      )}
      <h2 className="font-serif text-3xl italic tracking-tight text-stone-900">{plan.name}</h2>
      {plan.tagline && <p className="mt-1 text-sm text-stone-500">{plan.tagline}</p>}

      <div className="mt-6 min-h-[5.5rem]">
        {free ? (
          <p className="font-serif text-4xl text-stone-900">Grátis</p>
        ) : (
          <>
            <p className="flex items-baseline gap-1.5">
              <span className="font-serif text-4xl text-stone-900">{formatPrice(price)}</span>
              <span className="text-sm text-stone-400">/{interval === "MONTHLY" ? "mês" : "ano"}</span>
            </p>
            {monthlyEquivalent && <p className="mt-1 text-xs text-stone-500">equivale a {monthlyEquivalent}/mês</p>}
            {showTrial && (
              <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                {plan.trialDays} dias grátis para experimentar
              </p>
            )}
          </>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3 border-t border-stone-100 pt-6">
        {plan.features.map((feature) => (
          <li key={feature.text} className={`flex items-start gap-2.5 text-sm ${feature.included ? "text-stone-700" : "text-stone-400"}`}>
            {feature.included
              ? <Check size={16} className="mt-0.5 shrink-0 text-stone-900" />
              : <Minus size={16} className="mt-0.5 shrink-0 text-stone-300" />}
            <span className="flex-1">
              {feature.text}
              {feature.comingSoon && (
                <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-stone-500">em breve</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {action && <div className="mt-8">{action}</div>}
      {free && !current && !subscribed && (
        <Link href="/chat" className="mt-8 block py-3 text-center text-sm text-stone-500 underline-offset-4 hover:underline">Continuar no Provador</Link>
      )}
    </article>
  );
}
