"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Share } from "lucide-react";
import { toast } from "sonner";
import "./pwa.css";

type Caller = (path: string, opts?: { method?: string; body?: unknown }) => Promise<any>;
export type PushState = "loading" | "unsupported" | "needs-install" | "denied" | "off" | "on";

const urlB64 = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

// O service worker só existe em produção; cada app (/app, /fornecedor) tem o seu, no próprio escopo.
async function registration(scope: string) {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration(scope)) ?? null;
}

export async function currentState(scope: string): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await registration(scope);
  if (!reg) return "unsupported";
  const sub = await reg.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

async function subscribeAndSave(scope: string, api: Caller) {
  const reg = await registration(scope);
  if (!reg) throw new Error("Instale ou recarregue o app para ativar os avisos.");
  const { publicKey } = await api("/api/push/web");
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(publicKey) }));
  await api("/api/push/web", { method: "POST", body: sub.toJSON() });
}

export async function enableWebPush(scope: string, api: Caller) {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error(perm === "denied" ? "Os avisos estão bloqueados neste navegador. Libere nas configurações do site." : "Permissão não concedida.");
  await subscribeAndSave(scope, api);
}

// Ao sair da conta: este aparelho deixa de receber as mensagens dela.
export async function disableWebPush(scope: string, api: Caller) {
  try {
    const reg = await registration(scope);
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await api("/api/push/web", { method: "DELETE", body: { endpoint } }).catch(() => { /* a inscrição some quando o envio falhar */ });
  } catch { /* sem push ou sem internet */ }
}

// Mantém a inscrição deste aparelho ligada à conta que está logada (a pessoa pode ter trocado de conta).
export function useSyncWebPush(scope: string, api: Caller, enabled: boolean, userId?: string) {
  useEffect(() => {
    if (!enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    subscribeAndSave(scope, api).catch(() => { /* tenta na próxima abertura */ });
  }, [scope, api, enabled, userId]);
}

// Cartão para ligar/desligar os avisos de mensagem neste aparelho.
export function PushToggle({ scope, api, className = "" }: { scope: string; api: Caller; className?: string }) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => currentState(scope).then(setState).catch(() => setState("unsupported")), [scope]);
  useEffect(() => { refresh(); }, [refresh]);
  if (state === "loading" || state === "unsupported") return null;

  async function toggle() {
    setBusy(true);
    try {
      if (state === "on") { await disableWebPush(scope, api); toast.success("Avisos desligados neste aparelho"); }
      else { await enableWebPush(scope, api); toast.success("Avisos ligados"); }
    } catch (e: any) { toast.error(e.message || "Não foi possível alterar os avisos"); }
    finally { setBusy(false); refresh(); }
  }
  const on = state === "on";
  return (
    <div className={`push-card ${className}`}>
      <span className="push-ico">{on ? <Bell size={18} /> : <BellOff size={18} />}</span>
      <div className="push-txt">
        <b>Avisos de mensagem</b>
        {state === "needs-install" ? <span>No iPhone, instale o app: toque em <Share size={13} style={{ verticalAlign: "-2px" }} /> Compartilhar e “Adicionar à Tela de Início”. Depois ative aqui.</span>
          : state === "denied" ? <span>Bloqueados neste navegador. Libere as notificações nas configurações do site.</span>
          : <span>{on ? "Você será avisado quando chegar mensagem, mesmo com o app fechado." : "Receba um aviso quando chegar mensagem, mesmo com o app fechado."}</span>}
      </div>
      {(state === "on" || state === "off") && <button type="button" className={`btn sm ${on ? "" : "pri"}`} onClick={toggle} disabled={busy}>{on ? "Desligar" : "Ativar"}</button>}
    </div>
  );
}
