import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/site";

// As páginas públicas (landing, termos e privacidade) podem ser lidas; a área logada fica de fora.
// O login e os primeiros passos não entram aqui de propósito: eles saem das buscas pela marcação "noindex",
// que o buscador só enxerga se puder abrir a página.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/chat", "/wardrobe", "/eventos", "/tendencias", "/planos", "/assinatura", "/profile", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
