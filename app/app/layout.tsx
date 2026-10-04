import type { Metadata } from "next";
import "./app.css";
import AppProviders from "./AppProviders";

export const metadata: Metadata = {
  title: { default: "Vitrine Eventos", template: "%s · Vitrine Eventos" },
  description: "Encontre fornecedores para o seu evento: buffet, fotografia, decoração, espaços e muito mais.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
