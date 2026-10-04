"use client";
import Link from "next/link";
import { BadgeCheck, Clock, Star, Users, Layers, ChevronRight, Inbox } from "lucide-react";
import { useAdminData } from "@/lib/useAdminData";
import { ProviderActions } from "@/lib/providerActions";
import { Thumb } from "@/lib/pastel";
import { EmptyState, PageHeader } from "@/lib/ui";

// Cores de cada situação no gráfico de cadastros (todas derivadas da paleta do projeto).
const SITUATION: [string, string, string][] = [
  ["APPROVED", "Publicados", "var(--on-ok)"],
  ["PENDING", "Em análise", "var(--on-warn)"],
  ["DRAFT", "Rascunhos", "var(--mute)"],
  ["REJECTED", "Reprovados", "var(--on-bad)"],
  ["SUSPENDED", "Suspensos", "color-mix(in srgb,var(--on-bad) 50%,#fff)"],
];

export default function Dashboard() {
  const stats = useAdminData<any>("/api/admin/stats");
  const pend = useAdminData<any[]>("/api/admin/providers?status=PENDING");
  const s = stats.data;
  const max = Math.max(1, ...(s?.categories.map((c: any) => c.count) ?? [1]));
  const total = SITUATION.reduce((n, [k]) => n + (s?.status?.[k] ?? 0), 0);
  const kpis = [
    { label: "Publicados", v: s?.status.APPROVED ?? 0, icon: BadgeCheck, k: "k1" }, { label: "Em análise", v: s?.status.PENDING ?? 0, icon: Clock, k: "k2" },
    { label: "Destaques", v: s?.featured ?? 0, icon: Star, k: "k3" }, { label: "Clientes", v: s?.clients ?? 0, icon: Users, k: "k4" },
    { label: "Serviços", v: s?.services ?? 0, icon: Layers, k: "k5" },
  ];
  return (<>
    <PageHeader title="Visão geral" description="Acompanhe a vitrine e aprove novos cadastros." />

    <div className="kpis">
      {kpis.map(({ label, v, icon: Icon, k }) => (
        <div className="card kpi" key={label}>
          <div><small>{label}</small><strong>{stats.loading ? "…" : v}</strong></div>
          <span className={`tile ${k}`}><Icon size={18} /></span>
        </div>
      ))}
    </div>

    <div className="cols wide">
      <section className="card">
        <div className="card-head"><h2>Aguardando aprovação</h2><Link href="/admin/fornecedores" className="more">Ver todos <ChevronRight size={15} /></Link></div>
        {pend.loading ? <p className="mute pad">Carregando…</p> : !pend.data?.length ? <EmptyState icon={Inbox} title="Nenhum cadastro pendente">Quando um fornecedor enviar o perfil para análise, ele aparece aqui.</EmptyState> : (
          <ul className="rows">
            {pend.data.slice(0, 6).map((p) => (
              <li className="row" key={p.id}>
                <Thumb p={p} size={40} />
                <div className="grow"><b>{p.name}</b><div className="meta">{p.categories.map((c: any) => c.category.name).join(", ") || "Sem categoria"} · {p.services.length} {p.services.length === 1 ? "serviço" : "serviços"}</div></div>
                <ProviderActions p={p} onDone={() => { pend.reload(); stats.reload(); }} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="stack">
        <section className="card">
          <div className="card-head"><h2>Situação dos cadastros</h2><span className="mute num">{total} no total</span></div>
          <div className="card-body">
            <div className="split-bar" role="img" aria-label="Distribuição dos cadastros por situação">
              {SITUATION.map(([k, , color]) => (s?.status?.[k] ? <i key={k} style={{ flex: s.status[k], background: color }} /> : null))}
            </div>
            <ul className="legend">
              {SITUATION.map(([k, label, color]) => <li key={k}><span className="dot" style={{ background: color }} />{label}<b>{s?.status?.[k] ?? 0}</b></li>)}
            </ul>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Fornecedores por categoria</h2></div>
          <div className="card-body">
            {(s?.categories ?? []).map((c: any) => (
              <div key={c.name} className="bar-row"><span>{c.name}</span>
                <div className="bar"><i style={{ width: `${(c.count / max) * 100}%` }} /></div><b>{c.count}</b></div>
            ))}
            <p className="mute" style={{ margin: "4px 0 0" }}>Apenas fornecedores publicados.</p>
          </div>
        </section>
      </div>
    </div>
  </>);
}
