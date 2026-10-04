"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleCheck, ChevronRight, Sparkles } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { brl } from "@/lib/ui";
import { pastel } from "@/lib/pastel";
import { CtaBar, Loading, Notice, TopBar, useStartChat } from "../../../../ui";

export default function ServicoPage() {
  const { id, sid } = useParams<{ id: string; sid: string }>();
  const { data: p, loading } = useApi<any>(`/api/providers/${id}`);
  const chat = useStartChat(p?.id, `/app/fornecedor/${id}/servico/${sid}`);
  const back = `/app/fornecedor/${id}`;
  if (loading) return <><TopBar fallback={back} /><Loading /></>;
  const sv = p?.services.find((x: any) => x.id === sid);
  if (!p || !sv) return <><TopBar fallback={back} /><Notice>Serviço indisponível.</Notice></>;
  const msg = `Olá! Vi o serviço ${sv.name} no app e gostaria de saber mais.`;
  return (
    <>
      <TopBar title={sv.name} fallback={back} />
      <div className="v-hero short" style={{ background: pastel(sv.id) }}>
        {sv.imageUrl ? <img src={sv.imageUrl} alt={sv.name} /> : <Sparkles size={40} />}
      </div>
      <h2 className="v-title">{sv.name}</h2>
      <p className="v-price lg">{sv.priceFrom ? `a partir de ${brl(sv.priceFrom)}` : "sob consulta"}</p>
      <p className="v-mute">Valor de referência. Combine os detalhes direto com o fornecedor.</p>
      {sv.description && <p className="v-text">{sv.description}</p>}
      {sv.includes.length > 0 && (
        <>
          <h2 className="v-h2">O que inclui</h2>
          <ul className="v-includes">{sv.includes.map((x: string) => <li key={x}><CircleCheck size={18} />{x}</li>)}</ul>
        </>
      )}
      <Link href={back} className="v-card v-provider-link">
        <span className="v-svc-img sm" style={{ background: pastel(p.id) }} />
        <span className="v-card-body"><b>{p.name}</b><span className="v-mute">Ver perfil completo</span></span>
        <ChevronRight size={18} className="v-mute" />
      </Link>
      <p className="v-hint">Mensagem pronta: “{msg}”</p>
      <CtaBar p={p} message={msg} onChat={chat.canChat ? chat.start : undefined} chatBusy={chat.busy} />
    </>
  );
}
