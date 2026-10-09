"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Foto em tela cheia (a original, em tamanho real). Sobre o <dialog> nativo: funciona inclusive por cima de
 * outro modal (ex: a peça aberta do guarda-roupa). Fecha no X, no Esc ou tocando fora da foto.
 */
export function ImageViewer({ open, onClose, label, children }: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = useCallback(() => onClose(), [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 outline-none backdrop:bg-stone-950/85 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div onClick={(event) => { if (event.target === event.currentTarget) close(); }} className="flex h-full w-full items-center justify-center p-4 sm:p-10">
          <div className="pointer-events-none flex max-h-full max-w-full items-center justify-center transition-[opacity,scale] duration-200 starting:scale-95 starting:opacity-0 motion-reduce:transition-none [&>*]:pointer-events-auto">
            {children}
          </div>
          <button type="button" onClick={close} aria-label="Fechar" title="Fechar" className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
      )}
    </dialog>
  );
}
