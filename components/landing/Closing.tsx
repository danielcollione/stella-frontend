"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { CtaLink, LandingAsset, Reveal } from "@/components/landing/primitives";
import { SUPPORT_EMAIL } from "@/components/legal/LegalPage";
import { StellaMark } from "@/components/ui/StellaMark";

/** Chamada final: um cartão grande com imagem de fundo que cresce ao entrar na tela. */
export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);

  return (
    <section className="px-4 py-8 sm:px-6">
      <motion.div ref={ref} style={{ scale }} className="relative mx-auto flex min-h-[30rem] max-w-6xl items-center justify-center overflow-hidden rounded-[2.5rem] bg-stone-900 px-6 py-20 text-center">
        <motion.div style={{ scale: imageScale }} className="absolute inset-0">
          <LandingAsset name="closing.webp" tone="ink" alt="Guarda-roupa aberto e iluminado, com um chapéu na prateleira" className="h-full w-full opacity-70" />
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0 bg-stone-950/45" />
        <Reveal className="relative">
          <h2 className="mx-auto max-w-2xl font-serif text-4xl leading-[1.1] tracking-tight text-stone-50 sm:text-6xl">Seu próximo look já está <span className="font-light italic">no seu armário.</span></h2>
          <p className="mt-5 text-base font-light text-stone-200">Comece agora. É grátis para começar.</p>
          <CtaLink href="/login" tone="light" className="mt-8">Começar grátis</CtaLink>
          <p className="mt-6 text-xs text-stone-300/80">Sem cartão · No celular e no computador · Cancele quando quiser</p>
        </Reveal>
      </motion.div>
    </section>
  );
}

const PROMPTS = [
  "O que eu visto hoje?",
  "Tenho um casamento sábado à tarde",
  "Essa blusa combina com o quê?",
  "Vai chover: e agora?",
  "Monte uma mala para 4 dias de frio",
  "Quero parecer mais elegante no trabalho",
  "Quais cores me valorizam?",
  "O que falta no meu guarda-roupa?",
  "Primeiro encontro: o que usar?",
  "Look para entrevista de emprego",
  "Como usar mais essa saia?",
  "Jantar hoje às 20h",
];

/** Faixa de perguntas em movimento contínuo: duas linhas correndo da direita para a esquerda, em ritmos diferentes. */
export function PromptMarquee() {
  const half = Math.ceil(PROMPTS.length / 2);
  return (
    <section aria-labelledby="prompts-title" className="overflow-hidden py-16 sm:py-20">
      <Reveal className="px-6 text-center">
        <h2 id="prompts-title" className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Pergunte <span className="font-light italic">do seu jeito</span></h2>
        <p className="mt-3 text-base font-light text-stone-600">É uma conversa. Nada de formulários.</p>
      </Reveal>
      <div className="mt-12 space-y-4">
        <MarqueeRow prompts={PROMPTS.slice(0, half)} seconds={70} />
        <MarqueeRow prompts={PROMPTS.slice(half)} seconds={95} />
      </div>
    </section>
  );
}

function MarqueeRow({ prompts, seconds }: { prompts: string[]; seconds: number }) {
  return (
    <div className="stella-marquee flex w-max gap-4" style={{ "--stella-marquee-duration": `${seconds}s` } as CSSProperties}>
      {/* A lista é repetida para a volta ficar contínua; a cópia fica fora da leitura de tela */}
      {[0, 1].map((copy) => (
        <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-4">
          {prompts.map((prompt) => (
            <li key={prompt} className="whitespace-nowrap rounded-full border border-stone-200/80 bg-white px-6 py-3.5 font-serif text-lg italic text-stone-700 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">“{prompt}”</li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200/80 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-8">
        <div>
          <p className="flex items-center gap-2.5 font-serif text-3xl font-semibold italic text-stone-900"><StellaMark size={40} decorative />stella</p>
          <p className="mt-2 text-sm font-light text-stone-500">Estilista virtual com inteligência artificial e guarda-roupa virtual.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-7 gap-y-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          <Link href="/termos" className="transition-colors hover:text-stone-900">Termos de uso</Link>
          <Link href="/privacidade" className="transition-colors hover:text-stone-900">Privacidade</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-stone-900">Suporte</a>
          <Link href="/login" className="transition-colors hover:text-stone-900">Entrar</Link>
        </nav>
      </div>
    </footer>
  );
}
