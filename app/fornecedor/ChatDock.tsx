"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { providerApi } from "@/lib/providerApi";
import { useProvider } from "@/lib/providerContext";
import ChatThread from "@/lib/ChatThread";
import { Avatar } from "@/lib/ui";
import { activeChats } from "@/lib/chatActive";

export const TITLE = "Vitrine Eventos — Painel do fornecedor";
const MAX_WINDOWS = 3;
type Win = { id: string; min: boolean };
const DockCtx = createContext<{ open: (conversationId: string) => void }>({ open: () => {} });
export const useDock = () => useContext(DockCtx);

function useDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 861px)");
    const f = () => setD(mq.matches); f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return d;
}

// Chats flutuantes (no computador): botão de mensagens no canto e até 3 janelas de conversa abertas ao mesmo tempo, em qualquer tela do painel.
// No celular, "abrir" leva para a tela de Mensagens.
export function DockProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const desktop = useDesktop();
  const [wins, setWins] = useState<Win[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const open = useCallback((id: string) => {
    if (!desktop) { router.push(`/fornecedor/mensagens?c=${id}`); return; }
    setListOpen(false);
    setWins((w) => [{ id, min: false }, ...w.filter((x) => x.id !== id)].slice(0, MAX_WINDOWS));
  }, [desktop, router]);
  return (
    <DockCtx.Provider value={{ open }}>
      {children}
      {desktop && <Dock wins={wins} setWins={setWins} listOpen={listOpen} setListOpen={setListOpen} open={open} />}
    </DockCtx.Provider>
  );
}

function Dock({ wins, setWins, listOpen, setListOpen, open }: { wins: Win[]; setWins: React.Dispatch<React.SetStateAction<Win[]>>; listOpen: boolean; setListOpen: (v: boolean) => void; open: (id: string) => void }) {
  const path = usePathname();
  const { me, unread, refreshUnread } = useProvider();
  const hidden = path.startsWith("/fornecedor/mensagens"); // lá já existe a tela cheia
  const [convs, setConvs] = useState<any[]>([]);
  const load = useCallback(async () => { try { setConvs(await providerApi("/api/chat/conversations")); } catch { /* mantém a lista */ } }, []);
  useEffect(() => {
    if (hidden) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load, hidden]);
  if (hidden) return null;

  const byId = new Map(convs.map((c) => [c.id, c]));
  const activity = () => { refreshUnread(); load(); };
  return (
    <div className="dock">
      <div className="dock-launch">
        {listOpen && (
          <div className="dock-list" role="dialog" aria-label="Conversas">
            <div className="dock-list-head"><b>Mensagens</b><button className="icon" aria-label="Fechar" onClick={() => setListOpen(false)}><X size={16} /></button></div>
            {convs.length === 0 ? <p className="mute chat-empty">Nenhuma conversa ainda.</p> : convs.map((c) => (
              <button key={c.id} className="chat-item" onClick={() => open(c.id)}>
                <Avatar name={c.other.name} />
                <span className="chat-item-body">
                  <span className="chat-item-top"><b>{c.other.name}</b></span>
                  <span className="chat-item-last">{c.lastMessage ? `${c.lastMessage.mine ? "Você: " : ""}${c.lastMessage.deleted ? "Mensagem apagada" : c.lastMessage.body}` : ""}</span>
                </span>
                {c.unread > 0 && <span className="count-badge">{c.unread}</span>}
              </button>
            ))}
          </div>
        )}
        <button className="dock-fab" onClick={() => setListOpen(!listOpen)} aria-label={unread ? `Mensagens, ${unread} não lidas` : "Mensagens"} aria-expanded={listOpen}>
          <MessageCircle size={24} />{unread > 0 && <span className="count-badge">{unread > 99 ? "99+" : unread}</span>}
        </button>
      </div>
      {wins.map((w) => {
        const c = byId.get(w.id);
        const name = c?.other.name ?? "Conversa";
        return (
          <div key={w.id} className={`dock-win ${w.min ? "min" : ""}`}>
            <div className="dock-win-head" onClick={() => setWins((l) => l.map((x) => (x.id === w.id ? { ...x, min: !x.min } : x)))} role="button" tabIndex={0} aria-label={w.min ? `Abrir conversa com ${name}` : `Minimizar conversa com ${name}`}
              onKeyDown={(e) => { if (e.key === "Enter") setWins((l) => l.map((x) => (x.id === w.id ? { ...x, min: !x.min } : x))); }}>
              <Avatar name={name} /><b>{name}</b>
              {w.min && c?.unread > 0 && <span className="count-badge">{c.unread}</span>}
              <span className="dock-win-btns">
                <button className="icon" aria-label={w.min ? "Expandir" : "Minimizar"} onClick={(e) => { e.stopPropagation(); setWins((l) => l.map((x) => (x.id === w.id ? { ...x, min: !x.min } : x))); }}><Minus size={15} /></button>
                <button className="icon" aria-label="Fechar conversa" onClick={(e) => { e.stopPropagation(); setWins((l) => l.filter((x) => x.id !== w.id)); }}><X size={15} /></button>
              </span>
            </div>
            {!w.min && <div className="dock-win-body"><ChatThread id={w.id} name={name} me={me.userId} active onActivity={activity} /></div>}
          </div>
        );
      })}
    </div>
  );
}

// Avisos de mensagem nova: aviso flutuante com prévia por cima de qualquer tela, notificação do navegador com a aba em segundo plano,
// e o número de não lidas no título da aba.
export function Notifier() {
  const { latest, unread } = useProvider();
  const { open } = useDock();
  const init = useRef(false);
  const seenAt = useRef("");

  useEffect(() => { document.title = unread ? `(${unread}) ${TITLE}` : TITLE; }, [unread]);
  useEffect(() => {
    if (latest === undefined) return;
    if (!init.current) { init.current = true; seenAt.current = latest?.createdAt ?? ""; return; } // o que já estava não lido ao entrar não vira aviso
    if (!latest || latest.createdAt <= seenAt.current) return;
    seenAt.current = latest.createdAt;
    if (activeChats.has(latest.conversationId) && !document.hidden) return; // já está lendo essa conversa
    if (document.hidden) {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification(latest.from, { body: latest.body, tag: "vitrine-chat" });
        n.onclick = () => { window.focus(); open(latest.conversationId); n.close(); };
      }
    } else {
      toast(latest.from, { description: latest.body, duration: 8000, action: { label: "Responder", onClick: () => open(latest.conversationId) } });
    }
  }, [latest, open]);
  return null;
}
