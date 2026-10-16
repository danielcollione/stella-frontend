"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Lock, MessageCircle, RefreshCw, ShoppingBag, Sparkle, Sparkles, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StellaMark } from "@/components/ui/StellaMark";
import { DustField } from "@/components/ui/DustField";
import { BADGES, LockBadge, PieceThumb } from "@/components/features/trends/TrendCard";
import { Rail } from "@/components/features/trends/Rail";
import { FloatingMenu, POST_SLIDE, PostAction, PostCarousel } from "@/components/features/trends/PostCarousel";
import { UpgradePitch } from "@/components/features/trends/UpgradePitch";
import { PartnerLinkNote, ShoppingLinks } from "@/components/features/shopping/ShoppingLinks";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import { trendsService } from "@/services/trends/trendsService";
import { saveChatDraft } from "@/utils/chatDraft";
import { markGoodMoment } from "@/utils/goodMoment";
import type { LookFilters, LookOccasion, LookSwapReason, LookTrendLevel, TrendLook, TrendLooks } from "@/types/trends";
import { readCache, writeCache } from "@/utils/screenCache";
import { uniqueId } from "@/utils/uniqueId";

const OCCASIONS: { value: LookOccasion; label: string }[] = [
  { value: "VARIADOS", label: "Variados" },
  { value: "TRABALHO", label: "Trabalho" },
  { value: "CASUAL", label: "Dia a dia" },
  { value: "FIM_DE_SEMANA", label: "Fim de semana" },
  { value: "NOITE", label: "Noite" },
  { value: "EVENTO", label: "Evento" },
];

const LEVELS: { value: LookTrendLevel; label: string }[] = [
  { value: "DISCRETO", label: "Pouco" },
  { value: "EQUILIBRADO", label: "Na medida" },
  { value: "NA_MODA", label: "Bastante" },
];

// Os mesmos motivos do "não gostei" do chat
const SWAP_REASONS: { value: LookSwapReason; label: string }[] = [
  { value: "NOT_MY_STYLE", label: "Não é meu estilo" },
  { value: "TOO_FORMAL", label: "Formal demais" },
  { value: "TOO_CASUAL", label: "Casual demais" },
  { value: "WRONG_WEATHER", label: "Não combina com o clima" },
  { value: "COLORS", label: "Não gostei das cores" },
  { value: "OTHER", label: "Só quero outro" },
];

// O que aparece enquanto a Stella monta a rodada (leva alguns segundos)
const GENERATING_STEPS = ["Olhando o seu guarda-roupa", "Cruzando com as tendências da estação", "Combinando as peças", "Finalizando os looks"];

// Transições da seção: suaves e curtas, sem exagero
const EASE = [0.22, 1, 0.36, 1] as const;
const COLLAPSE = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto", transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.25, ease: EASE } },
};

const DEFAULT_FILTERS: LookFilters = { occasion: "VARIADOS", useWeather: true, trendLevel: "EQUILIBRADO", allowPurchase: false };
const dayMonth = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Seus looks da estação: a pessoa escolhe os filtros, pede uma rodada e a Stella monta até 5 looks com as peças dela
 * e as tendências. Cada look pode ser trocado (com motivo) e marcado como "Usei hoje", que entra no diário de uso.
 */
const LOOKS_CACHE = "trends:looks";
// As fotos das peças vêm com endereço que expira em 15 min: o que foi guardado vale por 10
const PHOTO_CACHE_MS = 10 * 60 * 1000;

export function SeasonLooks() {
  // Voltando para a aba: a rodada que estava na tela aparece na hora (as fotos das peças expiram, por isso o
  // limite de tempo) e a busca de sempre atualiza por trás
  const [data, setData] = useState<TrendLooks | null>(() => readCache<TrendLooks>(LOOKS_CACHE, PHOTO_CACHE_MS) ?? null);
  const [failed, setFailed] = useState(false);
  const [filters, setFilters] = useState<LookFilters>(() => {
    const round = readCache<TrendLooks>(LOOKS_CACHE, PHOTO_CACHE_MS)?.round;
    return round ? { occasion: round.occasion, useWeather: round.useWeather, trendLevel: round.trendLevel, allowPurchase: round.allowPurchase } : DEFAULT_FILTERS;
  });

  useEffect(() => {
    if (data) writeCache(LOOKS_CACHE, data);
  }, [data]);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    trendsService.looks(controller.signal)
      .then((loaded) => {
        setData(loaded);
        if (loaded.round) setFilters({ occasion: loaded.round.occasion, useWeather: loaded.round.useWeather, trendLevel: loaded.round.trendLevel, allowPurchase: loaded.round.allowPurchase });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, GENERATING_STEPS.length - 1)), 4500);
    return () => window.clearInterval(timer);
  }, [generating]);

  const generate = async () => {
    setError("");
    setGenerating(true);
    setStep(0);
    try {
      setData(await trendsService.generateLooks(filters));
      setEditing(false);
    } catch (failure) {
      setError(apiErrorMessage(failure, "A Stella não conseguiu montar seus looks agora. Tente novamente em instantes."));
    } finally {
      setGenerating(false);
    }
  };

  if (failed) return <p className="text-sm text-stone-500">Não conseguimos carregar seus looks. Recarregue a página para tentar de novo.</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-3xl bg-stone-200/50" role="status" aria-label="Carregando looks" />;
  if (!data.enabled) return <LockedLooks />;

  const roundsLeft = Math.max(0, data.rounds.limit - data.rounds.used);
  // Ao gerar, os filtros saem e a Stella aparece pensando, com os cards se formando onde os looks vão surgir
  const showFilters = (!data.round || editing) && !generating;

  return (
    <div className="space-y-6">
      {/* Com uma rodada na tela: os filtros dela numa linha e o "Nova rodada" (que reabre o convite) */}
      {data.round && !editing && !generating && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-[13px] text-stone-600">{roundSummary(data)}</p>
            <p className="mt-0.5 text-[11px] text-stone-400">
              {roundsLeft > 0
                ? `${roundsLeft} de ${data.rounds.limit} ${data.rounds.limit === 1 ? "rodada" : "rodadas"} nesta semana`
                : `Novas rodadas em ${dayMonth(data.rounds.resetsOn)}`}
            </p>
          </div>
          {roundsLeft > 0 ? (
            <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900">
              <Sparkles size={13} />
              Nova rodada
            </button>
          ) : !data.advancedFilters && (
            // Rodada da semana usada num plano abaixo do Couture: o botão continua lá, com cadeado, levando aos planos
            <Link
              href="/planos"
              title="No Couture são 3 rodadas por semana"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-700"
            >
              <Lock size={12} />
              Nova rodada
            </Link>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
      {showFilters && (
        <motion.div key="filters" {...COLLAPSE} className="overflow-hidden">
        <Filters
          filters={filters}
          onChange={setFilters}
          advanced={data.advancedFilters}
          disabled={generating}
          canBuildLook={data.canBuildLook}
          buildHint={data.buildHint}
          roundsLeft={roundsLeft}
          roundsLimit={data.rounds.limit}
          resetsOn={data.rounds.resetsOn}
          onGenerate={generate}
          onCancel={data.round ? () => setEditing(false) : undefined}
        />
        </motion.div>
      )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <motion.p key="error" role="alert" {...COLLAPSE} className="overflow-hidden text-sm text-[#8A4B32]">{error}</motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {generating ? (
          <motion.div key="forming" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <div className="mb-3"><StellaThinking text={GENERATING_STEPS[step]} /></div>
            <FormingLooks />
          </motion.div>
        ) : data.round && data.looks.length > 0 && !editing ? (
          <motion.div key={data.round.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <RoundLooks data={data} onChange={setData} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Montar uma nova rodada?"
        description="Os looks que estão aqui serão substituídos pelos novos. Os que você marcou como usados continuam no seu diário de uso."
      >
        <div className="flex flex-wrap items-center gap-3 px-6 py-6 sm:px-7">
          <button
            type="button"
            onClick={() => { setConfirming(false); setEditing(true); }}
            className="inline-flex items-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Montar uma nova rodada
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-4 py-3 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
            Manter os looks atuais
          </button>
        </div>
      </Modal>
    </div>
  );
}

// A Stella pensando (o mesmo traço animado do chat), com a etapa em que ela está
export function StellaThinking({ text }: { text: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <p role="status" className="inline-flex items-center gap-3 text-sm text-stone-600">
      {reducedMotion ? <StellaMark size={28} decorative /> : (
        // <img> simples para o Next não converter a animação em imagem parada
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/stella-thinking.webp" alt="" aria-hidden="true" width={28} height={28} draggable={false} className="shrink-0 select-none" />
      )}
      <span className="stella-shimmer font-serif italic">{text}…</span>
    </p>
  );
}

/**
 * O convite para montar os looks: o título diz o que é e o botão diz como, logo de cara. A ocasião fica à vista (é a
 * escolha que mais muda o resultado); o resto vai em "Mais opções", com escolhas boas por padrão.
 */
function Filters({ filters, onChange, advanced, disabled, canBuildLook, buildHint, roundsLeft, roundsLimit, resetsOn, onGenerate, onCancel }: {
  filters: LookFilters;
  onChange: (filters: LookFilters) => void;
  advanced: boolean;
  disabled: boolean;
  canBuildLook: boolean;
  buildHint: string | null;
  roundsLeft: number;
  roundsLimit: number;
  resetsOn: string;
  onGenerate: () => void;
  onCancel?: () => void;
}) {
  const [more, setMore] = useState(false);
  const set = (patch: Partial<LookFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:px-8 sm:py-7">
      <p className="font-serif text-[22px] italic leading-tight tracking-tight text-stone-900 sm:text-2xl">Monte seus looks da estação</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500">Até 5 looks com as suas peças e o que está em alta agora.</p>

      {/* A ação primeiro */}
      <div className="mt-6 flex flex-col items-center gap-x-4 gap-y-2.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center">
        {canBuildLook ? (
          <>
            {/* No celular, ao centro; com luz que atravessa, halo dourado e estrelinhas em volta */}
            <span className="relative inline-flex">
              {roundsLeft > 0 && !disabled && (
                <>
                  <Sparkle aria-hidden="true" size={11} className="stella-twinkle pointer-events-none absolute -left-3 -top-2 fill-[#C9A27E] text-[#C9A27E]" />
                  <Sparkle aria-hidden="true" size={8} className="stella-twinkle pointer-events-none absolute -right-2 -top-3 fill-[#D9B98F] text-[#D9B98F] [animation-delay:0.9s]" />
                  <Sparkle aria-hidden="true" size={9} className="stella-twinkle pointer-events-none absolute -bottom-2 right-6 fill-[#C9A27E] text-[#C9A27E] [animation-delay:1.7s]" />
                </>
              )}
              <button
                type="button"
                onClick={onGenerate}
                disabled={disabled || roundsLeft === 0}
                className={`inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${roundsLeft > 0 && !disabled ? "stella-shine-button" : ""}`}
              >
                <Sparkles size={15} className="text-[#E9D3B4]" />
                Montar meus looks
              </button>
            </span>
            <span className="text-xs text-stone-400">
              {roundsLeft > 0
                ? `${roundsLeft} de ${roundsLimit} ${roundsLimit === 1 ? "rodada" : "rodadas"} nesta semana`
                : `Novas rodadas em ${dayMonth(resetsOn)}`}
            </span>
            {onCancel && (
              <button type="button" onClick={onCancel} className="stella-hit text-xs text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-800">
                Voltar aos looks
              </button>
            )}
          </>
        ) : (
          <p className="text-sm leading-relaxed text-stone-500">
            {buildHint ?? "Para montar looks, a Stella precisa de uma parte de cima e uma de baixo, ou de uma peça inteira."}{" "}
            <Link href="/wardrobe" className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-4">Cadastrar peças</Link>
          </p>
        )}
      </div>

      {/* min-w-0: um fieldset não encolhe por padrão, e a linha das ocasiões não rolaria no celular */}
      <fieldset disabled={disabled} aria-label="Filtros dos looks" className="mt-6 min-w-0 border-t border-stone-100 pt-5">
        {/* A ocasião, à vista: no celular arrasta para o lado em vez de quebrar em duas linhas */}
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs text-stone-400">Para</span>
          <div className="scrollbar-none -mr-5 flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-5 sm:mr-0 sm:flex-wrap sm:overflow-visible sm:pr-0">
            {OCCASIONS.map((occasion) => (
              <Chip key={occasion.value} selected={filters.occasion === occasion.value} onClick={() => set({ occasion: occasion.value })}>
                {occasion.label}
              </Chip>
            ))}
          </div>
        </div>

        {advanced ? (
          <>
            <button
              type="button"
              onClick={() => setMore((open) => !open)}
              aria-expanded={more}
              className="stella-hit mt-4 inline-flex items-center gap-1 text-xs text-stone-500 transition-colors hover:text-stone-900"
            >
              Mais opções
              <ChevronDown size={14} className={`transition-transform duration-300 ${more ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {more && (
                <motion.div key="more" {...COLLAPSE} className="overflow-hidden">
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[13px] text-stone-700">Quanto de tendência?</span>
                      {/* No celular, o seletor ocupa a largura toda, com as três opções do mesmo tamanho */}
                      <div className="grid w-full grid-cols-3 rounded-full border border-stone-200 bg-[#FAF8F5] p-1 sm:inline-flex sm:w-auto">
                        {LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => set({ trendLevel: level.value })}
                            aria-pressed={filters.trendLevel === level.value}
                            className={`rounded-full px-3.5 py-2 text-xs font-medium sm:py-1.5 transition-colors ${filters.trendLevel === level.value ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Toggle checked={filters.useWeather} onChange={(useWeather) => set({ useWeather })} label="Considerar o clima da semana" />
                      <Toggle checked={filters.allowPurchase} onChange={(allowPurchase) => set({ allowPurchase })} label="Sugerir uma peça para comprar, se fizer falta" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <Link href="/planos" className="stella-hit mt-4 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700">
            <Lock size={12} />
            Mais opções no plano Couture
          </Link>
        )}
      </fieldset>
    </div>
  );
}

// Os filtros da rodada na tela, numa linha: "Noite · Na medida · Clima da semana"
function roundSummary(data: TrendLooks): string {
  const round = data.round!;
  return [
    OCCASIONS.find((occasion) => occasion.value === round.occasion)?.label,
    data.advancedFilters ? LEVELS.find((level) => level.value === round.trendLevel)?.label : null,
    round.useWeather ? "Clima da semana" : null,
    round.allowPurchase ? "Com sugestão de compra" : null,
  ].filter(Boolean).join(" · ");
}

function RoundLooks({ data, onChange }: { data: TrendLooks; onChange: (data: TrendLooks) => void }) {
  const round = data.round!;
  const swapsLeft = Math.max(0, round.swapsLimit - round.swapsUsed);


  return (
    <div>
      {data.looks.length < 5 && (
        <p className="mb-4 text-[12px] leading-relaxed text-stone-500">
          Montei {plural(data.looks.length, "look", "looks")} com as peças que você tem agora. Quanto mais peças você cadastrar, mais combinações a Stella encontra.
        </p>
      )}
      {/* Celular e tablet: um look por vez, como um post */}
      <div className="lg:hidden">
        <LookFeed looks={data.looks} swapsLeft={swapsLeft} onChange={onChange} />
      </div>
      <div className="hidden lg:block">
      <Rail label="Seus looks da estação">
        {data.looks.map((look, index) => (
          <motion.li
            key={look.id}
            initial={{ opacity: 0, y: 10, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE, delay: index * 0.08 } }}
            className="flex w-[290px] shrink-0 snap-start sm:w-[320px]"
          >
            <LookCard look={look} swapsLeft={swapsLeft} onChange={onChange} />
          </motion.li>
        ))}
      </Rail>
      </div>
      {data.looks.some((look) => look.purchase) && <div className="mt-3"><PartnerLinkNote /></div>}
    </div>
  );
}

// "Usei hoje" e "Trocar": a mesma lógica no card do computador e no post do celular
function useLookActions(look: TrendLook, onChange: (data: TrendLooks) => void) {
  const [busy, setBusy] = useState<"wear" | "swap" | null>(null);
  const [askingReason, setAskingReason] = useState(false);
  const [error, setError] = useState("");

  const toggleWorn = async () => {
    setBusy("wear");
    setError("");
    try {
      onChange(await trendsService.setWorn(look.id, !look.wornToday));
      if (!look.wornToday) markGoodMoment();
    } catch (failure) {
      setError(apiErrorMessage(failure, "Não deu para registrar agora. Tente de novo."));
    } finally {
      setBusy(null);
    }
  };

  const swap = async (reason: LookSwapReason) => {
    setBusy("swap");
    setError("");
    try {
      onChange(await trendsService.swapLook(look.id, reason));
    } catch (failure) {
      setError(apiErrorMessage(failure, "A Stella não conseguiu trocar este look agora. Tente de novo."));
      setAskingReason(false);
      setBusy(null);
    }
  };

  return { busy, askingReason, setAskingReason, error, toggleWorn, swap };
}

// Computador: o card de sempre, lado a lado no slide
function LookCard({ look, swapsLeft, onChange }: { look: TrendLook; swapsLeft: number; onChange: (data: TrendLooks) => void }) {
  const { busy, askingReason, setAskingReason, error, toggleWorn, swap } = useLookActions(look, onChange);
  const photos = look.items.slice(0, 4);
  const extra = look.items.length - photos.length;

  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <AnimatePresence>
        {busy === "swap" && (
          <motion.div
            key="dust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="pointer-events-none absolute inset-x-0 top-0 z-20 aspect-square bg-[#EFE8DC]/90 backdrop-blur-sm"
          >
            <span className="stella-forming-sheen absolute inset-0" />
            <DustField />
          </motion.div>
        )}
      </AnimatePresence>
      <ul className={`grid gap-1 bg-stone-100 p-1 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {photos.map((item, index) => (
          <li key={item.id} className={`relative ${photos.length === 3 && index === 0 ? "row-span-2" : ""}`}>
            <PieceThumb item={item} className={`h-full w-full rounded-2xl ${photos.length === 3 && index === 0 ? "" : "aspect-square"}`} />
            {index === photos.length - 1 && extra > 0 && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-stone-900/45 font-serif text-xl italic text-white">+{extra}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <SwapPanel open={askingReason} busy={busy === "swap"} onPick={swap} onClose={() => setAskingReason(false)} />
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-400">{look.occasion}</p>
        <h3 className="mt-1 font-serif text-xl italic leading-tight tracking-tight text-stone-900">{look.title}</h3>
        {look.trends.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {look.trends.map((trend) => (
              <li key={trend.name} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-2.5 py-0.5 text-[11px] text-stone-600">
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${BADGES[trend.badge]?.bar ?? "bg-stone-300"}`} />
                {trend.name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-stone-600"><Reasoning text={look.reasoning} pieces={look.items.map((item) => item.name)} /></p>

        {look.purchase && (
          <div className="mt-3 space-y-2.5 rounded-2xl border border-dashed border-stone-300 px-3.5 py-3">
            <p className="flex items-center gap-2 text-[13px] text-stone-800">
              <ShoppingBag size={14} className="shrink-0 text-stone-400" />
              <span><span className="text-stone-500">Para completar:</span> {look.purchase}</span>
            </p>
            <ShoppingLinks suggestion={look.purchase} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
          <WornToggle worn={look.wornToday} disabled={busy !== null} onToggle={toggleWorn} />
          <button
            type="button"
            onClick={() => setAskingReason(true)}
            disabled={busy !== null || swapsLeft === 0}
            title={swapsLeft === 0 ? "Você já usou as trocas desta rodada" : undefined}
            className="stella-hit inline-flex items-center gap-1.5 py-1.5 text-xs text-stone-500 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={12} />
            Trocar{swapsLeft > 0 ? ` (${swapsLeft})` : ""}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-[#8A4B32]">{error}</p>}
      </div>
    </article>
  );
}

/**
 * O porquê do look, com as peças do guarda-roupa em negrito. A Stella marca as peças com **asteriscos**; nos looks
 * gerados antes disso, ficam em negrito os nomes das peças do look que aparecem no texto.
 */
export function Reasoning({ text, pieces }: { text: string; pieces: string[] }) {
  const parts = text.includes("**") ? splitMarked(text) : splitByNames(text, pieces);
  return (
    <>
      {parts.map((part, index) => part.bold
        ? <strong key={index} className="font-medium text-stone-900">{part.text}</strong>
        : <span key={index}>{part.text}</span>)}
    </>
  );
}

function splitMarked(text: string): { text: string; bold: boolean }[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) => ({ text: part, bold: index % 2 === 1 })).filter((part) => part.text);
}

function splitByNames(text: string, names: string[]): { text: string; bold: boolean }[] {
  const terms = [...new Set(names.map((name) => name.trim()).filter((name) => name.length >= 4))].sort((a, b) => b.length - a.length);
  if (terms.length === 0) return [{ text, bold: false }];
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(pattern).filter(Boolean).map((part) => ({ text: part, bold: terms.some((term) => term.toLowerCase() === part.toLowerCase()) }));
}

/**
 * Troca de um look: um painel de vidro fosco que sobe sobre o texto do card, sem mudar o tamanho dele nem dos
 * vizinhos. Enquanto a Stella procura outro look, o painel mostra ela pensando.
 */
// Os motivos da troca, em lista (a mesma do painel do card e do menu do post)
function SwapReasons({ onPick, onClose }: { onPick: (reason: LookSwapReason) => void; onClose: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-serif text-base italic text-stone-900">O que não funcionou?</p>
        <button type="button" onClick={onClose} aria-label="Manter este look" title="Manter este look" className="stella-hit rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
          <X size={15} />
        </button>
      </div>
      <ul className="mt-2 flex-1 divide-y divide-stone-100">
        {SWAP_REASONS.map((reason) => (
          <li key={reason.value}>
            <button type="button" onClick={() => onPick(reason.value)} className="flex w-full items-center justify-between py-2.5 text-left text-[13px] text-stone-700 transition-colors hover:text-stone-950">
              {reason.label}
              <RefreshCw size={12} className="text-stone-300" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function SwapPanel({ open, busy, onPick, onClose }: {
  open: boolean;
  busy: boolean;
  onPick: (reason: LookSwapReason) => void;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-10 flex flex-col rounded-b-3xl bg-white/90 px-4 pb-4 pt-3.5 backdrop-blur-md"
        >
          {busy ? (
            <div className="flex flex-1 items-center justify-center">
              <StellaThinking text="Procurando outro look" />
            </div>
          ) : (
            <SwapReasons onPick={onPick} onClose={onClose} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Celular e tablet, como um post do Instagram: só a colagem das peças arrasta para o lado (com as bolinhas logo
 * embaixo); a ocasião, as ações e a legenda ficam fixas no lugar e trocam junto com o look que está na tela.
 */
function LookFeed({ looks, swapsLeft, onChange }: { looks: TrendLook[]; swapsLeft: number; onChange: (data: TrendLooks) => void }) {
  const [active, setActive] = useState(0);
  const current = looks[Math.min(Number.isFinite(active) ? active : 0, looks.length - 1)] ?? looks[0];

  return (
    <div>
      <header className="flex min-h-[40px] items-center gap-2 overflow-hidden">
        <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-stone-400">{current.occasion}</span>
        {current.trends.slice(0, 2).map((trend) => (
          <span key={trend.name} className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full border border-stone-200 px-2.5 py-0.5 text-[11px] text-stone-600">
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${BADGES[trend.badge]?.bar ?? "bg-stone-300"}`} />
            <span className="truncate">{trend.name}</span>
          </span>
        ))}
      </header>
      <PostCarousel label="Seus looks da estação" count={looks.length} onActiveChange={setActive}>
        {looks.map((look, slot) => (
          <li key={slot} className={POST_SLIDE}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={look.id}
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="overflow-hidden sm:rounded-2xl"
              >
                <LookCollage look={look} />
              </motion.div>
            </AnimatePresence>
          </li>
        ))}
      </PostCarousel>
      <LookDetails key={current.id} look={current} swapsLeft={swapsLeft} onChange={onChange} />
    </div>
  );
}

// As peças do look numa colagem 4:3 (cada uma abre em tela cheia ao tocar)
function LookCollage({ look }: { look: TrendLook }) {
  const photos = look.items.slice(0, 4);
  const extra = look.items.length - photos.length;
  const layout = photos.length <= 1 ? "grid-cols-1" : photos.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2";
  return (
    <ul className={`grid aspect-[4/3] gap-[3px] bg-stone-100 ${layout}`}>
      {photos.map((item, index) => (
        <li key={item.id} className={`relative min-h-0 ${photos.length === 3 && index === 0 ? "row-span-2" : ""} ${photos.length === 2 ? "row-span-2" : ""}`}>
          <PieceThumb item={item} className="h-full w-full" />
          {index === photos.length - 1 && extra > 0 && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-900/45 font-serif text-xl italic text-white">+{extra}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// Abaixo da colagem: "Usei hoje" e "Trocar" (o motivo abre num menu flutuante) e a legenda do look na tela
function LookDetails({ look, swapsLeft, onChange }: { look: TrendLook; swapsLeft: number; onChange: (data: TrendLooks) => void }) {
  const { busy, askingReason, setAskingReason, error, toggleWorn, swap } = useLookActions(look, onChange);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <div className="relative">
        <FloatingMenu open={askingReason} locked={busy === "swap"} onClose={() => setAskingReason(false)} label="Trocar este look">
          {busy === "swap" ? (
            <div className="flex min-h-[44px] items-center"><StellaThinking text="Procurando outro look" /></div>
          ) : (
            <SwapReasons onPick={swap} onClose={() => setAskingReason(false)} />
          )}
        </FloatingMenu>
        <div className="-mx-2 flex min-h-[56px] items-center gap-1 px-2">
          <WornToggle worn={look.wornToday} disabled={busy !== null} onToggle={toggleWorn} />
          <span className="flex-1" />
          <PostAction
            onClick={() => setAskingReason(true)}
            disabled={busy !== null || swapsLeft === 0}
            active={askingReason}
            icon={<RefreshCw size={20} strokeWidth={1.6} />}
          >
            {swapsLeft > 0 ? `Trocar (${swapsLeft})` : "Sem trocas"}
          </PostAction>
        </div>
      </div>

      <div className="pb-1">
        <h3 className="mt-4 font-serif text-[30px] font-semibold italic leading-tight tracking-tight text-stone-900">{look.title}</h3>
        <p className={`mt-1 text-sm leading-relaxed text-stone-600 ${expanded ? "" : "line-clamp-2"}`}>
          <Reasoning text={look.reasoning} pieces={look.items.map((item) => item.name)} />
        </p>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="stella-hit text-sm text-stone-400 hover:text-stone-700">mais</button>
        )}
        {look.purchase && (
          <div className="mt-3 space-y-2.5 rounded-2xl border border-dashed border-stone-300 px-3.5 py-3">
            <p className="flex items-center gap-2 text-[13px] text-stone-800">
              <ShoppingBag size={14} className="shrink-0 text-stone-400" />
              <span><span className="text-stone-500">Para completar:</span> {look.purchase}</span>
            </p>
            <ShoppingLinks suggestion={look.purchase} />
          </div>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-[#8A4B32]">{error}</p>}
      </div>
    </div>
  );
}

// "Usei hoje": interruptor no mesmo estilo do "Salvar no guarda-roupa" do chat — verde-sálvia quando ligado.
// Ligar registra o look no diário de uso com a data de hoje; desligar desfaz
function WornToggle({ worn, disabled, onToggle }: { worn: boolean; disabled: boolean; onToggle: () => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={worn}
      aria-label="Usei hoje"
      onClick={onToggle}
      disabled={disabled}
      title={worn ? "Registrado no seu diário de uso. Toque para desfazer." : "Registra este look no seu diário de uso com a data de hoje."}
      className={`stella-hit inline-flex items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:opacity-60 ${worn ? "border-[#5E8B6E]/35 bg-[#F1F6F2] text-[#2F4A38]" : "border-stone-200/80 text-stone-600 hover:border-stone-300 hover:text-stone-800"}`}
    >
      <Check aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${worn ? "text-[#4E7A5E]" : "text-stone-400"}`} />
      Usei hoje
      <span aria-hidden="true" className={`relative flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${worn ? "bg-[#5E8B6E]" : "bg-stone-200"}`}>
        <motion.span
          className="h-3 w-3 rounded-full bg-white shadow-sm"
          animate={{ x: worn ? 12 : 0 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 35 }}
        />
      </span>
    </button>
  );
}

/**
 * Enquanto a Stella monta a rodada: cards no formato dos looks, cobertos de poeira fina que flutua e cintila, como
 * nos geradores de imagem. Quando os looks chegam, eles surgem saindo do desfoque no mesmo lugar.
 */
function FormingLooks() {
  return (
    <>
    {/* Celular e tablet: o post que vai surgir, na largura da tela */}
    <div aria-hidden="true" className="lg:hidden">
      <div className="flex min-h-[40px] items-center gap-2">
        <span className="h-2.5 w-20 rounded-full bg-stone-300/50" />
        <span className="h-4 w-24 rounded-full bg-stone-300/40" />
      </div>
      <div className="relative -mx-4 overflow-hidden bg-[#EFE8DC] sm:mx-0 sm:w-[400px] sm:rounded-2xl">
        <div className="aspect-[4/3] w-full" />
        <span className="stella-forming-sheen absolute inset-0" />
        <DustField density={1.1} />
      </div>
      <div className="space-y-2.5 pt-5">
        <span className="block h-5 w-44 rounded-full bg-stone-300/50" />
        <span className="block h-2.5 w-full rounded-full bg-stone-300/35" />
        <span className="block h-2.5 w-4/5 rounded-full bg-stone-300/35" />
      </div>
    </div>
    <ul aria-hidden="true" className="hidden gap-3 overflow-hidden lg:flex">
      {[0, 1, 2].map((index) => (
        <li key={index} className="relative w-[290px] shrink-0 overflow-hidden rounded-3xl border border-stone-200/70 bg-[#EFE8DC] sm:w-[320px]">
          <div className="aspect-square w-full" />
          <div className="space-y-2.5 px-4 pb-6 pt-4">
            <span className="block h-2.5 w-16 rounded-full bg-stone-300/40" />
            <span className="block h-5 w-40 rounded-full bg-stone-300/50" />
            <span className="block h-2.5 w-full rounded-full bg-stone-300/35" />
            <span className="block h-2.5 w-4/5 rounded-full bg-stone-300/35" />
          </div>
          {/* Um brilho largo e lento atravessando a poeira */}
          <span className="stella-forming-sheen absolute inset-0" style={{ animationDelay: `${index * 0.35}s` }} />
          <DustField density={1.1} />
        </li>
      ))}
    </ul>
    </>
  );
}

// Plano gratuito: a seção aparece embaçada, com o convite para assinar
function LockedLooks() {
  return (
    <>
    <UpgradePitch
      title="Seu armário tem mais looks da estação do que você imagina."
      text="A Stella cruza as suas peças com as tendências e monta looks prontos para o trabalho, o fim de semana ou a noite. Você escolhe a ocasião; ela faz o resto."
      benefits={[
        "Até 5 looks por rodada, com as peças que você já tem",
        "Troque o look que não for a sua cara",
        "Marque “Usei hoje” e acompanhe no seu diário de uso",
      ]}
      action="Ver os planos"
    />
    <Link href="/planos" aria-label="Assine o Atelier ou o Couture para montar seus looks da estação" className="group relative block overflow-hidden rounded-3xl">
      <div aria-hidden="true" className="pointer-events-none flex select-none gap-3 blur-[6px]">
        {[0, 1, 2].map((index) => (
          <div key={index} className="w-[290px] shrink-0 overflow-hidden rounded-3xl border border-stone-200/80 bg-white">
            <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1">
              {[0, 1, 2, 3].map((photo) => <span key={photo} className="aspect-square rounded-2xl bg-stone-200" />)}
            </div>
            <div className="space-y-2.5 p-4">
              <span className="block h-5 w-36 rounded-full bg-stone-300/80" />
              <span className="block h-2.5 w-full rounded-full bg-stone-200" />
              <span className="block h-2.5 w-4/5 rounded-full bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
      <LockBadge text="Assine para montar seus looks" />
    </Link>
    </>
  );
}

// Alternativa livre aos looks prontos: uma conversa nova com o pedido escrito
export function LooksChatShortcut() {
  const router = useRouter();
  const open = () => {
    const conversation = uniqueId();
    saveChatDraft({ conversation, before: "Stella, monte um look com as tendências da estação para mim", after: ".", itemIds: [] });
    router.push(`/chat?new=${conversation}`);
  };
  return (
    <button type="button" onClick={open} className="inline-flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-900">
      <MessageCircle size={15} />
      Prefere conversar? <span className="underline decoration-stone-300 underline-offset-4">Peça um look no chat</span>
    </button>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"}`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-stone-900" : "bg-stone-300"}`}
      >
        <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
      {label}
    </label>
  );
}
