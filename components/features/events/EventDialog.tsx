"use client";

import { useEffect, useState } from "react";
import { Clock, LoaderCircle, MapPin, Pencil, RefreshCw, Shirt, Sparkles, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PlanLimitNotice } from "@/components/features/billing/PlanLimitNotice";
import { EventForm } from "@/components/features/events/EventForm";
import type { EventFormSubmit } from "@/components/features/events/EventForm";
import { EventLookView, GeneratingLook } from "@/components/features/events/EventLookView";
import { planLimitFrom } from "@/services/billing/billingService";
import { eventService } from "@/services/events/eventService";
import { dressCodeLabel, formatLongDate, formatTime, occasionOf, relativeDay, shortCity, todayIso } from "@/services/events/eventCatalog";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import type { CalendarEvent, EventLook } from "@/types/events";

export type EventDialogTarget = { kind: "create"; date: string } | { kind: "open"; event: CalendarEvent };

interface EventDialogProps {
  target: EventDialogTarget;
  onClose: () => void;
  onChanged: (event: CalendarEvent) => void;
  onDeleted: (id: string) => void;
}

type Problem = { message: string; planLimit: boolean } | null;

export function EventDialog({ target, onClose, onChanged, onDeleted }: EventDialogProps) {
  const [event, setEvent] = useState<CalendarEvent | null>(target.kind === "open" ? target.event : null);
  const [editing, setEditing] = useState(target.kind === "create");
  const [pending, setPending] = useState<"save" | "generate" | "choose" | "delete" | null>(null);
  const [formError, setFormError] = useState("");
  const [problem, setProblem] = useState<Problem>(null);
  const [lookIndex, setLookIndex] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);
  const busy = pending !== null;
  const eventId = target.kind === "open" ? target.event.id : null;

  // A agenda traz só o look em destaque; o histórico completo vem do detalhe
  useEffect(() => {
    if (!eventId) return;
    const controller = new AbortController();
    eventService.get(eventId, controller.signal)
      .then((detail) => {
        setEvent(detail);
        setLookIndex(Math.max(0, detail.looks?.findIndex((look) => look.id === detail.featuredLook?.id) ?? 0));
      })
      .catch(() => {
        if (!controller.signal.aborted) setDetailFailed(true);
      });
    return () => controller.abort();
  }, [eventId]);

  function failure(error: unknown, fallback: string) {
    const planLimit = planLimitFrom(error);
    setProblem(planLimit ? { message: planLimit.message, planLimit: true } : { message: apiErrorMessage(error, fallback), planLimit: false });
  }

  async function generate(current: CalendarEvent) {
    setProblem(null);
    setPending("generate");
    try {
      const updated = await eventService.generateLook(current.id);
      setEvent(updated);
      setLookIndex(0);
      onChanged(updated);
    } catch (error) {
      failure(error, "A Stella não conseguiu montar o look agora. Tente novamente em instantes.");
    } finally {
      setPending(null);
    }
  }

  const submit: EventFormSubmit = async (request, { generateLook }) => {
    setFormError("");
    setPending(generateLook ? "generate" : "save");
    try {
      const saved = event ? await eventService.update(event.id, request) : await eventService.create(request);
      setEvent(saved);
      setEditing(false);
      onChanged(saved);
      if (generateLook) {
        await generate(saved);
        return;
      }
    } catch (error) {
      const planLimit = planLimitFrom(error);
      setFormError(planLimit ? planLimit.message : apiErrorMessage(error, "Não foi possível salvar o evento. Tente novamente."));
    }
    setPending(null);
  };

  async function choose(look: EventLook) {
    if (!event) return;
    setPending("choose");
    try {
      const updated = await eventService.chooseLook(event.id, look.id);
      setEvent(updated);
      onChanged(updated);
    } catch (error) {
      failure(error, "Não foi possível escolher este look agora.");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!event) return;
    setPending("delete");
    try {
      await eventService.remove(event.id);
      onDeleted(event.id);
      onClose();
    } catch (error) {
      failure(error, "Não foi possível excluir o evento.");
      setPending(null);
      setConfirmingDelete(false);
    }
  }

  const title = editing ? (event ? "Editar evento" : "Novo evento") : event?.title ?? "";
  const description = editing
    ? event ? undefined : "Conte para a Stella aonde você vai; ela monta o look com o seu guarda-roupa."
    : event ? describeWhen(event) : undefined;

  return (
    <Modal open onClose={onClose} title={title} description={description} dismissible={!busy}>
      {editing || !event ? (
        <EventForm
          event={event ?? undefined}
          defaultDate={target.kind === "create" ? target.date : todayIso()}
          busy={busy}
          pending={pending === "save" || pending === "generate" ? pending : null}
          error={formError}
          onSubmit={(request, options) => void submit(request, options)}
          onCancel={() => (event ? setEditing(false) : onClose())}
        />
      ) : (
        <EventDetail
          event={event}
          detailFailed={detailFailed}
          pending={pending}
          problem={problem}
          lookIndex={lookIndex}
          confirmingDelete={confirmingDelete}
          onLookIndexChange={setLookIndex}
          onGenerate={() => void generate(event)}
          onChoose={(look) => void choose(look)}
          onEdit={() => { setProblem(null); setEditing(true); }}
          onAskDelete={setConfirmingDelete}
          onDelete={() => void remove()}
        />
      )}
    </Modal>
  );
}

function describeWhen(event: CalendarEvent): string {
  const time = formatTime(event.time);
  return [formatLongDate(event.date), time, relativeDay(event.date)].filter(Boolean).join(" · ");
}

function EventDetail({ event, detailFailed, pending, problem, lookIndex, confirmingDelete, onLookIndexChange, onGenerate, onChoose, onEdit, onAskDelete, onDelete }: {
  event: CalendarEvent;
  detailFailed: boolean;
  pending: "save" | "generate" | "choose" | "delete" | null;
  problem: Problem;
  lookIndex: number;
  confirmingDelete: boolean;
  onLookIndexChange: (index: number) => void;
  onGenerate: () => void;
  onChoose: (look: EventLook) => void;
  onEdit: () => void;
  onAskDelete: (value: boolean) => void;
  onDelete: () => void;
}) {
  const occasion = occasionOf(event.occasion);
  const past = event.date < todayIso();
  const looks = event.looks ?? (event.featuredLook ? [event.featuredLook] : []);
  const loadingLooks = event.looks === null && !detailFailed && event.lookCount > 0;
  const busy = pending !== null;
  const dressCode = dressCodeLabel(event.dressCode);

  return (
    <div className="flex flex-col">
      <div className="px-6 py-6 sm:px-7">
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-stone-700" style={{ backgroundColor: `${occasion.tone}33` }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: occasion.tone }} />{occasion.label}
          </span>
          {event.time && <Chip icon={<Clock size={12} />}>{formatTime(event.time)}</Chip>}
          {(event.cityName || event.location) && (
            <Chip icon={<MapPin size={12} />}>{[shortCity(event.cityName), event.location].filter(Boolean).join(" · ")}</Chip>
          )}
          {dressCode && <Chip icon={<Shirt size={12} />}>{dressCode}</Chip>}
        </div>
        {event.notes && <p className="mt-3 text-sm italic leading-relaxed text-stone-500">“{event.notes}”</p>}

        <div className="mt-6 rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:p-6">
          {pending === "generate" ? (
            <GeneratingLook />
          ) : loadingLooks ? (
            <div role="status" aria-label="Carregando looks" className="space-y-4">
              <div className="h-7 w-2/3 animate-pulse rounded-lg bg-stone-100" />
              <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-100" />)}</div>
            </div>
          ) : looks.length > 0 ? (
            <EventLookView
              looks={looks}
              index={Math.min(lookIndex, looks.length - 1)}
              chosenLookId={event.chosenLookId}
              choosing={pending === "choose"}
              onIndexChange={onLookIndexChange}
              onChoose={onChoose}
            />
          ) : past ? (
            <p className="py-6 text-center text-sm text-stone-400">Este evento já passou e não teve um look planejado.</p>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-700"><Sparkles size={20} strokeWidth={1.5} /></span>
              <p className="mt-4 font-serif text-xl italic text-stone-900">Que tal planejar o look?</p>
              <p className="mt-1 max-w-sm text-sm text-stone-500">A Stella combina peças do seu guarda-roupa com a ocasião e sugere o que faltar.</p>
              <button type="button" onClick={onGenerate} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-60">
                <Sparkles size={14} /> Montar meu look
              </button>
              <p className="mt-2 text-[11px] text-stone-400">Usa 1 mensagem do seu plano</p>
            </div>
          )}

          {problem && (
            <div className="mt-5">
              {problem.planLimit
                ? <PlanLimitNotice message={problem.message} compact />
                : <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{problem.message}</p>}
            </div>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-stone-200/70 bg-[#FAF8F5]/95 px-6 py-4 backdrop-blur-sm sm:px-7">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">Excluir este evento?</span>
            <button type="button" onClick={() => onAskDelete(false)} disabled={busy} className="rounded-full px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 disabled:opacity-50">Não</button>
            <button type="button" onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {pending === "delete" && <LoaderCircle size={14} className="animate-spin" />}
              Excluir
            </button>
          </div>
        ) : (
          <>
            <button type="button" onClick={onEdit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">
              <Pencil size={14} /> Editar
            </button>
            <button type="button" onClick={() => onAskDelete(true)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
              <Trash2 size={14} /> Excluir
            </button>
          </>
        )}
        {!past && looks.length > 0 && !confirmingDelete && (
          <div className="ml-auto flex flex-col items-end">
            <button type="button" onClick={onGenerate} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-60">
              <RefreshCw size={14} className={pending === "generate" ? "animate-spin" : ""} />
              Gerar outro look
            </button>
            <span className="mt-1 text-[10px] text-stone-400">Usa 1 mensagem do seu plano</span>
          </div>
        )}
      </footer>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-600">
      <span className="shrink-0 text-stone-400">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}
