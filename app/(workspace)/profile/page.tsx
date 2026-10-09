"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ChevronRight, CreditCard, Eye, EyeOff, Headphones,
  KeyRound, LoaderCircle, LogOut, MapPin, Menu, Save, UserRound,
} from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { Select } from "@/components/ui/Select";
import { PlanStatusPanel } from "@/components/features/billing/PlanStatusPanel";
import { CityAutocomplete } from "@/components/features/CityAutocomplete";
import { authService } from "@/services/authService";
import type { UpdateProfileRequestDto, UserResponseDto } from "@/types/auth";

type ProfileView = "overview" | "plan" | "details" | "password";

const PLAN_LABELS: Record<NonNullable<UserResponseDto["plan"]>, string> = {
  FREE: "Provador", ATELIER: "Atelier", COUTURE: "Couture",
};

const LIFESTYLES = [
  { id: "CORPORATE", label: "Corporativo & Trabalho" },
  { id: "CASUAL", label: "Casual & Dia a Dia" },
  { id: "FITNESS", label: "Esportivo & Fitness" },
  { id: "EVENTS", label: "Festas & Eventos" },
  { id: "URBAN", label: "Urbano & Streetwear" },
  { id: "TRAVEL", label: "Viagens & Lazer" },
];

const FASHION_OPTIONS = [
  { value: "FEMALE", label: "Feminino" },
  { value: "MALE", label: "Masculino" },
  { value: "NEUTRAL", label: "Sem genero / Neutro" },
] as const;

const PERSONA_OPTIONS = [
  { value: "AMIGA", label: "Amiga sincera" },
  { value: "CONSULTORA_LUXO", label: "Consultora de alta costura" },
  { value: "PRATICA", label: "Direta e pratica" },
] as const;

const fieldClass = "w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100 disabled:text-stone-500";
const labelClass = "block text-xs font-medium text-stone-500 mb-2";
const actionClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]).join("").toUpperCase() || "U";
}

function profileValues(user: UserResponseDto): UpdateProfileRequestDto {
  return {
    name: user.name,
    fashionPreference: user.fashionPreference ?? "NEUTRAL",
    cityName: user.cityName ?? "",
    cityCoordinates: user.cityCoordinates ?? "",
    age: user.age ?? undefined,
    lifestyles: [...(user.lifestyles ?? [])],
    stellaPersona: user.stellaPersona === "CONSULTORA" ? "CONSULTORA_LUXO" : user.stellaPersona ?? "AMIGA",
  };
}



export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, openMobileMenu } = useAppShell();
  const searchParams = useSearchParams();
  // ?view=plan: retorno do portal do Stripe abre direto na seção do plano
  const [view, setView] = useState<ProfileView>(() => searchParams.get("view") === "plan" ? "plan" : "overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [profile, setProfile] = useState<UpdateProfileRequestDto>(() => user ? profileValues(user) : ({
    fashionPreference: "NEUTRAL", cityName: "", cityCoordinates: "", lifestyles: [], stellaPersona: "AMIGA",
  }));

  function openView(next: ProfileView) {
    if (saving) return;
    setView(next);
    setError("");
    setSuccess("");
    setPasswords({ current: "", next: "", confirmation: "" });
    setShowPasswords(false);
    if (user) setProfile(profileValues(user));
  }

  function handleFailure(failure: unknown, fallback: string) {
    if (!authService.getToken()) router.replace("/login");
    else setError(failure instanceof Error ? failure.message : fallback);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!profile.name?.trim() || !profile.cityName.trim() || profile.lifestyles.length === 0) {
      setError("Informe seu nome, sua cidade e selecione pelo menos um estilo de vida.");
      return;
    }
    if (profile.age !== undefined && (profile.age < 13 || profile.age > 100)) {
      setError("Informe uma idade entre 13 e 100 anos.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updatedUser = await authService.updateOnboarding(profile);
      setUser(updatedUser);
      setProfile(profileValues(updatedUser));
      setSuccess("Perfil atualizado.");
    } catch (failure) {
      handleFailure(failure, "Nao foi possivel atualizar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");
    if (passwords.next !== passwords.confirmation) {
      setError("As senhas nao correspondem.");
      return;
    }
    if (passwords.next.length < 8 || !/[A-Z]/.test(passwords.next) || !/[0-9]/.test(passwords.next) || new TextEncoder().encode(passwords.next).length > 72) {
      setError("Use pelo menos 8 caracteres, uma maiuscula e um numero, com no maximo 72 bytes.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirmation: "" });
      setShowPasswords(false);
      setSuccess("Senha alterada.");
    } catch (failure) {
      handleFailure(failure, "Nao foi possivel alterar sua senha.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <main className="h-full flex items-center justify-center text-stone-500" role="status">Carregando...</main>;

  const titles: Record<ProfileView, string> = { overview: user.name, plan: "Plano", details: "Perfil", password: "Alterar Senha" };
  const rows = [
    { label: "Plano", icon: CreditCard, target: "plan" as const },
    { label: "Perfil", icon: UserRound, target: "details" as const },
    { label: "Alterar Senha", icon: KeyRound, target: "password" as const },
  ];

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900 font-sans">
      
      
      <main className="flex-1 min-w-0 px-5 sm:px-10 pt-6 pb-12">
        <PageContent contentKey={view} className="max-w-3xl mx-auto" stagger>
          <div className="flex items-center justify-between mb-8">
            {view === "overview" ? (
              <Link href="/chat" aria-label="Voltar ao chat" title="Voltar ao chat" className="p-2 rounded-lg text-stone-500 hover:bg-stone-100"><ArrowLeft size={18} /></Link>
            ) : (
              <button type="button" onClick={() => openView("overview")} disabled={saving} aria-label="Voltar ao perfil" title="Voltar ao perfil" className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-40"><ArrowLeft size={18} /></button>
            )}
            <button type="button" onClick={openMobileMenu} aria-label="Abrir menu" title="Abrir menu" className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 md:hidden"><Menu size={20} /></button>
          </div>
          <header className="text-center mb-8">
            <div className="mx-auto h-20 w-20 rounded-full border-4 border-white shadow-sm bg-stone-200 text-stone-700 flex items-center justify-center text-2xl font-semibold">{initials(user.name)}</div>
            <h1 className="mt-5 text-xl sm:text-2xl font-semibold break-words">{titles[view]}</h1>
            {view !== "overview" && <p className="mt-1 text-xs text-stone-500 break-all">{user.email}</p>}
          </header>
          {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

          {view === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button type="button" onClick={() => openView("plan")} className="rounded-lg border border-stone-200/70 bg-white px-4 py-5 text-left hover:border-stone-400 transition-colors">
                  <CreditCard size={19} className="text-stone-500 mb-3" />
                  <p className="text-sm font-semibold break-words">{PLAN_LABELS[user.plan ?? "FREE"]}</p>
                  <p className="text-xs text-stone-500 mt-1">Plano</p>
                </button>
                <button type="button" onClick={() => openView("details")} className="rounded-lg border border-stone-200/70 bg-white px-4 py-5 text-left hover:border-stone-400 transition-colors">
                  <MapPin size={19} className="text-stone-500 mb-3" />
                  <p className="text-sm font-semibold break-words">{user.cityName || "Nao informada"}</p>
                  <p className="text-xs text-stone-500 mt-1">Localizacao</p>
                </button>
              </div>
              <p className="text-xs font-medium text-stone-500 px-1 mb-3">Minha conta</p>
              <nav aria-label="Opcoes da conta" className="space-y-2">
                {rows.map((row) => {
                  const Icon = row.icon;
                  return <button key={row.target} type="button" onClick={() => openView(row.target)} className="flex items-center gap-3 w-full rounded-lg border border-stone-200/70 bg-white px-4 py-4 text-left text-sm hover:bg-stone-50 transition-colors"><Icon size={18} className="text-stone-600" /><span className="flex-1">{row.label}</span><ChevronRight size={17} className="text-stone-400" /></button>;
                })}
                <button type="button" disabled title="Suporte em breve" className="flex items-center gap-3 w-full rounded-lg border border-stone-200/70 bg-white px-4 py-4 text-left text-sm text-stone-400 cursor-not-allowed"><Headphones size={18} /><span className="flex-1">Falar com Suporte</span><ChevronRight size={17} /></button>
                <button type="button" onClick={() => { setSaving(true); void authService.logout(); }} disabled={saving} className="flex items-center gap-3 w-full rounded-lg border border-stone-200/70 bg-white px-4 py-4 text-left text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"><LogOut size={18} /><span className="flex-1">Sair</span>{saving ? <LoaderCircle size={17} className="animate-spin" /> : <ChevronRight size={17} className="text-red-400" />}</button>
              </nav>
            </>
          )}

          {view === "plan" && <PlanStatusPanel />}

          {view === "details" && (
            <form onSubmit={saveProfile} className="space-y-6">
              <dl className="divide-y divide-stone-200 border-y border-stone-200">
                <div className="grid sm:grid-cols-[120px_1fr] items-center gap-2 py-4">
                  <dt><label htmlFor="profile-name" className="text-xs text-stone-500">Nome</label></dt>
                  <dd><input id="profile-name" required maxLength={255} autoComplete="name" disabled={saving} value={profile.name ?? ""} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className={fieldClass} /></dd>
                </div>
                {[{ label: "E-mail", value: user.email }, { label: "Telefone", value: user.phoneNumber || "Nao informado" }].map((item) => <div key={item.label} className="grid sm:grid-cols-[120px_1fr] gap-2 py-4"><dt className="text-xs text-stone-500">{item.label}</dt><dd className="text-sm break-words">{item.value}</dd></div>)}
              </dl>
              <fieldset disabled={saving} className="space-y-5">
                <div>
                  <label htmlFor="profile-preference" className={labelClass}>Preferencia de roupa</label>
                  <Select id="profile-preference" value={profile.fashionPreference} onValueChange={(fashionPreference) => setProfile({ ...profile, fashionPreference })} options={FASHION_OPTIONS} disabled={saving} />
                </div>
                <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
                  <div>
                    <label htmlFor="profile-age" className={labelClass}>Idade</label>
                    <input id="profile-age" type="text" inputMode="numeric" maxLength={3} placeholder="--" value={profile.age ?? ""} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ""); setProfile({ ...profile, age: digits ? Number(digits) : undefined }); }} className={fieldClass} />
                  </div>
                  <div>
                    <label htmlFor="profile-city" className={labelClass}>Cidade</label>
                    <CityAutocomplete id="profile-city" value={{ cityName: profile.cityName, cityCoordinates: profile.cityCoordinates ?? "" }} onChange={({ cityName, cityCoordinates }) => setProfile({ ...profile, cityName, cityCoordinates })} disabled={saving} inputClassName={fieldClass} />
                  </div>
                </div>
                <fieldset><legend className={labelClass}>Estilos de vida</legend><div className="grid sm:grid-cols-2 gap-3">{[...LIFESTYLES, ...profile.lifestyles.filter((id) => !LIFESTYLES.some((option) => option.id === id)).map((id) => ({ id, label: id }))].map((option) => <label key={option.id} className="flex items-center gap-3 text-sm text-stone-700 py-1.5"><input type="checkbox" checked={profile.lifestyles.includes(option.id)} onChange={(event) => setProfile({ ...profile, lifestyles: event.target.checked ? [...profile.lifestyles, option.id] : profile.lifestyles.filter((id) => id !== option.id) })} className="h-4 w-4 shrink-0 accent-stone-900" />{option.label}</label>)}</div></fieldset>
                <div>
                  <label htmlFor="profile-persona" className={labelClass}>Personalidade da Stella</label>
                  <Select id="profile-persona" value={profile.stellaPersona} onValueChange={(stellaPersona) => setProfile({ ...profile, stellaPersona })} options={PERSONA_OPTIONS} disabled={saving} />
                </div>
              </fieldset>
              <button type="submit" disabled={saving} className={actionClass}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}Salvar perfil</button>
            </form>
          )}

          {view === "password" && (user.authProvider === "GOOGLE" ? (
            <div className="border-y border-stone-200 py-6"><p className="text-sm text-stone-600 mb-5">Senha gerenciada pelo Google.</p><a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className={actionClass}><KeyRound size={16} />Seguranca da conta Google</a></div>
          ) : (
            <form onSubmit={savePassword} className="space-y-5">
              <fieldset disabled={saving} className="space-y-5">
                {[{ key: "current" as const, label: "Senha atual", autoComplete: "current-password" }, { key: "next" as const, label: "Nova senha", autoComplete: "new-password" }, { key: "confirmation" as const, label: "Confirmar nova senha", autoComplete: "new-password" }].map((field) => <div key={field.key}><label htmlFor={`password-${field.key}`} className={labelClass}>{field.label}</label><div className="relative"><input id={`password-${field.key}`} required type={showPasswords ? "text" : "password"} autoComplete={field.autoComplete} value={passwords[field.key]} onChange={(event) => setPasswords({ ...passwords, [field.key]: event.target.value })} className={`${fieldClass} pr-12`} /><button type="button" onClick={() => setShowPasswords(!showPasswords)} title={showPasswords ? "Ocultar senhas" : "Mostrar senhas"} aria-label={showPasswords ? "Ocultar senhas" : "Mostrar senhas"} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800">{showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>)}
              </fieldset>
              <button type="submit" disabled={saving} className={actionClass}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}Alterar senha</button>
            </form>
          ))}
        </PageContent>
      </main>
    </div>
  );
}