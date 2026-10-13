"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { StellaMark } from "@/components/ui/StellaMark";
import { EASE } from "@/components/landing/primitives";

const LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#planejador", label: "Planejador" },
  { href: "#planos", label: "Planos" },
  { href: "#duvidas", label: "Dúvidas" },
];

function scrollToSection(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Barra flutuante em formato de pílula: some ao rolar para baixo e volta ao rolar para cima.
 * No celular, os links ficam atrás do botão de menu, que abre a própria barra para baixo.
 */
export function LandingNav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(current > 320 && current > previous);
    // Rolar a página fecha o menu aberto
    if (Math.abs(current - previous) > 8) setMenuOpen(false);
  });

  function go(href: string) {
    setMenuOpen(false);
    scrollToSection(href);
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden && !menuOpen ? -96 : 0, opacity: hidden && !menuOpen ? 0 : 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav aria-label="Principal" className="w-full max-w-3xl rounded-[1.75rem] border border-stone-200/70 bg-white/80 shadow-[0_8px_30px_rgba(28,25,23,0.08)] backdrop-blur-xl">
        <div className="flex items-center justify-between py-2 pl-4 pr-2">
          <Link href="/" aria-label="Stella" className="flex items-center gap-2">
            <StellaMark size={32} decorative />
            <span className="font-serif text-2xl font-semibold italic tracking-tight text-stone-900">stella</span>
          </Link>
          <div className="hidden items-center gap-7 text-[13px] font-medium text-stone-600 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  event.preventDefault();
                  go(link.href);
                }}
                className="transition-colors hover:text-stone-900"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link href="/login" className="hidden rounded-full bg-stone-900 px-5 py-2.5 text-xs font-semibold tracking-wide text-stone-50 transition-colors hover:bg-stone-800 md:block">Entrar</Link>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-800 transition-colors hover:bg-stone-100 md:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={menuOpen ? "close" : "open"} initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 45 }} transition={{ duration: 0.18 }}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id="landing-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden md:hidden"
            >
              <ul className="flex flex-col px-5 pb-5 pt-2">
                {LINKS.map((link, index) => (
                  <motion.li key={link.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 + index * 0.05, ease: EASE }}>
                    <a
                      href={link.href}
                      onClick={(event) => {
                        event.preventDefault();
                        go(link.href);
                      }}
                      className="block py-3 font-serif text-xl text-stone-800"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
                <li className="pt-3">
                  <Link href="/login" className="inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-50 transition-colors hover:bg-stone-800">Entrar</Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
