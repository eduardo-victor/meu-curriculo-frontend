"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { restoreSession } from "@/services/auth-session-service";
import { useAuthStore } from "@/store/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const session = restoreSession();

    if (!session) {
      clearSession();
      router.replace("/login");
      return;
    }

    void loadProfile(session.accessToken).catch(() => {
      clearSession();
      router.replace("/login");
    });
  }, [clearSession, loadProfile, router]);

  if (isLoading || !user) {
    return <main>Carregando perfil...</main>;
  }

  if (error) {
    return <main>{error}</main>;
  }

  return (
    <main>
      <h1>Perfil</h1>
      {user.photo ? (
        <Image
          src={user.photo}
          alt={`Foto de ${user.name}`}
          width={96}
          height={96}
        />
      ) : null}
      <p>Nome: {user.name}</p>
      <p>E-mail: {user.email}</p>
      <p>Telefone: {user.phoneNumber ?? "Não informado"}</p>
    </main>
  );
}
