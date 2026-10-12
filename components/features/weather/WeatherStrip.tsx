"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { WeatherIcon } from "@/components/features/weather/WeatherIcon";
import { parseIsoDate } from "@/services/events/eventCatalog";
import { weatherService } from "@/services/weather/weatherService";
import type { WeatherOverview } from "@/services/weather/weatherService";

const RAIN_WORTH_SHOWING = 30; // % a partir do qual a chuva muda o que vestir

function dayLabel(iso: string, today: string): string {
  if (iso === today) return "Hoje";
  return parseIsoDate(iso).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

/**
 * Faixa discreta com o clima da cidade do perfil: agora e os próximos dias. Sem previsão disponível, não aparece;
 * sem cidade no perfil, vira um convite para informá-la.
 */
export function WeatherStrip({ today, hasCity }: { today: string; hasCity: boolean }) {
  const [weather, setWeather] = useState<WeatherOverview | null>(null);

  useEffect(() => {
    if (!hasCity) return;
    const controller = new AbortController();
    weatherService.overview(controller.signal).then(setWeather).catch(() => undefined);
    return () => controller.abort();
  }, [hasCity]);

  if (!hasCity) {
    return (
      <p className="mb-6 flex items-center gap-2 text-xs text-stone-400">
        <MapPin size={13} aria-hidden="true" />
        <span>
          <Link href="/profile" className="font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900">Informe sua cidade no perfil</Link>
          {" "}para ver a previsão do tempo aqui.
        </span>
      </p>
    );
  }
  if (!weather) return null;

  return (
    <section aria-label={`Previsão do tempo em ${weather.place}`} className="mb-6 flex items-center gap-6 rounded-2xl border border-stone-200/80 bg-white/70 px-5 py-4 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <div className="min-w-0 shrink-0">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          <MapPin size={11} aria-hidden="true" />
          <span className="max-w-32 truncate">{weather.place}</span>
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          {weather.currentC !== null && <span className="font-serif text-3xl italic leading-none tracking-tight text-stone-900">{weather.currentC}°</span>}
          {weather.currentCondition && <span className="text-xs text-stone-500">{weather.currentCondition}</span>}
        </p>
      </div>

      <ul className="ml-auto flex gap-5 overflow-x-auto sm:gap-7">
        {weather.days.map((day) => (
          <li key={day.date} title={day.condition ?? undefined} className="flex shrink-0 flex-col items-center gap-1.5 text-center">
            <span className={`text-[11px] font-medium capitalize ${day.date === today ? "text-stone-900" : "text-stone-400"}`}>{dayLabel(day.date, today)}</span>
            <WeatherIcon condition={day.condition} size={18} className="text-stone-600" />
            <span className="text-xs tabular-nums text-stone-800">
              {day.maxC}°<span className="ml-1 text-stone-400">{day.minC}°</span>
            </span>
            {/* Linha sempre presente (invisível sem chuva) para os dias ficarem alinhados */}
            <span className={`text-[10px] tabular-nums leading-none text-stone-400 ${(day.rainChance ?? 0) >= RAIN_WORTH_SHOWING ? "" : "invisible"}`}>
              chuva {day.rainChance ?? 0}%
            </span>
            <span className="sr-only">{day.condition}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
