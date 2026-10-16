"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Sparkle, Sparkles } from "lucide-react";
import { WeatherIcon } from "@/components/features/weather/WeatherIcon";
import { EventRow, NextEventCard } from "@/components/features/events/EventAgenda";
import { addDays, occasionOf, parseIsoDate, toIsoDate } from "@/services/events/eventCatalog";
import { weatherService } from "@/services/weather/weatherService";
import type { WeatherOverview } from "@/services/weather/weatherService";
import type { CalendarEvent } from "@/types/events";

const WEEKDAYS = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sáb."];
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** Dias na faixa: alguns antes de hoje (para rever) e as próximas semanas. */
const DAYS_BEFORE = 3;
const DAYS_AFTER = 45;

/**
 * Planejador no celular e no tablet, sem cartões em volta e com o topo enxuto (menos de um quinto da tela): a previsão
 * do dia escolhido e o ícone do mês; a faixa de dias que rola para os seguintes; o botão de planejar; o cartão do evento
 * do dia, só quando houver; e os próximos eventos. O mês inteiro abre pelo ícone (calendar).
 */
export function PlannerMobile({ today, selected, events, dayEvents, upcoming, hasCity, calendarOpen, calendar, onSelect, onToggleCalendar, onOpen, onCreate }: {
  today: string;
  selected: string;
  events: CalendarEvent[];
  dayEvents: CalendarEvent[];
  upcoming: CalendarEvent[] | null;
  hasCity: boolean;
  calendarOpen: boolean;
  calendar: ReactNode;
  onSelect: (iso: string) => void;
  onToggleCalendar: () => void;
  onOpen: (event: CalendarEvent) => void;
  onCreate: (iso: string) => void;
}) {
  const [weather, setWeather] = useState<WeatherOverview | null>(null);
  useEffect(() => {
    if (!hasCity) return;
    const controller = new AbortController();
    weatherService.overview(controller.signal).then(setWeather).catch(() => undefined);
    return () => controller.abort();
  }, [hasCity]);

  const forecast = weather?.days.find((day) => day.date === selected) ?? null;
  const later = (upcoming ?? []).filter((event) => event.date !== selected).slice(0, 6);
  const canPlan = selected >= today;
  const selectedDate = parseIsoDate(selected);

  return (
    <div>
      {/* Previsão do dia escolhido, a data e o ícone do mês */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {forecast ? (
            <p className="flex items-center gap-2">
              <span className="font-serif text-[26px] italic leading-none tracking-tight text-stone-900 tabular-nums">
                {selected === today && weather?.currentC != null ? weather.currentC : forecast.maxC}°
              </span>
              <WeatherIcon condition={forecast.condition} size={20} className="text-stone-600" />
              <span className="truncate text-xs text-stone-500">
                {forecast.minC != null && forecast.maxC != null ? `${forecast.minC}° · ${forecast.maxC}°` : ""}
                {(forecast.rainChance ?? 0) >= 30 ? ` · chuva ${forecast.rainChance}%` : ""}
              </span>
            </p>
          ) : (
            // Sem previsão: o dia da semana no lugar da temperatura, no mesmo tamanho, para o topo manter a altura
            <p className="font-serif text-[26px] italic leading-none tracking-tight text-stone-900">
              {upperFirst(selectedDate.toLocaleDateString("pt-BR", { weekday: "long" }))}
            </p>
          )}
          <p className="mt-1 text-xs text-stone-500">
            {forecast
              ? upperFirst(selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short", year: "numeric" }))
              : selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            {!forecast && !hasCity && (
              <Link href="/profile" className="ml-2 inline-flex items-center gap-1 text-stone-400 underline decoration-stone-300 underline-offset-4">
                <MapPin size={11} />
                ver previsão
              </Link>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCalendar}
          aria-expanded={calendarOpen}
          aria-label={calendarOpen ? "Fechar o mês" : "Ver o mês inteiro"}
          title={calendarOpen ? "Fechar o mês" : "Ver o mês inteiro"}
          className={`stella-hit -mr-1 shrink-0 rounded-full p-2 transition-colors ${calendarOpen ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200/60"}`}
        >
          <CalendarDays size={20} />
        </button>
      </div>

      {/* O mês inteiro, aberto pelo ícone; fechado, a faixa de dias */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${calendarOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className={`min-h-0 overflow-hidden ${calendarOpen ? "" : "invisible"}`}>
          <div className="pt-3">{calendar}</div>
        </div>
      </div>
      {!calendarOpen && <DayStrip today={today} selected={selected} events={events} weather={weather} onSelect={onSelect} />}

      {canPlan && (
        <div className="mt-6 flex justify-center">
          <span className="relative inline-flex">
            <Sparkle aria-hidden="true" size={11} className="stella-twinkle pointer-events-none absolute -left-3 -top-2 fill-[#C9A27E] text-[#C9A27E]" />
            <Sparkle aria-hidden="true" size={8} className="stella-twinkle pointer-events-none absolute -right-2 -top-3 fill-[#D9B98F] text-[#D9B98F] [animation-delay:0.9s]" />
            <Sparkle aria-hidden="true" size={9} className="stella-twinkle pointer-events-none absolute -bottom-2 right-6 fill-[#C9A27E] text-[#C9A27E] [animation-delay:1.7s]" />
            <button
              type="button"
              onClick={() => onCreate(selected)}
              className="stella-shine-button inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-[0.98]"
            >
              <Sparkles size={15} className="text-[#E9D3B4]" />
              {dayEvents.length > 0 ? "Planejar outro evento neste dia" : "Planejar um look para este dia"}
            </button>
          </span>
        </div>
      )}

      {/* O cartão escuro só aparece quando há evento no dia escolhido */}
      {dayEvents.length > 0 && (
        <div className="mt-6 space-y-3">
          {dayEvents.map((event) => (
            <NextEventCard key={event.id} event={event} today={today} onOpen={() => onOpen(event)} label={selected === today ? "Evento de hoje" : "Evento do dia"} />
          ))}
        </div>
      )}

      {later.length > 0 && (
        <section aria-labelledby="planner-upcoming" className="mt-8">
          <h2 id="planner-upcoming" className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Próximos eventos</h2>
          <ul className="flex flex-col gap-2">
            {later.map((event) => (
              <li key={event.id}><EventRow event={event} withDate onOpen={() => onOpen(event)} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// A faixa de dias, que rola para os seguintes: dia da semana, número, a previsão (quando houver) e as bolinhas dos eventos
function DayStrip({ today, selected, events, weather, onSelect }: {
  today: string;
  selected: string;
  events: CalendarEvent[];
  weather: WeatherOverview | null;
  onSelect: (iso: string) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const start = useMemo(() => {
    const first = addDays(parseIsoDate(today), -DAYS_BEFORE);
    // Se o dia escolhido (no mês) for anterior, a faixa começa nele
    return selected < toIsoDate(first) ? parseIsoDate(selected) : first;
  }, [today, selected]);
  const days = useMemo(() => {
    const total = Math.max(DAYS_BEFORE + DAYS_AFTER, Math.round((parseIsoDate(selected).getTime() - start.getTime()) / 86_400_000) + 8);
    return Array.from({ length: total }, (_, index) => addDays(start, index));
  }, [start, selected]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => map.set(event.date, [...(map.get(event.date) ?? []).filter((other) => other.id !== event.id), event]));
    return map;
  }, [events]);
  const forecastByDay = useMemo(() => new Map((weather?.days ?? []).map((day) => [day.date, day])), [weather]);

  // O dia escolhido sempre à vista na faixa
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    if (list && item) list.scrollTo({ left: item.offsetLeft - list.offsetLeft - list.clientWidth / 2 + item.clientWidth / 2, behavior: "smooth" });
  }, [selected]);

  return (
    <ol ref={listRef} aria-label="Dias" className="scrollbar-none -mx-4 mt-3 flex snap-x gap-1 overflow-x-auto px-4 sm:-mx-8 sm:px-8">
      {days.map((day) => {
        const iso = toIsoDate(day);
        const isSelected = iso === selected;
        const isToday = iso === today;
        const dayEvents = byDay.get(iso) ?? [];
        const forecast = forecastByDay.get(iso);
        return (
          <li key={iso} data-day={iso} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              aria-label={`${day.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}${dayEvents.length ? `, ${dayEvents.length} ${dayEvents.length === 1 ? "evento" : "eventos"}` : ""}`}
              className={`flex w-12 flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${isSelected ? "bg-stone-900 text-white" : iso < today ? "text-stone-400" : "text-stone-700"}`}
            >
              <span className={`text-[10px] ${isSelected ? "text-white/70" : "text-stone-400"}`}>{WEEKDAYS[day.getDay()]}</span>
              <span className={`text-base font-medium tabular-nums ${isToday && !isSelected ? "text-[#B8925F]" : ""}`}>{day.getDate()}</span>
              <span className="flex h-4 items-center">
                {forecast ? (
                  <WeatherIcon condition={forecast.condition} size={14} className={isSelected ? "text-white/80" : "text-stone-400"} />
                ) : null}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <span key={event.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: occasionOf(event.occasion).tone }} />
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
