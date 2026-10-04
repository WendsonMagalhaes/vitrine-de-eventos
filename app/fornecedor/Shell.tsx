"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Images, LayoutDashboard, MessageCircle, Package, Store, UserCog, UserRound } from "lucide-react";
import { providerApi, providerTokenKey } from "@/lib/providerApi";
import { ProviderContext } from "@/lib/providerContext";
import { Badge } from "@/lib/providerActions";
import AppShell from "@/lib/AppShell";
import { DockProvider, Notifier } from "./ChatDock";
import { disableWebPush, useSyncWebPush } from "@/lib/webPush";
import { clearAllSessions } from "@/lib/authStore";

const NAV = [
  { href: "/fornecedor", label: "Início", icon: LayoutDashboard },
  { href: "/fornecedor/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/fornecedor/perfil", label: "Informações", short: "Perfil", icon: UserRound },
  { href: "/fornecedor/fotos", label: "Fotos", icon: Images },
  { href: "/fornecedor/servicos", label: "Serviços", icon: Package },
  { href: "/fornecedor/conta", label: "Conta", icon: UserCog },
];

// A tela de login fica fora do painel. São dois componentes diferentes para que os hooks do painel
// só existam quando ele está na tela.
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith("/fornecedor/login") ? <>{children}</> : <Panel>{children}</Panel>;
}

function Panel({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [feed, setFeed] = useState<{ count: number; latest: any } | null>(null);

  const logout = useCallback(() => { void disableWebPush("/", providerApi); clearAllSessions(); router.replace("/login?next=/fornecedor"); }, [router]);
  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([providerApi("/api/providers/me"), providerApi("/api/categories")]);
      if (!m) throw new Error("Perfil de fornecedor não encontrado");
      setMe(m); setCats(c); setError("");
    } catch (e: any) {
      if (e.status === 401 || e.status === 403) logout(); else setError(e.message);
    }
  }, [logout]);
  useEffect(() => {
    if (!localStorage.getItem(providerTokenKey)) router.replace("/login?next=/fornecedor"); else load();
  }, [router, load]);

  // Mensagens não lidas (e a mais recente, para o aviso): consulta a cada 3 s (o navegador reduz o ritmo sozinho em aba escondida).
  const refreshUnread = useCallback(async () => {
    try { setFeed(await providerApi("/api/chat/unread")); } catch { /* tenta no próximo ciclo */ }
  }, []);
  const ready = !!me;
  useSyncWebPush("/", providerApi, ready, me?.userId);
  useEffect(() => {
    if (!ready) return;
    refreshUnread();
    const t = setInterval(refreshUnread, 3000);
    const onVis = () => document.visibilityState === "visible" && refreshUnread();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [ready, refreshUnread]);

  if (error) return <div className="center-screen"><div className="card card-body stack" style={{ maxWidth: 380, gap: 14 }}><p className="err" style={{ margin: 0 }}>{error}</p><button className="btn" onClick={logout}>Sair</button></div></div>;
  if (!me) return <div className="center-screen"><p className="mute">Carregando…</p></div>;

  const n = feed?.count ?? 0;
  const nav = NAV.map((i) => (i.href === "/fornecedor/mensagens" ? { ...i, badge: n } : i));
  return (
    <ProviderContext.Provider value={{ me, cats, reload: load, unread: n, latest: feed ? feed.latest : undefined, refreshUnread }}>
      <AppShell nav={nav} area="Painel do fornecedor" user={{ name: me.name, role: "Fornecedor" }} badge={<><Link href="/app" className="btn sm" title="Ver a vitrine como cliente"><Store size={14} /><span className="lbl-sm">Ver vitrine</span></Link><Badge status={me.status} /></>} onLogout={logout}>
        {/* O chat flutuante e os avisos ficam dentro do AppShell para usar o mesmo ConfirmProvider e Toaster do painel. */}
        <DockProvider>
          <Notifier />
          {children}
        </DockProvider>
      </AppShell>
    </ProviderContext.Provider>
  );
}
