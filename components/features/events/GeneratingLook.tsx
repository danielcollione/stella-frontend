"use client";

import { useEffect, useState } from "react";
import { DustField } from "@/components/ui/DustField";
import { StellaThinking } from "@/components/features/trends/SeasonLooks";

const GENERATING_STEPS = [
  "Consultando a previsão do tempo",
  "Entendendo a ocasião",
  "Abrindo o seu guarda-roupa",
  "Harmonizando cores e texturas",
  "Finalizando os detalhes",
];

// Enquanto a Stella monta o look (alguns segundos): a Stella pensando (o mesmo gif do chat) e, no formato da colagem do
// post em que o look vai aparecer, a poeira fina se formando
export function GeneratingLook({ caption = "A Stella está montando o seu look." }: { caption?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, GENERATING_STEPS.length - 1)), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div role="status">
      <div className="mb-4">
        <StellaThinking text={GENERATING_STEPS[step]} />
        <p className="mt-1 pl-10 text-xs text-stone-400">{caption}</p>
      </div>
      {/* No formato em que o look vai aparecer: a colagem 4:3 no celular; as peças lado a lado do tablet em diante */}
      <div aria-hidden="true" className="relative overflow-hidden rounded-2xl bg-[#EFE8DC] sm:hidden">
        <div className="aspect-[4/3] w-full" />
        <span className="stella-forming-sheen absolute inset-0" />
        <DustField density={1.1} />
      </div>
      <ul aria-hidden="true" className="hidden grid-cols-4 gap-2 sm:grid">
        {[0, 1, 2, 3].map((tile) => (
          <li key={tile} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#EFE8DC]">
            <span className="stella-forming-sheen absolute inset-0" style={{ animationDelay: `${tile * 0.3}s` }} />
            <DustField />
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="mt-5 space-y-2.5">
        <span className="block h-5 w-48 rounded-full bg-stone-200/70" />
        <span className="block h-2.5 w-full rounded-full bg-stone-200/50" />
        <span className="block h-2.5 w-4/5 rounded-full bg-stone-200/50" />
      </div>
    </div>
  );
}
