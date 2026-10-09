"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { DRESS_CODES, OCCASIONS, todayIso } from "@/services/events/eventCatalog";
import type { CalendarEvent, DressCode, EventOccasion, EventRequest } from "@/types/events";

const fieldClass = "w-full rounded-lg border border-stone-200/90 bg-white px-3.5 py-3 text-sm text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100";
const labelClass = "mb-1.5 block text-xs font-medium text-stone-500";

type DressCodeOption = DressCode | "AUTO";
const DRESS_CODE_OPTIONS: readonly { value: DressCodeOption; label: string }[] = [
  { value: "AUTO", label: "Não sei — a Stella deduz" },
  ...DRESS_CODES,
];

interface FormState {
  title: string;
  occasion: EventOccasion | null;
  date: string;
  time: string;
  location: string;
  dressCode: DressCodeOption;
  notes: string;
}

export type EventFormSubmit = (request: EventRequest, options: { generateLook: boolean }) => void;

interface EventFormProps {
  event?: CalendarEvent; // edição; sem ele, criação
  defaultDate: string;
  busy: boolean;
  pending: "save" | "generate" | null;
  error?: string;
  onSubmit: EventFormSubmit;
  onCancel: () => void;
}

export function EventForm({ event, defaultDate, busy, pending, error, onSubmit, onCancel }: EventFormProps) {
  const editing = Boolean(event);
  const [form, setForm] = useState<FormState>(() => ({
    title: event?.title ?? "",
    occasion: event?.occasion ?? null,
    date: event?.date ?? defaultDate,
    time: event?.time?.slice(0, 5) ?? "",
    location: event?.location ?? "",
    dressCode: event?.dressCode ?? "AUTO",
    notes: event?.notes ?? "",
  }));
  const [validation, setValidation] = useState("");
  // Evento passado pode ser editado sem trocar a data; datas novas só a partir de hoje
  const minDate = editing && event!.date < todayIso() ? undefined : todayIso();

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidation("");
  }

  function submit(generateLook: boolean) {
    if (!form.title.trim()) return setValidation("Dê um nome ao evento.");
    if (!form.occasion) return setValidation("Escolha o tipo de ocasião.");
    if (!form.date) return setValidation("Informe a data do evento.");
    if (form.date < todayIso() && form.date !== event?.date) return setValidation("Escolha uma data a partir de hoje.");
    onSubmit({
      title: form.title.trim(),
      occasion: form.occasion,
      date: form.date,
      time: form.time || null,
      location: form.location.trim() || null,
      dressCode: form.dressCode === "AUTO" ? null : form.dressCode,
      notes: form.notes.trim() || null,
    }, { generateLook });
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    submit(!editing);
  }

  const message = validation || error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <fieldset disabled={busy} className="min-w-0 space-y-5 px-6 py-6 sm:px-7">
        <div>
          <label htmlFor="event-title" className={labelClass}>Nome do evento</label>
          <input id="event-title" value={form.title} onChange={(change) => update("title", change.target.value)} maxLength={120} placeholder="Ex: Casamento da Ana" className={`${fieldClass} font-serif text-base italic`} autoComplete="off" autoFocus={!editing} />
        </div>

        <div role="radiogroup" aria-labelledby="event-occasion-label">
          <span id="event-occasion-label" className={labelClass}>Ocasião</span>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map((occasion) => {
              const selected = form.occasion === occasion.value;
              return (
                <button
                  key={occasion.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("occasion", occasion.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-stone-300 ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"}`}
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: occasion.tone }} />
                  {occasion.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <div>
            <label htmlFor="event-date" className={labelClass}>Data</label>
            <input id="event-date" type="date" value={form.date} min={minDate} onChange={(change) => update("date", change.target.value)} className={`${fieldClass} min-h-12`} required />
          </div>
          <div>
            <label htmlFor="event-time" className={labelClass}>Horário <span className="text-stone-400">(opcional)</span></label>
            <input id="event-time" type="time" value={form.time} onChange={(change) => update("time", change.target.value)} className={`${fieldClass} min-h-12`} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-location" className={labelClass}>Local <span className="text-stone-400">(opcional)</span></label>
            <input id="event-location" value={form.location} onChange={(change) => update("location", change.target.value)} maxLength={160} placeholder="Ex: Fazenda Santa Bárbara, Itu" className={fieldClass} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="event-dress-code" className={labelClass}>Dress code</label>
            <Select id="event-dress-code" value={form.dressCode} onValueChange={(value) => update("dressCode", value)} options={DRESS_CODE_OPTIONS} disabled={busy} />
          </div>
        </div>

        <div>
          <label htmlFor="event-notes" className={labelClass}>Detalhes para a Stella <span className="text-stone-400">(opcional)</span></label>
          <textarea id="event-notes" value={form.notes} onChange={(change) => update("notes", change.target.value)} maxLength={600} rows={3} placeholder="Ex: cerimônia ao ar livre no fim da tarde, sou madrinha, quero usar meu vestido verde…" className={`${fieldClass} resize-none leading-relaxed`} />
        </div>
      </fieldset>

      {message && <p role="alert" className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 sm:mx-7">{message}</p>}

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200/70 px-6 py-4 sm:px-7">
        <button type="button" onClick={onCancel} disabled={busy} className="mr-auto rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">
          Cancelar
        </button>
        {editing ? (
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-60">
            {pending === "save" && <LoaderCircle size={14} className="animate-spin" />}
            Salvar alterações
          </button>
        ) : (
          <>
            <button type="button" onClick={() => submit(false)} disabled={busy} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">
              {pending === "save" && <LoaderCircle size={14} className="animate-spin" />}
              Só salvar
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-60">
              {pending === "generate" ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Salvar e montar o look
            </button>
          </>
        )}
      </footer>
    </form>
  );
}
