"use client";

import { useCallback, useEffect, useState } from "react";
import { useFeedback } from "@/components/features/feedback/FeedbackProvider";
import { InstallGuide, useInstallContext } from "@/components/features/install/InstallGuide";
import { onGoodMoment } from "@/utils/goodMoment";
import { wasInstalled } from "@/utils/installApp";

const STORAGE_KEY = "stella:install-card";
// Primeira visita e, enquanto a pessoa não instalar, de novo a cada dois dias (contados pelo calendário)
const INTERVAL_DAYS = 2;
// Depois do momento bom, um respiro antes do convite (no chat, a resposta da Stella aparece e é lida primeiro).
// Mais curto que o da avaliação, que espera esta janela fechar se as duas coincidirem
const SHOW_DELAY_MS = 2500;

const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);

function dueNow(): boolean {
  if (wasInstalled()) return false;
  try {
    const last = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    if (!last) return true;
    const days = Math.round((startOfDay(Date.now()) - startOfDay(last)) / 86_400_000);
    return days >= INTERVAL_DAYS;
  } catch {
    return true;
  }
}

function recordShow() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
  }
}

// Uma vez por abertura do app, mesmo trocando de tela
let shownThisVisit = false;

/**
 * Convite para instalar a Stella na tela inicial, só no iPhone e no Android: abre a janela de instalação logo depois do
 * primeiro momento bom da visita (resposta da Stella, peça salva, look escolhido), já na primeira visita e, enquanto a
 * pessoa não instalar, de novo a cada dois dias. Aberta dentro do Instagram (ou de outro app), a janela pede para ir
 * ao navegador antes. No Perfil, a linha "Instalar no celular" abre a mesma janela.
 */
export function InstallCard({ hidden }: { hidden: boolean }) {
  const context = useInstallContext();
  const { panelOpen } = useFeedback();
  const [goodMoment, setGoodMoment] = useState(false);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  // Não disputa a tela com o teclado, o menu ou a avaliação: espera eles saírem
  const blocked = hidden || panelOpen;

  useEffect(() => {
    if (!context || shownThisVisit || goodMoment) return;
    return onGoodMoment(() => setGoodMoment(true));
  }, [context, goodMoment]);

  useEffect(() => {
    if (!context || !goodMoment || blocked || shownThisVisit || !dueNow()) return;
    const timer = window.setTimeout(() => {
      shownThisVisit = true;
      recordShow();
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [context, goodMoment, blocked]);

  if (!context || !open) return null;
  return <InstallGuide context={context} onClose={close} />;
}
