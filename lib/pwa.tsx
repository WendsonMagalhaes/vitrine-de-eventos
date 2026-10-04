"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import "./pwa.css";

// Registra o service worker no escopo de cada app (/app, /fornecedor, /admin). Cada escopo é um app instalável separado.
export function useServiceWorker(scope = "/app") {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope }).catch(() => { /* sem PWA offline desta vez */ });
  }, [scope]);
}

// Para os painéis: registra o service worker e mostra o convite de instalação flutuante.
export function PwaBoot({ scope }: { scope: string }) {
  useServiceWorker(scope);
  return <InstallBanner floating />;
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const DISMISS = "vitrine_install_dismissed";

// Convite para instalar. No Android/Chrome usa o aviso nativo; no iPhone mostra o passo "Compartilhar > Tela de Início".
export function InstallBanner({ floating = false }: { floating?: boolean }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    let dismissed = false;
    try { dismissed = !!localStorage.getItem(DISMISS); } catch { /* ignora */ }
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIos(isIos); setHidden(!isIos);
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setHidden(false); };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (hidden || (!evt && !ios)) return null;
  const close = () => { setHidden(true); try { localStorage.setItem(DISMISS, "1"); } catch { /* ignora */ } };
  return (
    <div className={`v-install ${floating ? "float" : ""}`} role="region" aria-label="Instalar o aplicativo">
      <span className="v-install-ico"><Download size={18} /></span>
      <div className="v-install-txt">
        <b>Instale o app no seu aparelho</b>
        {ios ? <span>Toque em <Share size={13} style={{ verticalAlign: "-2px" }} /> Compartilhar e depois em “Adicionar à Tela de Início”.</span> : <span>Abre mais rápido e fica na sua tela inicial.</span>}
      </div>
      {evt && <button className="btn sm pri" onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null); setHidden(true); }}>Instalar</button>}
      <button className="icon" onClick={close} aria-label="Fechar"><X size={16} /></button>
    </div>
  );
}
