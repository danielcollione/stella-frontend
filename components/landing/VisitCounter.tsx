"use client";

import { useEffect } from "react";
import { api } from "@/services/api";

const SESSION_KEY = "@stella:visit-counted";

/**
 * Soma uma visita à página inicial no painel interno, uma vez por sessão do navegador (recarregar a página não
 * conta de novo). Não envia nenhum dado de quem visita. Navegadores automatizados ficam de fora.
 */
export function VisitCounter() {
  useEffect(() => {
    if (navigator.webdriver) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Sem armazenamento (aba anônima restrita): conta a visita mesmo assim
    }
    api.post("/visits").catch(() => undefined);
  }, []);
  return null;
}
