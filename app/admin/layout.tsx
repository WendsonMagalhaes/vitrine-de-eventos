import type { Metadata, Viewport } from "next";
import { PwaBoot } from "@/lib/pwa";

export const metadata: Metadata = {
  title: "Vitrine Eventos — Administração",
  applicationName: "Vitrine Admin",
  manifest: "/manifest-admin.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Admin", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#3A2F52" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<PwaBoot scope="/admin" /></>;
}
