import type { NextConfig } from "next";

// Cabeçalhos de proteção enviados em todas as páginas:
// - o site não pode ser embutido em outra página (golpes que escondem botões por cima do app);
// - o navegador não tenta adivinhar o tipo dos arquivos;
// - sites externos abertos a partir do app recebem só o domínio de origem, nunca o endereço completo;
// - câmera e microfone por código ficam desligados (o envio de fotos usa o seletor de arquivos do aparelho,
//   que não depende disso); a localização só vale para o próprio site.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
