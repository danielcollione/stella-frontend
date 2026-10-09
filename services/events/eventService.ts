import { api } from "@/services/api";
import type { CalendarEvent, EventRequest } from "@/types/events";

const path = (id: string) => `/events/${encodeURIComponent(id)}`;

export const eventService = {
  // Eventos entre duas datas (inclusive), em ordem cronológica
  async list(from: string, to: string, signal?: AbortSignal): Promise<CalendarEvent[]> {
    const { data } = await api.get<CalendarEvent[]>("/events", { params: { from, to }, signal });
    return data;
  },

  async get(id: string, signal?: AbortSignal): Promise<CalendarEvent> {
    const { data } = await api.get<CalendarEvent>(path(id), { signal });
    return data;
  },

  async create(request: EventRequest): Promise<CalendarEvent> {
    const { data } = await api.post<CalendarEvent>("/events", request);
    return data;
  },

  async update(id: string, request: EventRequest): Promise<CalendarEvent> {
    const { data } = await api.put<CalendarEvent>(path(id), request);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(path(id));
  },

  // A Stella monta um look novo (conta como 1 mensagem do plano); devolve o evento com todos os looks
  async generateLook(id: string): Promise<CalendarEvent> {
    const { data } = await api.post<CalendarEvent>(`${path(id)}/looks`);
    return data;
  },

  async chooseLook(id: string, lookId: string): Promise<CalendarEvent> {
    const { data } = await api.put<CalendarEvent>(`${path(id)}/looks/${encodeURIComponent(lookId)}/choose`);
    return data;
  },
};
