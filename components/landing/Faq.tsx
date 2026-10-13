"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { FAQ_QUESTIONS } from "@/components/landing/faqData";
import { EASE, Reveal } from "@/components/landing/primitives";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="duvidas" className="scroll-mt-24 px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <h2 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Dúvidas? <span className="font-light italic">Eu respondo</span></h2>
          <p className="mt-3 text-base font-light text-stone-600">As perguntas mais comuns sobre a Stella.</p>
        </Reveal>
        <ul className="border-t border-stone-200">
          {FAQ_QUESTIONS.map((item, index) => {
            const expanded = open === index;
            return (
              <li key={item.question} className="border-b border-stone-200">
                <button type="button" onClick={() => setOpen(expanded ? null : index)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                  <span className="font-serif text-xl text-stone-900 sm:text-2xl">{item.question}</span>
                  <motion.span animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: 0.35, ease: EASE }} className="shrink-0 text-stone-500"><Plus size={20} strokeWidth={1.5} /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                      <p className="max-w-2xl pb-6 text-base font-light leading-relaxed text-stone-600">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
