"use client";

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { CalendarHeart, CloudSun, Sparkles } from "lucide-react";
import { CtaLink, EASE, Eyebrow, LandingAsset, PhoneFrame, Reveal } from "@/components/landing/primitives";
import { StellaMark } from "@/components/ui/StellaMark";
import type { AssetTone } from "@/components/landing/primitives";

const HEADLINE = ["Uma", "IA", "que", "cuida", "do", "seu", "estilo"];
const HEADLINE_ACCENT = ["e", "do", "seu", "guarda-roupa"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.5 });
  const phoneY = useTransform(progress, [0, 1], [0, -70]);
  const phoneScale = useTransform(progress, [0, 1], [1, 0.93]);

  return (
    <section ref={ref} className="relative px-4 pb-4 pt-28 sm:pt-32">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal><Eyebrow>Sua estilista pessoal com IA</Eyebrow></Reveal>
        <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.08] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
          {HEADLINE.map((word, index) => <Word key={index} delay={0.1 + index * 0.06}>{word}</Word>)}
          <br className="hidden sm:block" />
          <span className="font-light italic">
            {HEADLINE_ACCENT.map((word, index) => <Word key={index} delay={0.52 + index * 0.07}>{word}</Word>)}
          </span>
        </h1>
        <Reveal delay={0.55}>
          <p className="mx-auto mt-6 max-w-xl text-base font-light leading-relaxed text-stone-600 sm:text-lg">
            Eu conheço cada peça do seu guarda-roupa, olho a previsão do tempo e a sua agenda, e monto o look certo antes mesmo de você perguntar.
          </p>
        </Reveal>
        <Reveal delay={0.7}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CtaLink href="/login">Começar grátis</CtaLink>
            <a href="#recursos" onClick={(event) => { event.preventDefault(); document.querySelector("#recursos")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full px-5 py-3 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
              Ver como funciona
            </a>
          </div>
        </Reveal>
      </div>

      {/* Palco: o celular no centro e as peças "flutuando" em volta, cada uma em um ritmo ao rolar.
          As quatro peças aparecem de tablet para cima; no celular ficam só o aparelho e as duas etiquetas */}
      <div className="relative mx-auto mt-20 h-[600px] max-w-5xl sm:mt-12">
        <FloatingPiece progress={progress} name="piece-01.webp" tone="sand" label="Blazer de linho" depth={1.4} className="left-[2%] top-[14%] hidden w-36 -rotate-6 md:block" delay={0.9} />
        <FloatingPiece progress={progress} name="piece-02.webp" tone="clay" label="Saia midi caramelo" depth={0.8} className="left-[4%] top-[58%] hidden w-28 rotate-3 md:block lg:left-[10%] lg:w-32" delay={1.05} />
        <FloatingPiece progress={progress} name="piece-03.webp" tone="olive" label="Mule de couro" depth={1.1} className="right-[3%] top-[20%] hidden w-32 rotate-6 md:block" delay={1.0} />
        <FloatingPiece progress={progress} name="piece-04.webp" tone="rose" label="Bolsa estruturada" depth={1.7} className="right-[4%] top-[60%] hidden w-28 -rotate-3 md:block lg:right-[11%] lg:w-36" delay={1.15} />
        <FloatingChip progress={progress} depth={0.9} className="-top-11 left-[4%] sm:left-[22%] sm:top-[2%]" delay={1.25}><CloudSun size={14} className="text-amber-600" />24° · sol em São Paulo</FloatingChip>
        <FloatingChip progress={progress} depth={1.1} className="-top-11 right-[4%] sm:right-[21%] sm:top-[9%]" delay={1.35}><CalendarHeart size={14} className="text-rose-500" />Jantar às 20h</FloatingChip>

        <motion.div style={{ y: phoneY, scale: phoneScale }} className="absolute left-1/2 top-6 z-10 w-[300px] -translate-x-1/2 sm:w-[320px]">
          <motion.div initial={{ opacity: 0, y: 90 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.5, ease: EASE }}>
            <PhoneFrame className="h-[580px]">
              <HeroChat />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Word({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
      <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay, ease: EASE }}>
        {children}&nbsp;
      </motion.span>
    </span>
  );
}

function FloatingPiece({ progress, name, tone, label, depth, className, delay }: {
  progress: MotionValue<number>; name: string; tone: AssetTone; label: string; depth: number; className: string; delay: number;
}) {
  const y = useTransform(progress, [0, 1], [0, -140 * depth]);
  return (
    <motion.div style={{ y }} className={`absolute ${className}`}>
      <motion.figure
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
        className="rounded-2xl border border-stone-200/80 bg-white p-2 shadow-[0_18px_40px_-12px_rgba(28,25,23,0.22)]"
      >
        <LandingAsset name={name} tone={tone} className="aspect-[4/5] w-full rounded-xl" priority />
        <figcaption className="px-1 pb-0.5 pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-stone-600">{label}</figcaption>
      </motion.figure>
    </motion.div>
  );
}

function FloatingChip({ progress, depth, className, delay, children }: {
  progress: MotionValue<number>; depth: number; className: string; delay: number; children: React.ReactNode;
}) {
  const y = useTransform(progress, [0, 1], [0, -140 * depth]);
  return (
    <motion.div style={{ y }} className={`absolute z-20 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 px-3.5 py-2 text-xs font-medium text-stone-700 shadow-[0_10px_30px_-10px_rgba(28,25,23,0.25)] backdrop-blur-md"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Conversa de demonstração: as mensagens entram uma a uma, como no app
function HeroChat() {
  const bubble = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });
  return (
    <div className="flex h-full flex-col px-4 pb-6 pt-12">
      <div className="flex items-center justify-between pb-3">
        <span className="flex items-center gap-1.5 font-serif text-lg italic text-stone-900"><StellaMark size={22} decorative />stella</span>
        <span className="flex items-center gap-1 text-[10px] text-stone-500"><CloudSun size={12} />24° · seg, 13 out</span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3">
        <motion.p {...bubble(1.2)} className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-stone-900 px-3.5 py-2.5 text-xs leading-relaxed text-stone-50">
          Tenho um jantar hoje às 20h. O que eu visto?
        </motion.p>
        <motion.div {...bubble(1.9)} className="max-w-[92%] rounded-2xl rounded-bl-md border border-stone-200/80 bg-white px-3.5 py-3 text-xs leading-relaxed text-stone-700 shadow-sm">
          <p>Jantar com 21° pede elegância sem esforço. Eu iria de <strong className="font-semibold text-stone-900">blazer de linho</strong> sobre a <strong className="font-semibold text-stone-900">saia midi caramelo</strong>: alonga a silhueta e segura o friozinho da volta. A <strong className="font-semibold text-stone-900">mule de couro</strong> arremata sem pesar.</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <LandingAsset name="piece-01.webp" tone="sand" className="aspect-[4/5] w-full rounded-lg" priority />
            <LandingAsset name="piece-02.webp" tone="clay" className="aspect-[4/5] w-full rounded-lg" priority />
            <LandingAsset name="piece-03.webp" tone="olive" className="aspect-[4/5] w-full rounded-lg" priority />
          </div>
          <p className="mt-2.5 flex items-center gap-1 text-[10px] text-stone-400"><Sparkles size={11} />Tudo do seu guarda-roupa</p>
        </motion.div>
      </div>
      <div className="mt-3 rounded-full border border-stone-200/90 bg-white px-4 py-2.5 text-[11px] text-stone-400 shadow-sm">Converse com a Stella...</div>
    </div>
  );
}

const TRUST = [
  { value: "Seu armário", label: "Cada look usa o que você já tem" },
  { value: "Clima real", label: "A previsão da sua cidade, na hora" },
  { value: "Só seu", label: "Suas fotos não ficam públicas" },
];

export function TrustRow() {
  return (
    <section aria-label="Por que confiar" className="px-4 py-10">
      <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
        {TRUST.map((item, index) => (
          <li key={item.value}>
            <Reveal delay={index * 0.08}>
              <p className="font-serif text-2xl italic text-stone-900 sm:text-3xl">{item.value}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">{item.label}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
