"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { authService } from "@/services/authService";
import type { UserResponseDto } from "@/types/auth";
import { prepareGoogleAuth } from "@/utils/google";
import { Logo } from "@/components/ui/Logo";
import { PageContent } from "@/components/layout/PageContent";

// Ícone SVG Oficial do Google
function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de Controle de Fluxo
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  // Estados dos Campos
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Validação de Senha para Registro
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  useEffect(() => {
    void prepareGoogleAuth().catch(() => {});
    if (!authService.getToken()) return;
    let cancelled = false;
    authService.getCurrentUser().then((user) => {
      if (!cancelled) router.replace(user.onboardingCompleted ? "/chat" : "/onboarding");
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [router]);

  function handleAuthSuccess(user: UserResponseDto) {
    router.replace(user.onboardingCompleted ? "/chat" : "/onboarding");
  }

  function handleStartRegistration() {
    if (isSubmitting) return;
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Informe um e-mail valido para criar sua conta.");
      return;
    }
    setEmail(trimmedEmail);
    if (trimmedEmail && !name.trim()) setName(trimmedEmail.split("@")[0]);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setMode("REGISTER");
    setRegisterStep(trimmedEmail ? 2 : 1);
    setError("");
  }

  // Handler de Login Tradicional
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const user = await authService.login(email.trim(), password);
      handleAuthSuccess(user);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível entrar. Verifique suas credenciais."
      );
      setIsSubmitting(false);
    }
  }

  // Handler do Passo 1 de Registro
  function handleNextRegisterStep(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError("Por favor, informe o seu nome e e-mail.");
      return;
    }
    setError("");
    setRegisterStep(2);
  }

  // Handler do Registro Final
  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!isPasswordValid) {
      setError("A senha não atende aos requisitos mínimos de segurança.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const user = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      handleAuthSuccess(user);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Erro ao criar conta. Tente novamente."
      );
      setIsSubmitting(false);
    }
  }

  // Handler do Login/Registro com Google
  async function handleGoogleAuth() {
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const user = await authService.loginWithGoogle();
      handleAuthSuccess(user);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Falha na autenticação com o Google."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-stone-900 font-sans">
      {/* 1. SEÇÃO ESQUERDA - PAINEL DE AUTENTICAÇÃO */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto md:max-w-none">
        
        {/* Topo / Voltar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar para o início
          </Link>
          <Logo size="sm" showText={false} />
        </div>

        {/* Corpo do Formulário */}
        <PageContent contentKey={`${mode}-${mode === "REGISTER" ? registerStep : 0}`} className="my-auto py-8" stagger>
          <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight">
            {mode === "LOGIN" ? "Boas-vindas!" : "Criar sua conta"}
          </h1>
          <p className="mt-2 text-sm text-stone-500 font-light">
            {mode === "LOGIN"
              ? "Entre para acessar sua estilista pessoal e guarda-roupa."
              : registerStep === 1
              ? "Informe seus dados básicos para dar o primeiro passo."
              : "Defina uma senha segura para proteger sua conta."}
          </p>

          {/* MENAGENS DE ERRO */}
          {searchParams.get("reason") === "access-denied" && !error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              O servidor recusou o acesso ao chat. Faça login novamente.
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 break-words">
              {error}
            </div>
          )}

          {/* ================= MODOS DE FORMULÁRIO ================= */}

          {/* FLUXO 1: LOGIN TRADICIONAL */}
          {mode === "LOGIN" && (
            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="seu@email.com"
                  className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-stone-200/90 bg-white pl-4 pr-12 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-800 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-stone-800 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm cursor-pointer"
              >
                {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <LogIn size={18} />}
                {isSubmitting ? "Entrando..." : "Fazer Login"}
              </button>
            </form>
          )}

          {/* FLUXO 2: REGISTRO - PASSO 1 (NOME E EMAIL) */}
          {mode === "REGISTER" && registerStep === 1 && (
            <form onSubmit={handleNextRegisterStep} className="mt-8 space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Nome Completo
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Daniel Collione"
                  className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  E-mail
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="seu@email.com"
                  className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
              >
                <span>Continuar para Senha</span>
                <ArrowLeft size={16} className="rotate-180" />
              </button>
            </form>
          )}

          {/* FLUXO 3: REGISTRO - PASSO 2 (SENHA E CONFIRMAÇÃO) */}
          {mode === "REGISTER" && registerStep === 2 && (
            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <div>
                <label htmlFor="reg-email-password" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  E-mail
                </label>
                <input
                  id="reg-email-password"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="seu@email.com"
                  className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="reg-pass" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Criar Senha
                </label>
                <div className="relative">
                  <input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-stone-200/90 bg-white pl-4 pr-12 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-800"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Confirmar Senha
                </label>
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 transition-all"
                />
              </div>

              {/* Checklist de Validação da Senha */}
              <div className="p-3 bg-stone-100/80 rounded-xl space-y-1.5 text-xs text-stone-600 border border-stone-200/60">
                <div className="flex items-center gap-2">
                  {hasMinLength ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-stone-400" />}
                  <span>Pelo menos 8 caracteres</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUppercase ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-stone-400" />}
                  <span>Pelo menos uma letra maiúscula</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-stone-400" />}
                  <span>Pelo menos um número</span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordsMatch ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-stone-400" />}
                  <span>As senhas correspondem</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="w-1/3 py-3.5 rounded-2xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isPasswordValid}
                  className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {isSubmitting ? "Criando..." : "Concluir Cadastro"}
                </button>
              </div>
            </form>
          )}

          {/* DIVISOR OU */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200/80"></div>
            </div>
            <span className="relative bg-[#FAF8F5] px-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
              ou
            </span>
          </div>

          {/* BOTÃO GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
          >
            <GoogleIcon />
            <span>Continuar com Google</span>
          </button>

          {/* ALTERNÂNCIA DE MODOS (CRIAR CONTA vs FAZER LOGIN) */}
          <div className="mt-8 text-center">
            {mode === "LOGIN" ? (
              <button
                type="button"
                onClick={handleStartRegistration}
                className="w-full py-3 rounded-2xl border border-stone-900/10 hover:border-stone-900/30 text-stone-900 text-sm font-medium transition-all"
              >
                Criar conta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isSubmitting) return;
                  setMode("LOGIN");
                  setPassword("");
                  setConfirmPassword("");
                  setShowPassword(false);
                  setError("");
                }}
                className="w-full py-3 rounded-2xl border border-stone-900/10 hover:border-stone-900/30 text-stone-900 text-sm font-medium transition-all"
              >
                Já tenho uma conta (Fazer Login)
              </button>
            )}
          </div>

        </PageContent>

        {/* Rodapé / Termos */}
        <p className="text-[11px] text-stone-400 text-center font-light">
          Ao continuar, você concorda com os Nossos Termos de Serviço e Política de Privacidade LGPD.
        </p>
      </div>

      {/* 2. SEÇÃO DIREITA - PAINEL EDITORIAL VISUAL (MODA / STELLA) */}
      <div className="hidden md:flex md:w-1/2 p-6 justify-center items-center">
        <div className="relative w-full h-full max-h-[92vh] rounded-3xl overflow-hidden shadow-xl border border-stone-200/40 group">
          <Image
            src="/logo.jpg"
            alt="Stella Fashion Styling"
            fill
            className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
            priority
          />
          {/* Overlay Elegante com Gradiente Escuro na Base */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent flex flex-col justify-end p-10 text-white">
            <span className="font-serif italic text-3xl tracking-tight">stella.ai</span>
            <p className="text-sm text-stone-200 mt-2 font-light max-w-md leading-relaxed">
              Sua estilista pessoal com inteligência artificial e privacidade Nível 2 por criptografia.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#FAF8F5] text-stone-600 text-xs">
          Carregando a experiência Stella...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}