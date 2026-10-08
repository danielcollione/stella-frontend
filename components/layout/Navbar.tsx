import Link from 'next/link';

export function Navbar() {
  return (
    <header className="pt-6 px-4 flex justify-center">
      <nav className="w-full max-w-2xl bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
        <span className="font-serif italic text-2xl tracking-wide font-semibold text-stone-900">
          stella
        </span>
        <div className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="#vantagens" className="hover:text-stone-900 transition-colors hidden sm:block">Vantagens</Link>
          <Link href="#precos" className="hover:text-stone-900 transition-colors hidden sm:block">Planos</Link>
          <Link href="/login" className="bg-stone-900 text-stone-50 px-5 py-2 rounded-full text-xs font-semibold tracking-wide hover:bg-stone-800 transition-all shadow-sm">
            Entrar
          </Link>
        </div>
      </nav>
    </header>
  );
}