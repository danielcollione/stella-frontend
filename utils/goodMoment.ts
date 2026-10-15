// Momentos bons de uso (resposta da Stella no chat, peça salva, look escolhido ou usado): é logo depois de um deles
// que o convite para avaliar a Stella aparece, nunca do nada
const EVENT = "stella:good-moment";

export function markGoodMoment() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function onGoodMoment(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
