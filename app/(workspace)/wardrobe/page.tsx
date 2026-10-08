"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AlertCircle, ImagePlus, Menu, MessageCircle, Plus, Search, SearchX, Shirt, X } from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { Select } from "@/components/ui/Select";
import { CategoryTabs } from "@/components/features/wardrobe/CategoryTabs";
import type { CategoryTab } from "@/components/features/wardrobe/CategoryTabs";
import { WardrobeGrid, WardrobeGridSkeleton, WardrobeMessage } from "@/components/features/wardrobe/WardrobeGrid";
import { useWardrobeItems } from "@/components/features/wardrobe/useWardrobeItems";
import { WardrobeItemDialog } from "@/components/features/wardrobe/WardrobeItemDialog";
import type { WardrobeDialogTarget } from "@/components/features/wardrobe/WardrobeItemDialog";
import {
  CATEGORY_LABELS, CATEGORY_ORDER, STATUS_FILTER_OPTIONS,
  isCategory, isStatusFilter, matchesQuery, matchesStatus,
} from "@/services/wardrobe/wardrobeCatalog";
import type { StatusFilter } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingCategory } from "@/types/wardrobe";

type CategoryFilter = "ALL" | ClothingCategory;

const GRID_ID = "wardrobe-grid";
const secondaryButtonClass = "inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-2xs transition-colors hover:border-stone-300 hover:text-stone-900 active:scale-[0.98]";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:scale-[0.98]";

export default function WardrobePage() {
  const { openMobileMenu } = useAppShell();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items, status, retry, handleImageError, upsertItem, removeItem } = useWardrobeItems();
  const [dialog, setDialog] = useState<{ key: number; target: WardrobeDialogTarget } | null>(null);

  // A key remonta o diálogo a cada abertura, zerando o estado interno (passo, formulário, prévia)
  function openDialog(target: WardrobeDialogTarget) {
    setDialog((current) => ({ key: (current?.key ?? 0) + 1, target }));
  }
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // Categoria e status ficam na URL: a aba sobrevive ao refresh e pode ser compartilhada
  const categoryParam = searchParams.get("categoria");
  const statusParam = searchParams.get("status");
  const category: CategoryFilter = isCategory(categoryParam) ? categoryParam : "ALL";
  const statusFilter: StatusFilter = isStatusFilter(statusParam) ? statusParam : "ACTIVE";

  function updateFilters(next: { categoria?: CategoryFilter; status?: StatusFilter }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | undefined, fallback: string) => {
      if (value === undefined) return;
      if (value === fallback) params.delete(key);
      else params.set(key, value);
    };
    apply("categoria", next.categoria, "ALL");
    apply("status", next.status, "ACTIVE");
    const search = params.toString();
    window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
  }

  const inStatus = useMemo(
    () => items.filter((item) => matchesStatus(item, statusFilter)),
    [items, statusFilter],
  );

  // Só exibe abas de categorias que o usuário tem (mais a aba atual, para não sumir com a seleção)
  const tabs = useMemo<CategoryTab<CategoryFilter>[]>(() => {
    const counts = new Map<ClothingCategory, number>();
    inStatus.forEach((item) => counts.set(item.category, (counts.get(item.category) ?? 0) + 1));
    return [
      { value: "ALL", label: "Tudo", count: inStatus.length },
      ...CATEGORY_ORDER
        .filter((value) => counts.has(value) || value === category)
        .map((value) => ({ value, label: CATEGORY_LABELS[value].plural, count: counts.get(value) ?? 0 })),
    ];
  }, [inStatus, category]);

  const visibleItems = useMemo(
    () => inStatus.filter((item) => (category === "ALL" || item.category === category) && matchesQuery(item, deferredQuery)),
    [inStatus, category, deferredQuery],
  );

  const activeCount = items.filter((item) => item.status !== "ARCHIVED").length;
  const isFiltered = category !== "ALL" || statusFilter !== "ACTIVE" || deferredQuery.trim() !== "";

  function clearFilters() {
    setQuery("");
    updateFilters({ categoria: "ALL", status: "ACTIVE" });
  }

  function renderContent() {
    if (status === "loading") return <WardrobeGridSkeleton />;

    if (status === "error") {
      return (
        <WardrobeMessage
          icon={<AlertCircle size={22} strokeWidth={1.5} />}
          title="Não conseguimos abrir seu guarda-roupa"
          description="Verifique sua conexão e tente novamente."
          action={<button type="button" onClick={retry} className={buttonClass}>Tentar novamente</button>}
        />
      );
    }

    if (items.length === 0) {
      return (
        <WardrobeMessage
          icon={<Shirt size={22} strokeWidth={1.5} />}
          title="Seu guarda-roupa ainda está vazio"
          description="Adicione fotos das suas roupas aqui ou envie no chat com a opção de salvar ligada. A Stella identifica cada peça e organiza tudo por categoria."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => openDialog({ kind: "create" })} className={buttonClass}><ImagePlus size={16} />Adicionar peça</button>
              <Link href="/chat" className={secondaryButtonClass}><MessageCircle size={16} />Conversar com a Stella</Link>
            </div>
          }
        />
      );
    }

    if (visibleItems.length === 0) {
      return (
        <WardrobeMessage
          icon={<SearchX size={22} strokeWidth={1.5} />}
          title="Nenhuma peça encontrada"
          description="Nenhuma roupa corresponde aos filtros selecionados."
          action={<button type="button" onClick={clearFilters} className="text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-900">Limpar filtros</button>}
        />
      );
    }

    return (
      <WardrobeGrid
        id={GRID_ID}
        labelledBy={`wardrobe-tab-${category}`}
        items={visibleItems}
        onImageError={handleImageError}
        onSelect={(item) => openDialog({ kind: "edit", item })}
      />
    );
  }

  return (
    <div className="min-h-full bg-[#FAF8F5] text-stone-900">
      <main className="mx-auto w-full max-w-6xl pb-16 pt-6 sm:px-8 lg:px-10">
        <PageContent stagger>
          <header className="mb-7 flex items-end justify-between gap-4 px-5 sm:px-0">
            <div className="flex items-center gap-2">
              <button type="button" onClick={openMobileMenu} aria-label="Abrir menu" title="Abrir menu" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:hidden">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Seu acervo</p>
                <h1 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">Guarda-roupa</h1>
              </div>
            </div>
            {status === "ready" && items.length > 0 && (
              <div className="flex items-center gap-3 pb-1">
                <p className="hidden text-sm tabular-nums text-stone-500 sm:block">
                  {activeCount} {activeCount === 1 ? "peça" : "peças"}
                </p>
                <button type="button" onClick={() => openDialog({ kind: "create" })} className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 active:scale-[0.98]">
                  <Plus size={16} />
                  <span>Adicionar<span className="hidden sm:inline"> peça</span></span>
                </button>
              </div>
            )}
          </header>

          {status === "ready" && items.length > 0 && (
            <div className="mb-3 flex items-center gap-2 px-5 sm:px-0">
              <div className="w-44 shrink-0">
                <Select
                  id="wardrobe-status"
                  size="compact"
                  aria-label="Filtrar por situação"
                  value={statusFilter}
                  onValueChange={(value) => updateFilters({ status: value })}
                  options={STATUS_FILTER_OPTIONS}
                />
              </div>
              <label className="relative ml-auto w-full max-w-60">
                <span className="sr-only">Buscar no guarda-roupa</span>
                <Search aria-hidden="true" size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar peça"
                  className="h-9 w-full rounded-full border border-stone-200/90 bg-white pl-9 pr-9 text-xs text-stone-800 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                    <X size={13} />
                  </button>
                )}
              </label>
            </div>
          )}

          {status === "ready" && items.length > 0 && (
            <div className="mb-5">
              <CategoryTabs tabs={tabs} value={category} onChange={(value) => updateFilters({ categoria: value })} controls={GRID_ID} />
            </div>
          )}

          <section aria-live="polite" aria-busy={status === "loading"}>
            {isFiltered && status === "ready" && visibleItems.length > 0 && (
              <p className="sr-only">{visibleItems.length} peças exibidas</p>
            )}
            {renderContent()}
          </section>
        </PageContent>
      </main>

      {dialog && (
        <WardrobeItemDialog
          key={dialog.key}
          target={dialog.target}
          onClose={() => setDialog(null)}
          onSaved={upsertItem}
          onDeleted={removeItem}
        />
      )}
    </div>
  );
}
