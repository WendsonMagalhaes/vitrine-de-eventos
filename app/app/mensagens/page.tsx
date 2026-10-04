"use client";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useSession } from "@/lib/clientSession";
import { Avatar } from "@/lib/ui";
import { Loading, SignInPrompt } from "../ui";

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const when = (iso: string) => { const d = new Date(iso); return sameDay(d, new Date()) ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };

export default function Mensagens() {
  const { user } = useSession();
  const q = useApi<any[]>(user && user.role !== "ADMIN" ? "/api/chat/conversations?as=client" : null, { interval: 4000 });
  if (!user) return <SignInPrompt icon={MessageCircle} text="Entre para conversar com os fornecedores." next="/app/mensagens" />;
  return (
    <>
      <h1 className="v-h1">Mensagens</h1>
      {q.loading ? <Loading /> : !q.data?.length ? (
        <div className="v-center">
          <span className="v-tile"><MessageCircle size={26} /></span>
          <b>{q.error ? "Não foi possível carregar" : "Nenhuma conversa ainda"}</b>
          <p className="v-mute">{q.error ? "Verifique a conexão e tente de novo." : user.role === "PROVIDER" ? "Aqui ficam as conversas que você abriu com outros fornecedores. As mensagens dos seus clientes estão no seu painel." : "As conversas aparecem aqui assim que a primeira mensagem for enviada."}</p>
        </div>
      ) : (
        <div className="v-list">
          {q.data.map((c) => (
            <Link key={c.id} href={`/app/chat/${c.id}`} className="v-card" aria-label={`Conversa com ${c.other.name}${c.unread ? `, ${c.unread} não lidas` : ""}`}>
              {c.other.imageUrl ? <img src={c.other.imageUrl} alt="" className="v-avatar-img" /> : <Avatar name={c.other.name} large />}
              <span className="v-card-body">
                <span className="v-row-between"><b className="v-ellipsis">{c.other.name}</b><small className={c.unread ? "v-when new" : "v-when"}>{when(c.lastMessageAt)}</small></span>
                <span className={`v-ellipsis ${c.unread ? "v-last new" : "v-mute"}`}>
                  {c.lastMessage ? `${c.lastMessage.mine ? "Você: " : ""}${c.lastMessage.deleted ? "Mensagem apagada" : c.lastMessage.body}` : ""}
                </span>
              </span>
              {c.unread > 0 && <span className="v-badge static">{c.unread > 99 ? "99+" : c.unread}</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
