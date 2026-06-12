import { z } from "zod";

const googleClientIdSchema = z.string().min(1, {
  message: "Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID para habilitar o login.",
});

const tokenSuccessResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

const tokenErrorResponseSchema = z.object({
  error: z.string().min(1),
  error_description: z.string().optional(),
});

const popupErrorSchema = z.object({
  type: z.string().optional(),
  message: z.string().optional(),
});

type GoogleTokenClient = {
  requestAccessToken: () => void;
};

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: unknown) => void;
      error_callback: (error: unknown) => void;
    }) => GoogleTokenClient;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

export type GoogleAccessToken = {
  accessToken: string;
  expiresIn: number;
};

function getOAuthErrorMessage(response: unknown) {
  const parsedError = tokenErrorResponseSchema.safeParse(response);

  if (!parsedError.success) {
    return "O Google não autorizou o acesso à sua conta.";
  }

  if (parsedError.data.error === "invalid_client") {
    return "O Client ID do Google é inválido ou não está configurado como Aplicativo da Web.";
  }

  return parsedError.data.error_description ?? `Erro do Google: ${parsedError.data.error}.`;
}

function getPopupErrorMessage(error: unknown) {
  const parsedError = popupErrorSchema.safeParse(error);

  if (!parsedError.success) {
    return "Não foi possível abrir o login do Google.";
  }

  if (parsedError.data.type === "popup_closed") {
    return "A janela de login do Google foi fechada.";
  }

  if (parsedError.data.type === "popup_failed_to_open") {
    return "O navegador bloqueou a janela de login do Google.";
  }

  return parsedError.data.message ?? "O login com Google foi interrompido.";
}

export function requestGoogleAccessToken(): Promise<GoogleAccessToken> {
  const clientIdResult = googleClientIdSchema.safeParse(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  );

  if (!clientIdResult.success) {
    return Promise.reject(
      new Error("Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID no arquivo .env.local."),
    );
  }

  if (!window.google) {
    return Promise.reject(new Error("O login do Google ainda não está disponível."));
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientIdResult.data,
      scope: "openid email profile",
      callback: (rawResponse) => {
        const response = tokenSuccessResponseSchema.safeParse(rawResponse);

        if (!response.success) {
          reject(new Error(getOAuthErrorMessage(rawResponse)));
          return;
        }

        resolve({
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
        });
      },
      error_callback: (error) => {
        reject(new Error(getPopupErrorMessage(error)));
      },
    });

    tokenClient.requestAccessToken();
  });
}
