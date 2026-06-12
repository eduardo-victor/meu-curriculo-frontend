import { create } from "zustand";
import { z } from "zod";

import {
  clearStoredSession,
  saveSession,
} from "@/services/auth-session-service";

const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  photo: z.string().nullable(),
});

const userResponseSchema = z.object({
  message: z.string(),
  payload: userSchema,
});

export type User = z.infer<typeof userSchema>;

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (accessToken: string, expiresIn: number) => Promise<void>;
  loadProfile: (accessToken: string) => Promise<void>;
  clearSession: () => void;
};

const API_URL = "/api/backend";

async function readApiError(response: Response) {
  try {
    const body = await response.json();
    return typeof body.message === "string"
      ? body.message
      : "Não foi possível concluir a solicitação.";
  } catch {
    return "Não foi possível concluir a solicitação.";
  }
}

async function createUser(accessToken: string) {
  const response = await fetch(`${API_URL}/user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(await readApiError(response));
  }
}

async function getUser(accessToken: string) {
  const response = await fetch(`${API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return userResponseSchema.parse(await response.json()).payload;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (accessToken, expiresIn) => {
    set({ isLoading: true, error: null });

    try {
      await createUser(accessToken);
      const user = await getUser(accessToken);
      saveSession(accessToken, expiresIn);
      set({ user, isLoading: false });
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? "O backend retornou dados de usuário inválidos."
          : error instanceof Error
            ? error.message
            : "Não foi possível entrar.";

      set({ user: null, isLoading: false, error: message });
      throw new Error(message);
    }
  },

  loadProfile: async (accessToken) => {
    set({ isLoading: true, error: null });

    try {
      const user = await getUser(accessToken);
      set({ user, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível carregar o perfil.";

      set({ user: null, isLoading: false, error: message });
      throw new Error(message);
    }
  },

  clearSession: () => {
    clearStoredSession();
    set({ user: null, isLoading: false, error: null });
  },
}));
