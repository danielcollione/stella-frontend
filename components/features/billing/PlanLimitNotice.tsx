import Link from "next/link";
import { Sparkles } from "lucide-react";

// Convite elegante quando o plano não permite a ação (HTTP 402), no lugar de uma mensagem de erro
export function PlanLimitNotice({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-stone-200/90 bg-white shadow-2xs ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-stone-900" />
        <span>{message}</span>
      </p>
      <Link href="/planos" className="mt-3 inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800">
        Conhecer os planos
      </Link>
    </div>
  );
}
