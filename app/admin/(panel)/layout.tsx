"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Store, Tags, Image as ImageIcon, Users } from "lucide-react";
import { tokenKey } from "@/lib/adminApi";
import { clearAllSessions } from "@/lib/authStore";
import AppShell from "@/lib/AppShell";

const NAV = [
  { href: "/admin", label: "Início", icon: LayoutDashboard },
  { href: "/admin/fornecedores", label: "Fornecedores", icon: Store },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
];
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) router.replace("/login?next=/admin"); else setOk(true);
  }, [router]);
  if (!ok) return null;
  const logout = () => { clearAllSessions(); router.replace("/login?next=/admin"); };
  return <AppShell nav={NAV} area="Administração" user={{ name: "Administrador", role: "Acesso total" }} onLogout={logout}>{children}</AppShell>;
}
