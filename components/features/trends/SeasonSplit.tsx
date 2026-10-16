import { BADGES } from "@/components/features/trends/TrendCard";
import type { Trend, TrendBadge } from "@/types/trends";

const ORDER: TrendBadge[] = ["INVESTMENT", "SEASON", "FLEETING", "EMERGING"];

// O que cada selo quer dizer, por extenso, para quem vai decidir uma compra
export const MEANINGS: Record<TrendBadge, string> = {
  INVESTMENT: "Já atravessaram mais de uma estação e combinam com o básico. Se for comprar algo novo, comece por elas: vão continuar valendo nas próximas temporadas.",
  SEASON: "Estão fortes agora e já são procuradas no Brasil. Aproveite nesta estação, de preferência combinando com peças que você já tem.",
  FLEETING: "Picos rápidos, puxados por virais, novelas ou celebridades. Divertidas para experimentar, mas sem gastar muito: costumam sumir logo.",
  EMERGING: "Apareceram nas passarelas e começam a chegar por aqui. Vale observar antes de investir.",
};

/**
 * Como a estação se divide entre os selos: uma barra só e, embaixo, o que cada selo significa. Fica logo acima das
 * tendências, para a pessoa ler os selos dos cards já sabendo o que eles dizem.
 */
export function SeasonSplit({ trends }: { trends: Trend[] }) {
  const groups = ORDER.map((badge) => ({ badge, count: trends.filter((trend) => trend.badge === badge).length }))
    .filter((group) => group.count > 0);
  const total = trends.length;

  return (
    <figure>
      <div className="flex h-2 overflow-hidden rounded-full bg-stone-100" role="img" aria-label={groups.map((group) => `${group.count} ${BADGES[group.badge].label}`).join(", ")}>
        {groups.map((group) => (
          <span key={group.badge} className={`h-full border-r-2 border-[#FAF8F5] last:border-r-0 ${BADGES[group.badge].bar}`} style={{ width: `${(group.count / total) * 100}%` }} />
        ))}
      </div>
      <figcaption className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.badge} className="flex gap-2.5">
            <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${BADGES[group.badge].bar}`} />
            <p className="text-[13px] leading-relaxed text-stone-500">
              <span className="font-medium text-stone-800">{BADGES[group.badge].label} · {group.count}</span>
              <br />
              {MEANINGS[group.badge]}
            </p>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
