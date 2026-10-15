import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

/**
 * Convite para desbloquear uma seção da aba, acima da prévia embaçada: o que a pessoa ganha, em poucas linhas e no
 * tom da Stella (sempre de ganho, nunca dizendo que falta algo no armário).
 */
export function UpgradePitch({ title, text, benefits, action }: {
  title: string;
  text: string;
  benefits: string[];
  action: string;
}) {
  return (
    <div className="mb-5 max-w-2xl">
      <p className="font-serif text-lg italic leading-snug text-stone-800 sm:text-xl">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-stone-500">{text}</p>
      <ul className="mt-3 space-y-1.5">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-[13px] text-stone-600">
            <Check size={14} className="mt-0.5 shrink-0 text-[#4E7A5E]" />
            {benefit}
          </li>
        ))}
      </ul>
      <Link
        href="/planos"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:scale-[0.98]"
      >
        {action}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
