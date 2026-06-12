"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleIcon } from "@/components/google-icon";
import { requestGoogleAccessToken } from "@/services/google-auth-service";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleLogin = async () => {
    setOauthError(null);

    try {
      const googleToken = await requestGoogleAccessToken();
      await login(googleToken.accessToken, googleToken.expiresIn);
      router.replace("/profile");
    } catch (error) {
      setOauthError(
        error instanceof Error ? error.message : "Não foi possível entrar com o Google.",
      );
    }
  };

  const errorMessage = oauthError ?? storeError;

  return (
    <main className="login-page">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setIsGoogleReady(true)}
        onError={() => setOauthError("Não foi possível carregar o login do Google.")}
      />

      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">Meu Currículo</h1>

        <button
          className="google-login-button"
          type="button"
          onClick={handleLogin}
          disabled={!isGoogleReady || isLoading}
        >
          <GoogleIcon />
          <span>{isLoading ? "Entrando..." : "Login com Google"}</span>
        </button>

        {errorMessage ? (
          <p className="login-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
