"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const previouslyFocused = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  field.style.fontSize = "16px";
  document.body.appendChild(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
  } finally {
    field.remove();
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
  }
}

export function CopyMessageButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"copied" | "error" | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copying = useRef(false);
  const mounted = useRef(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  async function handleCopy() {
    if (!text || copying.current) return;
    copying.current = true;
    if (timeout.current) clearTimeout(timeout.current);
    try {
      await copyText(text);
      if (mounted.current) setStatus("copied");
    } catch {
      if (mounted.current) setStatus("error");
    } finally {
      copying.current = false;
      if (mounted.current) timeout.current = setTimeout(() => setStatus(null), 2000);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!text}
        aria-label="Copiar mensagem da Stella"
        title="Copiar mensagem"
        className={`p-1.5 hover:text-stone-700 hover:bg-stone-200/50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${status === "copied" ? "text-stone-900" : "text-stone-400"}`}
      >
        {status === "copied" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence>
        {status && (
          <motion.span
            key={status}
            role="status"
            aria-live="polite"
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
            className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 whitespace-nowrap rounded-lg border border-stone-200/80 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm"
          >
            {status === "copied" ? "Copiado!" : "Nao foi possivel copiar"}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}