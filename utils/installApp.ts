// Instalação da Stella na tela inicial do celular (PWA): onde a pessoa está (iPhone ou Android, qual navegador, ou
// dentro do navegador de um app como o Instagram) e, no Android, a janela nativa de instalação guardada para o toque.

export type InstallOs = "ios" | "android";

export type InstallBrowser =
  | "safari" // iPhone, Safari
  | "ios-other" // iPhone, Chrome, Firefox, Edge... (também instalam pelo Compartilhar desde o iOS 16.4)
  | "chrome" // Android, Chrome e os demais navegadores com menu de três pontinhos
  | "samsung" // Android, Samsung Internet
  | "in-app"; // navegador de dentro de um app (Instagram, Facebook, TikTok...): ali não dá para instalar

export interface InstallContext {
  os: InstallOs;
  browser: InstallBrowser;
  // Nome do app quando a Stella foi aberta dentro dele (ex: "Instagram")
  app?: string;
}

// Apps que abrem links no próprio navegador; o genérico do Android ("; wv)") cobre os que não se identificam
const IN_APP: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/, "Facebook"],
  [/BytedanceWebview|musical_ly|TikTok/i, "TikTok"],
  [/LinkedInApp/i, "LinkedIn"],
  [/Pinterest/i, "Pinterest"],
  [/Snapchat/i, "Snapchat"],
];

/** Stella já aberta como aplicativo (pelo ícone da tela inicial). */
export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Marca de que a Stella já foi instalada neste celular. No Android, o aplicativo instalado e o Chrome guardam os dados
// juntos: com ela, o convite não volta nem quando a pessoa abre a Stella pelo navegador. No iPhone, o aplicativo da
// tela inicial guarda os dados à parte do Safari, então lá a marca só vale dentro do próprio aplicativo
const INSTALLED_KEY = "stella:app-installed";

function markInstalled() {
  try {
    window.localStorage.setItem(INSTALLED_KEY, "true");
  } catch {
  }
}

export function wasInstalled(): boolean {
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === "true";
  } catch {
    return false;
  }
}

// Calculado uma vez por página: o aparelho e o navegador não mudam, e o React precisa receber sempre o mesmo objeto
let cachedContext: InstallContext | null | undefined;

/** Só no iPhone/iPad e no Android, e quando a Stella ainda não está aberta como aplicativo; no computador, null. */
export function detectInstallContext(): InstallContext | null {
  if (cachedContext === undefined) cachedContext = readInstallContext();
  return cachedContext;
}

function readInstallContext(): InstallContext | null {
  if (isStandalone()) return null;
  const agent = navigator.userAgent;
  // iPad recente se identifica como Mac: o toque é o que o diferencia
  const ios = /iPhone|iPad|iPod/.test(agent) || (agent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(agent);
  if (!ios && !android) return null;
  const os: InstallOs = ios ? "ios" : "android";

  const app = IN_APP.find(([pattern]) => pattern.test(agent))?.[1];
  if (app) return { os, browser: "in-app", app };
  if (android && /; wv\)/.test(agent)) return { os, browser: "in-app" };

  if (ios) {
    // Chrome, Firefox, Edge, Opera e o app do Google se identificam; o resto é o Safari
    const other = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(agent);
    return { os, browser: other ? "ios-other" : "safari" };
  }
  return { os, browser: /SamsungBrowser/i.test(agent) ? "samsung" : "chrome" };
}

/**
 * Endereço que tira a pessoa do navegador do app e abre a Stella no navegador do celular (o Safari no iPhone, o
 * Chrome no Android). Se o app não deixar, nada acontece e os passos manuais continuam valendo.
 */
export function externalBrowserUrl(os: InstallOs): string {
  const { host, pathname, search } = window.location;
  if (os === "ios") return `x-safari-https://${host}${pathname}${search}`;
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
}

// Janela nativa de instalação do Android (Chrome, Samsung Internet, Edge): o navegador avisa uma vez por página que
// a Stella pode ser instalada; o aviso fica guardado aqui até a pessoa tocar em "Instalar"
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Registrado assim que o módulo carrega (pelo layout raiz): o aviso pode chegar antes de qualquer tela montar
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    markInstalled();
    notify();
  });
  if (isStandalone()) markInstalled();
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

/** Abre a janela nativa de instalação; true se a pessoa confirmou. O aviso só vale uma vez. */
export async function promptInstall(): Promise<boolean> {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === "accepted";
}

// Janela de instalação aberta: o convite de avaliação não aparece por cima dela (fica para o próximo momento bom)
let guideOpen = false;

export function setInstallGuideOpen(open: boolean) {
  guideOpen = open;
}

export function isInstallGuideOpen(): boolean {
  return guideOpen;
}
