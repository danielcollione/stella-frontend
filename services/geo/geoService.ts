import { api } from "@/services/api";

// Espelha o CitySuggestionDto do back-end (busca via Photon/OpenStreetMap, centralizada na API)
export interface CitySuggestion {
  name: string;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  label: string; // ex: "Jacarezinho, Paraná, Brasil"
  latitude: number;
  longitude: number;
}

// Mesmo formato aceito pelo back-end em cityCoordinates ("lat,lng")
export function toCoordinates(city: Pick<CitySuggestion, "latitude" | "longitude">): string {
  return `${city.latitude.toFixed(6)},${city.longitude.toFixed(6)}`;
}

export const geoService = {
  async searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
    const { data } = await api.get<CitySuggestion[]>("/geo/cities", { params: { q: query }, signal });
    return data;
  },

  async reverseCity(latitude: number, longitude: number, signal?: AbortSignal): Promise<CitySuggestion | null> {
    const { data } = await api.get<CitySuggestion[]>("/geo/cities/reverse", {
      params: { lat: latitude, lng: longitude },
      signal,
    });
    return data[0] ?? null;
  },
};
