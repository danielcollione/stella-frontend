"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BatteryFull, Signal, Wifi } from "lucide-react";

export const EASE = [0.22, 1, 0.36, 1] as const;

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// As animações presas à rolagem (trilho horizontal, seções fixas) só valem em telas largas;
// no celular, as mesmas seções viram rolagem simples
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches, () => false);
}

export function useViewport(): { width: number; height: number } | null {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const measure = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return size;
}

// Entrada padrão dos blocos: sobe alguns pixels e ganha foco ao entrar na tela, uma única vez
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const CTA_TONES = {
  dark: "bg-stone-900 text-stone-50 hover:bg-stone-800",
  light: "bg-[#FAF8F5] text-stone-900 hover:bg-white",
  outline: "border border-stone-300 bg-white/70 text-stone-800 hover:border-stone-500",
} as const;

// Botão com o texto que "rola" ao passar o mouse: o rótulo sobe e uma cópia entra por baixo
export function CtaLink({ href, children, tone = "dark", className = "" }: {
  href: string; children: string; tone?: keyof typeof CTA_TONES; className?: string;
}) {
  return (
    <Link href={href} className={`group relative inline-flex h-12 items-center overflow-hidden rounded-full px-7 text-sm font-medium shadow-sm transition-[background-color,border-color,transform] duration-300 active:scale-[0.98] ${CTA_TONES[tone]} ${className}`}>
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[220%]">{children}</span>
      <span aria-hidden="true" className="absolute inset-0 flex translate-y-[220%] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">{children}</span>
    </Link>
  );
}

export function Eyebrow({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${tone === "light" ? "text-stone-400" : "text-stone-500"}`}>{children}</p>;
}

const ASSET_TONES = {
  sand: "from-[#E9DFD0] via-[#DCCDB8] to-[#C9B79C]",
  clay: "from-[#D9B9A0] via-[#C79A7C] to-[#A9745A]",
  olive: "from-[#BFC3A4] via-[#9FA683] to-[#7C8562]",
  ink: "from-[#57534E] via-[#3A3632] to-[#1C1917]",
  rose: "from-[#E8CFC8] via-[#D9B0A7] to-[#BF8D86]",
  sky: "from-[#D5DDE0] via-[#B7C5CB] to-[#93A7B0]",
} as const;

export type AssetTone = keyof typeof ASSET_TONES;

/**
 * Imagem da landing, lida de /public/landing. Enquanto o arquivo não existe, mostra um bloco de cor no mesmo
 * formato, com o nome do arquivo esperado: basta colocar a imagem na pasta para ela aparecer.
 */
export function LandingAsset({ name, alt = "", tone = "sand", className = "", priority }: {
  name: string; alt?: string; tone?: AssetTone; className?: string; priority?: boolean;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);

  // O erro de carregamento pode acontecer antes de o React assumir a página: confere de novo ao montar
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) {
    return (
      <div role={alt ? "img" : undefined} aria-label={alt || undefined} className={`flex items-end bg-gradient-to-br ${ASSET_TONES[tone]} ${className}`}>
        <span className={`m-3 rounded-full px-2.5 py-1 font-mono text-[10px] ${tone === "ink" ? "bg-white/10 text-white/60" : "bg-white/40 text-stone-700/70"}`}>{name}</span>
      </div>
    );
  }
  return (
    // Arquivos estáticos da própria landing, com tamanho já ajustado na exportação
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={`/landing/${name}`}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={() => setMissing(true)}
      className={`object-cover ${className}`}
    />
  );
}

// Moldura de celular para as telas de demonstração: aro metálico fino, botões laterais, ilha no topo,
// barra de status e a barrinha de início, como nos aparelhos atuais
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  const button = "absolute w-[3px] bg-gradient-to-b from-stone-400 to-stone-500";
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden="true" className={`${button} -left-[3px] top-[17%] h-[4.5%] rounded-l-sm`} />
      <span aria-hidden="true" className={`${button} -left-[3px] top-[25%] h-[8%] rounded-l-sm`} />
      <span aria-hidden="true" className={`${button} -left-[3px] top-[35%] h-[8%] rounded-l-sm`} />
      <span aria-hidden="true" className={`${button} -right-[3px] top-[29%] h-[12%] rounded-r-sm`} />
      <div className="h-full rounded-[3.25rem] bg-gradient-to-br from-stone-300 via-stone-500 to-stone-400 p-[3px] shadow-[0_40px_80px_-20px_rgba(28,25,23,0.5)]">
        <div className="h-full rounded-[3.05rem] bg-black p-[9px]">
          <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-[#FAF8F5]">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between px-7 text-[11px] font-semibold text-stone-900">
              <span>9:41</span>
              <span className="flex items-center gap-1"><Signal size={13} strokeWidth={2.5} /><Wifi size={13} strokeWidth={2.5} /><BatteryFull size={17} strokeWidth={2} /></span>
            </div>
            <div aria-hidden="true" className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[88px] -translate-x-1/2 rounded-full bg-black" />
            {children}
            <div aria-hidden="true" className="absolute bottom-1.5 left-1/2 z-10 h-1 w-28 -translate-x-1/2 rounded-full bg-stone-900/85" />
          </div>
        </div>
      </div>
    </div>
  );
}
