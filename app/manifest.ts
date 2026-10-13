import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/utils/site";

// Manifesto do aplicativo instalável (PWA): com ele o celular oferece "Adicionar à tela inicial" e a Stella
// abre em tela cheia, sem as barras do navegador
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stella — estilista virtual",
    short_name: "Stella",
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    // Quem já tem conta cai direto na conversa; sem sessão, o app leva ao login
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF8F5",
    theme_color: "#FAF8F5",
    categories: ["lifestyle", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Versão com margem maior: o Android recorta o ícone em círculo ou em "squircle"
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
