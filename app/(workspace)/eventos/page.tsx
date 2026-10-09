"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarHeart, Check, Menu, Plus } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { EventCalendar } from "@/components/features/events/EventCalendar";
import { EventAgenda } from "@/components/features/events/EventAgenda";
import { EventDialog } from "@/components/features/events/EventDialog";
import type { EventDialogTarget } from "@/components/features/events/EventDialog";
import { planLimitFrom } from "@/services/billing/billingService";
import { eventService } from "@/services/events/eventService";
import { addDays, monthGrid, parseIsoDate, toIsoDate, todayIso } from "@/services/events/eventCatalog";
import type { CalendarEvent } from "@/types/events";

const UPCOMING_DAYS = 60;

type Load = { key: string; events: CalendarEvent[] };

export default function EventsPage() {
  const { openMobileMenu } = useAppShell();
  const [today] = useState(todayIso);
  const [month, setMonth] = useState(() => firstOfMonth(today));
  const [selected, setSelected] = useState(today);
  const [version, setVersion] = useState(0); // incrementa a cada alteração: recarrega calendário e agenda
  const [monthData, setMonthData] = useState<Load | null>(null);
  const [upcomingData, setUpcomingData] = useState<Load | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dialog, setDialog] = useState<{ key: number; target: EventDialogTarget } | null>(null);

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

  const monthEvents = useMemo(() => monthData?.events ?? [], [monthData]);
  const upcoming = upcomingData?.events ?? null;
  const dayEvents = useMemo(() => {
    const byId = new Map<string, CalendarEvent>();
    [...monthEvents, ...(upcoming ?? [])].filter((event) => event.date === selected).forEach((event) => byId.set(event.id, event));
    return [...byId.values()].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  }, [monthEvents, upcoming, selected]);

  function openDialog(target: EventDialogTarget) {
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
    // Dia livre a partir de hoje: já abre o planejamento do evento
    const hasEvents = monthEvents.some((event) => event.date === iso);
    if (!hasEvents && iso >= today && monthData?.key === monthKey) openDialog({ kind: "create", date: iso });
  }

  const refresh = () => setVersion((current) => current + 1);

  if (locked) return <LockedEvents message={locked} onMenu={openMobileMenu} />;

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
                <h1 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Eventos</h1>
              </div>
            </div>
            <button type="button" onClick={() => openDialog({ kind: "create", date: selected >= today ? selected : today })} className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 active:scale-[0.98]">
              <Plus size={16} />
              <span>Novo<span className="hidden sm:inline"> evento</span></span>
            </button>
          </header>

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
              </aside>
            </div>
          )}
        </PageContent>
      </main>

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

// Provador: convite para os planos, mostrando o que a agenda faz
function LockedEvents({ message, onMenu }: { message: string; onMenu: () => void }) {
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
            <p className="relative mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Atelier e Couture</p>
            <h1 className="relative mt-2 font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Cada compromisso com o look certo</h1>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">{message}</p>
            <ul className="relative mx-auto mt-8 max-w-sm space-y-3 text-left text-sm text-stone-700">
              {[
                "Agenda com casamentos, jantares, viagens e reuniões",
                "A Stella monta o look com o seu guarda-roupa e sugere só o que faltar",
                "Peça outras opções quando quiser e escolha a sua",
                "No chat, pergunte: “quais eventos tenho esta semana?”",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-stone-900" />{text}</li>
              ))}
            </ul>
            <Link href="/planos" className="relative mt-10 inline-flex items-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800">
              Conhecer os planos
            </Link>
          </section>
        </PageContent>
      </main>
    </div>
  );
}
