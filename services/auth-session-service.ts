import { z } from "zod";

const SESSION_KEY = "meu-curriculo-auth";

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

export type AuthSession = z.infer<typeof sessionSchema>;

export function saveSession(accessToken: string, expiresIn: number) {
  const session: AuthSession = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function restoreSession(): AuthSession | null {
  const storedSession = sessionStorage.getItem(SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = sessionSchema.parse(JSON.parse(storedSession));

    if (session.expiresAt <= Date.now()) {
      clearStoredSession();
      return null;
    }

    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
