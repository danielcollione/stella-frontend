"use client";

import { useSyncExternalStore, useState } from "react";
import { ChevronRight, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

type Platform = "ios" | "android" | null;

// Só oferece a instalação em celular ou tablet e quando a Stella ainda não está aberta como aplicativo
function detectPlatform(): Platform {
  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || !window.matchMedia("(pointer: coarse)").matches) return null;
  const agent = navigator.userAgent;
  // iPad recente se identifica como Mac: o toque é o que o diferencia
  const ios = /iPhone|iPad|iPod/.test(agent) || (agent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "android";
}

const noSubscription = () => () => undefined;

const STEPS: Record<Exclude<Platform, null>, string[]> = {
  ios: [
    "Abra a Stella no Safari.",
    "Toque no botão Compartilhar (o quadrado com a seta para cima).",
    "Role a lista e escolha “Adicionar à Tela de Início”.",
    "Confirme em “Adicionar”. O ícone da Stella aparece junto dos seus aplicativos.",
  ],
  android: [
    "Abra a Stella no Chrome.",
    "Toque no menu de três pontinhos, no canto de cima.",
    "Escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.",
    "Confirme em “Instalar”. O ícone da Stella aparece junto dos seus aplicativos.",
  ],
};

/** Linha do perfil que ensina a instalar a Stella na tela inicial do celular. */
export function InstallAppRow() {
  const platform = useSyncExternalStore<Platform>(noSubscription, detectPlatform, () => null);
  const [open, setOpen] = useState(false);
  if (!platform) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-3 w-full rounded-lg border border-stone-200/70 bg-white px-4 py-3 text-left text-sm hover:bg-stone-50 transition-colors">
        <Smartphone size={18} className="shrink-0 text-stone-600" />
        <span className="min-w-0 flex-1">
          <span className="block">Instalar no celular</span>
          <span className="block truncate text-xs text-stone-500">Abra a Stella como um aplicativo, em tela cheia.</span>
        </span>
        <ChevronRight size={17} className="shrink-0 text-stone-400" />
      </button>
      {open && (
        <Modal open onClose={() => setOpen(false)} title="Instalar a Stella" description="Leva menos de um minuto e não ocupa espaço como um aplicativo de loja.">
          <div className="px-6 py-6 sm:px-7">
            <ol className="space-y-4">
              {STEPS[platform].map((step, index) => (
                <li key={step} className="flex gap-3.5 text-sm leading-relaxed text-stone-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-medium text-white">{index + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800">Entendi</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
