import type { Metadata } from "next";
import LoginScreen from "@/lib/LoginScreen";

export const metadata: Metadata = { title: "Entrar — Vitrine Eventos" };
export default function LoginPage() { return <LoginScreen />; }
