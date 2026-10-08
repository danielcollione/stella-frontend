import { useCallback, useSyncExternalStore } from "react";

// Preferência por navegador: "salvar fotos do chat no guarda-roupa"
const STORAGE_KEY = "@stella:save-to-wardrobe";
const CHANGE_EVENT = "stella:save-to-wardrobe-change";

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
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
  // No servidor (e na hidratação) começa desligado; depois reflete o localStorage
  const enabled = useSyncExternalStore(subscribe, read, () => false);

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
