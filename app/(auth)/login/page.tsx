"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { authService } from "@/services/authService";
import { Logo } from "@/components/ui/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authService.getToken()) router.replace("/chat");
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await authService.login(email.trim(), password);
      router.replace("/chat");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Nao foi possivel entrar. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-6 py-8 bg-[#FAF8F5] text-stone-900">
      <Link href="/" className="inline-flex items-center gap-2 self-start text-sm text-stone-600 hover:text-stone-900">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar
      </Link>
      <div className="w-full max-w-sm m-auto py-12">
        <Logo size="lg" showText />
        <h1 className="mt-10 text-2xl font-serif">Entrar na sua conta</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="username" required
              value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-stone-500 disabled:opacity-60" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Senha</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                autoComplete="current-password" required value={password}
                onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting}
                className="w-full rounded-lg border border-stone-300 bg-white pl-3 pr-12 py-3 text-base outline-none focus:ring-2 focus:ring-stone-500 disabled:opacity-60" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword}
                className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {searchParams.get("reason") === "access-denied" && !error && (
            <p role="alert" className="text-sm text-red-700">
              O servidor recusou o acesso ao chat. Entre novamente. Se o problema persistir, verifique as permissoes da sua conta.
            </p>
          )}
          {error && <p role="alert" className="text-sm text-red-700 break-words">{error}</p>}
          <button type="submit" disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60 disabled:cursor-wait cursor-pointer">
            {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <LogIn size={18} />}
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center" role="status">Carregando...</main>}>
      <LoginForm />
    </Suspense>
  );
}