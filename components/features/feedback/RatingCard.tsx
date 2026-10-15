"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, X } from "lucide-react";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import { feedbackService } from "@/services/feedback/feedbackService";
import type { AppRating, RatingSource } from "@/types/feedback";

const EASE = [0.22, 1, 0.36, 1] as const;
const STAR_LABELS = ["Ruim", "Pode melhorar", "Boa", "Muito boa", "Excelente"];

/**
 * Avaliação da Stella: 5 estrelas e, depois de escolher, o comentário opcional (a pergunta muda com a nota). Depois de
 * enviar, um agradecimento curto e o cartão se fecha sozinho.
 */
export function RatingCard({ source, initial, onSaved, onClose, dismissLabel }: {
  source: RatingSource;
  initial: AppRating | null;
  onSaved: (rating: AppRating) => void;
  onClose: () => void;
  // Texto do link para fechar sem avaliar (ex: "Agora não"); sem ele, só o X
  dismissLabel?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [thanked, setThanked] = useState(false);
  const shown = hover || rating;
  const editing = Boolean(initial?.rating);

  useEffect(() => {
    if (!thanked) return;
    const timer = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(timer);
  }, [thanked, onClose]);

  const send = async () => {
    setSending(true);
    setError("");
    try {
      onSaved(await feedbackService.save(rating, comment, source));
      setThanked(true);
    } catch (failure) {
      setError(apiErrorMessage(failure, "Não foi possível enviar agora. Tente de novo."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-5 pb-5 pt-4">

      <AnimatePresence mode="wait" initial={false}>
        {thanked ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="py-3"
          >
            <p className="font-serif text-lg italic leading-snug text-stone-900">Obrigada pela sua avaliação!</p>
            <p className="mt-1 text-[13px] leading-relaxed text-stone-500">Sua opinião ajuda a Stella a ficar cada vez melhor.</p>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            {/* O X fica na mesma linha do título, com espaço entre os dois */}
            <div className="flex items-start justify-between gap-4">
              <p className="font-serif text-lg italic leading-snug text-stone-900">
                {editing ? "Sua avaliação da Stella" : "Como está sendo sua experiência com a Stella?"}
              </p>
              <button type="button" onClick={onClose} aria-label="Fechar" title="Fechar" className="stella-hit -mr-1.5 mt-0.5 shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3" onMouseLeave={() => setHover(0)}>
              <div role="radiogroup" aria-label="Nota de 1 a 5 estrelas" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}: ${STAR_LABELS[value - 1]}`}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    className="stella-hit rounded-full p-0.5 transition-transform active:scale-90"
                  >
                    <Star
                      size={28}
                      strokeWidth={1.4}
                      className={`transition-colors duration-150 ${value <= shown ? "fill-[#C9A27E] text-[#B8925F]" : "fill-transparent text-stone-300"}`}
                    />
                  </button>
                ))}
              </div>
              <span className="min-w-0 text-xs text-stone-500" aria-live="polite">{shown ? STAR_LABELS[shown - 1] : ""}</span>
            </div>

            <AnimatePresence initial={false}>
              {rating > 0 && (
                <motion.div
                  key="comment"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  <label className="mt-4 block text-[12px] text-stone-600">
                    {rating <= 3 ? "O que podemos melhorar?" : "O que você mais gosta?"} <span className="text-stone-400">(opcional)</span>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="mt-1.5 block w-full resize-none rounded-2xl border border-stone-200 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                      placeholder="Conte com suas palavras"
                    />
                  </label>
                  {error && <p role="alert" className="mt-2 text-xs text-[#8A4B32]">{error}</p>}
                  <div className="mt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={sending}
                      className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:scale-[0.98] disabled:opacity-60"
                    >
                      {sending ? "Enviando..." : editing ? "Salvar" : "Enviar"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {rating === 0 && dismissLabel && (
              <button type="button" onClick={onClose} className="stella-hit mt-3 text-xs text-stone-400 transition-colors hover:text-stone-700">
                {dismissLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
