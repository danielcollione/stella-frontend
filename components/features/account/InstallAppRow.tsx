"use client";

import { useCallback, useState } from "react";
import { ChevronRight, Smartphone } from "lucide-react";
import { InstallGuide, useInstallContext } from "@/components/features/install/InstallGuide";

/** Linha do perfil que ensina a instalar a Stella na tela inicial do celular. */
export function InstallAppRow() {
  const context = useInstallContext();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (!context) return null;

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
      {open && <InstallGuide context={context} onClose={close} />}
    </>
  );
}
