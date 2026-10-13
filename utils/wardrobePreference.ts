import { useCallback, useSyncExternalStore } from "react";

// Preferência guardada no aparelho (por navegador): "salvar fotos do chat no guarda-roupa"
const STORAGE_KEY = "@stella:save-to-wardrobe";
const CHANGE_EVENT = "stella:save-to-wardrobe-change";

// Enquanto a pessoa nunca mexeu no botão, ele vale como LIGADO: quem assina um plano já começa salvando as
// fotos do chat no guarda-roupa. Depois do primeiro toque, vale a escolha gravada neste aparelho.
// (Nos planos sem o recurso o botão aparece travado e nada é salvo, qualquer que seja este valor.)
function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // outras abas
  window.addEventListener(CHANGE_EVENT, onChange); // esta aba
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useSaveToWardrobePreference(): [boolean, (enabled: boolean) => void] {
  // No servidor (e na hidratação) usa o padrão, ligado; depois reflete o que está gravado no aparelho
  const enabled = useSyncExternalStore(subscribe, read, () => true);

  const setEnabled = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Sem storage (aba anônima/bloqueada): a escolha não persiste, mas o toggle segue funcionando nesta sessão
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [enabled, setEnabled];
}
