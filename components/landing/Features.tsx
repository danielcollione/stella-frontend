"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CloudSun, ShoppingBag, Sparkles } from "lucide-react";
import { CtaLink, EASE, LandingAsset, Reveal } from "@/components/landing/primitives";
import type { AssetTone } from "@/components/landing/primitives";

const cardClass = "rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(28,25,23,0.3)] backdrop-blur-md";

const FEATURES: { title: ReactNode; body: string; asset: string; alt: string; tone: AssetTone; cards: ReactNode }[] = [
  {
    title: <>Nada para vestir?<br /><span className="font-light italic">Comigo, não.</span></>,
    body: "Todo dia eu olho o clima da sua cidade e as peças que você tem para sugerir um look pronto. Não gostou? Monto outro na hora.",
    asset: "feature-daily.webp",
    alt: "Homem ajeitando a gola diante do espelho, com o look do dia pronto",
    tone: "sand",
    cards: (
      <>
        <div className={cardClass}>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400"><CloudSun size={12} />Hoje · 19° e garoa</p>
          <p className="mt-1.5 text-xs text-stone-700">Tricô cinza, calça de alfaiataria e bota. Leve o trench.</p>
        </div>
        <div className={`${cardClass} flex items-center gap-2 text-xs text-stone-700`}><Sparkles size={13} className="text-amber-600" />3 peças do seu guarda-roupa</div>
      </>
    ),
  },
  {
    title: <>Use mais<br /><span className="font-light italic">o que você já tem</span></>,
    body: "Eu sei quais peças estão paradas e coloco cada uma de volta no jogo, em combinações que você ainda não tinha pensado.",
    asset: "feature-wear.webp",
    alt: "Mulher tirando do armário uma camisa de seda verde que estava esquecida",
    tone: "olive",
    cards: (
      <>
        <div className={cardClass}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Esquecida há 4 meses</p>
          <p className="mt-1.5 text-xs text-stone-700">Camisa de seda verde: que tal com o jeans reto e a mule?</p>
        </div>
        <div className={cardClass}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Em uso</p>
          <p className="mt-1 font-serif text-lg text-stone-900">68% <span className="text-xs font-light text-stone-500">do armário</span></p>
        </div>
      </>
    ),
  },
  {
    title: <>Compre menos.<br /><span className="font-light italic">Acerte mais.</span></>,
    body: "Só sugiro uma compra quando falta uma peça de verdade, e mostro onde encontrar. Seu dinheiro vai para o que você vai usar.",
    asset: "feature-shop.webp",
    alt: "Rapaz examinando um mocassim caramelo numa loja antes de comprar",
    tone: "clay",
    cards: (
      <>
        <div className={cardClass}>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400"><ShoppingBag size={12} />Sugestão de compra</p>
          <p className="mt-1.5 text-xs text-stone-700">Mocassim caramelo: fecha 6 looks que você já tem.</p>
        </div>
        <div className={`${cardClass} text-xs text-stone-700`}>Buscar online · Ver lojas perto</div>
      </>
    ),
  },
];

/** Três benefícios em linhas alternadas: a imagem desliza devagar e os cartões entram por cima dela. */
export function Features() {
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 sm:gap-24">
        {FEATURES.map((feature, index) => <FeatureRow key={feature.asset} feature={feature} flipped={index % 2 === 1} />)}
      </div>
    </section>
  );
}

function FeatureRow({ feature, flipped }: { feature: (typeof FEATURES)[number]; flipped: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div className={`relative ${flipped ? "lg:order-2" : ""}`}>
        <div className="overflow-hidden rounded-[2rem] bg-stone-200">
          <motion.div style={{ y: imageY }} className="scale-[1.16]">
            <LandingAsset name={feature.asset} tone={feature.tone} alt={feature.alt} className="aspect-[4/5] w-full sm:aspect-[5/5]" />
          </motion.div>
        </div>
        <motion.div style={{ y: cardsY }} className={`absolute bottom-10 flex w-56 flex-col gap-2.5 sm:w-64 ${flipped ? "-left-3 sm:-left-8" : "-right-3 sm:-right-8"}`}>
          <motion.div
            initial={{ opacity: 0, x: flipped ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -140px 0px" }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="flex flex-col gap-2.5"
          >
            {feature.cards}
          </motion.div>
        </motion.div>
      </div>
      <Reveal className={flipped ? "lg:order-1" : ""}>
        <h2 className="font-serif text-4xl leading-[1.12] tracking-tight text-stone-900 sm:text-5xl">{feature.title}</h2>
        <p className="mt-5 max-w-md text-base font-light leading-relaxed text-stone-600">{feature.body}</p>
        <CtaLink href="/login" className="mt-8">Começar grátis</CtaLink>
      </Reveal>
    </div>
  );
}
