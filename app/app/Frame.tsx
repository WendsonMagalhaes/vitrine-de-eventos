"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Home, MessageCircle, Search, Sparkles, User } from "lucide-react";
import { useSession } from "@/lib/clientSession";
import { Loading } from "./ui";

const TABS = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/buscar", label: "Buscar", icon: Search },
  { href: "/app/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/app/favoritos", label: "Favoritos", icon: Heart },
  { href: "/app/perfil", label: "Perfil", icon: User },
];
const isTabRoute = (p: string) => TABS.some((t) => t.href === p);

// Estrutura do app: abas embaixo no celular (menu lateral no computador). Telas de detalhe, conversa e login ocupam a tela toda.
// Como no app de celular, fornecedor e administrador não usam as abas da vitrine: cada um vai para o seu painel.
export default function Frame({ children }: { children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, "") || "/app";
  const router = useRouter();
  const { user, ready, unread } = useSession();
  const tabs = isTabRoute(path);
  const redirect = tabs && ready && user && user.role !== "CLIENT" ? (user.role === "ADMIN" ? "/admin" : "/fornecedor") : null;

  useEffect(() => { if (redirect) router.replace(redirect); }, [redirect, router]);

  if (tabs && (!ready || redirect)) return <div className="v-root"><Loading full /></div>;
  return (
    <div className={`v-root ${tabs ? "has-tabs" : ""}`}>
      {tabs && (
        <nav className="v-tabs" aria-label="Seções do aplicativo">
          <Link href="/app" className="v-brand" aria-label="Vitrine Eventos"><span className="logo-mark"><Sparkles size={18} /></span><b>Vitrine Eventos</b></Link>
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = path === href;
            const badge = href === "/app/mensagens" ? unread : 0;
            return (
              <Link key={href} href={href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
                <span className="v-tab-ico"><Icon size={21} strokeWidth={on ? 2.4 : 2} />{badge > 0 && <span className="v-badge" aria-label={`${badge} não lidas`}>{badge > 99 ? "99+" : badge}</span>}</span>
                <span className="v-tab-lbl">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
      <main className="v-main">{children}</main>
    </div>
  );
}
