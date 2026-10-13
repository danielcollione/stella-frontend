"use client";

import { useEffect } from "react";

const FIELD_SELECTOR = "input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']), textarea, select, [contenteditable='true']";

function focusedField(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement && active.matches(FIELD_SELECTOR) ? active : null;
}

/**
 * Publica no CSS a área realmente visível da tela (--stella-vvh e --stella-vv-top). No iPhone, quando o teclado
 * abre, a página não encolhe: o teclado simplesmente cobre a parte de baixo. Com essas medidas, o app e as
 * janelas se ajustam ao espaço que sobra, como num aplicativo nativo.
 *
 * Também cuida de que o campo em que a pessoa tocou fique à vista: depois que o teclado termina de subir, o
 * campo é rolado para o meio da área visível (vale para qualquer tela, inclusive dentro das janelas).
 */
export function ViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    let revealTimer: number | undefined;

    // Espera o teclado e o ajuste do layout assentarem antes de rolar; chamadas seguidas viram uma só
    const revealFocusedField = (delay: number) => {
      if (!touch) return;
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        focusedField()?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, delay);
    };

    const update = () => {
      // Com zoom de pinça a área visível encolhe por outro motivo: aí as medidas não são atualizadas
      if (viewport.scale > 1.01) return;
      root.style.setProperty("--stella-vvh", `${Math.round(viewport.height)}px`);
      root.style.setProperty("--stella-vv-top", `${Math.round(viewport.offsetTop)}px`);
      // Dentro do app (que não rola como página), o iPhone às vezes desloca a tela ao abrir o teclado:
      // volta ao topo para o cabeçalho não sumir
      if (viewport.offsetTop > 0 && root.classList.contains("stella-app")) window.scrollTo(0, 0);
    };

    const onResize = () => {
      update();
      // O teclado abriu ou fechou: o campo em foco pode ter ficado escondido atrás dele
      revealFocusedField(120);
    };
    // Tocar num campo com o teclado já aberto não muda o tamanho da tela: por isso o foco também dispara
    const onFocusIn = () => revealFocusedField(350);

    update();
    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", update);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.clearTimeout(revealTimer);
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", update);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);
  return null;
}
