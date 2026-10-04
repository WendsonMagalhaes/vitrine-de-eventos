"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, MessageCircle } from "lucide-react";
import { providerApi } from "@/lib/providerApi";
import { useProvider } from "@/lib/providerContext";
import ChatThread from "@/lib/ChatThread";
import { Avatar, PageHeader } from "@/lib/ui";

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const listTime = (d: string) => { const x = new Date(d); return sameDay(x, new Date()) ? x.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : x.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };

export default function Mensagens() {
  const { me, refreshUnread } = useProvider();
  const [convs, setConvs] = useState<any[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [perm, setPerm] = useState<string>("granted");

  const loadList = useCallback(async () => {
    try { setConvs(await providerApi("/api/chat/conversations")); } catch { /* mantém a lista anterior */ }
  }, []);
  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 4000);
    return () => clearInterval(t);
  }, [loadList]);
  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    const c = new URLSearchParams(window.location.search).get("c"); // vindo de um aviso
    if (c) setSel(c);
  }, []);

  const current = convs?.find((c) => c.id === sel);
  const name = current?.other.name ?? "Conversa";
  const activity = useCallback(() => { refreshUnread(); loadList(); }, [refreshUnread, loadList]);
  return (<>
    <PageHeader title="Mensagens" description="Converse com quem se interessou pelo seu trabalho." />
    {perm === "default" && (
      <div className="chat-perm"><Bell size={18} /><span>Receba um aviso quando chegar mensagem, mesmo com esta aba em segundo plano.</span>
        <button className="btn sm" onClick={async () => setPerm(await Notification.requestPermission())}>Ativar avisos</button></div>
    )}
    <div className={`chat ${sel ? "open" : ""}`}>
      <div className="chat-list">
        <div className="chat-list-head"><h2>Conversas</h2>{convs && convs.length > 0 && <span className="mute num">{convs.length}</span>}</div>
        {convs === null ? <p className="mute chat-empty">Carregando…</p> : convs.length === 0 ? (
          <div className="chat-empty"><MessageCircle size={28} /><b>Nenhuma conversa ainda</b><span className="mute">Quando um cliente enviar uma mensagem pelo app, ela aparece aqui na hora.</span></div>
        ) : convs.map((c) => (
          <button key={c.id} className={`chat-item ${sel === c.id ? "on" : ""}`} onClick={() => setSel(c.id)}>
            <Avatar name={c.other.name} />
            <span className="chat-item-body">
              <span className="chat-item-top"><b>{c.other.name}</b><small>{listTime(c.lastMessageAt)}</small></span>
              <span className="chat-item-last">{c.lastMessage ? `${c.lastMessage.mine ? "Você: " : ""}${c.lastMessage.deleted ? "Mensagem apagada" : c.lastMessage.body}` : ""}</span>
            </span>
            {c.unread > 0 && <span className="count-badge">{c.unread > 99 ? "99+" : c.unread}</span>}
          </button>
        ))}
      </div>
      <div className="chat-thread">
        {sel ? (<>
          <div className="thread-head">
            <button className="icon thread-back" onClick={() => setSel(null)} aria-label="Voltar para as conversas"><ArrowLeft size={18} /></button>
            <Avatar name={name} /><div><b>{name}</b><div className="meta">Cliente do aplicativo</div></div>
          </div>
          <ChatThread key={sel} id={sel} name={name} me={me.userId} onActivity={activity} />
        </>) : <div className="chat-empty"><MessageCircle size={28} /><span className="mute">Escolha uma conversa para começar.</span></div>}
      </div>
    </div>
  </>);
}
