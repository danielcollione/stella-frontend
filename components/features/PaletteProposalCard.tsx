"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Check, LoaderCircle, Lock, Palette } from "lucide-react";
import { chatService } from "@/services/chat/chatService";
import type { PaletteProposal } from "@/types/chat";

// Abaixo da resposta com uma análise de coloração: a paleta só é salva se a pessoa quiser
export function PaletteProposalCard({ messageId, proposal }: { messageId: string; proposal: PaletteProposal }) {
  const [status, setStatus] = useState(proposal.status);
  const [planRequired, setPlanRequired] = useState(proposal.planRequired === true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (status === "DISMISSED") return null;

  if (status === "SAVED") {
    return (
      <Link href="/profile?view=palette" className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900">
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
        Paleta salva · {proposal.season}
      </Link>
    );
  }

  async function choose(save: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (save) await chatService.savePalette(messageId);
      else await chatService.dismissPalette(messageId);
      setStatus(save ? "SAVED" : "DISMISSED");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 402) setPlanRequired(true);
      else setError("Não consegui registrar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 shadow-2xs">
      <p className="flex items-center gap-2 text-sm font-medium text-stone-900">
        <Palette aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-500" />
        {proposal.replaces
          ? `Substituir sua paleta atual (${proposal.replaces}) por esta?`
          : "Salvar como sua paleta de cores?"}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
        Vou usar essas cores para escolher seus looks e sugestões de compra. Você pode alterar ou apagar quando quiser, no seu Perfil.
      </p>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {planRequired ? (
          <Link href="/planos" className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900">
            <Lock aria-hidden="true" className="h-3.5 w-3.5 text-stone-500" />
            Salvar sua paleta é do plano Atelier
          </Link>
        ) : (
          <button type="button" onClick={() => void choose(true)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-50">
            {busy ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Check aria-hidden="true" className="h-3.5 w-3.5" />}
            Salvar paleta
          </button>
        )}
        <button type="button" onClick={() => void choose(false)} disabled={busy} className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50">
          Agora não
        </button>
      </div>
    </div>
  );
}
