"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ClothingItemForm } from "@/components/features/wardrobe/ClothingItemForm";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import { DuplicateClothingItemError, apiErrorMessage, wardrobeService } from "@/services/wardrobe/wardrobeService";
import type { ClothingItem } from "@/types/wardrobe";
import { compressImage } from "@/utils/imageCompression";
import { PlanLimitNotice } from "@/components/features/billing/PlanLimitNotice";
import { planLimitFrom } from "@/services/billing/billingService";

export type WardrobeDialogTarget = { kind: "create" } | { kind: "edit"; item: ClothingItem };

// Qualquer foto é aceita na escolha: o front converte para JPEG (inclusive HEIC do iPhone, quando o navegador
// decodifica). Depois da conversão, só seguem JPEG/PNG, que o back-end (ImageIO) lê.
const UPLOAD_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_BYTES = 25 * 1024 * 1024; // mesmo limite do back-end (spring.servlet.multipart.max-file-size)

type View =
  | { step: "pick"; error?: string; planLimit?: boolean }
  | { step: "analyzing"; file: File; previewUrl: string }
  | { step: "duplicate"; file: File; previewUrl: string; existing: ClothingItem; matchType: "SAME_PHOTO" | "SAME_GARMENT" }
  | { step: "form"; item: ClothingItem; isNew: boolean };

interface WardrobeItemDialogProps {
  target: WardrobeDialogTarget;
  onClose: () => void;
  onSaved: (item: ClothingItem) => void;
  onDeleted: (id: string) => void;
}

export function WardrobeItemDialog({ target, onClose, onSaved, onDeleted }: WardrobeItemDialogProps) {
  const [view, setView] = useState<View>(() =>
    target.kind === "edit" ? { step: "form", item: target.item, isNew: false } : { step: "pick" });
  const [formBusy, setFormBusy] = useState(false);
  const previewUrl = view.step === "analyzing" || view.step === "duplicate" ? view.previewUrl : null;

  // Libera a prévia local quando ela sai de cena
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const busy = view.step === "analyzing" || formBusy;

  async function upload(file: File, previewUrl: string, allowDuplicate: boolean) {
    setView({ step: "analyzing", file, previewUrl });
    try {
      const item = await wardrobeService.createItem(file, { allowDuplicate });
      onSaved(item);
      setView({ step: "form", item, isNew: true });
    } catch (failure) {
      if (failure instanceof DuplicateClothingItemError) {
        setView({ step: "duplicate", file, previewUrl, existing: failure.existingItem, matchType: failure.matchType });
        return;
      }
      // Guarda-roupa cheio no plano atual (402): convite para os planos em vez de erro
      const planLimit = planLimitFrom(failure);
      setView(planLimit
        ? { step: "pick", error: planLimit.message, planLimit: true }
        : { step: "pick", error: apiErrorMessage(failure, "Não foi possível analisar a foto. Tente novamente.") });
    }
  }

  async function selectFile(selected: File | undefined) {
    if (!selected) return;
    // A compressão leva ~1 s no celular: já mostra o estado de análise para ninguém tocar de novo
    setView({ step: "analyzing", file: selected, previewUrl: URL.createObjectURL(selected) });
    const file = await compressImage(selected);
    if (!UPLOAD_TYPES.includes(file.type)) {
      setView({ step: "pick", error: "Não conseguimos ler esse formato de foto. Tente uma foto em JPG ou PNG." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setView({ step: "pick", error: "A foto deve ter no máximo 25 MB." });
      return;
    }
    void upload(file, URL.createObjectURL(file), false);
  }

  const { title, description } = describe(view);

  return (
    <Modal open onClose={onClose} title={title} description={description} dismissible={!busy}>
      {view.step === "pick" && <PhotoPicker error={view.error} planLimit={view.planLimit} onSelect={selectFile} />}

      {view.step === "analyzing" && (
        <div className="flex flex-col items-center px-6 py-10 text-center sm:px-7">
          <div className="relative w-44 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view.previewUrl} alt="Foto enviada" className="aspect-[4/5] w-full object-cover opacity-80" />
            <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-t from-white/50 to-transparent" />
          </div>
          <p role="status" className="mt-5 inline-flex items-center gap-2 text-sm text-stone-600">
            <Sparkles size={15} className="animate-pulse text-stone-800" />
            A Stella está analisando a peça...
          </p>
          <p className="mt-1 text-xs text-stone-400">Isso leva alguns segundos.</p>
        </div>
      )}

      {view.step === "duplicate" && (
        <div className="px-6 py-6 sm:px-7">
          <div className="grid grid-cols-2 gap-4">
            <Thumb src={view.previewUrl} label="Foto enviada" />
            <Thumb src={view.existing.thumbnailUrl ?? view.existing.imageUrl} label={displayName(view.existing)} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-stone-600">
            {view.matchType === "SAME_PHOTO"
              ? "Esta foto já foi cadastrada no seu guarda-roupa."
              : "A Stella reconheceu esta peça no seu guarda-roupa, em outra foto."}
            {" "}Se você tem mais de uma peça igual, pode adicioná-la mesmo assim.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => void upload(view.file, view.previewUrl, true)} className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900">
              Adicionar mesmo assim
            </button>
            <button type="button" onClick={() => setView({ step: "form", item: view.existing, isNew: false })} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800">
              Ver peça existente
            </button>
          </div>
        </div>
      )}

      {view.step === "form" && (
        <ClothingItemForm
          key={view.item.id}
          item={view.item}
          isNew={view.isNew}
          onBusyChange={setFormBusy}
          onSaved={(item) => {
            onSaved(item);
            onClose();
          }}
          onDeleted={(id) => {
            onDeleted(id);
            onClose();
          }}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function describe(view: View): { title: string; description?: string } {
  switch (view.step) {
    case "pick":
      return { title: "Adicionar peça", description: "Envie uma foto e a Stella identifica categoria, cor e estilo." };
    case "analyzing":
      return { title: "Adicionar peça" };
    case "duplicate":
      return { title: "Peça já cadastrada" };
    case "form":
      return view.isNew
        ? { title: "Peça adicionada", description: "Confira o que a Stella identificou e ajuste se precisar." }
        : { title: "Editar peça" };
  }
}

function PhotoPicker({ error, planLimit, onSelect }: {
  error?: string; planLimit?: boolean; onSelect: (file: File | undefined) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void onSelect(event.dataTransfer.files[0]);
  }

  return (
    <div className="px-6 py-6 sm:px-7">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${dragging ? "border-stone-500 bg-white" : "border-stone-300 bg-white/60 hover:border-stone-400 hover:bg-white"}`}
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
          <ImagePlus size={20} strokeWidth={1.5} />
        </span>
        <span className="text-sm font-medium text-stone-800">Escolha uma foto ou arraste aqui</span>
        <span className="mt-1 text-xs text-stone-400">Fotos da galeria ou da câmera. Uma peça por foto funciona melhor.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          void onSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && (planLimit
        ? <div className="mt-4"><PlanLimitNotice message={error} compact /></div>
        : <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>)}
    </div>
  );
}

function Thumb({ src, label }: { src: string; label: string }) {
  return (
    <figure>
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="h-full w-full object-cover" />
      </div>
      <figcaption className="mt-2 truncate text-center text-[11px] font-medium uppercase tracking-[0.08em] text-stone-600">{label}</figcaption>
    </figure>
  );
}
