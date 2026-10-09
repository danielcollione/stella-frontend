"use client";

import { CalendarPlus, Clock, MapPin, Shirt, Sparkles } from "lucide-react";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import { daysBetween, formatLongDate, formatTime, occasionOf, parseIsoDate, relativeDay, shortCity } from "@/services/events/eventCatalog";
import type { CalendarEvent, EventLook } from "@/types/events";

interface EventAgendaProps {
  today: string;
  selected: string;
  dayEvents: CalendarEvent[];
  upcoming: CalendarEvent[] | null;
  onOpen: (event: CalendarEvent) => void;
  onCreate: (dateIso: string) => void;
}

export function EventAgenda({ today, selected, dayEvents, upcoming, onOpen, onCreate }: EventAgendaProps) {
  const next = upcoming?.[0] ?? null;
  const later = (upcoming ?? []).filter((event) => event.id !== next?.id && event.date !== selected).slice(0, 6);
  const selectedIsPast = selected < today;

  return (
    <div className="flex flex-col gap-6">
      {next && <NextEventCard event={next} today={today} onOpen={() => onOpen(next)} />}

      <section aria-labelledby="agenda-day-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">{relativeDay(selected, today)}</p>
            <h2 id="agenda-day-title" className="mt-0.5 font-serif text-2xl italic tracking-tight text-stone-900">{formatLongDate(selected)}</h2>
          </div>
          {!selectedIsPast && dayEvents.length > 0 && (
            <button type="button" onClick={() => onCreate(selected)} aria-label="Novo evento neste dia" title="Novo evento neste dia" className="rounded-full border border-stone-200 bg-white p-2 text-stone-600 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900">
              <CalendarPlus size={16} />
            </button>
          )}
        </div>

        {dayEvents.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {dayEvents.map((event) => (
              <li key={event.id}><EventRow event={event} past={event.date < today} onOpen={() => onOpen(event)} /></li>
            ))}
          </ul>
        ) : selectedIsPast ? (
          <p className="rounded-2xl border border-dashed border-stone-200 px-5 py-6 text-center text-sm text-stone-400">Nenhum evento neste dia.</p>
        ) : (
          <button type="button" onClick={() => onCreate(selected)} className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-white/50 px-5 py-5 text-left transition-colors hover:border-stone-400 hover:bg-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition-colors group-hover:bg-stone-900 group-hover:text-white">
              <CalendarPlus size={17} strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-medium text-stone-800">Planejar um evento neste dia</span>
              <span className="mt-0.5 block text-xs text-stone-400">Conte onde você vai e a Stella monta o look.</span>
            </span>
          </button>
        )}
      </section>

      {later.length > 0 && (
        <section aria-labelledby="agenda-upcoming-title">
          <h2 id="agenda-upcoming-title" className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Em breve</h2>
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

// Destaque do próximo compromisso, com a contagem regressiva e o look planejado
function NextEventCard({ event, today, onOpen }: { event: CalendarEvent; today: string; onOpen: () => void }) {
  const look = event.featuredLook;
  const occasion = occasionOf(event.occasion);
  const days = Math.max(0, daysBetween(today, event.date));
  return (
    <button type="button" onClick={onOpen} className="group relative w-full overflow-hidden rounded-3xl bg-stone-900 p-5 text-left text-white shadow-[0_18px_40px_rgba(28,25,23,0.18)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] active:scale-[0.99]">
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-2xl" style={{ backgroundColor: occasion.tone }} />
      <span className="relative flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Próximo evento</span>
          <span className="mt-1.5 block truncate font-serif text-2xl italic leading-tight">{event.title}</span>
          <span className="mt-1 block text-xs text-stone-300">
            {formatLongDate(event.date)}{event.time ? ` · ${formatTime(event.time)}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-serif text-4xl leading-none tabular-nums">{days === 0 ? "Hoje" : days}</span>
          {days > 0 && <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-stone-400">{days === 1 ? "dia" : "dias"}</span>}
        </span>
      </span>
      <span className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        {look ? (
          <>
            <LookThumbs look={look} size="md" dark />
            <span className="min-w-0 flex-1 truncate text-right text-xs italic text-stone-300">“{look.headline}”</span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-stone-300">
            <Sparkles size={14} className="text-stone-200" />
            Toque para a Stella montar o look
          </span>
        )}
      </span>
    </button>
  );
}

function EventRow({ event, withDate, past, onOpen }: { event: CalendarEvent; withDate?: boolean; past?: boolean; onOpen: () => void }) {
  const occasion = occasionOf(event.occasion);
  const date = parseIsoDate(event.date);
  const time = formatTime(event.time);
  return (
    <button type="button" onClick={onOpen} className={`group flex w-full items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-[0_6px_18px_rgba(28,25,23,0.06)] focus-visible:ring-2 focus-visible:ring-stone-300 ${past ? "opacity-70" : ""}`}>
      {withDate ? (
        <span className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-[#FAF8F5] py-1.5">
          <span className="font-serif text-xl leading-none tabular-nums text-stone-900">{date.getDate()}</span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">{date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
        </span>
      ) : (
        <span aria-hidden="true" className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: occasion.tone }} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-stone-900">{event.title}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2.5 text-xs text-stone-400">
          <span className="shrink-0" style={{ color: occasion.tone }}>{occasion.label}</span>
          {time && <span className="inline-flex shrink-0 items-center gap-1"><Clock size={11} />{time}</span>}
          {(event.cityName || event.location) && (
            <span className="inline-flex min-w-0 items-center gap-1"><MapPin size={11} className="shrink-0" /><span className="truncate">{shortCity(event.cityName) ?? event.location}</span></span>
          )}
        </span>
      </span>
      {event.featuredLook ? (
        <LookThumbs look={event.featuredLook} size="sm" />
      ) : (
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-stone-500">Sem look</span>
      )}
    </button>
  );
}

// Miniaturas sobrepostas das peças do look (ou um ícone, se o look for só de sugestões de compra)
export function LookThumbs({ look, size, dark }: { look: EventLook; size: "sm" | "md"; dark?: boolean }) {
  const dimension = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const ring = dark ? "ring-stone-900" : "ring-white";
  const items = look.items.slice(0, 3);
  if (items.length === 0) {
    return (
      <span className={`flex ${dimension} shrink-0 items-center justify-center rounded-full ${dark ? "bg-white/10 text-stone-300" : "bg-stone-100 text-stone-400"}`} title={look.headline}>
        <Shirt size={15} strokeWidth={1.5} />
      </span>
    );
  }
  return (
    <span className="flex shrink-0 -space-x-2.5" title={look.headline}>
      {items.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={item.id} src={item.thumbnailUrl ?? item.imageUrl} alt={displayName(item)} loading="lazy" decoding="async" className={`${dimension} rounded-full bg-stone-100 object-cover ring-2 ${ring}`} />
      ))}
      {look.items.length > 3 && (
        <span className={`flex ${dimension} items-center justify-center rounded-full text-[10px] font-semibold ring-2 ${ring} ${dark ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-500"}`}>+{look.items.length - 3}</span>
      )}
    </span>
  );
}
