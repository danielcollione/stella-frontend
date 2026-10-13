let locks = 0;

/**
 * Trava a rolagem da página enquanto uma janela está aberta (o fundo não se mexe por baixo dela).
 * Conta as travas: com duas janelas abertas, a página só destrava quando a última fecha.
 *
 * @returns a função que desfaz esta trava
 */
export function lockPageScroll(): () => void {
  locks += 1;
  document.documentElement.classList.add("stella-scroll-locked");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.documentElement.classList.remove("stella-scroll-locked");
  };
}
