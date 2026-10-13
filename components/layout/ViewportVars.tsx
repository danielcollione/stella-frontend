"use client";

import { useEffect } from "react";

/**
 * Publica no CSS a área realmente visível da tela (--stella-vvh e --stella-vv-top). No iPhone, quando o teclado
 * abre, a página não encolhe: o teclado simplesmente cobre a parte de baixo. Com essas medidas, o app e as
 * janelas se ajustam ao espaço que sobra, como num aplicativo nativo.
 */
export function ViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const update = () => {
      // Com zoom de pinça a área visível encolhe por outro motivo: aí as medidas não são atualizadas
      if (viewport.scale > 1.01) return;
      root.style.setProperty("--stella-vvh", `${Math.round(viewport.height)}px`);
      root.style.setProperty("--stella-vv-top", `${Math.round(viewport.offsetTop)}px`);
      // Dentro do app (que não rola como página), o iPhone às vezes desloca a tela ao abrir o teclado:
      // volta ao topo para o cabeçalho não sumir
      if (viewport.offsetTop > 0 && root.classList.contains("stella-app")) window.scrollTo(0, 0);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return null;
}
