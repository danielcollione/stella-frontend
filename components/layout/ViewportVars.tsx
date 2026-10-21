"use client";

import { useEffect } from "react";
// Montado em todas as páginas: já começa a escutar o aviso de instalação do Android (ver installApp)
import "@/utils/installApp";

const FIELD_SELECTOR = "input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']), textarea, select, [contenteditable='true']";

export function focusedField(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement && active.matches(FIELD_SELECTOR) ? active : null;
}

// A área rolável mais próxima em volta do campo (a janela, ou a área de conteúdo do app)
function scrollContainerOf(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && parent.scrollHeight > parent.clientHeight + 1) return parent;
  }
  return null;
}

// Diferença mínima entre a janela e a área visível para considerar que o teclado está aberto
// (as barras do navegador, sozinhas, tiram bem menos que isso)
const KEYBOARD_MIN_HEIGHT = 150;

// Espaço que deve sobrar abaixo do campo: é onde abrem as listas de sugestão (cidades, peças, marcas)
const ROOM_BELOW = 140;

/**
 * Traz o campo para a vista rolando SÓ a área rolável em volta dele. De propósito não usa scrollIntoView:
 * no iPhone ele também desloca a tela inteira, e a janela saía do lugar (ficava um vão entre ela e o teclado).
 */
function revealInContainer(field: HTMLElement) {
  const container = scrollContainerOf(field);
  if (!container) return;
  const fieldBox = field.getBoundingClientRect();
  const box = container.getBoundingClientRect();
  const visible = fieldBox.top >= box.top + 12 && fieldBox.bottom <= box.bottom - Math.min(ROOM_BELOW, box.height / 3);
  if (visible) return;
  const centered = container.scrollTop + (fieldBox.top - box.top) - (container.clientHeight - fieldBox.height) / 2;
  container.scrollTo({ top: Math.max(0, centered), behavior: "smooth" });
}

/**
 * Publica no CSS a área realmente visível da tela (--stella-vvh e --stella-vv-top). No iPhone, quando o teclado
 * abre, a página não encolhe: o teclado simplesmente cobre a parte de baixo. Com essas medidas, o app e as
 * janelas se ajustam ao espaço que sobra, como num aplicativo nativo.
 *
 * Também cuida de que o campo em que a pessoa tocou fique à vista: depois que o teclado termina de subir, a
 * área rolável em volta do campo é rolada até ele ficar no meio (vale para qualquer tela e para as janelas).
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
        const field = focusedField();
        if (field) revealInContainer(field);
      }, delay);
    };

    const update = () => {
      // Com zoom de pinça a área visível encolhe por outro motivo: aí as medidas não são atualizadas
      if (viewport.scale > 1.01) return;
      // As medidas só valem enquanto o teclado está aberto (a área visível fica bem menor que a janela).
      // Com ele fechado, saem de cena e o layout volta à altura normal da tela, que o navegador calcula
      // sozinho levando em conta as próprias barras: assim nunca sobra uma medida antiga depois de fechar.
      const keyboardOpen = window.innerHeight - viewport.height > KEYBOARD_MIN_HEIGHT;
      if (!keyboardOpen) {
        root.style.removeProperty("--stella-vvh");
        root.style.removeProperty("--stella-vv-top");
        return;
      }
      root.style.setProperty("--stella-vvh", `${Math.round(viewport.height)}px`);
      root.style.setProperty("--stella-vv-top", `${Math.round(viewport.offsetTop)}px`);
      // Dentro do app (que não rola como página), o iPhone às vezes desloca a tela ao abrir o teclado:
      // volta ao topo para o cabeçalho não sumir
      if (viewport.offsetTop > 0 && root.classList.contains("stella-app")) window.scrollTo(0, 0);
    };

    // O iPhone nem sempre avisa quando termina de mover a tela ao abrir o teclado: por um instante depois
    // de cada mudança, as medidas são conferidas a cada quadro, para a janela não ficar fora de posição
    let syncUntil = 0;
    let syncFrame = 0;
    const keepInSync = () => {
      update();
      if (performance.now() < syncUntil) syncFrame = requestAnimationFrame(keepInSync);
    };
    const syncFor = (milliseconds: number) => {
      syncUntil = performance.now() + milliseconds;
      cancelAnimationFrame(syncFrame);
      syncFrame = requestAnimationFrame(keepInSync);
    };

    const onResize = () => {
      update();
      syncFor(700);
      // O teclado abriu ou fechou: o campo em foco pode ter ficado escondido atrás dele
      revealFocusedField(120);
    };
    // Tocar num campo com o teclado já aberto não muda o tamanho da tela: por isso o foco também dispara
    const onFocusIn = () => {
      syncFor(900);
      revealFocusedField(350);
    };
    const onFocusOut = () => syncFor(1200);
    // Rede de segurança: qualquer toque ou mudança de tamanho da janela confere as medidas de novo
    const onTouchEnd = () => syncFor(300);

    update();
    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", update);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(revealTimer);
      cancelAnimationFrame(syncFrame);
      document.removeEventListener("focusout", onFocusOut);
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", update);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);
  return null;
}
