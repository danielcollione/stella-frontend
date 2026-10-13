// A cor de cada peça é texto livre ("azul marinho", "off-white"): aqui ela vira um tom para os gráficos.
// A ordem importa: os nomes mais específicos vêm antes dos genéricos ("azul marinho" antes de "azul").
const SWATCHES: readonly [term: string, hex: string][] = [
  ["off white", "#F1EADC"], ["off-white", "#F1EADC"], ["creme", "#F1EADC"], ["marfim", "#F1EADC"],
  ["azul marinho", "#1F2A44"], ["marinho", "#1F2A44"], ["azul claro", "#A9C3DD"], ["jeans", "#5B7FA6"], ["denim", "#5B7FA6"],
  ["verde militar", "#5E6B43"], ["militar", "#5E6B43"], ["oliva", "#6F7446"], ["verde agua", "#9CCFC2"],
  ["vinho", "#6D1F2C"], ["bordo", "#6D1F2C"], ["marsala", "#7B2E36"],
  ["terracota", "#B5654A"], ["ferrugem", "#A8562F"], ["caramelo", "#B07A45"], ["mostarda", "#C79A2B"],
  ["caqui", "#B8A67A"], ["nude", "#DDBFA5"], ["areia", "#D9C8A9"], ["bege", "#D6C4A6"],
  ["grafite", "#44403C"], ["chumbo", "#44403C"], ["prata", "#C4C4C4"], ["prateado", "#C4C4C4"],
  ["dourado", "#C8A951"], ["ouro", "#C8A951"], ["bronze", "#9C6B3F"], ["cobre", "#B06E4A"],
  ["lilas", "#B9A3D4"], ["lavanda", "#B9A3D4"], ["roxo", "#6F4E96"], ["violeta", "#6F4E96"],
  ["salmao", "#EFA58F"], ["coral", "#E9806E"], ["pink", "#D94F86"], ["rosa", "#E3A5B0"],
  ["turquesa", "#3FA7A3"], ["petroleo", "#1F5560"],
  ["preto", "#1C1917"], ["preta", "#1C1917"], ["branco", "#FDFCFA"], ["branca", "#FDFCFA"],
  ["cinza", "#A8A29E"], ["marrom", "#6F4E37"], ["cafe", "#5A3E2B"], ["chocolate", "#5A3E2B"],
  ["azul", "#4B6CB7"], ["verde", "#5F8A5A"], ["vermelho", "#B3392F"], ["vermelha", "#B3392F"],
  ["amarelo", "#E3C14F"], ["amarela", "#E3C14F"], ["laranja", "#D98A3D"],
];

const NEUTRAL = "#D6D3D1"; // estampados, multicoloridos e nomes desconhecidos

export function colorSwatch(label: string): string {
  const text = label.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return SWATCHES.find(([term]) => text.includes(term))?.[1] ?? NEUTRAL;
}
