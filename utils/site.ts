// Endereço público do site, usado em tudo que os buscadores e as redes sociais leem (canonical, sitemap,
// imagem de compartilhamento). Em outro domínio, basta definir NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://usestella.app").replace(/\/+$/, "");

export const SITE_NAME = "Stella";

export const SITE_TITLE = "Stella — Estilista virtual com IA e guarda-roupa virtual";

export const SITE_DESCRIPTION =
  "A Stella é uma estilista virtual com inteligência artificial: organiza o seu guarda-roupa virtual por foto, "
  + "olha a previsão do tempo e a sua agenda e monta o look certo para cada dia e cada evento. Comece grátis.";

// Termos pelos quais a página quer ser encontrada (o Google os ignora como fator de posição, mas outros
// buscadores e ferramentas ainda leem)
export const SITE_KEYWORDS = [
  "estilista virtual",
  "guarda-roupa virtual",
  "personal stylist com IA",
  "estilista pessoal com inteligência artificial",
  "consultoria de estilo online",
  "o que vestir hoje",
  "montar looks",
  "looks para eventos",
  "organizar guarda-roupa",
  "coloração pessoal",
  "armário cápsula",
  "Stella",
];
