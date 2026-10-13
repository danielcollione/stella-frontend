"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { authService } from "@/services/authService";
import type { UserResponseDto } from "@/types/auth";

/**
 * Confirmação de e-mail de quem se cadastrou por e-mail e senha. Não bloqueia nada: a pessoa confirma quando
 * quiser, pelo perfil, digitando o código de 6 números que recebeu.
 */
export function VerifyEmailDialog({ email, onClose, onVerified }: { email: string; onClose: () => void; onVerified: (user: UserResponseDto) => void }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<"verify" | "send" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = pending !== null;

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) return setError("O código tem 6 números.");
    setPending("verify");
    setError("");
    setNotice("");
    try {
      onVerified(await authService.verifyEmail(code));
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível confirmar o código.");
      setPending(null);
    }
  }

  async function sendAgain() {
    setPending("send");
    setError("");
    setNotice("");
    try {
      await authService.sendVerificationCode();
      setCode("");
      setNotice("Enviamos um novo código. Ele vale por 15 minutos.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível enviar o código agora.");
    } finally {
      setPending(null);
    }
  }

  return (
    <Modal open onClose={onClose} dismissible={!busy} title="Confirme o seu e-mail" description={`Digite o código de 6 números que enviamos para ${email}.`}>
      <form onSubmit={(event) => void verify(event)} className="px-6 py-6 sm:px-7">
        <label htmlFor="email-verification-code" className="sr-only">Código de confirmação</label>
        <input
          id="email-verification-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          disabled={busy}
          placeholder="000000"
          className="w-full max-w-64 rounded-lg border border-stone-200/90 bg-white px-4 py-3 text-center font-serif text-2xl tracking-[0.4em] text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-stone-300 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100"
        />
        <p className="mt-3 text-xs text-stone-500">
          Não encontrou? Confira a pasta de Spam ou Lixo eletrônico, ou{" "}
          <button type="button" onClick={() => void sendAgain()} disabled={busy} className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-600 disabled:opacity-50">
            {pending === "send" ? "enviando..." : "peça um novo código"}
          </button>.
        </p>

        {notice && <p role="status" className="mt-4 text-sm text-stone-600">{notice}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

        <div className="mt-7 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 disabled:opacity-50">Agora não</button>
          <button type="submit" disabled={busy || code.length !== 6} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40">
            {pending === "verify" && <LoaderCircle size={14} className="animate-spin" />}
            Confirmar
          </button>
        </div>
      </form>
    </Modal>
  );
}
