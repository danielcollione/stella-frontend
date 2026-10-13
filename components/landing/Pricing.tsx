"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { CtaLink, EASE, Reveal } from "@/components/landing/primitives";
import { billingService, formatPrice } from "@/services/billing/billingService";
import type { BillingInterval, Plan } from "@/types/billing";

// Maior desconto do plano anual em relação a 12 mensalidades, para o texto "Economize X%"
function yearlySaving(plans: Plan[]): number {
  return plans.reduce((best, plan) => {
    if (plan.monthlyPriceCents <= 0 || plan.yearlyPriceCents <= 0) return best;
    return Math.max(best, Math.round((1 - plan.yearlyPriceCents / (plan.monthlyPriceCents * 12)) * 100));
  }, 0);
}

/** Vitrine de planos: os valores vêm do mesmo cadastro usado dentro do app. */
export function Pricing() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>("YEARLY");

  useEffect(() => {
    const controller = new AbortController();
    billingService.listPlans(controller.signal).then(setPlans).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, []);

  const saving = plans ? yearlySaving(plans) : 0;

  return (
    <section id="planos" className="scroll-mt-24 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <h2 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Escolha <span className="font-light italic">seu plano</span></h2>
            <p className="mt-3 text-base font-light text-stone-600">Comece grátis. Evolua quando quiser.{saving > 0 && ` Economize ${saving}% no plano anual.`}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div role="radiogroup" aria-label="Período de cobrança" className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-2xs">
              {(["YEARLY", "MONTHLY"] as const).map((option) => (
                <button key={option} type="button" role="radio" aria-checked={interval === option} onClick={() => setInterval(option)} className={`relative rounded-full px-4 py-2 text-xs font-medium transition-colors ${interval === option ? "text-white" : "text-stone-500 hover:text-stone-900"}`}>
                  {interval === option && <motion.span layoutId="pricing-interval" className="absolute inset-0 rounded-full bg-stone-900" transition={{ duration: 0.4, ease: EASE }} />}
                  <span className="relative">{option === "YEARLY" ? (saving > 0 ? `Anual (-${saving}%)` : "Anual") : "Mensal"}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {failed && (
          <Reveal className="mt-12 rounded-3xl border border-stone-200/80 bg-white p-10 text-center">
            <p className="font-serif text-2xl italic text-stone-900">Comece pelo plano gratuito</p>
            <p className="mt-2 text-sm text-stone-500">Crie sua conta e veja os planos e valores dentro do app.</p>
            <CtaLink href="/login" className="mt-6">Começar grátis</CtaLink>
          </Reveal>
        )}

        {!plans && !failed && (
          <div role="status" aria-label="Carregando planos" className="mt-12 grid gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((index) => <div key={index} className="h-[26rem] animate-pulse rounded-3xl bg-stone-200/50" />)}
          </div>
        )}

        {plans && (
          <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => <PlanCard key={plan.code} plan={plan} interval={interval} index={index} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function PlanCard({ plan, interval, index }: { plan: Plan; interval: BillingInterval; index: number }) {
  const free = plan.monthlyPriceCents === 0;
  const yearly = interval === "YEARLY" && !free;
  // No anual, o destaque é o valor equivalente por mês; o total cobrado aparece logo abaixo
  const price = free ? "Grátis" : formatPrice(yearly ? Math.round(plan.yearlyPriceCents / 12) : plan.monthlyPriceCents);
  const action = free ? "Começar grátis" : plan.trialDays > 0 ? `Começar ${plan.trialDays} dias grátis` : `Assinar ${plan.name}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: EASE }}
      className={`relative flex flex-col rounded-3xl border bg-white p-7 ${plan.highlight ? "border-stone-900 shadow-[0_24px_60px_-20px_rgba(28,25,23,0.3)] lg:-translate-y-3" : "border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.03)]"}`}
    >
      {plan.highlight && <span className="absolute -top-3 left-7 rounded-full bg-stone-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-50">Mais escolhido</span>}
      <h3 className="font-serif text-2xl italic text-stone-900">{plan.name}</h3>
      {plan.tagline && <p className="mt-1.5 min-h-10 text-sm font-light text-stone-500">{plan.tagline}</p>}
      <p className="mt-5 flex items-baseline gap-1.5">
        <motion.span key={price} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="font-serif text-4xl tracking-tight text-stone-900">{price}</motion.span>
        {!free && <span className="text-sm text-stone-500">/mês</span>}
      </p>
      <p className="mt-1 min-h-4 text-xs text-stone-400">{yearly ? `${formatPrice(plan.yearlyPriceCents)} cobrados uma vez por ano` : free ? "Para sempre, sem cartão" : "Cobrança mensal"}</p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.filter((feature) => !feature.comingSoon).map((feature) => (
          <li key={feature.text} className={`flex items-start gap-2.5 text-sm ${feature.included ? "text-stone-700" : "text-stone-300 line-through"}`}>
            <Check size={15} className={`mt-0.5 shrink-0 ${feature.included ? "text-stone-900" : "text-stone-300"}`} />
            {feature.text}
          </li>
        ))}
      </ul>

      <CtaLink href="/login" tone={plan.highlight ? "dark" : "outline"} className="mt-8 w-full justify-center">{action}</CtaLink>
    </motion.article>
  );
}
