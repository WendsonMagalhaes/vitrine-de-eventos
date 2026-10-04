"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, Check, ChevronRight, Clock, FileText, Heart, Images, Package, TriangleAlert, UserRound } from "lucide-react";
import { providerApi } from "@/lib/providerApi";
import { useProvider } from "@/lib/providerContext";
import { checklist } from "@/lib/providerProfile";
import { STATUS } from "@/lib/providerActions";
import { PageHeader } from "@/lib/ui";

const TEXT: Record<string, string> = {
  DRAFT: "Complete o perfil e envie para análise. Só depois de aprovado você aparece no app.",
  PENDING: "A equipe está analisando o seu perfil. Você ainda pode editar as informações e as fotos.",
  APPROVED: "Seu perfil está publicado e aparece para os clientes no app.",
  REJECTED: "Seu perfil não foi aprovado. Ajuste as informações e envie novamente.",
  SUSPENDED: "Seu perfil está suspenso. Fale com a administração da Vitrine.",
};
const ICON: Record<string, any> = { DRAFT: FileText, PENDING: Clock, APPROVED: BadgeCheck, REJECTED: TriangleAlert, SUSPENDED: TriangleAlert };

export default function Inicio() {
  const { me, reload } = useProvider();
  const [favorites, setFavorites] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => { providerApi("/api/providers/me/stats").then((s) => setFavorites(s.favorites)).catch(() => setFavorites(null)); }, []);

  const items = checklist(me);
  const missing = items.filter((i) => !i.done);
  const pct = Math.round(((items.length - missing.length) / items.length) * 100);
  const canSubmit = me.status === "DRAFT" || me.status === "REJECTED";
  const tone = me.status === "APPROVED" ? "ok" : me.status === "PENDING" ? "warn" : me.status === "DRAFT" ? "" : "bad";
  const StatusIcon = ICON[me.status];

  async function submit() {
    setSending(true);
    try { await providerApi("/api/providers/me/submit", { method: "POST" }); toast.success("Enviado para análise"); await reload(); }
    catch (e: any) { toast.error(e.message); } finally { setSending(false); }
  }

  return (<>
    <PageHeader title={`Olá, ${me.name}`} description="Acompanhe o seu perfil e mantenha suas informações em dia." />

    <div className="kpis">
      <Link href="/fornecedor/fotos" className="card kpi"><div><small>{me.images.length === 1 ? "Foto" : "Fotos"}</small><strong>{me.images.length}</strong></div><span className="tile k1"><Images size={18} /></span></Link>
      <Link href="/fornecedor/servicos" className="card kpi"><div><small>{me.services.length === 1 ? "Serviço" : "Serviços"}</small><strong>{me.services.length}</strong></div><span className="tile k2"><Package size={18} /></span></Link>
      <div className="card kpi"><div><small>{favorites === 1 ? "Favorito" : "Favoritos"}</small><strong>{favorites ?? "—"}</strong></div><span className="tile k5"><Heart size={18} /></span></div>
    </div>

    <div className="cols">
      <div className="stack">
        <section className={`status ${tone}`}>
          <span className="tile"><StatusIcon size={20} /></span>
          <div className="grow">
            <h2>{STATUS[me.status][0]}</h2>
            <p style={{ margin: 0 }}>{TEXT[me.status]}</p>
            {canSubmit && missing.length > 0 && (<>
              <p style={{ margin: "14px 0 0", fontWeight: 600 }}>Falta completar:</p>
              <ul className="missing">{missing.map((m) => <li key={m.label}><Link href={m.href}>{m.label} <ChevronRight size={14} /></Link></li>)}</ul>
            </>)}
            {canSubmit && <button className="btn pri" disabled={sending || missing.length > 0} onClick={submit}>{sending ? "Enviando…" : "Enviar para análise"}</button>}
          </div>
        </section>

        <div className="shortcuts">
          <Link href="/fornecedor/perfil" className="card short"><span className="tile k4"><UserRound size={18} /></span><div><b>Informações</b><span className="meta">Contato e categorias</span></div><ChevronRight className="chev" size={18} /></Link>
          <Link href="/fornecedor/fotos" className="card short"><span className="tile k1"><Images size={18} /></span><div><b>Fotos</b><span className="meta">Portfólio e capa</span></div><ChevronRight className="chev" size={18} /></Link>
          <Link href="/fornecedor/servicos" className="card short"><span className="tile k2"><Package size={18} /></span><div><b>Serviços</b><span className="meta">O que você oferece</span></div><ChevronRight className="chev" size={18} /></Link>
        </div>
      </div>

      <section className="card">
        <div className="card-head"><h2>Perfil completo</h2></div>
        <div className="card-body">
          <div className="pct"><b className="num">{pct}%</b><span className="mute">{items.length - missing.length} de {items.length} itens</span></div>
          <div className="progress"><i style={{ width: `${pct}%` }} /></div>
          <ul className="check">
            {items.map((i) => (
              <li key={i.label}><Link href={i.href} className={i.done ? "done" : ""}>
                <span className="dot"><Check size={13} strokeWidth={3} /></span><span>{i.label.charAt(0).toUpperCase() + i.label.slice(1)}</span>
              </Link></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  </>);
}
