"use client";

import { useEffect, useState } from "react";
import { WeatherIcon } from "@/components/features/weather/WeatherIcon";
import { parseIsoDate } from "@/services/events/eventCatalog";
import { weatherService } from "@/services/weather/weatherService";
import type { WeatherOverview } from "@/services/weather/weatherService";

const RAIN_WORTH_SHOWING = 30; // % a partir do qual a chuva muda o que vestir

// "seg., 12 de out." -> "seg, 12 out"
function shortDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "").replace(" de ", " ");
}

/** Clima de hoje na cidade do perfil, em duas linhas discretas. Sem cidade ou sem previsão, não aparece. */
export function TodayWeather({ hasCity }: { hasCity: boolean }) {
  const [weather, setWeather] = useState<WeatherOverview | null>(null);

  useEffect(() => {
    if (!hasCity) return;
    const controller = new AbortController();
    weatherService.overview(controller.signal).then(setWeather).catch(() => undefined);
    return () => controller.abort();
  }, [hasCity]);

  const today = weather?.days[0];
  if (!hasCity || !weather || !today) return null;
  const rain = today.rainChance ?? 0;

  return (
    <div title={today.condition ?? undefined} aria-label={`Previsão de hoje em ${weather.place}`} className="stella-message-in min-w-0 leading-none">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {shortDate(today.date)}<span className="hidden sm:inline"> · {weather.place}</span>
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs tabular-nums text-stone-800">
        <WeatherIcon condition={today.condition} size={15} className="shrink-0 text-stone-500" />
        <span>{today.maxC}°<span className="ml-1 text-stone-400">{today.minC}°</span></span>
        {rain >= RAIN_WORTH_SHOWING && <span className="text-[11px] text-stone-400">· chuva {rain}%</span>}
        <span className="sr-only">{today.condition}</span>
      </p>
    </div>
  );
}
