"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Image as ImageIcon, MapPin, Share2 } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { clientApi } from "@/lib/clientApi";
import { useSession } from "@/lib/clientSession";
import { brl } from "@/lib/ui";
import { pastel } from "@/lib/pastel";
import { Chip, CtaBar, Loading, Notice, Tag, TopBar, loginHref, useStartChat } from "../../ui";

type TabKey = "about" | "services" | "photos";

export default function FornecedorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [tab, setTab] = useState<TabKey>("services");
  const { data: p, loading, error } = useApi<any>(`/api/providers/${id}`);
  const isClient = user?.role === "CLIENT";
  const canSave = !user || isClient; // favoritar é só para cliente (ou visitante, que é levado ao login)
  const favs = useApi<any[]>(isClient ? "/api/favorites" : null);
  const saved = !!favs.data?.some((f) => f.id === id);
  const chat = useStartChat(p?.id, `/app/fornecedor/${id}`);

  async function toggleSave() {
    if (!user) { router.push(loginHref(`/app/fornecedor/${id}`)); return; }
    const was = saved;
    favs.setData((d) => (was ? (d ?? []).filter((f) => f.id !== id) : [...(d ?? []), { id }]));
    try {
      if (was) await clientApi(`/api/favorites?providerId=${encodeURIComponent(id)}`, { method: "DELETE" });
      else await clientApi("/api/favorites", { method: "POST", body: { providerId: id } });
      favs.reload();
      toast.success(was ? "Removido dos favoritos" : "Salvo nos favoritos");
    } catch (e: any) { toast.error(e.message); favs.reload(); }
  }
  async function share() {
    const data = { title: p.name, text: `Veja ${p.name} na Vitrine Eventos`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); toast.success("Link copiado"); }
    } catch { /* cancelou */ }
  }

  if (loading) return <><TopBar /><Loading /></>;
  if (error || !p) return <><TopBar /><Notice>Fornecedor indisponível.</Notice></>;
  const hero = p.images[0]?.url;
  const tabs: [TabKey, string][] = [["about", "Sobre"], ["services", `Serviços (${p.services.length})`], ["photos", "Fotos"]];
  return (
    <>
      <TopBar title={p.name} right={<button className="icon" onClick={share} aria-label="Compartilhar"><Share2 size={19} /></button>} />
      <div className="v-hero" style={{ background: pastel(p.id) }}>
        {hero ? <img src={hero} alt={p.name} /> : <ImageIcon size={40} />}
        {p.featured && <span className="v-hero-tag"><Tag text="Destaque" /></span>}
      </div>
      <h2 className="v-title">{p.name}</h2>
      {p.city && <p className="v-mute v-loc"><MapPin size={14} /> {p.city}</p>}
      <div className="v-chips wrap">{p.categories.map((x: any) => <Chip key={x.category.slug} label={x.category.name} />)}</div>

      <div className="v-seg-tabs" role="tablist">
        {tabs.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>)}
      </div>

      {tab === "about" && <p className="v-text">{p.description || "Este fornecedor ainda não adicionou uma descrição."}</p>}
      {tab === "services" && (p.services.length === 0 ? <Notice>Nenhum serviço cadastrado.</Notice> : (
        <div className="v-list">
          {p.services.map((sv: any, i: number) => (
            <Link key={sv.id} href={`/app/fornecedor/${p.id}/servico/${sv.id}`} className="v-card">
              {sv.imageUrl ? <img src={sv.imageUrl} alt="" className="v-svc-img" /> : <span className="v-svc-img" style={{ background: pastel(sv.id + i) }} />}
              <span className="v-card-body">
                <b>{sv.name}</b>
                {sv.description && <span className="v-mute v-clamp2">{sv.description}</span>}
                <span className="v-price">{sv.priceFrom ? `a partir de ${brl(sv.priceFrom)}` : "sob consulta"}</span>
              </span>
              <ChevronRight size={18} className="v-mute" />
            </Link>
          ))}
        </div>
      ))}
      {tab === "photos" && (p.images.length === 0 ? <Notice>Nenhuma foto no portfólio ainda.</Notice> : (
        <div className="v-photos">{p.images.map((i: any) => <a key={i.id} href={i.url} target="_blank" rel="noopener noreferrer"><img src={i.url} alt="" loading="lazy" /></a>)}</div>
      ))}

      <CtaBar p={p} saved={saved} onSave={canSave ? toggleSave : undefined} onChat={chat.canChat ? chat.start : undefined} chatBusy={chat.busy}
        message="Olá! Encontrei seu perfil no aplicativo de fornecedores para eventos e gostaria de saber mais sobre seus serviços." />
    </>
  );
}
