"use client";

import { markGoodMoment } from "@/utils/goodMoment";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Link from "next/link";
import { AlertCircle, Check, ImagePlus, Info, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ClothingItemForm } from "@/components/features/wardrobe/ClothingItemForm";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import { DuplicateClothingItemError, apiErrorMessage, wardrobeService } from "@/services/wardrobe/wardrobeService";
import type { ClothingItem } from "@/types/wardrobe";
import { compressImage } from "@/utils/imageCompression";
import { PlanLimitNotice } from "@/components/features/billing/PlanLimitNotice";
import { billingService, planLimitFrom } from "@/services/billing/billingService";

// create com `file`: a foto já veio da câmera (botão do celular) e segue direto para a análise
export type WardrobeDialogTarget = { kind: "create"; file?: File } | { kind: "edit"; item: ClothingItem };

// Qualquer foto é aceita na escolha: o front converte para JPEG (inclusive HEIC do iPhone, quando o navegador
// decodifica). Depois da conversão, só seguem JPEG/PNG, que o back-end (ImageIO) lê.
const UPLOAD_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_BYTES = 25 * 1024 * 1024; // mesmo limite do back-end (spring.servlet.multipart.max-file-size)

const BULK_ENTITLEMENT = "wardrobe.bulk.max_photos"; // fotos por envio no plano (1 = uma por vez)
const BULK_PLAN_MESSAGE = "Adicionar várias peças de uma vez faz parte dos planos Atelier e Couture.";
// Fotos analisadas ao mesmo tempo: mais rápido que uma a uma, sem sobrecarregar a IA nem a conexão do celular
const BATCH_CONCURRENCY = 2;

// Uma foto do envio em lote. Cada foto é uma requisição própria, com o seu próprio resultado
interface BatchEntry {
  id: number;
  file: File;
  previewUrl: string;
  state: "queued" | "analyzing" | "done" | "duplicate" | "limit" | "error";
  item?: ClothingItem;
  message?: string;
}

type View =
  | { step: "pick"; error?: string; planLimit?: boolean }
  | { step: "batch"; notice?: string }
  | { step: "forms"; items: ClothingItem[]; index: number }
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

  // Envio em lote: o plano diz quantas fotos por vez (null = ainda não sabemos; o back-end decide)
  const [bulkMax, setBulkMax] = useState<number | null>(null);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const entriesRef = useRef<BatchEntry[]>([]);
  const closedRef = useRef(false);
  const creating = target.kind === "create";

  useEffect(() => {
    if (!creating) return;
    const controller = new AbortController();
    billingService.status(controller.signal)
      .then((status) => setBulkMax(Number(status.entitlements[BULK_ENTITLEMENT] ?? 1) || 1))
      .catch(() => undefined);
    return () => controller.abort();
  }, [creating]);

  useEffect(() => {
    // Em desenvolvimento o React monta, desmonta e monta de novo: sem religar aqui, o envio nunca começaria
    closedRef.current = false;
    return () => {
      closedRef.current = true;
      entriesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, []);

  const batchRunning = entries.some((entry) => entry.state === "queued" || entry.state === "analyzing");
  const busy = view.step === "analyzing" || formBusy || (view.step === "batch" && batchRunning);

  function patchEntry(id: number, patch: Partial<BatchEntry>) {
    entriesRef.current = entriesRef.current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
    setEntries(entriesRef.current);
  }

  function openForms() {
    const items = entriesRef.current.flatMap((entry) => (entry.state === "done" && entry.item ? [entry.item] : []));
    if (items.length === 0) onClose();
    else if (items.length === 1) setView({ step: "form", item: items[0], isNew: true });
    else setView({ step: "forms", items, index: 0 });
  }

  // Devolve false quando o envio em lote inteiro foi recusado pelo plano (a modal volta para a escolha da foto)
  async function processEntry(entry: BatchEntry, allowDuplicate: boolean): Promise<boolean> {
    patchEntry(entry.id, { state: "analyzing", message: undefined });
    try {
      const file = await compressImage(entry.file);
      if (!UPLOAD_TYPES.includes(file.type)) {
        patchEntry(entry.id, { state: "error", message: "Formato não suportado" });
        return true;
      }
      if (file.size > MAX_FILE_BYTES) {
        patchEntry(entry.id, { state: "error", message: "Foto acima de 25 MB" });
        return true;
      }
      const item = await wardrobeService.createItem(file, { allowDuplicate, batch: true });
      if (closedRef.current) return true;
      patchEntry(entry.id, { state: "done", item });
      onSaved(item);
    } catch (failure) {
      if (closedRef.current) return true;
      const planLimit = planLimitFrom(failure);
      if (failure instanceof DuplicateClothingItemError) {
        patchEntry(entry.id, { state: "duplicate", message: "Já está no guarda-roupa" });
      } else if (planLimit?.entitlementKey === BULK_ENTITLEMENT) {
        setView({ step: "pick", error: planLimit.message, planLimit: true });
        return false;
      } else if (planLimit) {
        // Guarda-roupa cheio: as fotos que ainda não foram enviadas também não cabem
        entriesRef.current = entriesRef.current.map((other) =>
          other.id === entry.id || other.state === "queued" ? { ...other, state: "limit", message: planLimit.message } : other);
        setEntries(entriesRef.current);
      } else {
        patchEntry(entry.id, { state: "error", message: "Não foi possível analisar" });
      }
    }
    return true;
  }

  async function startBatch(files: File[]) {
    const limit = bulkMax ?? files.length;
    const accepted = files.slice(0, limit);
    entriesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    entriesRef.current = accepted.map((file, id) => ({ id, file, previewUrl: URL.createObjectURL(file), state: "queued" }));
    setEntries(entriesRef.current);
    setView({
      step: "batch",
      notice: files.length > limit ? `Enviamos as ${limit} primeiras fotos: esse é o máximo por vez no seu plano.` : undefined,
    });

    let refused = false;
    async function worker() {
      for (;;) {
        const next = entriesRef.current.find((entry) => entry.state === "queued");
        if (!next || refused || closedRef.current) return;
        if (!(await processEntry(next, false))) refused = true;
      }
    }
    await Promise.all(Array.from({ length: BATCH_CONCURRENCY }, worker));
    if (refused || closedRef.current) return;
    // Tudo certo: segue direto para a conferência. Se alguma foto ficou de fora, a pessoa vê o motivo antes
    if (entriesRef.current.every((entry) => entry.state === "done")) openForms();
  }

  function selectFiles(files: File[]) {
    if (files.length <= 1) {
      void selectFile(files[0]);
      return;
    }
    if (bulkMax !== null && bulkMax <= 1) {
      setView({ step: "pick", error: BULK_PLAN_MESSAGE, planLimit: true });
      return;
    }
    void startBatch(files);
  }

  async function upload(file: File, previewUrl: string, allowDuplicate: boolean) {
    setView({ step: "analyzing", file, previewUrl });
    try {
      const item = await wardrobeService.createItem(file, { allowDuplicate });
      onSaved(item);
      setView({ step: "form", item, isNew: true });
      markGoodMoment();
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

  // Foto tirada pela câmera antes de a janela abrir: começa a análise na hora (uma vez só, mesmo se o React
  // montar a janela duas vezes em desenvolvimento)
  const cameraFile = target.kind === "create" ? target.file : undefined;
  const cameraStarted = useRef(false);
  useEffect(() => {
    if (!cameraFile || cameraStarted.current) return;
    cameraStarted.current = true;
    void selectFile(cameraFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só a foto da abertura
  }, [cameraFile]);

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
    <Modal open onClose={onClose} title={title} description={description} dismissible={!busy} scrollBody={view.step !== "form" && view.step !== "forms"}>
      {view.step === "pick" && <PhotoPicker error={view.error} planLimit={view.planLimit} bulkMax={bulkMax} onSelect={selectFiles} />}

      {view.step === "batch" && (
        <BatchProgress
          entries={entries}
          running={batchRunning}
          notice={view.notice}
          onAddAnyway={(entry) => void processEntry(entry, true)}
          onContinue={openForms}
        />
      )}

      {/* Várias peças: o mesmo formulário, uma peça por vez, com setas e "Salvar 1/3" */}
      {view.step === "forms" && (
        <ClothingItemForm
          key={view.items[view.index].id}
          item={view.items[view.index]}
          isNew
          pager={{
            position: view.index + 1,
            total: view.items.length,
            onStep: (delta, saved) => {
              if (saved) onSaved(saved);
              setView({ ...view, items: withSaved(view.items, saved), index: view.index + delta });
            },
          }}
          onBusyChange={setFormBusy}
          onPhotoChanged={(updated) => {
            onSaved(updated);
            setView({ ...view, items: withSaved(view.items, updated) });
          }}
          onSaved={(saved) => {
            onSaved(saved);
            if (view.index === view.items.length - 1) onClose();
            else setView({ ...view, items: withSaved(view.items, saved), index: view.index + 1 });
          }}
          onDeleted={(id) => {
            onDeleted(id);
            const remaining = view.items.filter((other) => other.id !== id);
            if (remaining.length === 0) onClose();
            else setView({ ...view, items: remaining, index: Math.min(view.index, remaining.length - 1) });
          }}
          // "Salvar 2/3" sem alterações: só passa para a próxima (ou encerra, na última)
          onClose={() => {
            if (view.index === view.items.length - 1) onClose();
            else setView({ ...view, index: view.index + 1 });
          }}
        />
      )}

      {view.step === "analyzing" && (
        <div className="flex flex-col items-center px-6 py-10 text-center sm:px-7">
          <div className="relative w-44 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view.previewUrl} alt="Foto enviada" className="aspect-[4/5] w-full object-cover opacity-80" />
            <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-t from-white/50 to-transparent" />
          </div>
          <p role="status" className="mt-5 inline-flex items-center gap-2 text-sm text-stone-600">
            <Sparkles size={15} className="animate-pulse text-stone-800" />
            A Stella está analisando a peça e preparando a foto...
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
          onPhotoChanged={onSaved}
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

function withSaved(items: ClothingItem[], saved?: ClothingItem): ClothingItem[] {
  return saved ? items.map((item) => (item.id === saved.id ? saved : item)) : items;
}

// A análise automática fez uma pausa (trava de segurança no back-end): a foto entra e a pessoa preenche os dados
const MANUAL_DETAILS = {
  title: "Complete os detalhes",
  description: "A Stella já analisou muitas peças suas nos últimos dias e precisa de uma pausa até amanhã. A foto foi salva: preencha os detalhes da peça.",
};

function describe(view: View): { title: string; description?: string } {
  switch (view.step) {
    case "pick":
      return { title: "Adicionar peça", description: "Envie uma foto e a Stella identifica categoria, cor e estilo." };
    case "analyzing":
      return { title: "Adicionar peça" };
    case "batch":
      return { title: "Adicionar peças" };
    case "forms":
      return view.items[view.index].analysisSkipped
        ? MANUAL_DETAILS
        : { title: "Peças adicionadas", description: "Confira o que a Stella identificou e ajuste se precisar." };
    case "duplicate":
      return { title: "Peça já cadastrada" };
    case "form":
      if (view.isNew && view.item.analysisSkipped) return MANUAL_DETAILS;
      return view.isNew
        ? { title: "Peça adicionada", description: "Confira o que a Stella identificou e ajuste se precisar." }
        : { title: "Editar peça" };
  }
}

function PhotoPicker({ error, planLimit, bulkMax, onSelect }: {
  error?: string; planLimit?: boolean; bulkMax: number | null; onSelect: (files: File[]) => void;
}) {
  const bulk = bulkMax !== null && bulkMax > 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    onSelect(Array.from(event.dataTransfer.files));
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
        <span className="text-sm font-medium text-stone-800">{bulk ? "Escolha as fotos ou arraste aqui" : "Escolha uma foto ou arraste aqui"}</span>
        <span className="mt-1 text-xs text-stone-400">
          {bulk ? `Até ${bulkMax} fotos por vez.` : "Fotos da galeria ou da câmera."}
        </span>
      </button>
      {/* A Stella tira o fundo e guarda o que estiver em primeiro plano: várias peças na mesma foto viram uma só */}
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#F1E9DC]/60 px-3.5 py-2.5 text-xs leading-relaxed text-stone-600">
        <Info aria-hidden="true" size={14} className="mt-px shrink-0 text-stone-500" />
        <span><span className="font-medium text-stone-800">Recomendado: uma peça por foto.</span> Sozinha no enquadramento, a Stella reconhece melhor a peça e tira o fundo certinho.</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple={bulk}
        className="sr-only"
        tabIndex={-1}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onSelect(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      {error && (planLimit
        ? <div className="mt-4"><PlanLimitNotice message={error} compact /></div>
        : <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>)}
      {!error && bulkMax !== null && !bulk && (
        <p className="mt-4 text-center text-xs text-stone-400">
          Nos planos Atelier e Couture você adiciona várias peças de uma vez.{" "}
          <Link href="/planos" className="font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900">Conhecer os planos</Link>
        </p>
      )}
    </div>
  );
}

function BatchProgress({ entries, running, notice, onAddAnyway, onContinue }: {
  entries: BatchEntry[]; running: boolean; notice?: string;
  onAddAnyway: (entry: BatchEntry) => void; onContinue: () => void;
}) {
  const finished = entries.filter((entry) => entry.state !== "queued" && entry.state !== "analyzing").length;
  const added = entries.filter((entry) => entry.state === "done").length;
  const limitMessage = entries.find((entry) => entry.state === "limit")?.message;

  return (
    <div className="px-6 py-6 sm:px-7">
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {entries.map((entry) => {
          const waiting = entry.state === "queued" || entry.state === "analyzing";
          const skipped = !waiting && entry.state !== "done";
          return (
            <li key={entry.id}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.previewUrl} alt="Foto enviada" className={`h-full w-full object-cover transition-opacity ${entry.state === "done" ? "" : "opacity-60"}`} />
                {entry.state === "analyzing" && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-t from-white/60 to-transparent" />}
                {entry.state === "done" && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-stone-900 p-1 text-white shadow-sm"><Check size={11} strokeWidth={2.5} /></span>
                )}
                {skipped && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-white/95 p-1 text-stone-500 shadow-sm"><AlertCircle size={11} /></span>
                )}
              </div>
              <p className="mt-1.5 text-center text-[11px] leading-snug text-stone-500">
                {entry.state === "queued" && "Na fila"}
                {entry.state === "analyzing" && "Analisando..."}
                {entry.state === "done" && "Adicionada"}
                {entry.state === "limit" && "Limite do plano"}
                {(entry.state === "duplicate" || entry.state === "error") && entry.message}
              </p>
              {entry.state === "duplicate" && !running && (
                <button type="button" onClick={() => onAddAnyway(entry)} className="mx-auto mt-0.5 block text-[11px] font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900">
                  Adicionar mesmo assim
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {running ? (
        <div className="mt-6 text-center">
          <p role="status" className="inline-flex items-center gap-2 text-sm text-stone-600">
            <Sparkles size={15} className="animate-pulse text-stone-800" />
            A Stella está analisando as peças... {finished} de {entries.length}
          </p>
          <p className="mt-1 text-xs text-stone-400">Cada foto leva alguns segundos. Não feche esta janela.</p>
        </div>
      ) : (
        <>
          <p role="status" className="mt-6 text-sm leading-relaxed text-stone-600">
            {added === 0 ? "Nenhuma peça foi adicionada." : `${added} de ${entries.length} peças foram adicionadas.`}
            {added < entries.length && " As outras fotos ficaram de fora pelo motivo indicado em cada uma."}
          </p>
          {limitMessage && <div className="mt-4"><PlanLimitNotice message={limitMessage} compact /></div>}
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onContinue} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800">
              {added === 0 ? "Fechar" : added === 1 ? "Conferir a peça" : `Conferir as ${added} peças`}
            </button>
          </div>
        </>
      )}
      {notice && <p className="mt-4 text-xs text-stone-400">{notice}</p>}
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
