"use client";

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useMotionTemplate, useScroll, useSpring, useTransform } from "framer-motion";
import { Check, CloudSun } from "lucide-react";
import { CtaLink, Eyebrow, LandingAsset, PhoneFrame, useViewport } from "@/components/landing/primitives";
import { StellaMark } from "@/components/ui/StellaMark";

function useSectionProgress(ref: React.RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });
}

/**
 * Planejador de eventos: seção escura que fica presa na tela enquanto a luz atravessa o fundo e o cartão do
 * evento entra em cena.
 */
export function PlannerSpotlight() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSectionProgress(ref);
  const imageScale = useTransform(progress, [0, 1], [1.08, 1]);
  const glowX = useTransform(progress, [0, 1], ["-30%", "70%"]);
  const cardY = useTransform(progress, [0, 0.6], [140, 0]);
  const cardRotate = useTransform(progress, [0, 0.6], [10, -4]);
  const cardOpacity = useTransform(progress, [0, 0.3], [0, 1]);
  const textY = useTransform(progress, [0, 0.5], [50, 0]);

  return (
    <section id="planejador" ref={ref} className="relative h-[140vh] bg-stone-950 lg:h-[190vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ scale: imageScale }} className="absolute inset-0">
          <LandingAsset name="planner-night.webp" tone="ink" alt="Stella de vestido verde diante do espelho, se arrumando para um evento" className="h-full w-full object-right opacity-90" />
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/65 to-transparent" />
        {/* Feixe de luz que cruza a cena conforme a rolagem */}
        <motion.div aria-hidden="true" style={{ x: glowX }} className="absolute -top-1/4 left-0 h-[150%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent blur-2xl" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-7 px-6 lg:grid-cols-2 lg:gap-12">
          <motion.div style={{ y: textY }}>
            <Eyebrow tone="light">Planejador de eventos</Eyebrow>
            <h2 className="mt-3 font-serif text-[2rem] leading-[1.1] tracking-tight text-stone-50 sm:text-6xl lg:mt-4">Convite na mão, <span className="font-light italic">look resolvido.</span></h2>
            <p className="mt-4 max-w-md text-base font-light leading-relaxed text-stone-300 max-lg:text-sm">
              Casamento, entrevista, jantar ou viagem: você me conta aonde vai e eu monto o look com as suas roupas, já olhando a previsão do dia.
            </p>
            <CtaLink href="/login" tone="light" className="mt-6 lg:mt-8">Planejar meu primeiro evento</CtaLink>
          </motion.div>

          <motion.div style={{ y: cardY, rotate: cardRotate, opacity: cardOpacity }} className="w-full max-w-[15.5rem] justify-self-center lg:max-w-xs lg:justify-self-start">
            <div className="rounded-3xl bg-[#FAF8F5] p-4 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)] lg:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Sábado, 18 de outubro · 16h</p>
              <p className="mt-1.5 font-serif text-xl italic text-stone-900 lg:mt-2 lg:text-2xl">Casamento da Ana</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-500"><CloudSun size={13} />24° · sol · chuva 10%</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <LandingAsset name="piece-05.webp" tone="olive" className="aspect-[4/5] w-full rounded-xl" />
                <LandingAsset name="piece-04.webp" tone="rose" className="aspect-[4/5] w-full rounded-xl" />
                <LandingAsset name="piece-03.webp" tone="clay" className="aspect-[4/5] w-full rounded-xl" />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-stone-600 max-lg:hidden">Cerimônia ao ar livre no fim da tarde: o vestido verde fica leve e elegante, e a sandália baixa aguenta o gramado.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"><Check size={13} />Vou com este</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const PHONE_WIDTH = 320;
const PHONE_HEIGHT = 640;

/**
 * Painéis do guarda-roupa: um ponto claro nasce no fundo escuro, vira um cartão e cresce até quase tomar a
 * tela (para antes das bordas, com os cantos arredondados), revelando o conteúdo que já estava atrás dele.
 */
export function NumbersReveal() {
  const ref = useRef<HTMLElement>(null);
  const viewport = useViewport();
  const progress = useSectionProgress(ref);
  const width = viewport?.width ?? 1280;
  const height = viewport?.height ?? 800;
  const cardWidth = Math.min(width * 0.82, 620);
  const cardHeight = Math.min(height * 0.5, 380);
  // O painel não chega às bordas: termina como um cartão arredondado, com o fundo escuro aparecendo em volta
  const margin = width < 640 ? 10 : 24;
  const fullWidth = width - margin * 2;
  const fullHeight = height - margin * 2;

  const panelWidth = useTransform(progress, [0, 0.12, 0.42, 0.72], [0, 18, cardWidth, fullWidth]);
  const panelHeight = useTransform(progress, [0, 0.12, 0.42, 0.72], [0, 18, cardHeight, fullHeight]);
  const radius = useTransform(progress, [0.12, 0.42, 0.72], [999, 36, 28]);
  const contentOpacity = useTransform(progress, [0.5, 0.75], [0, 1]);
  const contentY = useTransform(progress, [0.5, 0.8], [40, 0]);
  const phoneY = useTransform(progress, [0.55, 0.95], [160, 0]);
  const borderRadius = useMotionTemplate`${radius}px`;
  // Em telas largas o celular ocupa quase a altura do cartão; no celular, divide o espaço com os textos
  const phoneScale = Math.min(1, (width >= 1024 ? height - 144 : height * 0.42) / PHONE_HEIGHT);

  return (
    <section ref={ref} className="relative h-[220vh] bg-stone-950 lg:h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ width: panelWidth, height: panelHeight, borderRadius }} className="relative overflow-hidden bg-[#FAF8F5]">
          {/* O conteúdo tem o tamanho da tela inteira e fica centralizado: o painel só o revela ao crescer */}
          <div style={{ width, height }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div style={{ opacity: contentOpacity, y: contentY }} className="mx-auto grid h-full max-w-6xl items-center gap-5 px-6 max-lg:content-start lg:grid-cols-[1fr_auto_1fr] lg:gap-14">
              {/* Os dois textos encostam no celular, cada um do seu lado, com a mesma distância */}
              <div className="max-lg:pt-24 max-lg:text-center lg:justify-self-end">
                <Eyebrow>Painéis</Eyebrow>
                <h2 className="mt-3 font-serif text-3xl leading-[1.1] tracking-tight text-stone-900 sm:text-5xl lg:mt-4">Seu guarda-roupa, <span className="font-light italic">em números</span></h2>
                <p className="mt-4 font-serif text-xl font-light leading-snug text-stone-500 max-lg:hidden">Quanto vale.<br />O que você usa.<br />O que ficou esquecido.</p>
              </div>
              {/* O celular aparece inteiro e é a peça mais alta da cena. Ele é desenhado num tamanho fixo e
                  reduzido por escala para caber na janela, então a tela de dentro nunca é cortada */}
              <motion.div style={{ y: phoneY, width: PHONE_WIDTH * phoneScale, height: PHONE_HEIGHT * phoneScale }} className="mx-auto max-lg:mb-8">
                <div style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT, transform: `scale(${phoneScale})` }} className="origin-top-left">
                  <PhoneFrame className="h-full"><NumbersScreen /></PhoneFrame>
                </div>
              </motion.div>
              <div className="max-lg:text-center lg:justify-self-start">
                <p className="max-w-sm text-base font-light leading-relaxed text-stone-600 max-lg:mx-auto max-lg:text-sm">
                  Veja as peças que mais trabalham por você, as que nunca saíram do cabide e o custo de cada uso. Decidir o que comprar, e o que doar, fica simples.
                </p>
                <CtaLink href="/login" className="mt-5 lg:mt-7">Ver meus números</CtaLink>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Tela de demonstração dos painéis (valores ilustrativos)
function NumbersScreen() {
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-6 pt-12">
      <p className="flex items-center gap-1.5 font-serif text-lg italic text-stone-900"><StellaMark size={20} decorative />Painéis</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-stone-400">Valor do guarda-roupa</p>
          <p className="mt-1.5 font-serif text-xl text-stone-900">R$ 3.280</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-stone-400">Em uso</p>
          <p className="mt-1.5 font-serif text-xl text-stone-900">68%</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-200"><div className="h-full w-[68%] rounded-full bg-stone-800" /></div>
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200/80 bg-white p-3">
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-stone-400">Cores</p>
        <div className="mt-2 flex items-center gap-3">
          <svg viewBox="0 0 40 40" className="h-14 w-14 -rotate-90" aria-hidden="true">
            <circle cx="20" cy="20" r="14" fill="none" stroke="#1C1917" strokeWidth="7" strokeDasharray="34 88" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#D6C4A6" strokeWidth="7" strokeDasharray="24 88" strokeDashoffset="-35" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#B07A45" strokeWidth="7" strokeDasharray="16 88" strokeDashoffset="-60" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#5F8A5A" strokeWidth="7" strokeDasharray="11 88" strokeDashoffset="-77" />
          </svg>
          <ul className="flex-1 space-y-1 text-[9px] text-stone-600">
            <li className="flex justify-between"><span>Preto</span><span className="text-stone-400">39%</span></li>
            <li className="flex justify-between"><span>Bege</span><span className="text-stone-400">27%</span></li>
            <li className="flex justify-between"><span>Caramelo</span><span className="text-stone-400">18%</span></li>
          </ul>
        </div>
      </div>
      <div className="flex-1 rounded-2xl border border-stone-200/80 bg-white p-3">
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-stone-400">Mais usadas</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <LandingAsset name="piece-01.webp" tone="sand" className="aspect-[4/5] w-full rounded-lg" />
          <LandingAsset name="piece-02.webp" tone="clay" className="aspect-[4/5] w-full rounded-lg" />
          <LandingAsset name="piece-03.webp" tone="olive" className="aspect-[4/5] w-full rounded-lg" />
        </div>
        <p className="mt-2 text-[9px] text-stone-500">Blazer de linho · R$ 14 por uso</p>
      </div>
    </div>
  );
}

/**
 * Guarda-roupa por foto: imagem de tela cheia com um zoom discreto conforme a página rola. O topo da imagem
 * nasce do escuro da seção anterior, num degradê, para a passagem entre as duas não ter uma linha de corte.
 */
export function PhotoFilm() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative -mt-px flex min-h-screen items-end overflow-hidden bg-stone-950">
      {/* A foto é ancorada pelo topo (em telas largas o corte sai só da base) e o zoom cresce a partir dele:
          a cabeça da personagem, que fica no alto da cena, nunca é cortada. No celular, o enquadramento vai
          para a direita, onde ela está fotografando */}
      <motion.div style={{ scale }} className="absolute inset-0 origin-top">
        <LandingAsset name="wardrobe-film.webp" tone="clay" alt="Stella fotografando com o celular as roupas dispostas sobre a cama" className="h-full w-full object-[68%_0%] lg:object-top" />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-tr from-stone-950/90 via-stone-950/35 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[9vh] bg-gradient-to-b from-stone-950 via-stone-950/50 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 sm:pb-24">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -120px 0px" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <h2 className="font-serif text-4xl leading-[1.1] tracking-tight text-stone-50 sm:text-6xl">Você fotografa.<br /><span className="font-light italic">Eu cuido do resto.</span></h2>
          <p className="mt-4 max-w-md text-base font-light leading-relaxed text-stone-200">Uma foto por peça, no cabide ou sobre a cama. Eu identifico, nomeio e organizo tudo por categoria.</p>
          <CtaLink href="/login" tone="light" className="mt-7">Montar meu guarda-roupa</CtaLink>
        </motion.div>
      </div>
    </section>
  );
}
