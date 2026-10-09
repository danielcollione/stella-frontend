"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, MessageCircle, Sparkles } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { authService } from "@/services/authService";
import { billingService, formatDate } from "@/services/billing/billingService";
import type { BillingStatus } from "@/types/billing";

// O Stripe confirma a assinatura pelo webhook, que pode levar alguns segundos depois do retorno do checkout
const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 12;

export default function SubscriptionSuccessPage() {
  const { setUser } = useAppShell();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      attempts.current += 1;
      try {
        const status = await billingService.status(controller.signal);
        if (controller.signal.aborted) return;
        if (status.planCode !== "FREE") {
          setBilling(status);
          // Atualiza o usuário do app (selo do plano, recursos liberados) sem recarregar a página
          authService.getCurrentUser(controller.signal).then(setUser).catch(() => undefined);
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (attempts.current >= POLL_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [setUser]);

  const trialEnd = billing?.status === "TRIALING" ? formatDate(billing.trialEnd) : null;

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <PageContent contentKey={billing ? "ready" : timedOut ? "late" : "waiting"} stagger className="flex flex-col items-center">
          {billing ? (
            <>
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
                <Sparkles size={24} className="text-stone-900" />
              </span>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Assinatura confirmada</p>
              <h1 className="mt-2 font-serif text-4xl italic tracking-tight">Boas-vindas ao {billing.planName}</h1>
              <p className="mt-4 text-sm leading-relaxed text-stone-500">
                {trialEnd
                  ? `Seu período de teste vai até ${trialEnd}. A primeira cobrança só acontece depois dessa data, e você pode cancelar antes quando quiser.`
                  : "Tudo pronto. A Stella já está com todos os recursos do seu plano liberados."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <Link href="/chat" className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800">
                  <MessageCircle size={16} />Conversar com a Stella
                </Link>
                <Link href="/profile?view=plan" className="inline-flex items-center rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-300">
                  Ver meu plano
                </Link>
              </div>
            </>
          ) : timedOut ? (
            <>
              <h1 className="font-serif text-3xl italic tracking-tight">Pagamento recebido</h1>
              <p className="mt-4 text-sm leading-relaxed text-stone-500">
                A confirmação do Stripe está levando um pouco mais que o normal. Seu plano será ativado em instantes.
              </p>
              <button type="button" onClick={() => window.location.reload()} className="mt-8 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-300">
                Verificar novamente
              </button>
            </>
          ) : (
            <p role="status" className="flex items-center gap-2 text-sm text-stone-500">
              <LoaderCircle size={16} className="animate-spin" />Confirmando sua assinatura...
            </p>
          )}
        </PageContent>
      </main>
    </div>
  );
}
