import type { FashionPreference } from "@/types/auth";

// ID de associado da Amazon (público: vai na própria URL). Toda compra feita após o clique conta para ele.
const AMAZON_TAG = "usestella-20";
const MAX_TERM_LENGTH = 80;

const GENDER_TERM: Record<FashionPreference, string | null> = {
  FEMALE: "feminino",
  MALE: "masculino",
  NEUTRAL: null,
};

// "Scarpin nude (salto bloco), para alongar a silhueta." -> "Scarpin nude"
export function searchTerm(suggestion: string): string {
  return suggestion
    .replace(/\([^)]*\)/g, " ")
    .split(/[,;:.–—]/)[0]
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TERM_LENGTH);
}

// Busca na Amazon já com o ID de associado; o gênero do perfil afina o resultado
export function amazonSearchUrl(suggestion: string, preference?: FashionPreference | null): string {
  const term = searchTerm(suggestion);
  const gender = preference ? GENDER_TERM[preference] : null;
  const mentionsGender = /\b(feminin|masculin)/i.test(term);
  const query = gender && !mentionsGender ? `${term} ${gender}` : term;
  return `https://www.amazon.com.br/s?${new URLSearchParams({ k: query, tag: AMAZON_TAG })}`;
}

const SHOES = /\b(sapat|scarpin|sand[aá]li|t[eê]nis|bota|botin|coturno|mocassi|loafer|sapatilh|rasteir|chinelo|mule|oxford|salto|papete|alpargata|cal[cç]ado)/i;
const ACCESSORIES = /\b(bolsa|clutch|carteira|mochila|cinto|brinco|colar|pulseira|anel|rel[oó]gio|[oó]culos|len[cç]o|echarpe|cachecol|chap[eé]u|bon[eé]|gravata|bijuteria|joia|acess[oó]rio)/i;
const GENDER_STORE: Record<FashionPreference, string> = {
  FEMALE: "loja de roupas femininas",
  MALE: "loja de roupas masculinas",
  NEUTRAL: "loja de roupas",
};

// O Maps encontra lojas por tipo, não por produto: "clutch dourada" não acha nada numa cidade pequena
function storeCategory(suggestion: string, preference?: FashionPreference | null): string {
  if (SHOES.test(suggestion)) return "loja de calçados";
  if (ACCESSORIES.test(suggestion)) return "loja de bolsas e acessórios";
  return GENDER_STORE[preference ?? "NEUTRAL"];
}

// Abre o Google Maps nas lojas do tipo certo perto de onde a pessoa está (o Maps usa a localização do aparelho)
export function nearbyStoresUrl(suggestion: string, preference?: FashionPreference | null): string {
  const query = `${storeCategory(suggestion, preference)} perto de mim`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}

const PURCHASE_MARK = /\(Sugest[ãa]o de compra\)/i;

// Peças que a Stella marca no chat: **Nome da peça** (Sugestão de compra). Tolera a marcação dentro do negrito
// e os dois-pontos antes dela: **Nome:** (Sugestão de compra), **Nome (Sugestão de compra)**
export function shoppingSuggestionsIn(markdown: string): string[] {
  const found = new Map<string, string>();
  for (const match of markdown.matchAll(/\*\*([^*\n]+?)\*\*(:?\s*\(Sugest[ãa]o de compra\))?/gi)) {
    if (!match[2] && !PURCHASE_MARK.test(match[1])) continue;
    const term = searchTerm(match[1]);
    if (term) found.set(term.toLowerCase(), term);
  }
  return [...found.values()];
}
