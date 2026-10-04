"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { anyStoredToken, homeFor, storedUser } from "@/lib/authStore";

// Porta de entrada do site e do app instalado: cada perfil vai para a sua área; visitante vê a vitrine.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = anyStoredToken(), u = token ? storedUser() : null;
    router.replace(u ? homeFor(u.role) : token ? "/login" : "/app"); // token sem usuário salvo: o login confirma e encaminha
  }, [router]);
  return <div className="center-screen" role="status" aria-label="Carregando"><LoaderCircle className="spin" size={24} /></div>;
}
