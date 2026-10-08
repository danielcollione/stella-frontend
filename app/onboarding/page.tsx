"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  Check, 
  LoaderCircle, 
  Briefcase, 
  Coffee, 
  Dumbbell, 
  PartyPopper, 
  Compass, 
  Palmtree,
  Smile,
  Crown,
  Zap
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { PageContent } from "@/components/layout/PageContent";
import { authService } from "@/services/authService";
import { CityAutocomplete } from "@/components/features/CityAutocomplete";
import type { CityValue } from "@/components/features/CityAutocomplete";
import { geoService, toCoordinates } from "@/services/geo/geoService";
import type { UpdateProfileRequestDto } from "@/types/auth";

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;

// Mesmos limites do back-end (UpdateProfileRequestDto)
const MIN_AGE = 13;
const MAX_AGE = 100;
const DEFAULT_AGE = 25;

function isValidAge(value: string): boolean {
  const age = Number(value);
  return /^\d{1,3}$/.test(value) && age >= MIN_AGE && age <= MAX_AGE;
}

function clampAge(value: number): number {
  return Math.min(MAX_AGE, Math.max(MIN_AGE, value));
}

// 1. Opções de Estilo de Vida (Moda)
const LIFESTYLE_OPTIONS = [
  { id: "CORPORATE", label: "Corporativo & Trabalho", icon: Briefcase },
  { id: "CASUAL", label: "Casual & Dia a Dia", icon: Coffee },
  { id: "FITNESS", label: "Esportivo & Fitness", icon: Dumbbell },
  { id: "EVENTS", label: "Festas & Eventos", icon: PartyPopper },
  { id: "URBAN", label: "Urbano & Streetwear", icon: Compass },
  { id: "TRAVEL", label: "Viagens & Lazer", icon: Palmtree },
];

// 2. Comportamentos da Stella (Persona)
const PERSONA_OPTIONS = [
  {
    id: "AMIGA",
    title: "Amiga Sincera & Descontraída",
    desc: "Calorosa, intimista, usa emojis e te dá opiniões reais como uma melhor amiga.",
    icon: Smile,
  },
  {
    id: "CONSULTORA_LUXO",
    title: "Consultora de Alta Costura",
    desc: "Elegante, técnica e sofisticada. Foco na qualidade dos tecidos, caimento e harmonia.",
    icon: Crown,
  },
  {
    id: "PRATICA",
    title: "Direta, Prática & Objetiva",
    desc: "Sem enrolação. Sugestões rápidas de combinações e respostas curtas prontas para uso.",
    icon: Zap,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Estado do formulário
  const [fashionPreference, setFashionPreference] = useState<UpdateProfileRequestDto["fashionPreference"]>("FEMALE");
  const [age, setAge] = useState("");
  const [city, setCity] = useState<CityValue>({ cityName: "", cityCoordinates: "" });
  const [isLocating, setIsLocating] = useState(false);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  const [stellaPersona, setStellaPersona] = useState("AMIGA");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authService.getToken()) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    authService.getCurrentUser(controller.signal).then((user) => {
      if (controller.signal.aborted) return;
      if (user.onboardingCompleted) {
        router.replace("/chat");
        return;
      }
      setFashionPreference(user.fashionPreference ?? "FEMALE");
      setAge(user.age ? String(user.age) : "");
      setCity({ cityName: user.cityName ?? "", cityCoordinates: user.cityCoordinates ?? "" });
      setLifestyles(user.lifestyles ?? []);
      setStellaPersona(user.stellaPersona ?? "AMIGA");
      setIsCheckingSession(false);
    }).catch(() => {
      if (!controller.signal.aborted) router.replace("/login");
    });
    return () => controller.abort();
  }, [router]);

  // Obter localização do navegador
  function handleGetLocation() {
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const found = await geoService.reverseCity(latitude, longitude);
          if (found) {
            setCity({ cityName: found.label, cityCoordinates: toCoordinates(found) });
          } else {
            setCity((current) => ({ ...current, cityCoordinates: toCoordinates({ latitude, longitude }) }));
            setError("Não foi possível identificar o nome da cidade automaticamente. Digite abaixo.");
          }
        } catch {
          setError("Não foi possível identificar o nome da cidade automaticamente. Digite abaixo.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError("Permissão de localização negada. Digite o nome da sua cidade.");
        setIsLocating(false);
      }
    );
  }

  // Alternar seleção de múltiplos estilos de vida
  function toggleLifestyle(id: string) {
    setLifestyles((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Envio final para o Back-end
  async function handleSubmit() {
    if (isSubmitting || isCheckingSession) return;
    if (!isValidAge(age) || !city.cityName.trim() || lifestyles.length === 0) {
      setError("Informe sua idade, sua cidade e selecione pelo menos um estilo de vida.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const user = await authService.updateOnboarding({
        fashionPreference,
        age: Number(age),
        cityName: city.cityName.trim(),
        cityCoordinates: city.cityCoordinates,
        lifestyles,
        stellaPersona,
      });

      if (!user.onboardingCompleted) throw new Error("O servidor nao confirmou a conclusao do perfil.");
      router.replace("/chat");
    } catch (err: unknown) {
      if (!authService.getToken()) {
        router.replace("/login");
        return;
      }
      setIsSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Erro ao salvar perfil. Tente novamente."
      );
    }
  }

  if (isCheckingSession) {
    return <main className="min-h-screen bg-[#FAF8F5] text-stone-600 flex items-center justify-center" role="status">Carregando...</main>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between font-sans">
      {/* 1. BARRA DE PROGRESSO SUPERIOR (ESTILO REFERÊNCIA) */}
      <div className="w-full bg-stone-200/80 h-1.5">
        <div
          className="bg-stone-900 h-1.5 transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* 2. CABEÇALHO COM BOTÃO VOLTAR E LOGO */}
      <header className="px-6 py-6 flex items-center justify-between max-w-2xl mx-auto w-full">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => (prev - 1) as Step)}
            className="p-2 -ml-2 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="Voltar passo"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-8" />
        )}

        <Logo framed />
        <div className="w-8 text-right text-xs text-stone-500 font-mono">
          {step}/{TOTAL_STEPS}
        </div>
      </header>

      {/* 3. CONTEÚDO CENTRAL (PASSO A PASSO) */}
      <main className="px-6 my-auto max-w-xl mx-auto w-full py-8">
        <PageContent contentKey={step}>
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 break-words">
            {error}
          </div>
        )}

        {/* PASSO 1: PREFERÊNCIA DE VESTUÁRIO / GÊNERO */}
        {step === 1 && (
          <div className="stella-stagger">
            <h1 className="text-2xl sm:text-3xl font-serif text-center font-medium">
              Como você prefere se vestir?
            </h1>
            <p className="mt-2 text-xs text-stone-500 text-center">
              A Stella usará isso para adaptar as peças, cortes e a linguagem gramatical.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { id: "FEMALE", label: "Feminino", desc: "Sugestões e pronomes no feminino" },
                { id: "MALE", label: "Masculino", desc: "Sugestões e pronomes no masculino" },
                { id: "NEUTRAL", label: "Sem gênero / Neutro", desc: "Estilo livre e linguagem adaptável" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFashionPreference(opt.id as UpdateProfileRequestDto["fashionPreference"])}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    fashionPreference === opt.id
                      ? "border-stone-400 bg-white text-stone-900 shadow-sm"
                      : "border-stone-200/90 bg-white/80 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{opt.desc}</div>
                  </div>
                  {fashionPreference === opt.id && (
                    <div className="w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-8 py-3.5 rounded-2xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-all cursor-pointer"
            >
              Continuar
            </button>
          </div>
        )}

        {/* PASSO 2: IDADE */}
        {step === 2 && (
          <div className="stella-stagger">
            <h1 className="text-2xl sm:text-3xl font-serif text-center font-medium">
              Qual é a sua idade?
            </h1>
            <p className="mt-2 text-xs text-stone-500 text-center">
              Assim a Stella ajusta referências, peças e ocasiões ao seu momento de vida.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (isValidAge(age)) setStep(3);
              }}
            >
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setAge((current) => String(clampAge(Number(current || DEFAULT_AGE) - 1)))}
                  aria-label="Diminuir idade"
                  className="h-11 w-11 rounded-full border border-stone-200/90 bg-white text-lg text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all cursor-pointer"
                >
                  −
                </button>
                <label className="flex items-baseline gap-2">
                  <span className="sr-only">Idade em anos</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={age}
                    onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="--"
                    className="w-24 bg-transparent text-center font-serif text-5xl text-stone-900 placeholder-stone-300 outline-none border-b border-stone-200 focus:border-stone-400 pb-1 transition-colors"
                  />
                  <span className="text-sm text-stone-500">anos</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAge((current) => String(clampAge(Number(current || DEFAULT_AGE - 1) + 1)))}
                  aria-label="Aumentar idade"
                  className="h-11 w-11 rounded-full border border-stone-200/90 bg-white text-lg text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all cursor-pointer"
                >
                  +
                </button>
              </div>
              <p className={`mt-4 text-center text-xs ${age && !isValidAge(age) ? "text-red-700" : "text-stone-400"}`}>
                {age && !isValidAge(age)
                  ? `Informe uma idade entre ${MIN_AGE} e ${MAX_AGE} anos.`
                  : "Usamos apenas para personalizar as sugestões."}
              </p>

              <button
                type="submit"
                disabled={!isValidAge(age)}
                className="w-full mt-8 py-3.5 rounded-2xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Continuar
              </button>
            </form>
          </div>
        )}

        {/* PASSO 3: CIDADE & GEOLOCALIZAÇÃO */}
        {step === 3 && (
          <div className="stella-stagger">
            <h1 className="text-2xl sm:text-3xl font-serif text-center font-medium">
              Onde você está localizado(a)?
            </h1>
            <p className="mt-2 text-xs text-stone-500 text-center">
              Para considerar o clima da sua região ao sugerir Looks.
            </p>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full p-4 rounded-2xl border border-dashed border-stone-300 bg-white/80 hover:bg-stone-50 hover:border-stone-400 flex items-center justify-center gap-2 text-xs font-medium text-stone-700 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLocating ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <MapPin size={16} />
                )}
                <span>
                  {isLocating
                    ? "Obtendo localização do GPS..."
                    : "Usar minha localização atual"}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <span className="bg-[#FAF8F5] px-3 text-[10px] uppercase text-stone-500">
                  Ou digite manualmente
                </span>
              </div>

              <CityAutocomplete
                value={city}
                onChange={setCity}
                placeholder="Ex: São Paulo, Lisboa, Jacarezinho..."
                inputClassName="w-full p-4 rounded-2xl border border-stone-200/90 bg-white text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!city.cityName.trim()}
              className="w-full mt-8 py-3.5 rounded-2xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Continuar
            </button>
          </div>
        )}

        {/* PASSO 4: ESTILO DE VIDA (MÚLTIPLA ESCOLHA) */}
        {step === 4 && (
          <div className="stella-stagger">
            <h1 className="text-2xl sm:text-3xl font-serif text-center font-medium">
              Qual é o seu estilo de vida?
            </h1>
            <p className="mt-2 text-xs text-stone-500 text-center">
              Selecione todas as opções que fazem parte da sua rotina.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {LIFESTYLE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = lifestyles.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLifestyle(item.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
                      isSelected
                        ? "border-stone-400 bg-white text-stone-900 shadow-sm"
                        : "border-stone-200/90 bg-white/80 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon size={20} className={isSelected ? "text-stone-900" : "text-stone-500"} />
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center text-white">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(5)}
              disabled={lifestyles.length === 0}
              className="w-full mt-8 py-3.5 rounded-2xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Continuar ({lifestyles.length} selecionados)
            </button>
          </div>
        )}

        {/* PASSO 5: COMPORTAMENTO DA STELLA */}
        {step === 5 && (
          <div className="stella-stagger">
            <h1 className="text-2xl sm:text-3xl font-serif text-center font-medium">
              Como a Stella deve se comportar?
            </h1>
            <p className="mt-2 text-xs text-stone-500 text-center">
              Escolha a personalidade da sua inteligência artificial.
            </p>

            <div className="mt-8 space-y-3">
              {PERSONA_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = stellaPersona === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStellaPersona(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-stone-400 bg-white text-stone-900 shadow-sm"
                        : "border-stone-200/90 bg-white/80 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? "bg-stone-100 text-stone-900" : "bg-stone-100/80 text-stone-500"}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span>{item.title}</span>
                        {isSelected && <Check size={14} className="text-stone-900" />}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mt-8 py-3.5 rounded-2xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              <span>{isSubmitting ? "Finalizando..." : "Concluir e Ir para o Chat"}</span>
            </button>
          </div>
        )}
        </PageContent>
      </main>

      {/* 4. RODAPÉ FIXO */}
      <footer className="px-6 py-4 text-center text-[10px] text-stone-500">
        Stella AI Stylist • As suas preferências podem ser alteradas depois nas configurações do perfil.
      </footer>
    </div>
  );
}