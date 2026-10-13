"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { authService } from "@/services/authService";

const CONFIRM_WORD = "EXCLUIR";

/**
 * Exclusão da conta pela própria pessoa. Quem tem senha confirma com ela; quem entra pelo Google confirma
 * digitando a palavra. Não tem volta: peças, fotos, conversas e eventos são apagados e a assinatura é encerrada.
 */
export function DeleteAccountDialog({ hasPassword, onClose }: { hasPassword: boolean; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ready = hasPassword ? value.length > 0 : value.trim().toUpperCase() === CONFIRM_WORD;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || pending) return;
    setPending(true);
    setError("");
    try {
      // Em caso de sucesso, a sessão é encerrada e a pessoa volta para a página inicial
      await authService.deleteAccount(hasPassword ? value : undefined);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível excluir a conta agora.");
      setPending(false);
    }
  }

  return (
    <Modal open onClose={onClose} dismissible={!pending} title="Excluir a sua conta" description="Esta ação não pode ser desfeita.">
      <form onSubmit={(event) => void submit(event)} className="px-6 py-6 sm:px-7">
        <p className="text-sm leading-relaxed text-stone-600">
          Vamos apagar o seu guarda-roupa, as suas fotos, conversas e eventos, e encerrar a sua assinatura, se houver,
          sem reembolso do período já pago. As cópias de segurança são eliminadas em até 30 dias.
        </p>

        <label htmlFor="delete-account-confirmation" className="mt-5 block text-xs font-medium text-stone-600">
          {hasPassword ? "Para confirmar, digite a sua senha" : `Para confirmar, digite ${CONFIRM_WORD}`}
        </label>
        <input
          id="delete-account-confirmation"
          type={hasPassword ? "password" : "text"}
          autoComplete={hasPassword ? "current-password" : "off"}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          disabled={pending}
          className="mt-1.5 w-full rounded-lg border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100"
        />

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

        <div className="mt-7 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={pending} className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={!ready || pending} className="inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40">
            {pending && <LoaderCircle size={14} className="animate-spin" />}
            Excluir conta
          </button>
        </div>
      </form>
    </Modal>
  );
}
