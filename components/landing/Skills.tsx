"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { CtaLink, LandingAsset, Reveal, useIsDesktop } from "@/components/landing/primitives";
import type { AssetTone } from "@/components/landing/primitives";

const SKILLS: { name: string; description: string; asset: string; tone: AssetTone }[] = [
  { name: "Curadora", description: "Cataloga cada peça a partir de uma foto: categoria, cor, estilo e formalidade.", asset: "skill-curadora.webp", tone: "sand" },
  { name: "Produtora", description: "Planeja o look de cada evento da sua agenda, do casamento à entrevista.", asset: "skill-produtora.webp", tone: "rose" },
  { name: "Colorista", description: "Guarda a sua paleta e as cores que mais valorizam você.", asset: "skill-colorista.webp", tone: "clay" },
  { name: "Analista", description: "Mostra o que você usa, o que ficou esquecido e quanto vale o seu armário.", asset: "skill-analista.webp", tone: "olive" },
  { name: "Consultora", description: "Só sugere comprar o que falta de verdade, e mostra onde encontrar.", asset: "skill-consultora.webp", tone: "ink" },
  { name: "Meteorologista", description: "Confere o clima da sua cidade antes de sugerir qualquer look.", asset: "skill-meteorologista.webp", tone: "sky" },
];

/**
 * "Uma estilista, muitos talentos": em telas largas a seção fica presa enquanto os cartões correm na
 * horizontal conforme a rolagem; no celular, é um carrossel de arrastar.
 */
export function Skills() {
  const desktop = useIsDesktop();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [shift, setShift] = useState(0);

  // Quanto o trilho precisa andar para mostrar o último cartão: é também quanto a página rola com a seção presa
  useLayoutEffect(() => {
    if (!desktop) return;
    const measure = () => {
      const track = trackRef.current;
      if (track) setShift(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [desktop]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });
  const x = useTransform(progress, [0, 1], [0, -shift]);

  return (
    <section id="recursos" ref={sectionRef} style={desktop ? { height: `calc(100vh + ${shift}px)` } : undefined} className="relative scroll-mt-24">
      <div className={desktop ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-12"}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-6 px-6">
          <Reveal className="max-w-xl">
            <h2 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Uma estilista, <span className="font-light italic">muitos talentos</span></h2>
            <p className="mt-4 text-base font-light leading-relaxed text-stone-600">
              Eu enxergo o seu guarda-roupa como um todo: o que você tem, o que combina, o que anda esquecido e o que realmente falta.
            </p>
          </Reveal>
          <Reveal delay={0.1}><CtaLink href="/login">Começar grátis</CtaLink></Reveal>
        </div>

        <motion.ul
          ref={trackRef}
          style={desktop ? { x } : undefined}
          className={`mt-12 flex gap-5 ${desktop ? "w-max pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pr-24" : "snap-x snap-mandatory scroll-px-6 overflow-x-auto px-6 pb-4 scrollbar-none"}`}
        >
          {SKILLS.map((skill, index) => (
            <motion.li
              key={skill.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{ duration: 0.8, delay: Math.min(index, 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group w-[260px] shrink-0 snap-start sm:w-[300px]"
            >
              <div className="overflow-hidden rounded-3xl bg-stone-200">
                <LandingAsset name={skill.asset} tone={skill.tone} alt={`Ilustração da Stella como ${skill.name.toLowerCase()}: ${skill.description}`} className="aspect-[4/5] w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
              </div>
              <h3 className="mt-4 font-serif text-xl italic text-stone-900">{skill.name}</h3>
              <p className="mt-1.5 text-sm font-light leading-relaxed text-stone-600">{skill.description}</p>
            </motion.li>
          ))}
          {/* No carrossel de arrastar, o navegador ignora o respiro do fim da lista: este item o garante */}
          {!desktop && <li aria-hidden="true" className="w-px shrink-0" />}
        </motion.ul>
      </div>
    </section>
  );
}
