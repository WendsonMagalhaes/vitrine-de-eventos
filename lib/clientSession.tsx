"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clientApi, clientTokenKey, clientUserKey } from "./clientApi";
import { providerTokenKey } from "./providerApi";
import { tokenKey as adminTokenKey } from "./adminApi";
import { clearApiCache } from "./useApi";

export type Role = "CLIENT" | "PROVIDER" | "ADMIN";
export type SessionUser = { id: string; name: string; email?: string; role: Role; provider?: { id: string; status: string; featured: boolean } | null };
type Ctx = {
  user: SessionUser | null; ready: boolean;
  signIn: (r: { token: string; user: SessionUser }) => void; signOut: () => void; refresh: () => Promise<void>;
  unread: number; refreshUnread: () => Promise<void>;
};
const SessionCtx = createContext<Ctx | null>(null);

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession fora do SessionProvider");
  return c;
}

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const drop = (k: string) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } };

// Guarda quem está logado no app web. Mesmo papel da sessão do app de celular: o "role" decide a experiência
// (cliente fica aqui, fornecedor vai para /fornecedor, administrador para /admin).
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!read(clientTokenKey)) { setUser(null); return; }
    try {
      const me = await clientApi("/api/me");
      write(clientUserKey, JSON.stringify(me));
      setUser(me);
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403 || e?.status === 404) { drop(clientTokenKey); drop(clientUserKey); setUser(null); }
      else { // sem internet: usa o que estava salvo
        try { setUser(JSON.parse(read(clientUserKey) ?? "null")); } catch { setUser(null); }
      }
    }
  }, []);

  useEffect(() => {
    // Mostra o último usuário salvo na hora (abre mais rápido, funciona offline) e confirma com a API em seguida.
    try { const u = JSON.parse(read(clientUserKey) ?? "null"); if (u && read(clientTokenKey)) setUser(u); } catch { /* ignora */ }
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const signIn = useCallback((r: { token: string; user: SessionUser }) => {
    write(clientTokenKey, r.token); write(clientUserKey, JSON.stringify(r.user));
    // Quem é fornecedor ou admin já entra também no painel correspondente, sem pedir a senha duas vezes.
    if (r.user.role === "PROVIDER") write(providerTokenKey, r.token);
    if (r.user.role === "ADMIN") write(adminTokenKey, r.token);
    clearApiCache(); setUser(r.user); setUnread(0);
    refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    drop(clientTokenKey); drop(clientUserKey); drop(providerTokenKey); drop(adminTokenKey);
    clearApiCache(); setUser(null); setUnread(0);
  }, []);

  const chatOn = user?.role === "CLIENT";
  const refreshUnread = useCallback(async () => {
    try { const r = await clientApi("/api/chat/unread"); setUnread(r?.count ?? 0); } catch { /* tenta no próximo ciclo */ }
  }, []);
  useEffect(() => {
    if (!chatOn) { setUnread(0); return; }
    refreshUnread();
    const t = setInterval(() => document.visibilityState === "visible" && refreshUnread(), 4000);
    const onVis = () => document.visibilityState === "visible" && refreshUnread();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [chatOn, refreshUnread]);

  const value = useMemo(() => ({ user, ready, signIn, signOut, refresh, unread, refreshUnread }), [user, ready, signIn, signOut, refresh, unread, refreshUnread]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
