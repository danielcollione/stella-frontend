interface GoogleOAuth {
  initCodeClient(config: {
    client_id: string;
    scope: string;
    ux_mode: 'popup';
    select_account: boolean;
    callback: (response: { code?: string; error?: string }) => void;
    error_callback: (error: { type: string }) => void;
  }): { requestCode(): void };
}

let sdkPromise: Promise<GoogleOAuth> | undefined;

function getOAuth(): GoogleOAuth | undefined {
  return (window as Window & { google?: { accounts?: { oauth2?: GoogleOAuth } } })
    .google?.accounts?.oauth2;
}

function loadGoogleOAuth(): Promise<GoogleOAuth> {
  const oauth = getOAuth();
  if (oauth) return Promise.resolve(oauth);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<GoogleOAuth>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('Nao foi possivel carregar o Google. Tente novamente.'));
    }
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const oauth = getOAuth();
      if (!oauth) return fail();
      window.clearTimeout(timeout);
      resolve(oauth);
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdkPromise = undefined;
    throw error;
  });

  return sdkPromise;
}

export async function prepareGoogleAuth(): Promise<void> {
  if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) await loadGoogleOAuth();
}

export async function requestGoogleAuthorizationCode(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID para continuar com Google.');
  }
  const oauth = await loadGoogleOAuth();

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      fail('A autenticacao com Google expirou. Tente novamente.');
    }, 180000);

    function fail(message: string) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      reject(new Error(message));
    }

    try {
      const client = oauth.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        select_account: true,
        callback: ({ code, error }) => {
          if (settled) return;
          if (error || !code) return fail('O acesso com Google foi cancelado ou recusado.');
          settled = true;
          window.clearTimeout(timeout);
          resolve(code);
        },
        error_callback: ({ type }) => {
          fail(type === 'popup_failed_to_open'
            ? 'Permita pop-ups para este site e tente novamente.'
            : 'A janela de login do Google foi fechada. Tente novamente.');
        },
      });
      client.requestCode();
    } catch {
      fail('Nao foi possivel abrir o login do Google. Tente novamente.');
    }
  });
}