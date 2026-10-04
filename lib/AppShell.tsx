"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/lib/confirm";
import { Avatar } from "@/lib/ui";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; short?: string }; // badge = contador (ex.: mensagens não lidas); short = rótulo curto da barra de baixo no celular
const fmt = (n: number) => (n > 99 ? "99+" : String(n));

// Estrutura única dos dois painéis: menu lateral, barra superior, conteúdo e abas no celular.
export default function AppShell({ nav, area, user, badge, onLogout, children }: {
  nav: NavItem[]; area: string; user: { name: string; role: string }; badge?: React.ReactNode; onLogout: () => void; children: React.ReactNode;
}) {
  const path = usePathname();
  const root = nav[0].href;
  const isOn = (href: string) => (href === root ? path === href : path.startsWith(href));
  const current = nav.find((n) => isOn(n.href)) ?? nav[0];
  return (
    <ConfirmProvider>
      <div className="app">
        <aside className="side">
          <div className="side-brand"><span className="logo-mark"><Sparkles size={19} /></span><div><b>Vitrine Eventos</b><small>{area}</small></div></div>
          <nav className="nav" aria-label="Seções">
            {nav.map(({ href, label, icon: Icon, badge }) => (
              <Link key={href} href={href} title={label} className={isOn(href) ? "on" : ""} aria-current={isOn(href) ? "page" : undefined}>
                <Icon size={18} /><span className="lbl">{label}</span>
                {!!badge && <span className="nav-badge" aria-label={`${badge} não lidas`}>{fmt(badge)}</span>}
              </Link>
            ))}
          </nav>
          <div className="side-foot">
            <Avatar name={user.name} />
            <div className="side-user"><b>{user.name}</b><small>{user.role}</small></div>
            <button className="icon" onClick={onLogout} aria-label="Sair" title="Sair"><LogOut size={18} /></button>
          </div>
        </aside>

        <div className="main">
          <header className="top">
            <div className="crumbs"><span>{area}</span><ChevronRight size={14} /><b>{current.label}</b></div>
            <div className="top-brand"><span className="logo-mark" style={{ width: 32, height: 32 }}><Sparkles size={17} /></span>Vitrine Eventos</div>
            <div className="top-right">
              {badge}
              <div className="top-user"><span className="n">{user.name}</span><Avatar name={user.name} /></div>
              <button className="icon top-out" onClick={onLogout} aria-label="Sair" title="Sair"><LogOut size={18} /></button>
            </div>
          </header>
          <div className="page">{children}</div>
        </div>

        <nav className="tabbar" aria-label="Seções">
          {nav.map(({ href, label, short, icon: Icon, badge }) => (
            <Link key={href} href={href} className={isOn(href) ? "on" : ""} aria-current={isOn(href) ? "page" : undefined}>
              <span className="tab-ico"><Icon size={20} />{!!badge && <span className="nav-badge" aria-label={`${badge} não lidas`}>{fmt(badge)}</span>}</span>{short ?? label}
            </Link>
          ))}
        </nav>
      </div>
      <Toaster position="top-right" offset={72} toastOptions={{ classNames: { toast: "vt-toast", success: "vt-success", error: "vt-error" } }} />
    </ConfirmProvider>
  );
}
