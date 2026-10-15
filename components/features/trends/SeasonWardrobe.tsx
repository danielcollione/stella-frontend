"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Shirt, Sparkles } from "lucide-react";
import { BADGES, LockBadge, PieceThumb } from "@/components/features/trends/TrendCard";
import { Rail } from "@/components/features/trends/Rail";
import { saveChatDraft } from "@/utils/chatDraft";
import type { Trends, TrendInsightPiece } from "@/types/trends";

// Legenda da foto em tela cheia: o selo da tendência, sem o nome dela
const badgeLabel = (piece: TrendInsightPiece) => (piece.badge && BADGES[piece.badge] ? `Em alta · ${BADGES[piece.badge].label}` : undefined);

/**
 * Seu armário na estação: um slide com as fotos das peças da pessoa que estão em alta e o atalho para a Stella montar
 * um look com elas. O texto nunca compara com o tamanho do armário: poucas peças em alta não significam armário
 * fraco, só que o resto entra no jogo com a combinação certa.
 */
export function SeasonWardrobe({ data }: { data: Trends }) {
  const { insight, wardrobe } = data;
  const pieces = insight?.pieces ?? [];

  return (
    <section aria-labelledby="wardrobe-title" className="flex min-w-0 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Seu armário na estação</p>
      <h2 id="wardrobe-title" className="mt-1 font-serif text-xl italic leading-snug tracking-tight text-stone-900">
        {insight && pieces.length > 0
          ? insight.closest ? "Uma peça sua que conversa com a estação" : "Peças suas que já estão em alta"
          : title(data)}
      </h2>

      {!insight || wardrobe.items === 0 ? (
        <Invite
          text="Cadastre suas peças e a Stella mostra aqui as que já estão em alta nesta estação."
          action="Cadastrar peças"
          href="/wardrobe"
        />
      ) : insight.locked && pieces.length > 0 ? (
        <>
          <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
            Encontrei algumas peças do seu armário que já conversam com as tendências.
          </p>
          <Link href="/planos" aria-label="Assine o Atelier ou o Couture para ver suas peças em alta" className="group relative mt-4 block overflow-hidden rounded-2xl">
            <ul aria-hidden="true" className="pointer-events-none flex select-none gap-3 overflow-hidden">
              {pieces.slice(0, 4).map((piece) => (
                <li key={piece.id} className="aspect-[3/4] w-40 shrink-0 overflow-hidden rounded-2xl border border-stone-200/70 bg-stone-100 sm:w-44">
                  {piece.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={piece.thumbnailUrl} alt="" className="h-full w-full scale-110 object-cover blur-md" />
                  )}
                </li>
              ))}
            </ul>
            <LockBadge text="Assine para ver suas peças" />
          </Link>
          <LockedLookButton />
        </>
      ) : pieces.length === 0 ? (
        <Invite text="Seu estilo conversa com a estação de outras formas: veja abaixo o que está em alta e peça à Stella para combinar as tendências com o que você já tem." />
      ) : (
        <>
          <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
            {insight.closest
              ? "Ela conversa com as tendências desta estação. Peça à Stella para montar um look com ela e o resto do seu armário."
              : "Encontrei algumas peças do seu armário que já conversam com as tendências."}
          </p>
          <div className="mt-4">
            <Rail label="Suas peças em alta">
              {pieces.map((piece) => (
                <li key={piece.id} className="w-40 shrink-0 snap-start sm:w-44">
                  <PieceThumb item={piece} caption={badgeLabel(piece)} className="aspect-[3/4] w-full rounded-2xl border border-stone-200/70 bg-white" />
                  <p className="mt-2 truncate text-[13px] text-stone-800" title={piece.name}>{piece.name}</p>
                  {piece.badge && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-stone-400">
                      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${BADGES[piece.badge]?.bar ?? "bg-stone-300"}`} />
                      <span className="truncate">{BADGES[piece.badge]?.label}</span>
                    </p>
                  )}
                </li>
              ))}
            </Rail>
          </div>
          <LookButton pieces={pieces} />
        </>
      )}
    </section>
  );
}

// No plano gratuito: o mesmo botão, com cadeado, levando aos planos
function LockedLookButton() {
  return (
    <Link
      href="/planos"
      className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-800"
    >
      <Lock size={14} />
      Pedir para a Stella montar um look com as tendências
    </Link>
  );
}

// Abre uma conversa nova com a mensagem pronta e as peças em alta marcadas; a pessoa revisa e envia
function LookButton({ pieces }: { pieces: TrendInsightPiece[] }) {
  const router = useRouter();

  const askForLook = () => {
    const conversation = crypto.randomUUID();
    saveChatDraft({
      conversation,
      before: "Stella, monte um look com as tendências da estação usando ",
      after: ". Se precisar, complete com outras peças do meu guarda-roupa.",
      itemIds: pieces.map((piece) => piece.id),
    });
    router.push(`/chat?new=${conversation}`);
  };

  return (
    <button
      type="button"
      onClick={askForLook}
      className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:scale-[0.98]"
    >
      <Sparkles size={15} />
      Pedir para a Stella montar um look com as tendências
    </button>
  );
}

function title({ insight, wardrobe }: Trends): string {
  if (!insight || wardrobe.items === 0) return "Mostre seu armário para a Stella";
  return "Seu estilo nesta estação";
}

function Invite({ text, action, href }: { text: string; action?: string; href?: string }) {
  return (
    <div className="mt-4 rounded-3xl border border-dashed border-stone-300 bg-white/60 px-5 py-5">
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-600">
        <Shirt size={15} className="mt-0.5 shrink-0 text-stone-400" />
        {text}
      </p>
      {action && href && (
        <Link href={href} className="mt-4 inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800">
          {action}
        </Link>
      )}
    </div>
  );
}
