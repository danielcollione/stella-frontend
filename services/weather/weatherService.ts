import { api } from "@/services/api";
import { readCache, writeCache } from "@/utils/screenCache";

// A previsão muda devagar: a última que chegou aparece na hora ao abrir outra tela (e a busca atualiza por trás)
const OVERVIEW_CACHE = "weather:overview";
const OVERVIEW_MAX_AGE_MS = 30 * 60 * 1000;

// Espelha o WeatherOverviewDto: clima da cidade do perfil, agora e nos próximos dias
export interface WeatherOverview {
  place: string;
  currentC: number | null;
  currentCondition: string | null;
  days: { date: string; minC: number | null; maxC: number | null; rainChance: number | null; condition: string | null }[];
}

// Espelha o DayWeatherDto: clima de uma data numa cidade
export interface DayWeather {
  historical: boolean; // data ainda sem previsão: o resumo é a média da época
  place: string;
  date: string;
  summary: string; // ex: "29° às 12:00 · céu limpo · chuva 10%"
  condition: string | null;
}

// O back-end responde 204 quando não há dados (cidade não informada, data passada, provedor fora do ar)
export const weatherService = {
  async overview(signal?: AbortSignal): Promise<WeatherOverview | null> {
    const response = await api.get<WeatherOverview>("/weather", { signal });
    const overview = response.status === 204 ? null : response.data;
    writeCache(OVERVIEW_CACHE, overview);
    return overview;
  },

  /** A última previsão que chegou nesta sessão (null se ainda não veio nenhuma). */
  cachedOverview(): WeatherOverview | null {
    return readCache<WeatherOverview | null>(OVERVIEW_CACHE, OVERVIEW_MAX_AGE_MS) ?? null;
  },

  async day(params: { date: string; time?: string; cityName?: string; cityCoordinates?: string }, signal?: AbortSignal): Promise<DayWeather | null> {
    const response = await api.get<DayWeather>("/weather/day", {
      params: {
        date: params.date,
        time: params.time || undefined,
        cityName: params.cityName || undefined,
        cityCoordinates: params.cityCoordinates || undefined,
      },
      signal,
    });
    return response.status === 204 ? null : response.data;
  },
};
