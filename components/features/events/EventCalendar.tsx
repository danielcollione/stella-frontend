"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthGrid, monthLabel, occasionOf, toIsoDate } from "@/services/events/eventCatalog";
import type { CalendarEvent } from "@/types/events";

const WEEKDAYS = [
  { short: "D", long: "Domingo" },
  { short: "S", long: "Segunda" },
  { short: "T", long: "Terça" },
  { short: "Q", long: "Quarta" },
  { short: "Q", long: "Quinta" },
  { short: "S", long: "Sexta" },
  { short: "S", long: "Sábado" },
];

interface EventCalendarProps {
  month: Date;
  today: string;
  selected: string;
  events: CalendarEvent[];
  loading: boolean;
  onMonthChange: (month: Date) => void;
  onSelectDay: (dateIso: string) => void;
  onToday: () => void;
}

export function EventCalendar({ month, today, selected, events, loading, onMonthChange, onSelectDay, onToday }: EventCalendarProps) {
  const reducedMotion = useReducedMotion();
  const days = useMemo(() => monthGrid(month), [month]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => map.set(event.date, [...(map.get(event.date) ?? []), event]));
    return map;
  }, [events]);
  const { month: monthName, year } = monthLabel(month);
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const isCurrentMonth = toIsoDate(month).slice(0, 7) === today.slice(0, 7);

  function shift(delta: number) {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  return (
    <section aria-label="Calendário" className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 aria-live="polite" className="flex items-baseline gap-2">
          <span className="font-serif text-3xl capitalize italic tracking-tight text-stone-900">{monthName}</span>
          <span className="text-sm font-medium tabular-nums text-stone-400">{year}</span>
        </h2>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button type="button" onClick={onToday} className="mr-1 rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900">
              Hoje
            </button>
          )}
          <button type="button" onClick={() => shift(-1)} aria-label="Mês anterior" className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Próximo mês" className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900">
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 pb-2" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday.long} className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            <span className="sm:hidden">{weekday.short}</span>
            <span className="hidden sm:inline">{weekday.long.slice(0, 3)}</span>
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={`grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-stone-100 bg-stone-100 transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          {days.map((day) => {
            const iso = toIsoDate(day);
            const dayEvents = byDay.get(iso) ?? [];
            return (
              <DayCell
                key={iso}
                day={day}
                iso={iso}
                events={dayEvents}
                outside={day.getMonth() !== month.getMonth()}
                isToday={iso === today}
                isPast={iso < today}
                isSelected={iso === selected}
                onSelect={() => onSelectDay(iso)}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function DayCell({ day, iso, events, outside, isToday, isPast, isSelected, onSelect }: {
  day: Date; iso: string; events: CalendarEvent[]; outside: boolean; isToday: boolean; isPast: boolean; isSelected: boolean; onSelect: () => void;
}) {
  const label = `${day.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}${events.length ? `, ${events.length} ${events.length === 1 ? "evento" : "eventos"}` : ""}${isToday ? ", hoje" : ""}`;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={isSelected}
      data-date={iso}
      className={`group relative flex h-14 flex-col items-center gap-1 px-1 pt-1.5 text-left outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-300 sm:h-24 sm:items-stretch sm:px-2 sm:pt-2 ${outside ? "bg-stone-50/70" : "bg-white"} ${isSelected ? "" : "hover:bg-[#FAF8F5]"}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors sm:self-start ${
        isSelected
          ? "bg-stone-900 font-semibold text-white"
          : isToday
            ? "font-semibold text-stone-900 ring-1 ring-stone-900"
            : outside
              ? "text-stone-300"
              : isPast
                ? "text-stone-400"
                : "text-stone-700 group-hover:text-stone-900"
      }`}>
        {day.getDate()}
      </span>

      {/* Celular: pontos coloridos; telas maiores: o nome dos eventos */}
      {events.length > 0 && (
        <span className="flex gap-0.5 sm:hidden" aria-hidden="true">
          {events.slice(0, 3).map((event) => (
            <span key={event.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: occasionOf(event.occasion).tone }} />
          ))}
        </span>
      )}
      <span className="hidden min-w-0 flex-col gap-0.5 sm:flex" aria-hidden="true">
        {events.slice(0, 2).map((event) => (
          <span key={event.id} className={`flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] leading-tight ${isPast ? "text-stone-400" : "text-stone-700"}`} style={{ backgroundColor: `${occasionOf(event.occasion).tone}1F` }}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: occasionOf(event.occasion).tone }} />
            <span className="truncate">{event.title}</span>
          </span>
        ))}
        {events.length > 2 && <span className="px-1.5 text-[10px] font-medium text-stone-400">+{events.length - 2}</span>}
      </span>
    </button>
  );
}
