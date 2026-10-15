"use client";

import { useEffect, useRef, useState } from "react";

export interface PageSection {
  id: string;
  label: string;
}

/**
 * Navegação da página por seções, como nas páginas de produto da Apple ou no anúncio do Airbnb: gruda no topo ao
 * rolar, marca a seção em que a pessoa está e leva até as outras. Nada fica escondido — todas as seções estão na
 * página; a barra só encurta o caminho.
 */
export function SectionNav({ sections }: { sections: PageSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Enquanto a rolagem de um clique acontece, o marcador não fica pulando pelas seções do meio
  const clickedRef = useRef<string | null>(null);

  useEffect(() => {
    const root = sentinelRef.current?.closest(".stella-scroll-area") ?? null;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      if (clickedRef.current) return;
      const current = sections.find((section) => (visible.get(section.id) ?? 0) > 0);
      if (current) setActive(current.id);
    }, { root, rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.01] });
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    // A barra ganha uma borda discreta quando gruda no topo
    const sentinel = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { root, threshold: 0 });
    if (sentinelRef.current) sentinel.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
      sentinel.disconnect();
    };
  }, [sections]);

  const go = (id: string) => {
    setActive(id);
    clickedRef.current = id;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      clickedRef.current = null;
    }, 900);
  };

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <nav
        aria-label="Seções da página"
        className={`sticky top-0 z-20 -mx-4 mb-8 px-4 py-3 transition-[background-color,box-shadow] duration-300 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10 ${stuck ? "bg-[#FAF8F5]/90 shadow-[0_1px_0_rgba(28,25,23,0.06)] backdrop-blur-md" : "bg-transparent"}`}
      >
        <ul className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {sections.map((section) => (
            <li key={section.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(section.id)}
                aria-current={active === section.id ? "true" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${active === section.id ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-900"}`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
