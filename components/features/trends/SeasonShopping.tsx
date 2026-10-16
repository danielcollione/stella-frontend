"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, MapPin, MessageCircle, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { DustField } from "@/components/ui/DustField";
import { LockBadge, PieceThumb, STAND_INS, TrendBadgeChip } from "@/components/features/trends/TrendCard";
import { Reasoning, StellaThinking } from "@/components/features/trends/SeasonLooks";
import { Rail } from "@/components/features/trends/Rail";
import { FloatingMenu, POST_SLIDE, PostAction, PostCarousel } from "@/components/features/trends/PostCarousel";
import { useAppShell } from "@/components/layout/AppShell";
import { amazonSearchUrl, nearbyStoresUrl } from "@/services/shopping/shoppingLinks";
import { UpgradePitch } from "@/components/features/trends/UpgradePitch";
import { PartnerLinkNote, ShoppingLinks } from "@/components/features/shopping/ShoppingLinks";
import { apiErrorMessage } from "@/services/wardrobe/wardrobeService";
import { trendsService } from "@/services/trends/trendsService";
import { saveChatDraft } from "@/utils/chatDraft";
import type { ShoppingDismissReason, ShoppingMark, ShoppingSuggestion, TrendShopping } from "@/types/trends";

const DISMISS_REASONS: { value: ShoppingDismissReason; label: string }[] = [
  { value: "NOT_MY_STYLE", label: "Não é meu estilo" },
  { value: "COLOR", label: "Não gosto da cor" },
  { value: "BUDGET", label: "Fora do orçamento" },
  { value: "ROUTINE", label: "Não combina com a rotina" },
];

// O que a Stella responde quando a sugestão marcada sai da tela (some sozinho)
const CONFIRMATIONS: Record<ShoppingMark, string> = {
  HAVE: "Anotado! A Stella não vai sugerir essa peça de novo.",
  BOUGHT: "Ótima escolha! Quando ela chegar, cadastre no guarda-roupa para entrar nos seus looks.",
  DISMISSED: "Entendido. A Stella vai levar isso em conta nas próximas sugestões.",
};

const POLL_EVERY_MS = 4000;
const POLL_LIMIT_MS = 180_000;

// Confere de tempos em tempos se a lista da semana (montada por um pedido anterior) ficou pronta. Para quando a
// pessoa sai da tela (alive.current = false)
async function waitForList(alive: { current: boolean }): Promise<TrendShopping | null> {
  const deadline = Date.now() + POLL_LIMIT_MS;
  while (Date.now() < deadline && alive.current) {
    await new Promise((resolve) => window.setTimeout(resolve, POLL_EVERY_MS));
    if (!alive.current) return null;
    try {
      const loaded = await trendsService.shopping();
      if (!loaded.pending) return loaded;
    } catch {
      // falha passageira de rede: tenta de novo na próxima volta
    }
  }
  return null;
}

const GENERATING_STEPS = ["Olhando o seu guarda-roupa", "Cruzando com as tendências da estação", "Escolhendo as peças da semana"];
const EASE = [0.22, 1, 0.36, 1] as const;
const dayMonth = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

/**
 * Compras (Couture): toda semana, peças que somam ao armário da pessoa com as tendências. Na primeira visita da
 * semana a Stella monta a lista. "Já tenho", "Comprei" e "Não é para mim" pedem confirmação dentro do card: a pessoa
 * troca por outra sugestão da reserva ou deixa o card na tela, marcado. Sem reserva, o card sempre fica.
 */
export function SeasonShopping() {
  const [data, setData] = useState<TrendShopping | null>(null);
  const [failed, setFailed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ShoppingMark | null>(null);
  const started = useRef(false);
  const alive = useRef(true);

  const generate = async () => {
    setError("");
    setGenerating(true);
    setStep(0);
    try {
      setData(await trendsService.generateShopping());
    } catch (failure) {
      // 429: a lista já está sendo montada (a pessoa saiu e voltou no meio). Em vez de erro, espera ela ficar pronta
      if (isAxiosError(failure) && failure.response?.status === 429) {
        const ready = await waitForList(alive);
        if (ready) {
          setData(ready);
          setGenerating(false);
          return;
        }
      }
      setError(apiErrorMessage(failure, "A Stella não conseguiu montar as sugestões agora. Tente novamente em instantes."));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    trendsService.shopping(controller.signal)
      .then((loaded) => {
        setData(loaded);
        // Primeira visita da semana: a lista é montada agora, sem a pessoa precisar pedir
        if (loaded.enabled && loaded.pending && !started.current) {
          started.current = true;
          void generate();
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, GENERATING_STEPS.length - 1)), 5000);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setTimeout(() => setConfirmation(null), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmation]);

  if (failed) return <p className="text-sm text-stone-500">Não conseguimos carregar as sugestões. Recarregue a página para tentar de novo.</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-3xl bg-stone-200/50" role="status" aria-label="Carregando sugestões" />;
  if (!data.enabled) return <LockedShopping />;
  if (!data.available) {
    return <p className="text-sm text-stone-500">As sugestões chegam assim que a Stella terminar de preparar as tendências da estação.</p>;
  }

  // A mensagem do topo só aparece quando o card saiu da tela; quando ele fica, a própria marcação no card já responde
  const marked = (next: TrendShopping, mark: ShoppingMark | null) => {
    setData(next);
    setConfirmation(mark);
  };

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-[13px] leading-relaxed text-stone-500">
        Peças que somam ao que você já tem, escolhidas a partir das tendências da estação.
        {data.renewsOn && ` Novas sugestões chegam em ${dayMonth(data.renewsOn)}.`}
      </p>

      {generating && <StellaThinking text={GENERATING_STEPS[step]} />}

      <AnimatePresence mode="wait" initial={false}>
        {generating ? (
          <motion.div key="forming" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <FormingSuggestions />
          </motion.div>
        ) : data.suggestions.length > 0 ? (
          <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
            {/* Celular e tablet: um post por vez, na largura da tela */}
            <div className="lg:hidden">
              <ShoppingFeed suggestions={data.suggestions} reserveLeft={data.reserveLeft} onMarked={marked} />
            </div>
            <div className="hidden lg:block">
            <Rail label="Sugestões de compra da semana">
              {/* Cada vaga fica parada no lugar; só o conteúdo dela troca, num esmaecer, quando entra outra sugestão */}
              {data.suggestions.map((suggestion, slot) => (
                <li key={slot} className="flex w-[272px] shrink-0 snap-start sm:w-[290px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, filter: "blur(8px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.45, ease: EASE } }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      className="flex w-full"
                    >
                      <SuggestionCard suggestion={suggestion} reserveLeft={data.reserveLeft} onMarked={marked} />
                    </motion.div>
                  </AnimatePresence>
                </li>
              ))}
            </Rail>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!generating && (error || confirmation) && (
          <motion.div
            key={error ? "error" : confirmation ?? ""}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: { duration: 0.3, ease: EASE } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            {error ? (
                <p role="alert" className="flex flex-wrap items-center gap-3 text-sm text-[#8A4B32]">
                  {error}
                  {data.pending && (
                    <button type="button" onClick={generate} className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900">
                      Tentar novamente
                    </button>
                  )}
                </p>
              ) : confirmation && (
                <p role="status" className="flex items-center gap-2 text-sm text-stone-600">
                  <Check size={15} className="text-[#4E7A5E]" />
                  {CONFIRMATIONS[confirmation]}
                  {confirmation === "BOUGHT" && <Link href="/wardrobe" className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900">Ir para o guarda-roupa</Link>}
                </p>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {data.suggestions.length > 0 && !generating && <PartnerLinkNote />}
      <div className="pt-1">
        <ShoppingChatShortcut />
      </div>
    </div>
  );
}

// Como o card fica depois de marcado: "Já tenho" e "Não é para mim" apagam o card; "Comprei" ganha o verde-sálvia
const MARKED: Record<ShoppingMark, { label: string; icon: React.ReactNode; card: string; content: string; stamp: string }> = {
  HAVE: {
    label: "Você já tem",
    icon: <Check size={12} />,
    card: "border-stone-200/70 bg-stone-50/60",
    content: "opacity-55 grayscale-[40%]",
    stamp: "bg-white/90 text-stone-700",
  },
  BOUGHT: {
    label: "Comprada",
    icon: <ShoppingBag size={12} />,
    card: "border-[#5E8B6E]/35 bg-[#F6FAF7]",
    content: "",
    stamp: "bg-[#5E8B6E] text-white",
  },
  DISMISSED: {
    label: "Não é para você",
    icon: <X size={12} />,
    card: "border-dashed border-stone-300/80 bg-stone-50/60",
    content: "opacity-45 grayscale",
    stamp: "bg-white/90 text-stone-500",
  },
};

const REASON_NAMES: Record<ShoppingDismissReason, string> = {
  NOT_MY_STYLE: "não é seu estilo",
  COLOR: "a cor",
  BUDGET: "o orçamento",
  ROUTINE: "a rotina",
};

interface SuggestionProps {
  suggestion: ShoppingSuggestion;
  reserveLeft: number;
  onMarked: (data: TrendShopping, mark: ShoppingMark | null) => void;
}

// Marcar, confirmar e desfazer: a mesma lógica no card do computador e no post do celular
function useSuggestionActions({ suggestion, reserveLeft, onMarked }: SuggestionProps) {
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<ShoppingMark | null>(null);
  const [error, setError] = useState("");
  const mark = suggestion.status === "VISIBLE" ? null : MARKED[suggestion.status];

  const confirm = async (status: ShoppingMark, reason: ShoppingDismissReason | null, replace: boolean) => {
    setBusy(true);
    setError("");
    try {
      const next = await trendsService.markSuggestion(suggestion.id, status, reason, replace);
      setAsking(null);
      setBusy(false);
      onMarked(next, replace && reserveLeft > 0 ? status : null);
    } catch (failure) {
      setError(apiErrorMessage(failure, "Não deu para registrar agora. Tente de novo."));
      setAsking(null);
      setBusy(false);
    }
  };

  const undo = async () => {
    setBusy(true);
    setError("");
    try {
      onMarked(await trendsService.unmarkSuggestion(suggestion.id), null);
    } catch (failure) {
      setError(apiErrorMessage(failure, "Não deu para desfazer agora. Tente de novo."));
    } finally {
      setBusy(false);
    }
  };

  return { busy, asking, setAsking, error, mark, confirm, undo };
}

// Rodapé de quem já marcou: o que ficou anotado e o "Desfazer"
function MarkedNote({ suggestion, busy, onUndo }: { suggestion: ShoppingSuggestion; busy: boolean; onUndo: () => void }) {
  return (
    <>
      <p className="text-xs text-stone-500">
        {suggestion.status === "BOUGHT" ? (
          <Link href="/wardrobe" className="text-[#2F4A38] underline decoration-[#5E8B6E]/40 underline-offset-4 hover:decoration-[#5E8B6E]">Cadastrar no guarda-roupa</Link>
        ) : suggestion.status === "DISMISSED" && suggestion.dismissReason ? (
          `Motivo: ${REASON_NAMES[suggestion.dismissReason]}`
        ) : suggestion.status === "HAVE" ? "Não volta nas sugestões" : "Anotado para as próximas"}
      </p>
      <button type="button" onClick={onUndo} disabled={busy} className="stella-hit text-xs text-stone-400 transition-colors hover:text-stone-900 disabled:opacity-40">
        Desfazer
      </button>
    </>
  );
}

// compact: na linha do selo (feed do celular), na mesma altura do selo da tendência
function MarkStamp({ suggestion, mark, compact }: { suggestion: ShoppingSuggestion; mark: (typeof MARKED)[ShoppingMark] | null; compact?: boolean }) {
  return (
    <AnimatePresence>
      {mark && (
        <motion.span
          key={suggestion.status}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } }}
          exit={{ opacity: 0 }}
          className={`inline-flex items-center rounded-full font-medium ${compact ? "gap-1 px-2.5 py-0.5 text-[10px] [&>svg]:h-3 [&>svg]:w-3" : "gap-1.5 px-2.5 py-1 text-[11px] shadow-sm backdrop-blur-md"} ${mark.stamp}`}
        >
          {mark.icon}
          {mark.label}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Computador: o card de sempre, lado a lado no slide
function SuggestionCard(props: SuggestionProps) {
  const { suggestion, reserveLeft } = props;
  const { busy, asking, setAsking, error, mark, confirm, undo } = useSuggestionActions(props);

  return (
    <article className={`relative flex w-full flex-col overflow-hidden rounded-3xl border shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-colors duration-500 ${mark ? mark.card : "border-stone-200/80 bg-white"}`}>
      <div className="relative">
        <div className={`transition-[opacity,filter] duration-500 ${mark?.content ?? ""}`}>
          <SuggestionIllustration suggestion={suggestion} />
        </div>
        <span className={`absolute left-3 top-3 transition-opacity duration-500 ${mark && mark.content ? "opacity-60" : ""}`}>
          <TrendBadgeChip badge={suggestion.badge} />
        </span>
        <span className="absolute right-3 top-3"><MarkStamp suggestion={suggestion} mark={mark} /></span>
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <ConfirmPanel
          action={asking}
          reserveLeft={reserveLeft}
          busy={busy}
          onConfirm={(reason, replace) => asking && confirm(asking, reason, replace)}
          onClose={() => setAsking(null)}
        />
        <div className={`flex flex-1 flex-col transition-[opacity,filter] duration-500 ${mark?.content ?? ""}`}>
          <p className="text-[11px] text-stone-400">{suggestion.trendName}</p>
          <h3 className={`mt-1 flex items-center gap-2 font-serif text-xl italic leading-tight tracking-tight text-stone-900 ${suggestion.status === "DISMISSED" ? "line-through decoration-stone-400/70 decoration-1" : ""}`}>
            {suggestion.colorHex && <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-stone-300/70" style={{ backgroundColor: suggestion.colorHex }} />}
            {suggestion.name}
          </h3>
          <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-stone-600">
            <Reasoning text={suggestion.reasoning} pieces={suggestion.pairsWith.map((item) => item.name)} />
          </p>

          {suggestion.pairsWith.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-stone-500">Combina com</span>
              <ul className="flex -space-x-1.5 sm:-space-x-2">
                {suggestion.pairsWith.map((item) => (
                  <li key={item.id}>
                    <PieceThumb item={item} className="h-10 w-10 rounded-full ring-2 ring-white sm:h-8 sm:w-8" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Marcada, a sugestão esconde as lojas sem mudar a altura do card */}
          <div className={`mt-3.5 ${mark ? "invisible" : ""}`} aria-hidden={mark ? true : undefined}>
            <ShoppingLinks suggestion={suggestion.searchTerm} />
          </div>
        </div>

        <div className="mt-4 flex min-h-[58px] items-center justify-between gap-2">
          {mark ? (
            <MarkedNote suggestion={suggestion} busy={busy} onUndo={undo} />
          ) : (
            <div role="group" aria-label="Marcar esta sugestão" className="grid w-full grid-cols-3 divide-x divide-stone-200/70 overflow-hidden rounded-2xl border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
              <MarkButton onClick={() => setAsking("HAVE")} disabled={busy} icon={<Check size={15} />}>Já tenho</MarkButton>
              <MarkButton onClick={() => setAsking("BOUGHT")} disabled={busy} icon={<ShoppingBag size={15} />}>Comprei</MarkButton>
              <MarkButton onClick={() => setAsking("DISMISSED")} disabled={busy} icon={<X size={15} />}>Não quero</MarkButton>
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-[#8A4B32]">{error}</p>}
      </div>
    </article>
  );
}

/**
 * Celular e tablet, como um post do Instagram: só as ilustrações arrastam para o lado (com as bolinhas logo embaixo);
 * o selo, as ações e a legenda ficam fixos no lugar e trocam junto com a sugestão que está na tela.
 */
function ShoppingFeed({ suggestions, reserveLeft, onMarked }: {
  suggestions: ShoppingSuggestion[];
  reserveLeft: number;
  onMarked: (data: TrendShopping, mark: ShoppingMark | null) => void;
}) {
  const [active, setActive] = useState(0);
  const current = suggestions[Math.min(Number.isFinite(active) ? active : 0, suggestions.length - 1)] ?? suggestions[0];
  const currentMark = current.status === "VISIBLE" ? null : MARKED[current.status];

  return (
    <div>
      <header className="flex min-h-[40px] items-center gap-2">
        <span className={currentMark?.content ? "opacity-60" : ""}><TrendBadgeChip badge={current.badge} /></span>
        <span className="min-w-0 flex-1 truncate text-xs text-stone-500">{current.trendName}</span>
        <MarkStamp suggestion={current} mark={currentMark} compact />
      </header>
      <PostCarousel label="Sugestões de compra da semana" count={suggestions.length} onActiveChange={setActive}>
        {suggestions.map((suggestion, slot) => {
          const mark = suggestion.status === "VISIBLE" ? null : MARKED[suggestion.status];
          return (
            <li key={slot} className={POST_SLIDE}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.45, ease: EASE } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className={`overflow-hidden transition-[opacity,filter] duration-500 sm:rounded-2xl [&>*]:!aspect-[4/3] ${mark?.content ?? ""}`}
                >
                  <SuggestionIllustration suggestion={suggestion} />
                </motion.div>
              </AnimatePresence>
            </li>
          );
        })}
      </PostCarousel>
      <SuggestionDetails key={current.id} suggestion={current} reserveLeft={reserveLeft} onMarked={onMarked} />
    </div>
  );
}

// Abaixo das fotos: as ações (ou a confirmação, no mesmo lugar) e a legenda da sugestão que está na tela
function SuggestionDetails(props: SuggestionProps) {
  const { suggestion, reserveLeft } = props;
  const { busy, asking, setAsking, error, mark, confirm, undo } = useSuggestionActions(props);
  const { user } = useAppShell();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      {/* As ações ficam sempre no lugar; a confirmação abre num menu pequeno, flutuando logo acima delas */}
      <div className="relative">
        <FloatingMenu open={asking !== null} locked={busy} onClose={() => setAsking(null)} label="Confirmar">
          {busy ? (
            <div className="flex min-h-[44px] items-center"><StellaThinking text="Anotando" /></div>
          ) : asking && (
            // As mesmas etapas e a mesma tipografia da confirmação de antes: opções uma embaixo da outra
            <ConfirmSteps action={asking} reserveLeft={reserveLeft} onConfirm={(reason, replace) => confirm(asking, reason, replace)} onClose={() => setAsking(null)} />
          )}
        </FloatingMenu>
        <div className="-mx-2 flex min-h-[56px] items-center gap-1">
          {mark ? (
            <div className="flex w-full items-center justify-between gap-3 px-2">
              <MarkedNote suggestion={suggestion} busy={busy} onUndo={undo} />
            </div>
          ) : (
            <>
              <PostAction onClick={() => setAsking("HAVE")} disabled={busy} active={asking === "HAVE"} icon={<Check size={21} strokeWidth={1.6} />}>Já tenho</PostAction>
              <PostAction onClick={() => setAsking("BOUGHT")} disabled={busy} active={asking === "BOUGHT"} icon={<ShoppingBag size={21} strokeWidth={1.6} />}>Comprei</PostAction>
              <PostAction onClick={() => setAsking("DISMISSED")} disabled={busy} active={asking === "DISMISSED"} icon={<X size={21} strokeWidth={1.6} />}>Não quero</PostAction>
              <span className="flex-1" />
              <PostAction href={amazonSearchUrl(suggestion.searchTerm, user?.fashionPreference)} sponsored icon={<Search size={21} strokeWidth={1.6} />}>Online</PostAction>
              <PostAction href={nearbyStoresUrl(suggestion.searchTerm, user?.fashionPreference)} icon={<MapPin size={21} strokeWidth={1.6} />}>Lojas</PostAction>
            </>
          )}
        </div>
      </div>

      <div className={`pb-1 transition-[opacity,filter] duration-500 ${mark?.content ?? ""}`}>
        <h3 className={`flex items-center gap-2 mt-4 font-serif text-[30px] font-semibold italic leading-tight tracking-tight text-stone-900 ${suggestion.status === "DISMISSED" ? "line-through decoration-stone-400/70 decoration-1" : ""}`}>
          {suggestion.colorHex && <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-stone-300/70" style={{ backgroundColor: suggestion.colorHex }} />}
          {suggestion.name}
        </h3>
        <p className={`mt-1 text-sm leading-relaxed text-stone-600 ${expanded ? "" : "line-clamp-2"}`}>
          <Reasoning text={suggestion.reasoning} pieces={suggestion.pairsWith.map((item) => item.name)} />
        </p>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="stella-hit text-sm text-stone-400 hover:text-stone-700">mais</button>
        )}
        {suggestion.pairsWith.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-stone-500">Combina com</span>
            <ul className="flex -space-x-1.5">
              {suggestion.pairsWith.map((item) => (
                <li key={item.id}>
                  <PieceThumb item={item} className="h-9 w-9 rounded-full ring-2 ring-[#FAF8F5]" />
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-[#8A4B32]">{error}</p>}
      </div>
    </div>
  );
}


// Uma das três partes iguais da barra: ícone em cima e o texto embaixo, com luz na letra para parecer tecla
function MarkButton({ onClick, disabled, icon, children }: { onClick: () => void; disabled: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="stella-key group flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[12px] font-medium text-stone-600 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="text-stone-400 transition-colors group-hover:text-stone-700">{icon}</span>
      {children}
    </button>
  );
}

const KEEP_TITLES: Record<ShoppingMark, string> = {
  HAVE: "Marcar que você já tem?",
  BOUGHT: "Marcar como comprada?",
  DISMISSED: "Marcar que não é para você?",
};

// Confirmação dentro do card, no mesmo painel de vidro da troca de look e em duas etapas: o motivo (só no "Não é para
// mim") e depois se a sugestão dá lugar a outra da reserva
function ConfirmPanel({ action, reserveLeft, busy, onConfirm, onClose }: {
  action: ShoppingMark | null;
  reserveLeft: number;
  busy: boolean;
  onConfirm: (reason: ShoppingDismissReason | null, replace: boolean) => void;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="absolute inset-0 z-10 flex flex-col rounded-b-3xl bg-white/90 px-4 pb-4 pt-3.5 backdrop-blur-md"
        >
          {busy ? (
            <div className="flex flex-1 items-center justify-center">
              <StellaThinking text="Anotando" />
            </div>
          ) : (
            <ConfirmSteps action={action} reserveLeft={reserveLeft} onConfirm={onConfirm} onClose={onClose} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// As etapas do painel; monta de novo a cada abertura, então sempre começa do primeiro passo
function ConfirmSteps({ action, reserveLeft, onConfirm, onClose }: {
  action: ShoppingMark;
  reserveLeft: number;
  onConfirm: (reason: ShoppingDismissReason | null, replace: boolean) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ShoppingDismissReason | null | undefined>(action === "DISMISSED" ? undefined : null);
  const askingReason = reason === undefined;
  const options: { key: string; label: string; icon: React.ReactNode; pick: () => void }[] = askingReason
    ? [
        ...DISMISS_REASONS.map((option) => ({ key: option.value, label: option.label, icon: <ChevronRight size={13} />, pick: () => setReason(option.value) })),
        { key: "none", label: "Prefiro não dizer", icon: <ChevronRight size={13} />, pick: () => setReason(null) },
      ]
    : reserveLeft > 0
      ? [
          { key: "swap", label: "Sim, mostrar outra sugestão", icon: <RefreshCw size={12} />, pick: () => onConfirm(reason ?? null, true) },
          { key: "keep", label: "Não, deixar esta marcada aqui", icon: <Check size={13} />, pick: () => onConfirm(reason ?? null, false) },
        ]
      : [
          { key: "keep", label: "Sim, marcar", icon: <Check size={13} />, pick: () => onConfirm(reason ?? null, false) },
          { key: "back", label: "Não, voltar", icon: <X size={13} />, pick: onClose },
        ];
  const title = askingReason ? "O que não combina com você?" : reserveLeft > 0 ? "Trocar por outra sugestão?" : KEEP_TITLES[action];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={askingReason ? "reason" : "swap"}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18, ease: EASE }}
        className="flex flex-1 flex-col"
      >
        <div className="flex items-center justify-between">
          <p className="font-serif text-base italic text-stone-900">{title}</p>
          <button type="button" onClick={onClose} aria-label="Manter esta sugestão" title="Manter esta sugestão" className="stella-hit rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
            <X size={15} />
          </button>
        </div>
        {!askingReason && reserveLeft === 0 && <p className="mt-0.5 text-[12px] text-stone-400">As sugestões desta semana acabaram; ela fica aqui, marcada.</p>}
        <ul className="mt-2 flex-1 divide-y divide-stone-100">
          {options.map((option) => (
            <li key={option.key}>
              <button type="button" onClick={option.pick} className="flex w-full items-center justify-between py-2.5 text-left text-[13px] text-stone-700 transition-colors hover:text-stone-950">
                {option.label}
                <span className="text-stone-300">{option.icon}</span>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}

// A ilustração da peça (a mesma família de imagens dos cards de tendência); sem ela, a cor da peça
function SuggestionIllustration({ suggestion }: { suggestion: ShoppingSuggestion }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);
  const key = suggestion.illustrationKey ? STAND_INS[suggestion.illustrationKey] ?? suggestion.illustrationKey : null;

  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) setMissing(true);
  }, []);

  if (!key || missing) {
    return (
      <div aria-hidden="true" className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: suggestion.colorHex ?? "#F1E9DC" }}>
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.32)_28%,transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_62%,rgba(28,25,23,0.10)_62%)]" />
      </div>
    );
  }
  return (
    // Arquivos estáticos já exportados em 800×800
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={`/tendencias/${key}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setMissing(true)}
      className="aspect-[4/3] w-full bg-[#F1E9DC] object-cover"
    />
  );
}

// Enquanto a Stella escolhe as peças: cards no formato das sugestões, cobertos pela mesma poeira dos looks
function FormingSuggestions() {
  return (
    <ul aria-hidden="true" className="flex gap-3 overflow-hidden">
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="relative w-[272px] shrink-0 overflow-hidden rounded-3xl border border-stone-200/70 bg-[#EFE8DC] sm:w-[290px]">
          <div className="aspect-[4/3] w-full" />
          <div className="space-y-2.5 px-4 pb-6 pt-4">
            <span className="block h-2.5 w-16 rounded-full bg-stone-300/40" />
            <span className="block h-5 w-40 rounded-full bg-stone-300/50" />
            <span className="block h-2.5 w-full rounded-full bg-stone-300/35" />
            <span className="block h-2.5 w-4/5 rounded-full bg-stone-300/35" />
          </div>
          <span className="stella-forming-sheen absolute inset-0" style={{ animationDelay: `${index * 0.35}s` }} />
          <DustField density={1.1} />
        </li>
      ))}
    </ul>
  );
}

// Fora do Couture: a seção aparece embaçada, com o convite para assinar
function LockedShopping() {
  const pieces = ["blazer-oversized", "bolsa-tote", "calca-pantalona", "camisa-linho"];
  return (
    <>
    <UpgradePitch
      title="Compre menos e acerte mais."
      text="Toda semana, a Stella escolhe peças que fazem o seu armário render mais: cada sugestão vem das tendências da estação e já chega dizendo com quais peças suas ela combina."
      benefits={[
        "Sugestões novas toda segunda-feira",
        "Cada peça mostra com o que combina no seu armário",
        "A Stella aprende com o que você já tem, comprou ou não quis",
      ]}
      action="Conhecer o Couture"
    />
    <Link href="/planos" aria-label="Assine o Couture para ver as sugestões de compra" className="group relative block overflow-hidden rounded-3xl">
      <div aria-hidden="true" className="pointer-events-none flex select-none gap-3 blur-[6px]">
        {pieces.map((piece) => (
          <div key={piece} className="w-[272px] shrink-0 overflow-hidden rounded-3xl border border-stone-200/80 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/tendencias/${piece}.webp`} alt="" loading="lazy" className="aspect-[4/3] w-full bg-[#F1E9DC] object-cover" />
            <div className="space-y-2.5 p-4">
              <span className="block h-5 w-36 rounded-full bg-stone-300/80" />
              <span className="block h-2.5 w-full rounded-full bg-stone-200" />
              <span className="block h-2.5 w-4/5 rounded-full bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
      <LockBadge text="Assine para ver as sugestões de compra" />
    </Link>
    </>
  );
}

// Para a peça que a pessoa viu numa loja: uma conversa nova com a pergunta escrita (ela anexa a foto e envia)
function ShoppingChatShortcut() {
  const router = useRouter();
  const open = () => {
    const conversation = crypto.randomUUID();
    saveChatDraft({ conversation, before: "Stella, estou pensando em comprar uma peça nova. Ela combina com o meu guarda-roupa e com as tendências da estação?", after: "", itemIds: [] });
    router.push(`/chat?new=${conversation}`);
  };
  return (
    <button type="button" onClick={open} className="inline-flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-900">
      <MessageCircle size={15} />
      Em dúvida sobre uma peça? <span className="underline decoration-stone-300 underline-offset-4">Mande para a Stella</span>
    </button>
  );
}
