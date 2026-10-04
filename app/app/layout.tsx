import type { Metadata, Viewport } from "next";
import "./app.css";
import AppProviders from "./AppProviders";

export const metadata: Metadata = {
  title: { default: "Vitrine Eventos", template: "%s · Vitrine Eventos" },
  description: "Encontre fornecedores para o seu evento: buffet, fotografia, decoração, espaços e muito mais.",
  applicationName: "Vitrine Eventos",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Vitrine", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#3A2F52",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
