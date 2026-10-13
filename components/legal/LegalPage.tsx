import Link from "next/link";
import type { ReactNode } from "react";

export const SUPPORT_EMAIL = "usestellaapp@gmail.com";

// E-mail de contato já como link: "envie um e-mail para o suporte do app Stella"
export function SupportLink({ children = "suporte do app Stella" }: { children?: ReactNode }) {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600">
      {children}
    </a>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl italic tracking-tight text-stone-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700 [&_li]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-stone-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Página pública de texto longo (termos, privacidade), no visual da Stella. */
export function LegalPage({ eyebrow, title, updatedAt, intro, children }: {
  eyebrow: string; title: string; updatedAt: string; intro: ReactNode; children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-stone-200">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-8 sm:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold italic tracking-wide text-stone-900">stella</Link>
        <Link href="/login" className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold tracking-wide text-stone-50 transition-colors hover:bg-stone-800">Entrar</Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-12 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">{title}</h1>
        <p className="mt-3 text-xs text-stone-400">Última atualização: {updatedAt}</p>
        <div className="mt-6 space-y-3 text-sm leading-relaxed text-stone-700">{intro}</div>
        {children}
      </main>

      <footer className="border-t border-stone-200/70">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-stone-500 sm:px-8">
          <span>Stella · sua estilista pessoal com inteligência artificial</span>
          <nav className="flex gap-5">
            <Link href="/termos" className="hover:text-stone-900">Termos de uso</Link>
            <Link href="/privacidade" className="hover:text-stone-900">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
