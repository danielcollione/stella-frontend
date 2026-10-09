import type { DressCode, EventOccasion } from "@/types/events";

// Tons discretos por ocasião (pontos do calendário e marcadores da agenda)
export const OCCASIONS: readonly { value: EventOccasion; label: string; tone: string }[] = [
  { value: "WEDDING", label: "Casamento", tone: "#C9A27E" },
  { value: "PARTY", label: "Festa", tone: "#A383A0" },
  { value: "BIRTHDAY", label: "Aniversário", tone: "#D4A373" },
  { value: "DINNER", label: "Jantar", tone: "#B07D72" },
  { value: "DATE", label: "Encontro", tone: "#C98B8B" },
  { value: "WORK", label: "Trabalho", tone: "#7D8CA3" },
  { value: "INTERVIEW", label: "Entrevista", tone: "#6E7F8D" },
  { value: "GRADUATION", label: "Formatura", tone: "#8C7A5B" },
  { value: "TRAVEL", label: "Viagem", tone: "#8FA58A" },
  { value: "OTHER", label: "Outro", tone: "#A8A29E" },
];

const OCCASION_BY_VALUE = new Map(OCCASIONS.map((occasion) => [occasion.value, occasion]));

export function occasionOf(value: EventOccasion) {
  return OCCASION_BY_VALUE.get(value) ?? OCCASIONS[OCCASIONS.length - 1];
}

export const DRESS_CODES: readonly { value: DressCode; label: string }[] = [
  { value: "CASUAL", label: "Casual" },
  { value: "SMART_CASUAL", label: "Esporte fino" },
  { value: "BUSINESS", label: "Traje de trabalho / passeio" },
  { value: "COCKTAIL", label: "Passeio completo / coquetel" },
  { value: "FORMAL", label: "Traje social / gala" },
  { value: "BLACK_TIE", label: "Black tie / traje a rigor" },
];

export function dressCodeLabel(value: DressCode | null): string | null {
  return value ? DRESS_CODES.find((code) => code.value === value)?.label ?? null : null;
}

// ---- Datas: o back-end usa AAAA-MM-DD (data local, sem fuso) ----

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()) / 86_400_000);
}

/** "hoje", "amanhã", "em 8 dias", "há 3 dias" */
export function relativeDay(dateIso: string, today = todayIso()): string {
  const days = daysBetween(today, dateIso);
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  return days > 0 ? `em ${days} dias` : `há ${-days} dias`;
}

export function formatLongDate(dateIso: string): string {
  const text = parseIsoDate(dateIso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

export function monthLabel(date: Date): { month: string; year: number } {
  return { month: date.toLocaleDateString("pt-BR", { month: "long" }), year: date.getFullYear() };
}

/** As 6 semanas exibidas no mês (domingo a sábado), como no calendário brasileiro. */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
