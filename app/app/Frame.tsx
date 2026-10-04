"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Home, LogIn, LogOut, MessageCircle, Search, Sparkles, Store, User } from "lucide-react";
import { useSession } from "@/lib/clientSession";
import { Avatar } from "@/lib/ui";
import { Loading, loginHref } from "./ui";

const TABS = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/buscar", label: "Buscar", icon: Search },
  { href: "/app/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/app/favoritos", label: "Favoritos", icon: Heart },
  { href: "/app/perfil", label: "Perfil", icon: User },
];
const isTabRoute = (p: string) => TABS.some((t) => t.href === p);

// Estrutura do app: abas embaixo no celular (menu lateral no computador). Telas de detalhe, conversa e login ocupam a tela toda.
// O fornecedor também usa a vitrine como cliente; só o administrador é levado ao próprio painel.
export default function Frame({ children }: { children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, "") || "/app";
  const router = useRouter();
  const { user, ready, unread, signOut } = useSession();
  const tabs = isTabRoute(path);
  const redirect = tabs && ready && user?.role === "ADMIN" ? "/admin" : null;

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
          {/* Conta: aparece só no menu lateral (computador). No celular, Entrar e Sair ficam na aba Perfil. */}
          <div className="v-side-foot">
            {user ? (
              <>
                {user.role === "PROVIDER" && <Link href="/fornecedor" className="v-side-link"><Store size={18} /><span>Meu painel</span></Link>}
                <div className="v-side-user">
                  <Avatar name={user.name} />
                  <div><b>{user.name}</b><small>{user.role === "PROVIDER" ? "Fornecedor" : "Cliente"}</small></div>
                  <button className="icon" onClick={() => { signOut(); router.replace("/app"); }} aria-label="Sair" title="Sair"><LogOut size={18} /></button>
                </div>
              </>
            ) : (
              <Link href={loginHref(path)} className="v-side-login"><LogIn size={18} /><span>Entrar</span></Link>
            )}
          </div>
        </nav>
      )}
      <main className="v-main">{children}</main>
    </div>
  );
}
