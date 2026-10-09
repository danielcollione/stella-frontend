"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Lock, Maximize2, Trash2 } from "lucide-react";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { Select } from "@/components/ui/Select";
import {
  CATEGORY_LABELS, CATEGORY_ORDER, FORMALITY_LABELS, FORMALITY_ORDER, STATUS_LABELS, displayName,
} from "@/services/wardrobe/wardrobeCatalog";
import { apiErrorMessage, wardrobeService } from "@/services/wardrobe/wardrobeService";
import type {
  ClothingCategory, ClothingFormality, ClothingItem, ClothingStatus, UpdateClothingItemRequest,
} from "@/types/wardrobe";

type FormalityOption = ClothingFormality | "NONE"; // Radix Select não aceita valor vazio

interface FormState {
  name: string;
  category: ClothingCategory;
  color: string;
  style: string;
  formality: FormalityOption;
  status: ClothingStatus;
}

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((value) => ({ value, label: CATEGORY_LABELS[value].singular }));
const FORMALITY_OPTIONS: { value: FormalityOption; label: string }[] = [
  { value: "NONE", label: "Não definida" },
  ...FORMALITY_ORDER.map((value) => ({ value, label: FORMALITY_LABELS[value] })),
];
const STATUS_ORDER: readonly ClothingStatus[] = ["AVAILABLE", "LAUNDRY", "ARCHIVED"];

const fieldClass = "w-full rounded-lg border border-stone-200/90 bg-white px-3.5 py-3 text-sm text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100";
const labelClass = "mb-1.5 block text-xs font-medium text-stone-500";

function toFormState(item: ClothingItem): FormState {
  return {
    name: item.name ?? "",
    category: item.category,
    color: item.color ?? "",
    style: item.style ?? "",
    formality: item.formality ?? "NONE",
    status: item.status,
  };
}

function toRequest(form: FormState): UpdateClothingItemRequest {
  const text = (value: string) => value.trim() || null;
  return {
    name: text(form.name),
    category: form.category,
    color: text(form.color),
    style: text(form.style),
    formality: form.formality === "NONE" ? null : form.formality,
    status: form.status,
  };
}

interface ClothingItemFormProps {
  item: ClothingItem;
  isNew?: boolean;
  onBusyChange: (busy: boolean) => void;
  onSaved: (item: ClothingItem) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}

export function ClothingItemForm({ item, isNew, onBusyChange, onSaved, onDeleted, onClose }: ClothingItemFormProps) {
  const [initial] = useState(() => toFormState(item));
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const busy = pending !== null;

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function run(kind: "save" | "delete", action: () => Promise<void>, fallback: string) {
    setPending(kind);
    onBusyChange(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError(apiErrorMessage(failure, fallback));
      setPending(null);
      onBusyChange(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty) {
      onClose();
      return;
    }
    void run("save", async () => {
      const saved = await wardrobeService.updateItem(item.id, toRequest(form));
      onBusyChange(false);
      onSaved(saved);
    }, "Não foi possível salvar as alterações. Tente novamente.");
  }

  function handleDelete() {
    void run("delete", async () => {
      await wardrobeService.deleteItem(item.id);
      onBusyChange(false);
      onDeleted(item.id);
    }, "Não foi possível excluir a peça. Tente novamente.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:px-7">
        <figure className="mx-auto w-40 sm:w-full">
          {/* Miniatura no formulário; tocar abre a foto original em tamanho real */}
          <button type="button" onClick={() => setViewerOpen(true)} aria-label="Ampliar foto" title="Ampliar foto" className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
            {/* URL pré-assinada do R2 (expira): <img> simples, sem o otimizador do Next */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnailUrl ?? item.imageUrl} alt={displayName(item)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 p-1.5 text-stone-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 size={14} />
            </span>
          </button>
          <ImageViewer open={viewerOpen} onClose={() => setViewerOpen(false)} label={displayName(item)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={displayName(item)} className="max-h-[calc(100dvh-5rem)] max-w-full rounded-xl object-contain shadow-2xl" />
          </ImageViewer>
          <figcaption className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 sm:justify-start">
            <Lock aria-hidden="true" size={11} />
            A foto não pode ser alterada
          </figcaption>
        </figure>

        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div>
            <label htmlFor="item-name" className={labelClass}>Nome</label>
            <input id="item-name" value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={255} placeholder="Ex: Camisa de linho" className={fieldClass} autoComplete="off" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-category" className={labelClass}>Categoria</label>
              <Select id="item-category" value={form.category} onValueChange={(value) => update("category", value)} options={CATEGORY_OPTIONS} disabled={busy} />
            </div>
            <div>
              <label htmlFor="item-formality" className={labelClass}>Formalidade</label>
              <Select id="item-formality" value={form.formality} onValueChange={(value) => update("formality", value)} options={FORMALITY_OPTIONS} disabled={busy} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-color" className={labelClass}>Cor</label>
              <input id="item-color" value={form.color} onChange={(event) => update("color", event.target.value)} maxLength={50} placeholder="Ex: azul marinho" className={fieldClass} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="item-style" className={labelClass}>Estilo</label>
              <input id="item-style" value={form.style} onChange={(event) => update("style", event.target.value)} maxLength={50} placeholder="Ex: casual" className={fieldClass} autoComplete="off" />
            </div>
          </div>

          <div role="radiogroup" aria-labelledby="item-status-label">
            <span id="item-status-label" className={labelClass}>Situação</span>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-stone-200/90 bg-white p-1">
              {STATUS_ORDER.map((status) => {
                const selected = form.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update("status", status)}
                    className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${selected ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"}`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>
      </div>

      {error && <p role="alert" className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 sm:mx-7">{error}</p>}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/70 px-6 py-4 sm:px-7">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">Excluir esta peça?</span>
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} className="rounded-full px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 disabled:opacity-50">
              Não
            </button>
            <button type="button" onClick={handleDelete} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {pending === "delete" && <LoaderCircle size={14} className="animate-spin" />}
              Excluir
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
            <Trash2 size={14} />
            Excluir peça
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">
            {isNew && !dirty ? "Concluir" : "Cancelar"}
          </button>
          {(!isNew || dirty) && (
            <button type="submit" disabled={busy || !dirty} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40">
              {pending === "save" && <LoaderCircle size={14} className="animate-spin" />}
              Salvar
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}
