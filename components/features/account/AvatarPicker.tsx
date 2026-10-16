"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { authService } from "@/services/authService";
import type { UserResponseDto } from "@/types/auth";

/**
 * A bolinha do Perfil: tocar abre um menu pequeno para enviar uma foto ou tirar a atual. Sem edição: o servidor
 * guarda o quadrado do centro da foto.
 */
export function AvatarPicker({ user, onChange }: { user: UserResponseDto; onChange: (user: UserResponseDto) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<UserResponseDto>) {
    setOpen(false);
    setBusy(true);
    setError("");
    try {
      onChange(await action());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto w-fit">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={busy}
        aria-label="Mudar foto de perfil"
        aria-expanded={open}
        className="relative block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
      >
        <UserAvatar user={user} className="h-20 w-20 border-4 border-white text-2xl shadow-sm" />
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
            <LoaderCircle size={22} className="animate-spin text-stone-600" />
          </span>
        )}
        <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm">
          <Pencil size={13} />
        </span>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        aria-label="Escolher foto de perfil"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void run(() => authService.uploadAvatar(file));
        }}
      />

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="backdrop"
              type="button"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 cursor-default bg-transparent"
            />
            <motion.div
              key="menu"
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 origin-top overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 p-1.5 text-left shadow-[0_12px_32px_-12px_rgba(28,25,23,0.3)] backdrop-blur-md"
            >
              <button type="button" role="menuitem" onClick={() => { setOpen(false); fileRef.current?.click(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-800 transition-colors hover:bg-stone-100">
                <ImagePlus size={17} className="text-stone-500" />
                Enviar foto
              </button>
              {user.avatarUrl && (
                <button type="button" role="menuitem" onClick={() => void run(() => authService.removeAvatar())} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-800 transition-colors hover:bg-stone-100">
                  <Trash2 size={17} className="text-stone-500" />
                  Remover foto
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {error && <p role="alert" className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 text-center text-xs text-red-700">{error}</p>}
    </div>
  );
}
