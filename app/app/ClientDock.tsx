"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { clientApi } from "@/lib/clientApi";
import { useSession } from "@/lib/clientSession";
import ChatThread from "@/lib/ChatThread";
import { Avatar } from "@/lib/ui";
import { activeChats } from "@/lib/chatActive";

const MAX_WINDOWS = 3;
type Win = { id: string; min: boolean };
type DockApi = { open: (conversationId: string) => void } | null;
const DockCtx = createContext<DockApi>(null);
// null = fora do provider (quem chama deve navegar para a tela de conversa).
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

// Chats flutuantes do app (só no computador): botão de mensagens no canto e até 3 janelas abertas ao mesmo tempo.
// No celular/PWA não há janelas: "abrir" leva para a tela de conversa (/app/chat/[id]).
export function DockProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const desktop = useDesktop();
    const { user, ready } = useSession();
    const [wins, setWins] = useState<Win[]>([]);
    const [listOpen, setListOpen] = useState(false);
    const enabled = ready && !!user && user.role !== "ADMIN";

    const open = useCallback((id: string) => {
        if (!desktop) { router.push(`/app/chat/${id}`); return; }
        setListOpen(false);
        setWins((w) => [{ id, min: false }, ...w.filter((x) => x.id !== id)].slice(0, MAX_WINDOWS));
    }, [desktop, router]);

    // Saiu da conta (ou trocou de usuário): fecha tudo.
    useEffect(() => { setWins([]); setListOpen(false); }, [user?.id]);

    return (
        <DockCtx.Provider value={{ open }}>
            {children}
            {desktop && enabled && <Dock meId={user!.id} wins={wins} setWins={setWins} listOpen={listOpen} setListOpen={setListOpen} open={open} />}
        </DockCtx.Provider>
    );
}

function Dock({ meId, wins, setWins, listOpen, setListOpen, open }: { meId: string; wins: Win[]; setWins: React.Dispatch<React.SetStateAction<Win[]>>; listOpen: boolean; setListOpen: (v: boolean) => void; open: (id: string) => void }) {
    const path = usePathname();
    const { unread, refreshUnread } = useSession();
    // Nessas telas a conversa já aparece em tela cheia.
    const hidden = path.startsWith("/app/chat") || path.startsWith("/app/mensagens") || path.startsWith("/app/entrar");
    const [convs, setConvs] = useState<any[]>([]);
    const lastSeen = useRef(new Map<string, string>()); // conversa -> id da última mensagem já conhecida
    const primed = useRef(false);

    const load = useCallback(async () => {
        try {
            const list: any[] = await clientApi("/api/chat/conversations?as=client");
            setConvs(list);
            // Aviso de mensagem nova (com atalho para responder), sem avisar do que já existia ao entrar.
            for (const c of list) {
                const mid = c.lastMessage?.id as string | undefined;
                const prev = lastSeen.current.get(c.id);
                if (mid) lastSeen.current.set(c.id, mid);
                if (!primed.current || !mid || prev === mid || c.lastMessage.mine || c.lastMessage.deleted || !c.unread) continue;
                if (activeChats.has(c.id) || document.visibilityState !== "visible") continue;
                toast(c.other.name, { description: c.lastMessage.body, duration: 8000, action: { label: "Responder", onClick: () => open(c.id) } });
            }
            primed.current = true;
        } catch { /* mantém a lista */ }
    }, [open]);

    useEffect(() => {
        if (hidden) return;
        load();
        const t = setInterval(() => document.visibilityState === "visible" && load(), 5000);
        return () => clearInterval(t);
    }, [load, hidden]);
    // Ao voltar para as telas cheias, o próximo carregamento não deve avisar do que foi visto lá.
    useEffect(() => { if (hidden) primed.current = false; }, [hidden]);

    if (hidden) return null;

    const byId = new Map(convs.map((c) => [c.id, c]));
    const activity = () => { refreshUnread(); load(); };
    const toggleMin = (id: string) => setWins((l) => l.map((x) => (x.id === id ? { ...x, min: !x.min } : x)));
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
                        <div className="dock-win-head" onClick={() => toggleMin(w.id)} role="button" tabIndex={0} aria-label={w.min ? `Abrir conversa com ${name}` : `Minimizar conversa com ${name}`}
                            onKeyDown={(e) => { if (e.key === "Enter") toggleMin(w.id); }}>
                            <Avatar name={name} /><b>{name}</b>
                            {w.min && c?.unread > 0 && <span className="count-badge">{c.unread}</span>}
                            <span className="dock-win-btns">
                                <button className="icon" aria-label={w.min ? "Expandir" : "Minimizar"} onClick={(e) => { e.stopPropagation(); toggleMin(w.id); }}><Minus size={15} /></button>
                                <button className="icon" aria-label="Fechar conversa" onClick={(e) => { e.stopPropagation(); setWins((l) => l.filter((x) => x.id !== w.id)); }}><X size={15} /></button>
                            </span>
                        </div>
                        {!w.min && <div className="dock-win-body"><ChatThread id={w.id} name={name} me={meId} call={clientApi} active onActivity={activity} /></div>}
                    </div>
                );
            })}
        </div>
    );
}