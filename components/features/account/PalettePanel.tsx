"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LoaderCircle, Palette, Sparkles } from "lucide-react";
import { authService } from "@/services/authService";
import { saveChatDraft } from "@/utils/chatDraft";
import { uniqueId } from "@/utils/uniqueId";
import type { SavedPalette } from "@/types/chat";

type Loaded = { palette: SavedPalette | null } | null;

function usePalette() {
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    authService.getPalette(controller.signal)
      .then((palette) => setLoaded({ palette }))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return { loaded, setLoaded, failed };
}

// Linha "Minha paleta" na lista do Perfil: mostra a estação salva ou o convite para descobrir
export function PaletteRow({ onOpen }: { onOpen: () => void }) {
  const { loaded } = usePalette();
  const season = loaded?.palette?.season;
  return (
    <button type="button" onClick={onOpen} className="flex items-center gap-3 w-full rounded-lg border border-stone-200/70 bg-white px-4 py-3 text-left text-sm hover:bg-stone-50 transition-colors">
      <Palette size={18} className="shrink-0 text-stone-600" />
      <span className="min-w-0 flex-1">
        <span className="block">Minha paleta</span>
        <span className="block truncate text-xs text-stone-500">{loaded === null ? " " : season ?? "Ainda não definida"}</span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-stone-400" />
    </button>
  );
}

function ColorList({ title, colors }: { title: string; colors: string[] }) {
  if (colors.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-stone-500 mb-2">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <li key={color} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">{color}</li>
        ))}
      </ul>
    </div>
  );
}

// Seção "Minha paleta" do Perfil: a paleta salva, com a opção de apagar, ou o caminho para pedir uma análise
export function PalettePanel() {
  const router = useRouter();
  const { loaded, setLoaded, failed } = usePalette();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function clear() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await authService.clearPalette();
      setLoaded({ palette: null });
      setConfirming(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Nao foi possivel apagar sua paleta agora.");
    } finally {
      setDeleting(false);
    }
  }

  function askForAnalysis() {
    const conversation = uniqueId();
    saveChatDraft({
      conversation,
      before: "Quero descobrir minha coloração pessoal. Como devo tirar a foto para você analisar?",
      after: "",
      itemIds: [],
    });
    router.push(`/chat?new=${conversation}`);
  }

  if (failed) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Nao foi possivel carregar sua paleta.</p>;
  if (loaded === null) return <p role="status" className="flex justify-center py-10 text-stone-400"><LoaderCircle size={20} className="animate-spin" /></p>;

  const palette = loaded.palette;
  if (!palette) {
    return (
      <div className="border-y border-stone-200 py-8 text-center">
        <p className="font-serif text-lg italic text-stone-800">Você ainda não tem uma paleta salva.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
          Peça uma análise de coloração para a Stella. Quando ela terminar, você escolhe se quer salvar o resultado como a sua paleta.
        </p>
        <button type="button" onClick={askForAnalysis} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors">
          <Sparkles size={16} />Pedir uma análise
        </button>
      </div>
    );
  }

  const savedOn = palette.analyzedAt ? new Date(palette.analyzedAt).toLocaleDateString("pt-BR") : null;
  return (
    <div className="space-y-6">
      <div className="border-y border-stone-200 py-6 space-y-6">
        <div>
          <p className="font-serif text-2xl italic text-stone-900">{palette.season}</p>
          {savedOn && <p className="mt-1 text-xs text-stone-500">Salva em {savedOn}</p>}
          {palette.summary && <p className="mt-3 text-sm leading-relaxed text-stone-600">{palette.summary}</p>}
        </div>
        <ColorList title="Cores que valorizam" colors={palette.bestColors} />
        <ColorList title="Evitar perto do rosto" colors={palette.avoidColors} />
        {palette.metals && (
          <div>
            <p className="text-xs font-medium text-stone-500 mb-1">Metais</p>
            <p className="text-sm text-stone-700">{palette.metals}</p>
          </div>
        )}
      </div>
      <p className="text-xs leading-relaxed text-stone-500">
        A Stella usa essa paleta para escolher seus looks e sugestões de compra. Para trocar, peça uma nova análise no chat.
      </p>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {confirming ? (
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
          <p className="text-sm text-stone-800">Apagar sua paleta?</p>
          <p className="mt-1 text-xs text-stone-500">A Stella deixa de considerar suas cores nos looks e nas compras.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => void clear()} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50">
              {deleting && <LoaderCircle size={14} className="animate-spin" />}Apagar paleta
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className="rounded-lg px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50">Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-xs text-stone-400 underline decoration-stone-300 underline-offset-4 transition-colors hover:text-red-700 hover:decoration-red-300">
          Apagar minha paleta
        </button>
      )}
    </div>
  );
}
