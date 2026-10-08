import type { ClothingCategory, ClothingFormality, ClothingItem, ClothingStatus } from "@/types/wardrobe";

// Ordem de exibição das abas: de cima para baixo no corpo, depois complementos
export const CATEGORY_ORDER: readonly ClothingCategory[] = ['TOP', 'BOTTOM', 'ONE_PIECE', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORY'];

export const CATEGORY_LABELS: Record<ClothingCategory, { plural: string; singular: string }> = {
  TOP: { plural: 'Partes de cima', singular: 'Parte de cima' },
  BOTTOM: { plural: 'Partes de baixo', singular: 'Parte de baixo' },
  ONE_PIECE: { plural: 'Vestidos e macacões', singular: 'Peça única' },
  OUTERWEAR: { plural: 'Casacos', singular: 'Casaco' },
  FOOTWEAR: { plural: 'Calçados', singular: 'Calçado' },
  ACCESSORY: { plural: 'Acessórios', singular: 'Acessório' },
};

export const STATUS_LABELS: Record<ClothingStatus, string> = {
  AVAILABLE: 'Disponível',
  LAUNDRY: 'Na lavanderia',
  ARCHIVED: 'Arquivada',
};

export const FORMALITY_LABELS: Record<ClothingFormality, string> = {
  CASUAL: 'Casual',
  SMART_CASUAL: 'Casual chique',
  BUSINESS_CASUAL: 'Esporte fino',
  FORMAL: 'Formal',
  BLACK_TIE: 'Black tie',
};

export const FORMALITY_ORDER: readonly ClothingFormality[] = ['CASUAL', 'SMART_CASUAL', 'BUSINESS_CASUAL', 'FORMAL', 'BLACK_TIE'];

// "ACTIVE" = tudo que está no armário (disponível + lavanderia); arquivadas ficam fora por padrão
export type StatusFilter = 'ACTIVE' | ClothingStatus;

export const STATUS_FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Todas as roupas' },
  { value: 'AVAILABLE', label: 'Disponíveis' },
  { value: 'LAUNDRY', label: 'Na lavanderia' },
  { value: 'ARCHIVED', label: 'Arquivadas' },
];

export function matchesStatus(item: ClothingItem, filter: StatusFilter): boolean {
  return filter === 'ACTIVE' ? item.status !== 'ARCHIVED' : item.status === filter;
}

export function isCategory(value: string | null): value is ClothingCategory {
  return value !== null && (CATEGORY_ORDER as readonly string[]).includes(value);
}

export function isStatusFilter(value: string | null): value is StatusFilter {
  return value !== null && STATUS_FILTER_OPTIONS.some((option) => option.value === value);
}

// Peças antigas ou mal identificadas podem não ter nome: usa a categoria + cor
export function displayName(item: ClothingItem): string {
  const name = item.name?.trim();
  if (name) return name;
  return [CATEGORY_LABELS[item.category].singular, item.color?.trim()].filter(Boolean).join(' ');
}

export function displayDetails(item: ClothingItem): string {
  const parts = [item.name?.trim() ? item.color?.trim() : null, item.style?.trim()].filter(Boolean);
  return parts.join(' · ');
}

export function matchesQuery(item: ClothingItem, query: string): boolean {
  const term = normalize(query);
  if (!term) return true;
  // A categoria fica de fora: as abas já filtram por ela, e "calça" não deve trazer "Calçados"
  return [displayName(item), item.color, item.style]
    .some((value) => value && normalize(value).includes(term));
}

// Busca sem acentos e sem diferenciar maiúsculas ("calca" encontra "Calça")
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
