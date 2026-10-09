import type { ClothingItem } from "@/types/wardrobe";

export type EventOccasion =
  | "WEDDING" | "PARTY" | "BIRTHDAY" | "DINNER" | "DATE"
  | "WORK" | "INTERVIEW" | "GRADUATION" | "TRAVEL" | "OTHER";

export type DressCode = "CASUAL" | "SMART_CASUAL" | "BUSINESS" | "COCKTAIL" | "FORMAL" | "BLACK_TIE";

// Espelha o EventLookDto do back-end
export interface EventLook {
  id: string;
  headline: string;
  analysis: string | null; // leitura do contexto (clima, horário, tipo real do evento) feita pela Stella
  styling: string; // markdown simples
  weatherSummary: string | null; // clima considerado na geração (ex: "29° às 12:00 · céu limpo · chuva 10%")
  items: ClothingItem[];
  basics: string[]; // básicos que a pessoa provavelmente já tem (não são compra)
  shoppingSuggestions: string[];
  createdAt: string | null;
}

// Espelha o EventResponseDto. `looks` só vem no detalhe do evento (null na listagem)
export interface CalendarEvent {
  id: string;
  title: string;
  occasion: EventOccasion;
  date: string; // AAAA-MM-DD
  time: string | null; // HH:mm:ss
  location: string | null;
  cityName: string | null; // cidade do evento; vazia = cidade do perfil
  cityCoordinates: string | null;
  dressCode: DressCode | null;
  notes: string | null;
  chosenLookId: string | null;
  lookCount: number;
  featuredLook: EventLook | null;
  looks: EventLook[] | null;
}

// Espelha o EventRequestDto
export interface EventRequest {
  title: string;
  occasion: EventOccasion;
  date: string;
  time: string | null;
  location: string | null;
  cityName: string | null;
  cityCoordinates: string | null;
  dressCode: DressCode | null;
  notes: string | null;
}
