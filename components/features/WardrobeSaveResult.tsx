import Link from "next/link";
import { AlertCircle, Check, Shirt } from "lucide-react";
import type { WardrobeSaveResult as Result } from "@/types/chat";

// Confirmação discreta, abaixo da resposta da Stella, do que aconteceu com as fotos no guarda-roupa
export function WardrobeSaveResult({ result }: { result: Result }) {
  const saved = result.savedItemIds.length;
  const duplicates = result.duplicateItemIds.length;
  const failed = result.failedCount;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {saved > 0 && (
        <Link href="/wardrobe" className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 font-medium text-stone-700 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900">
          <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
          {saved === 1 ? "Peça salva no guarda-roupa" : `${saved} peças salvas no guarda-roupa`}
        </Link>
      )}
      {duplicates > 0 && (
        <Link href="/wardrobe" className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 font-medium text-stone-600 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900">
          <Shirt aria-hidden="true" className="h-3.5 w-3.5 text-stone-500" />
          {duplicates === 1 ? "Já estava no guarda-roupa" : `${duplicates} peças já estavam no guarda-roupa`}
        </Link>
      )}
      {failed > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-800">
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
          {failed === 1 ? "Não consegui salvar a foto" : `Não consegui salvar ${failed} fotos`}
        </span>
      )}
    </div>
  );
}
