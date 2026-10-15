"use client";

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useMotionTemplate, useScroll, useSpring, useTransform } from "framer-motion";
import { Check, CloudSun } from "lucide-react";
import { CtaLink, Eyebrow, LandingAsset, PhoneFrame, useViewport } from "@/components/landing/primitives";

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
 * Tendências: um ponto claro nasce no fundo escuro, vira um cartão e cresce até quase tomar a tela (para antes das
 * bordas, com os cantos arredondados), revelando o celular com um look da estação montado com as roupas da pessoa.
 */
export function TrendsReveal() {
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
    <section id="tendencias" ref={ref} className="relative h-[220vh] bg-stone-950 lg:h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ width: panelWidth, height: panelHeight, borderRadius }} className="relative overflow-hidden bg-[#FAF8F5]">
          {/* O conteúdo tem o tamanho da tela inteira e fica centralizado: o painel só o revela ao crescer */}
          <div style={{ width, height }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div style={{ opacity: contentOpacity, y: contentY }} className="mx-auto grid h-full max-w-6xl items-center gap-5 px-6 max-lg:content-start lg:grid-cols-[1fr_auto_1fr] lg:gap-14">
              {/* Os dois textos encostam no celular, cada um do seu lado, com a mesma distância */}
              <div className="max-lg:pt-24 max-lg:text-center lg:justify-self-end">
                <Eyebrow>Motor de Tendências</Eyebrow>
                <h2 className="mt-3 font-serif text-3xl leading-[1.1] tracking-tight text-stone-900 sm:text-5xl lg:mt-4">A estação, <span className="font-light italic">no seu armário</span></h2>
                <p className="mt-4 font-serif text-xl font-light leading-snug text-stone-500 max-lg:hidden">O que está em alta.<br />O que você já tem.<br />O que vale comprar.</p>
              </div>
              {/* O celular aparece inteiro e é a peça mais alta da cena. Ele é desenhado num tamanho fixo e
                  reduzido por escala para caber na janela, então a tela de dentro nunca é cortada */}
              <motion.div style={{ y: phoneY, width: PHONE_WIDTH * phoneScale, height: PHONE_HEIGHT * phoneScale }} className="mx-auto max-lg:mb-8">
                <div style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT, transform: `scale(${phoneScale})` }} className="origin-top-left">
                  <PhoneFrame className="h-full"><TrendsScreen /></PhoneFrame>
                </div>
              </motion.div>
              <div className="max-lg:text-center lg:justify-self-start">
                <p className="max-w-sm text-base font-light leading-relaxed text-stone-600 max-lg:mx-auto max-lg:text-sm">
                  Meu Motor de Tendências lê toda semana centenas de matérias de moda e o que o Brasil está buscando. Com isso, monto looks da estação com as suas roupas e sugiro só a peça que soma.
                </p>
                <CtaLink href="/login" className="mt-5 lg:mt-7">Ver meus looks da estação</CtaLink>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Tela de demonstração da aba Tendências, no desenho da tela de verdade (conteúdo ilustrativo).
// A estação em uma frase, a paleta e um look da estação montado com as peças da pessoa, com o próximo aparecendo
// no slide
const SEASON_PALETTE = [
  { name: "Areia", hex: "#D9C7A7" },
  { name: "Off-white", hex: "#EFE6D6" },
  { name: "Terracota", hex: "#C0603F" },
  { name: "Oliva", hex: "#7A8B6F" },
  { name: "Vermelho", hex: "#E34234" },
];

const LOOK = {
  occasion: "Trabalho",
  title: "Linho no escritório",
  trends: [{ name: "Linho", dot: "bg-[#CDB892]" }, { name: "Saia midi fluida", dot: "bg-stone-900" }],
  pieces: [
    { name: "piece-01.webp", tone: "sand" },
    { name: "piece-02.webp", tone: "clay" },
    { name: "piece-03.webp", tone: "olive" },
    { name: "piece-04.webp", tone: "rose" },
  ] as const,
};

function TrendsScreen() {
  return (
    <div className="flex h-full flex-col overflow-hidden px-4 pb-6 pt-12">
      <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-stone-400">Primavera-Verão 2026/27</p>
      <p className="font-serif text-[22px] italic leading-tight tracking-tight text-stone-900">Tendências</p>

      <p className="mt-2 font-serif text-[11px] italic leading-snug text-stone-700">
        Conforto e elegância sem rigidez: linho, pantalonas e tons terrosos, com um toque de vermelho.
      </p>
      <div className="mt-2 grid grid-cols-5 gap-1" aria-hidden="true">
        {SEASON_PALETTE.map((color) => (
          <div key={color.name}>
            <span className="block h-4 rounded-md border border-stone-900/5" style={{ backgroundColor: color.hex }} />
            <span className="mt-0.5 block truncate text-[5.5px] text-stone-500">{color.name}</span>
          </div>
        ))}
      </div>

      <p className="mt-3.5 border-t border-stone-200/80 pt-3 text-[7px] font-semibold uppercase tracking-[0.16em] text-stone-400">Seus looks da estação</p>
      <p className="font-serif text-[15px] italic leading-tight text-stone-900">Looks com as suas peças e as tendências</p>
      <div className="mt-2 flex gap-1">
        {["Trabalho", "Equilibrado", "Clima da semana"].map((filter) => (
          <span key={filter} className="rounded-full bg-stone-200/60 px-2 py-0.5 text-[7px] font-medium text-stone-600">{filter}</span>
        ))}
      </div>

      <div className="-mr-4 mt-2.5 flex gap-2">
        <div className="w-[86%] shrink-0 overflow-hidden rounded-[1.25rem] border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
          <div className="grid grid-cols-2 gap-[3px] bg-stone-100 p-[3px]">
            {LOOK.pieces.map((piece) => <LandingAsset key={piece.name} name={piece.name} tone={piece.tone} className="aspect-square w-full rounded-xl" />)}
          </div>
          <div className="px-3 pb-3 pt-2.5">
            <p className="text-[7px] uppercase tracking-[0.14em] text-stone-400">{LOOK.occasion}</p>
            <p className="mt-0.5 font-serif text-[15px] italic leading-tight text-stone-900">{LOOK.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {LOOK.trends.map((trend) => (
                <span key={trend.name} className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-1.5 py-px text-[7px] text-stone-600">
                  <span className={`h-1 w-1 rounded-full ${trend.dot}`} />{trend.name}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[8.5px] leading-relaxed text-stone-600">
              O <b className="font-semibold text-stone-800">blazer de linho</b> sobre a <b className="font-semibold text-stone-800">saia caramelo</b> deixa o look leve e atual; o <b className="font-semibold text-stone-800">mule</b> e a <b className="font-semibold text-stone-800">bolsa rosé</b> fecham com conforto.
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#5E8B6E]/35 bg-[#F1F6F2] py-0.5 pl-1.5 pr-0.5 text-[7.5px] font-medium text-[#2F4A38]">
                <Check size={8} className="text-[#4E7A5E]" />Usei hoje
                <span className="flex h-2.5 w-[18px] items-center justify-end rounded-full bg-[#5E8B6E] p-px"><span className="h-2 w-2 rounded-full bg-white" /></span>
              </span>
              <span className="text-[7.5px] text-stone-500">Trocar (3)</span>
            </div>
          </div>
        </div>
        {/* O próximo look do slide, aparecendo na borda */}
        <div aria-hidden="true" className="w-[86%] shrink-0 overflow-hidden rounded-[1.25rem] border border-stone-200/80 bg-white">
          <div className="grid grid-cols-2 gap-[3px] bg-stone-100 p-[3px]">
            <LandingAsset name="piece-05.webp" tone="olive" className="aspect-square w-full rounded-xl" />
            <span className="aspect-square w-full rounded-xl bg-stone-200/70" />
          </div>
        </div>
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
