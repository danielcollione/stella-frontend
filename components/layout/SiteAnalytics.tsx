"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Medição de visitas da Vercel (sem cookies e sem identificar a pessoa). Só funciona no site publicado.
 * Os parâmetros do endereço são descartados antes do envio: dentro do app eles carregam códigos de conversa,
 * que não interessam à medição.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        url.search = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
