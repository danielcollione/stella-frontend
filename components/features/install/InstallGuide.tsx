"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Ellipsis, EllipsisVertical, Menu, Share, SquarePlus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StellaMark } from "@/components/ui/StellaMark";
import { lockPageScroll } from "@/utils/scrollLock";
import { canPromptInstall, detectInstallContext, externalBrowserUrl, promptInstall, setInstallGuideOpen, subscribeInstallPrompt } from "@/utils/installApp";
import type { InstallContext } from "@/utils/installApp";

const noSubscription = () => () => undefined;

/** Onde a pessoa está (null no computador ou com a Stella já aberta como aplicativo). Lido uma vez, no cliente. */
export function useInstallContext(): InstallContext | null {
  return useSyncExternalStore(noSubscription, detectInstallContext, () => null);
}

/** Android com a janela nativa de instalação disponível: um toque instala. */
export function useCanPromptInstall(): boolean {
  return useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);
}

// Ícone do botão citado no passo, desenhado no meio do texto: mais fácil de reconhecer do que a descrição
function Key({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="mx-0.5 inline-flex h-[22px] w-[22px] items-center align-middle justify-center rounded-md border border-stone-200 bg-white text-stone-800 shadow-2xs">
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

function steps({ os, browser, app }: InstallContext): ReactNode[] {
  const done = "O ícone da Stella aparece junto dos seus aplicativos.";
  if (browser === "in-app") {
    const where = app ? `do ${app}` : "deste app";
    const name = os === "ios" ? "Safari" : "Chrome";
    return [
      <>O navegador {where} não instala aplicativos: primeiro, abra a Stella no {name}.</>,
      <>Toque nos três pontinhos <Key icon={os === "ios" ? Ellipsis : EllipsisVertical} />, no canto de cima da tela.</>,
      <>Escolha “Abrir no navegador externo” (ou “Abrir no {name}”).</>,
      <>Lá, entre na sua conta: a Stella mostra os passos para instalar.</>,
    ];
  }
  if (browser === "safari") return [
    <>Toque no menu <Key icon={Ellipsis} />, ao lado do endereço, embaixo da tela.</>,
    <>Toque em Compartilhar <Key icon={Share} />.</>,
    <>Role a lista e escolha “Adicionar à Tela de Início” <Key icon={SquarePlus} />.</>,
    <>Confirme em “Adicionar”. {done}</>,
  ];
  if (browser === "ios-other") return [
    <>Toque em Compartilhar <Key icon={Share} />. No Chrome, ele fica ao lado do endereço; em outros navegadores, dentro do menu.</>,
    <>Escolha “Adicionar à Tela de Início” <Key icon={SquarePlus} /> (se não aparecer, toque em “Mais”).</>,
    <>Confirme em “Adicionar”. {done}</>,
    <>Não achou a opção? Abra a Stella no Safari e siga os mesmos passos por lá.</>,
  ];
  if (browser === "samsung") return [
    <>Toque no menu <Key icon={Menu} />, no canto de baixo da tela.</>,
    <>Escolha “Adicionar página a” e depois “Tela inicial”.</>,
    <>Confirme em “Adicionar”. {done}</>,
  ];
  return [
    <>Toque no menu <Key icon={EllipsisVertical} />, no canto de cima.</>,
    <>Escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</>,
    <>Confirme em “Instalar”. {done}</>,
  ];
}

/**
 * Janela no centro da tela com o passo a passo para instalar a Stella, conforme o celular e o navegador (ou o app) em
 * que ela está aberta. No Android, quando o navegador permite, "Instalar agora" abre a instalação nativa; dentro do
 * Instagram e afins, o botão tenta abrir a Stella no navegador do celular.
 */
export function InstallGuide({ context, onClose }: { context: InstallContext; onClose: () => void }) {
  const canPrompt = useCanPromptInstall();
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const inApp = context.browser === "in-app";
  const browserName = context.os === "ios" ? "Safari" : "Chrome";

  // Enquanto a janela está aberta, a página de trás não rola e o convite de avaliação espera; Esc fecha
  useEffect(() => {
    const unlock = lockPageScroll();
    setInstallGuideOpen(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      setInstallGuideOpen(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const install = async () => {
    if (await promptInstall()) onClose();
  };

  const primary = "rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800";
  const secondary = "rounded-full px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <motion.button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 cursor-default bg-stone-900/35 backdrop-blur-[2px]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[calc(100dvh-3rem)] w-full max-w-[400px] flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-[#FAF8F5] shadow-[0_24px_64px_rgba(28,25,23,0.22),0_4px_16px_rgba(28,25,23,0.06)]"
      >
        <div className="flex items-start gap-3 px-6 pb-4 pt-5">
          <StellaMark size={40} decorative className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-serif text-xl italic leading-snug tracking-tight text-stone-900">
              {inApp ? `Abra a Stella no ${browserName}` : "Leve a Stella para a tela inicial"}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
              {inApp
                ? `Pelo ${context.app ?? "navegador deste app"} não dá para instalar. No ${browserName}, a Stella vira um aplicativo no seu celular.`
                : "Abra como um aplicativo, em tela cheia, direto do ícone. Leva menos de um minuto."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" title="Fechar" className="stella-hit -mr-1.5 mt-0.5 shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-stone-200/70 px-6 py-5">
          {canPrompt && !inApp && (
            <p className="mb-4 text-sm leading-relaxed text-stone-600">Toque em “Instalar agora” e confirme. Se preferir, siga os passos:</p>
          )}
          <ol className="space-y-3.5">
            {steps(context).map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-7 text-stone-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-medium text-white">{index + 1}</span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stone-200/70 px-6 py-4">
          {inApp ? (
            <>
              <button type="button" onClick={onClose} className={secondary}>Agora não</button>
              <a href={externalBrowserUrl(context.os)} className={primary}>Abrir no {browserName}</a>
            </>
          ) : canPrompt ? (
            <>
              <button type="button" onClick={onClose} className={secondary}>Agora não</button>
              <button type="button" onClick={() => void install()} className={primary}>Instalar agora</button>
            </>
          ) : (
            <button type="button" onClick={onClose} className={primary}>Entendi</button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
