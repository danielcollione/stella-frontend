"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, CalendarHeart, Check, Menu, Plus } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { EventCalendar } from "@/components/features/events/EventCalendar";
import { EventAgenda } from "@/components/features/events/EventAgenda";
import { EventDialog } from "@/components/features/events/EventDialog";
import { WeatherStrip } from "@/components/features/weather/WeatherStrip";
import type { EventDialogTarget } from "@/components/features/events/EventDialog";
import { planLimitFrom } from "@/services/billing/billingService";
import { eventService } from "@/services/events/eventService";
import { addDays, monthGrid, parseIsoDate, toIsoDate, todayIso } from "@/services/events/eventCatalog";
import { Modal } from "@/components/ui/Modal";
import { RatingButton } from "@/components/features/feedback/RatingButton";
import type { CalendarEvent, EventQuota } from "@/types/events";

const UPCOMING_DAYS = 60;

type Load = { key: string; events: CalendarEvent[] };

export default function EventsPage() {
  const { openMobileMenu, user } = useAppShell();
  const [today] = useState(todayIso);
  const [month, setMonth] = useState(() => firstOfMonth(today));
  const [selected, setSelected] = useState(today);
  const [version, setVersion] = useState(0); // incrementa a cada alteração: recarrega calendário e agenda
  const [monthData, setMonthData] = useState<Load | null>(null);
  const [upcomingData, setUpcomingData] = useState<Load | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dialog, setDialog] = useState<{ key: number; target: EventDialogTarget } | null>(null);
  const [quota, setQuota] = useState<EventQuota | null>(null);
  const [quotaSettled, setQuotaSettled] = useState(false);
  const [introSeen, markIntroSeen] = usePlannerIntroSeen(user?.id);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const grid = useMemo(() => monthGrid(month), [month]);
  const monthKey = `${toIsoDate(grid[0])}:${toIsoDate(grid[grid.length - 1])}:${version}`;
  const upcomingKey = String(version);

  useEffect(() => {
    const controller = new AbortController();
    const [from, to] = monthKey.split(":");
    eventService.list(from, to, controller.signal)
      .then((events) => setMonthData({ key: monthKey, events }))
      .catch((failure) => {
        if (controller.signal.aborted) return;
        const planLimit = planLimitFrom(failure);
        if (planLimit) setLocked(planLimit.message);
        else setLoadError(true);
      });
    return () => controller.abort();
  }, [monthKey]);

  useEffect(() => {
    const controller = new AbortController();
    eventService.list(today, toIsoDate(addDays(parseIsoDate(today), UPCOMING_DAYS)), controller.signal)
      .then((events) => setUpcomingData({ key: upcomingKey, events }))
      .catch((failure) => {
        if (controller.signal.aborted) return;
        const planLimit = planLimitFrom(failure);
        if (planLimit) setLocked(planLimit.message);
        else setLoadError(true);
      });
    return () => controller.abort();
  }, [today, upcomingKey]);

  // Quantos eventos o plano permite: no limite, "novo evento" vira o convite para assinar
  useEffect(() => {
    const controller = new AbortController();
    eventService.quota(controller.signal).then(setQuota).catch(() => undefined).finally(() => {
      if (!controller.signal.aborted) setQuotaSettled(true);
    });
    return () => controller.abort();
  }, [version]);

  const atLimit = quota !== null && quota.max !== null && quota.used >= quota.max;

  const monthEvents = useMemo(() => monthData?.events ?? [], [monthData]);
  const upcoming = upcomingData?.events ?? null;
  const dayEvents = useMemo(() => {
    const byId = new Map<string, CalendarEvent>();
    [...monthEvents, ...(upcoming ?? [])].filter((event) => event.date === selected).forEach((event) => byId.set(event.id, event));
    return [...byId.values()].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  }, [monthEvents, upcoming, selected]);

  function openDialog(target: EventDialogTarget) {
    if (target.kind === "create" && atLimit) {
      setUpgradeOpen(true);
      return;
    }
    setDialog((current) => ({ key: (current?.key ?? 0) + 1, target }));
  }

  function changeMonth(next: Date) {
    setMonth(next);
    // O dia selecionado acompanha o mês exibido: hoje, se for o mês atual; senão, o dia 1º
    setSelected(toIsoDate(next).slice(0, 7) === today.slice(0, 7) ? today : toIsoDate(next));
  }

  function selectDay(iso: string) {
    setSelected(iso);
    if (iso.slice(0, 7) !== toIsoDate(month).slice(0, 7)) setMonth(firstOfMonth(iso));
    if (monthData?.key !== monthKey) return; // calendário ainda carregando: só seleciona o dia
    const eventsOfDay = monthEvents.filter((event) => event.date === iso);
    // Um evento: abre direto. Vários: a agenda ao lado lista todos para escolher.
    // Dia livre a partir de hoje: já abre o planejamento de um evento novo.
    if (eventsOfDay.length === 1) openDialog({ kind: "open", event: eventsOfDay[0] });
    else if (eventsOfDay.length === 0 && iso >= today) openDialog({ kind: "create", date: iso });
  }

  const refresh = () => setVersion((current) => current + 1);

  if (locked) {
    return (
      <PlannerIntro onMenu={openMobileMenu} eyebrow="Atelier e Couture" note={locked}>
        <Link href="/planos" className={INTRO_ACTION_CLASS}>Conhecer os planos</Link>
      </PlannerIntro>
    );
  }

  // Primeira visita, ainda sem nenhum evento: apresenta o planejador antes da agenda vazia
  if (introSeen !== true) {
    if (introSeen === null || !quotaSettled) return <div className="min-h-full bg-[#FAF8F5]" />;
    if (quota?.used === 0) {
      return (
        <PlannerIntro
          onMenu={openMobileMenu}
          eyebrow="Planejador"
          note={quota.max !== null ? `Seu plano inclui ${quota.max === 1 ? "1 evento" : `${quota.max} eventos`} para você experimentar.` : undefined}
        >
          <button type="button" onClick={markIntroSeen} className={INTRO_ACTION_CLASS}>Começar a planejar</button>
        </PlannerIntro>
      );
    }
  }

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8 lg:px-10">
        <PageContent stagger>
          <header className="mb-7 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={openMobileMenu} aria-label="Abrir menu" title="Abrir menu" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:hidden">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Sua agenda</p>
                <h1 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Planejador</h1>
              </div>
            </div>
            <button type="button" onClick={() => openDialog({ kind: "create", date: selected >= today ? selected : today })} className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 active:scale-[0.98]">
              <Plus size={16} />
              <span>Novo<span className="hidden sm:inline"> evento</span></span>
            </button>
          </header>

          <WeatherStrip today={today} hasCity={Boolean(user?.cityName?.trim())} />

          {loadError ? (
            <div role="alert" className="flex flex-col items-center rounded-3xl border border-dashed border-stone-200 bg-white/60 px-6 py-14 text-center">
              <AlertCircle size={22} strokeWidth={1.5} className="text-stone-400" />
              <p className="mt-3 text-sm font-medium text-stone-800">Não conseguimos abrir sua agenda</p>
              <p className="mt-1 text-sm text-stone-500">Verifique sua conexão e tente novamente.</p>
              <button type="button" onClick={() => { setLoadError(false); refresh(); }} className="mt-5 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800">Tentar novamente</button>
            </div>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
              <EventCalendar
                month={month}
                today={today}
                selected={selected}
                events={monthEvents}
                loading={monthData?.key !== monthKey}
                onMonthChange={changeMonth}
                onSelectDay={selectDay}
                onToday={() => changeMonth(firstOfMonth(today))}
              />
              <aside aria-label="Agenda" className="lg:sticky lg:top-6">
                <EventAgenda
                  today={today}
                  selected={selected}
                  dayEvents={dayEvents}
                  upcoming={upcoming}
                  onOpen={(event) => openDialog({ kind: "open", event })}
                  onCreate={(date) => openDialog({ kind: "create", date })}
                />
                {/* Agenda ainda vazia: lembra, com discrição, o que o planejador faz; some no primeiro evento */}
                {quota?.used === 0 && (
                  <section aria-label="Por que planejar" className="stella-message-in mt-8 border-t border-stone-200/70 pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Por que planejar</p>
                    <p className="mt-2 font-serif text-xl italic tracking-tight text-stone-900">Saiba o que vestir antes do dia chegar</p>
                    <BenefitList className="mt-4 text-[13px] leading-relaxed text-stone-500" />
                  </section>
                )}
              </aside>
            </div>
          )}
        </PageContent>
        <RatingButton />
      </main>

      {quota?.max != null && (
        <EventLimitDialog open={upgradeOpen} max={quota.max} onClose={() => setUpgradeOpen(false)} />
      )}

      {dialog && (
        <EventDialog
          key={dialog.key}
          target={dialog.target}
          onClose={() => setDialog(null)}
          onChanged={(event) => {
            setSelected(event.date);
            if (event.date.slice(0, 7) !== toIsoDate(month).slice(0, 7)) setMonth(firstOfMonth(event.date));
            refresh();
          }}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}

function firstOfMonth(iso: string): Date {
  const date = parseIsoDate(iso);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const PLANNER_BENEFITS = [
  "Decida com calma: o look fica pronto dias antes, não em cima da hora",
  "Montado com as roupas que você já tem; comprar, só se faltar algo essencial",
  "Certo para o clima do dia e da cidade, inclusive em viagens",
  "Revisite o que usou em cada ocasião e evite repetições",
];

const INTRO_ACTION_CLASS = "relative mt-8 inline-flex items-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800";

function BenefitList({ className }: { className: string }) {
  return (
    <ul className={`space-y-3 text-left ${className}`}>
      {PLANNER_BENEFITS.map((text) => (
        <li key={text} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-stone-900" />{text}</li>
      ))}
    </ul>
  );
}

// Limite de eventos do plano atingido: convite para assinar, no lugar do formulário de novo evento
function EventLimitDialog({ open, max, onClose }: { open: boolean; max: number; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Um look certo para cada compromisso"
      description={`Seu plano inclui ${max === 1 ? "1 evento, e ele já está na agenda" : `${max} eventos, e todos já estão na agenda`}. Com o Atelier ou o Couture, você planeja quantos quiser.`}
    >
      <div className="px-6 py-6 sm:px-7">
        <BenefitList className="text-sm text-stone-700" />
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/planos" onClick={onClose} className="inline-flex items-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800">
            Conhecer os planos
          </Link>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-3 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
            Agora não
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Apresentação do planejador: na primeira visita (leva à agenda) e para planos sem agenda (leva aos planos)
function PlannerIntro({ onMenu, eyebrow, note, children }: { onMenu: () => void; eyebrow: string; note?: string; children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-8">
        <PageContent stagger>
          <div className="mb-2 flex items-center md:hidden">
            <button type="button" onClick={onMenu} aria-label="Abrir menu" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Menu size={20} /></button>
          </div>
          <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white px-6 py-12 text-center shadow-[0_18px_48px_rgba(28,25,23,0.06)] sm:px-12 sm:py-16">
            <span aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#C9A27E]/15 blur-3xl" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#A383A0]/15 blur-3xl" />
            <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white">
              <CalendarHeart size={22} strokeWidth={1.5} />
            </span>
            <p className="relative mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">{eyebrow}</p>
            <h1 className="relative mt-2 font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Saiba o que vestir antes do dia chegar</h1>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">
              Conte à Stella aonde você vai — um casamento, um jantar, uma viagem — e ela deixa o look pronto para você.
            </p>
            <BenefitList className="relative mx-auto mt-8 max-w-sm text-sm text-stone-700" />
            {children}
            {note && <p className="relative mx-auto mt-4 max-w-md text-xs leading-relaxed text-stone-400">{note}</p>}
          </section>
        </PageContent>
      </main>
    </div>
  );
}

const INTRO_SEEN_EVENT = "stella:planner-intro-seen";
const introSeenThisSession = new Set<string>(); // vale mesmo se o navegador não deixar gravar
const introSeenKey = (userId: string) => `@stella:planner-intro-seen:${userId}`;

function subscribeIntroSeen(onChange: () => void) {
  window.addEventListener(INTRO_SEEN_EVENT, onChange);
  return () => window.removeEventListener(INTRO_SEEN_EVENT, onChange);
}

// Por navegador e por conta: a apresentação do planejador já foi vista? (null enquanto não dá para saber)
function usePlannerIntroSeen(userId: string | undefined): [boolean | null, () => void] {
  const seen = useSyncExternalStore<boolean | null>(
    subscribeIntroSeen,
    () => {
      if (!userId) return null;
      if (introSeenThisSession.has(userId)) return true;
      try {
        return window.localStorage.getItem(introSeenKey(userId)) === "true";
      } catch {
        return true; // sem storage: não insiste na apresentação a cada visita
      }
    },
    () => null,
  );

  const markSeen = useCallback(() => {
    if (userId) introSeenThisSession.add(userId);
    try {
      if (userId) window.localStorage.setItem(introSeenKey(userId), "true");
    } catch {
      // Sem storage (aba anônima/bloqueada): a apresentação volta na próxima visita
    }
    window.dispatchEvent(new Event(INTRO_SEEN_EVENT));
  }, [userId]);

  return [seen, markSeen];
}
