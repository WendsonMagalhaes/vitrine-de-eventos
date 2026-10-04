"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Reply, Send, SmilePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { providerApi } from "./providerApi";
import { useConfirm } from "./confirm";
import { EDIT_WINDOW_MS, REACTIONS } from "./chatConstants";
import { activeChats } from "./chatActive";

export type Msg = {
  id: string; body: string; senderId: string; createdAt: string; updatedAt?: string; editedAt?: string | null; deleted?: boolean;
  replyTo?: { id: string; senderId: string; body: string; deleted: boolean } | null;
  reactions: { emoji: string; userId: string }[];
  pending?: boolean; failed?: boolean;
};

const hhmm = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
function dayLabel(d: Date) {
  const now = new Date(), y = new Date(); y.setDate(now.getDate() - 1);
  return sameDay(d, now) ? "Hoje" : sameDay(d, y) ? "Ontem" : d.toLocaleDateString("pt-BR");
}

// Conversa completa: responder, reagir, editar, apagar, "digitando…", visto. Usada na tela de Mensagens e nas janelas flutuantes.
export default function ChatThread({ id, name, me, active = true, onActivity }: { id: string; name: string; me: string; active?: boolean; onActivity?: () => void }) {
  const confirm = useConfirm();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [otherRead, setOtherRead] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editing, setEditing] = useState<Msg | null>(null);
  const [sel, setSel] = useState<string | null>(null);        // mensagem com as ferramentas à mostra (toque)
  const [emojiFor, setEmojiFor] = useState<string | null>(null);
  const [hl, setHl] = useState<string | null>(null);          // mensagem destacada ao pular para ela
  const cursor = useRef<string | null>(null);
  const versions = useRef(new Map<string, string>());
  const box = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const area = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const seq = useRef(0);
  const lastPing = useRef(0);
  const activeRef = useRef(active); activeRef.current = active;
  const onActivityRef = useRef(onActivity); onActivityRef.current = onActivity;

  useEffect(() => { if (!active) return; activeChats.add(id); return () => { activeChats.delete(id); }; }, [id, active]);

  const merge = useCallback((incoming: Msg[]) => {
    setMsgs((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) {
        for (const [k, v] of map) if (v.pending && v.body === m.body && v.senderId === m.senderId) map.delete(k); // chegou a de verdade
        map.set(m.id, { ...m, reactions: m.reactions ?? [] });
      }
      return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    });
  }, []);

  const poll = useCallback(async (initial: boolean) => {
    const qs = new URLSearchParams();
    if (!initial && cursor.current) qs.set("after", cursor.current);
    if (activeRef.current && document.visibilityState === "visible") qs.set("read", "1");
    try {
      const r = await providerApi(`/api/chat/conversations/${id}/messages?${qs}`);
      setOtherRead(r.otherReadAt); setTyping(!!r.otherTyping);
      if (r.messages.length) {
        let changed = false;
        for (const m of r.messages as Msg[]) {
          if (m.updatedAt && (!cursor.current || m.updatedAt > cursor.current)) cursor.current = m.updatedAt;
          if (versions.current.get(m.id) !== m.updatedAt) { changed = true; versions.current.set(m.id, m.updatedAt ?? ""); }
        }
        merge(r.messages);
        if (changed) onActivityRef.current?.();
      }
    } catch { /* tenta de novo no próximo ciclo */ } finally { if (initial) setLoading(false); }
  }, [id, merge]);

  useEffect(() => {
    poll(true);
    const t = setInterval(() => poll(false), 2000);
    return () => clearInterval(t);
  }, [poll]);

  // Acompanha o fim da conversa só se a pessoa já estava lá embaixo.
  useEffect(() => { const el = box.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs, loading, typing, replyTo, editing]);
  const onScroll = () => { const el = box.current!; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; };
  // Fecha a barra de emojis ao clicar fora.
  useEffect(() => {
    if (!emojiFor) return;
    const close = () => setEmojiFor(null);
    const t = setTimeout(() => document.addEventListener("click", close), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", close); };
  }, [emojiFor]);

  const canEdit = (m: Msg) => m.senderId === me && !m.deleted && !m.pending && !m.failed && Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;
  const quoteName = (senderId: string) => (senderId === me ? "Você" : name);

  async function send(body: string, reply: Msg["replyTo"] | null, tmpId?: string) {
    const tid = tmpId ?? `tmp-${Date.now()}-${seq.current++}`;
    stick.current = true;
    setMsgs((p) => [...p.filter((m) => m.id !== tid), { id: tid, body, senderId: me, createdAt: new Date().toISOString(), pending: true, replyTo: reply ?? null, reactions: [] }]);
    try {
      const real = await providerApi(`/api/chat/conversations/${id}/messages`, { method: "POST", body: { body, replyToId: reply?.id ?? null } });
      setMsgs((p) => p.filter((m) => m.id !== tid));
      versions.current.set(real.id, real.updatedAt); merge([real]); onActivityRef.current?.();
    } catch { setMsgs((p) => p.map((m) => (m.id === tid ? { ...m, pending: false, failed: true } : m))); }
  }
  async function saveEdit(m: Msg, body: string) {
    if (body === m.body) return;
    const before = m;
    setMsgs((p) => p.map((x) => (x.id === m.id ? { ...x, body, editedAt: new Date().toISOString() } : x)));
    try { await providerApi(`/api/chat/messages/${m.id}`, { method: "PATCH", body: { body } }); }
    catch (e: any) { toast.error(e.message); setMsgs((p) => p.map((x) => (x.id === m.id ? before : x))); }
  }
  async function remove(m: Msg) {
    if (!(await confirm({ tone: "danger", title: "Apagar esta mensagem?", message: "Ela será apagada para você e para a outra pessoa.", confirmLabel: "Apagar" }))) return;
    setMsgs((p) => p.map((x) => (x.id === m.id ? { ...x, deleted: true, body: "", reactions: [] } : x)));
    try { await providerApi(`/api/chat/messages/${m.id}`, { method: "DELETE" }); }
    catch (e: any) { toast.error(e.message); setMsgs((p) => p.map((x) => (x.id === m.id ? m : x))); }
  }
  function react(m: Msg, emoji: string) {
    const current = m.reactions.find((r) => r.userId === me)?.emoji;
    const next = current === emoji ? null : emoji;
    setMsgs((p) => p.map((x) => (x.id === m.id ? { ...x, reactions: [...x.reactions.filter((r) => r.userId !== me), ...(next ? [{ emoji: next, userId: me }] : [])] } : x)));
    setEmojiFor(null);
    providerApi(`/api/chat/messages/${m.id}/reaction`, { method: "PUT", body: { emoji: next } }).catch(() => toast.error("Não foi possível reagir"));
  }
  function jump(mid: string) {
    const el = rows.current.get(mid);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setHl(mid); setTimeout(() => setHl((h) => (h === mid ? null : h)), 1500);
  }

  const resetArea = () => { if (area.current) area.current.style.height = "auto"; };
  const cancelCtx = () => { setReplyTo(null); if (editing) { setEditing(null); setText(""); resetArea(); } };
  function submit() {
    const b = text.trim();
    if (!b) return;
    if (editing) saveEdit(editing, b);
    else send(b, replyTo ? { id: replyTo.id, senderId: replyTo.senderId, deleted: false, body: replyTo.body.slice(0, 140) } : null);
    setText(""); setReplyTo(null); setEditing(null); resetArea();
  }
  function onType(v: string) {
    setText(v);
    if (v.trim() && !editing && Date.now() - lastPing.current > 3000) { lastPing.current = Date.now(); providerApi(`/api/chat/conversations/${id}/typing`, { method: "POST" }).catch(() => {}); }
  }

  const lastMine = [...msgs].reverse().find((m) => m.senderId === me && !m.pending && !m.failed && !m.deleted);
  const ctxMsg = editing ?? replyTo;
  return (
    <div className="thread">
      <div className="thread-body" ref={box} onScroll={onScroll}>
        {loading ? <p className="mute chat-empty">Carregando…</p> : msgs.length === 0 ? <p className="mute chat-empty">Escreva a primeira mensagem.</p> : msgs.map((m, i) => {
          const mine = m.senderId === me, d = new Date(m.createdAt), showDay = i === 0 || !sameDay(d, new Date(msgs[i - 1].createdAt));
          const tools = !m.deleted && !m.pending && !m.failed;
          const counts = new Map<string, number>(); m.reactions.forEach((r) => counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1));
          const myReaction = m.reactions.find((r) => r.userId === me)?.emoji;
          return (
            <div key={m.id} ref={(el) => { if (el) rows.current.set(m.id, el); else rows.current.delete(m.id); }}>
              {showDay && <div className="day">{dayLabel(d)}</div>}
              <div className={`bline ${mine ? "mine" : ""}`}>
                {tools && (
                  <div className={`btools ${sel === m.id || emojiFor === m.id ? "show" : ""}`}>
                    <button className="tool" aria-label="Reagir" title="Reagir" onClick={(e) => { e.stopPropagation(); setEmojiFor(emojiFor === m.id ? null : m.id); }}><SmilePlus size={15} /></button>
                    <button className="tool" aria-label="Responder" title="Responder" onClick={() => { setEditing(null); setReplyTo(m); setSel(null); area.current?.focus(); }}><Reply size={15} /></button>
                    {canEdit(m) && <button className="tool" aria-label="Editar" title="Editar" onClick={() => { setReplyTo(null); setEditing(m); setText(m.body); setSel(null); setTimeout(() => area.current?.focus(), 0); }}><Pencil size={15} /></button>}
                    {mine && <button className="tool" aria-label="Apagar" title="Apagar" onClick={() => remove(m)}><Trash2 size={15} /></button>}
                    {emojiFor === m.id && (
                      <div className="emoji-bar" onClick={(e) => e.stopPropagation()}>
                        {REACTIONS.map((e) => <button key={e} className={myReaction === e ? "on" : ""} aria-label={`Reagir com ${e}`} onClick={() => react(m, e)}>{e}</button>)}
                      </div>
                    )}
                  </div>
                )}
                <div className={`bubble ${mine ? "mine" : ""} ${m.deleted ? "gone" : ""} ${m.pending ? "pending" : ""} ${hl === m.id ? "hl" : ""}`} onClick={() => tools && setSel(sel === m.id ? null : m.id)}>
                  {m.replyTo && (
                    <button className="quote" onClick={(e) => { e.stopPropagation(); jump(m.replyTo!.id); }}>
                      <b>{quoteName(m.replyTo.senderId)}</b><span>{m.replyTo.deleted ? "Mensagem apagada" : m.replyTo.body}</span>
                    </button>
                  )}
                  <span>{m.deleted ? <em>Mensagem apagada</em> : m.body}</span>
                  <small>{hhmm(m.createdAt)}{m.editedAt && !m.deleted ? " · editada" : ""}{m.pending ? " · enviando…" : ""}</small>
                </div>
              </div>
              {counts.size > 0 && (
                <div className={`reacts ${mine ? "mine" : ""}`}>
                  {[...counts].map(([e, n]) => <button key={e} className={`react ${myReaction === e ? "on" : ""}`} onClick={() => react(m, e)} aria-label={`${e} ${n}`}>{e}{n > 1 && <span>{n}</span>}</button>)}
                </div>
              )}
              {m.failed && <div className="bubble-row mine"><button className="bubble-fail" onClick={() => send(m.body, m.replyTo ?? null, m.id)}>Não enviou. Tocar para tentar de novo</button></div>}
              {lastMine?.id === m.id && <div className="bubble-row mine"><small className="seen">{otherRead && otherRead >= m.createdAt ? "Visto" : "Enviado"}</small></div>}
            </div>
          );
        })}
        {typing && <div className="typing" aria-live="polite"><span /><span /><span /><em>{name} está digitando…</em></div>}
      </div>
      <form className="composer-wrap" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {ctxMsg && (
          <div className="ctx">
            <div><b>{editing ? "Editando mensagem" : `Respondendo a ${quoteName(ctxMsg.senderId)}`}</b><span>{ctxMsg.body}</span></div>
            <button type="button" className="icon" aria-label="Cancelar" onClick={cancelCtx}><X size={16} /></button>
          </div>
        )}
        <div className="composer">
          <textarea ref={area} rows={1} value={text} maxLength={2000} placeholder={editing ? "Edite a mensagem" : "Escreva uma mensagem"} aria-label="Mensagem"
            onChange={(e) => { onType(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } else if (e.key === "Escape" && ctxMsg) cancelCtx(); }} />
          <button className="btn pri send" disabled={!text.trim()} aria-label={editing ? "Salvar edição" : "Enviar"}><Send size={18} /></button>
        </div>
      </form>
    </div>
  );
}
