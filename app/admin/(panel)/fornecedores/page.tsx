"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, X, MapPin, Plus, Pencil, Trash2, Store, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { useAdminData } from "@/lib/useAdminData";
import { Badge, ProviderActions, STATUS } from "@/lib/providerActions";
import { Thumb } from "@/lib/pastel";
import { EmptyState, PageHeader, brl } from "@/lib/ui";
import { formatPhone } from "@/lib/mask";
import { useConfirm } from "@/lib/confirm";
import ProviderForm from "./ProviderForm";
import ServiceForm from "./ServiceForm";

export default function Fornecedores() {
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAdminData<any[]>("/api/admin/providers");
  const cats = useAdminData<any[]>("/api/admin/categories");
  const [q, setQ] = useState(""); const [status, setStatus] = useState("ALL"); const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ p?: any } | null>(null);                       // modal de fornecedor
  const [svc, setSvc] = useState<{ providerId: string; s?: any } | null>(null);     // modal de serviço
  const list = useMemo(() => (data ?? []).filter((p) =>
    (status === "ALL" || p.status === status) && (!q || `${p.name} ${p.city ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status]);
  const cur = data?.find((p) => p.id === sel);
  const count = (k: string) => k === "ALL" ? data?.length ?? 0 : data?.filter((p) => p.status === k).length ?? 0;
  const catNames = (p: any) => p.categories.map((c: any) => c.category.name).join(", ") || "Sem categoria";

  // Esc fecha a gaveta de detalhes (os modais já tratam o Esc sozinhos)
  useEffect(() => {
    if (!sel || form || svc) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel, form, svc]);

  async function removeProvider(p: any) {
    if (!(await confirm({ tone: "danger", title: `Excluir ${p.name}?`, message: "Serviços, fotos, favoritos e o login dele também serão apagados. Isso não pode ser desfeito." }))) return;
    try { await adminApi(`/api/admin/providers/${p.id}`, { method: "DELETE" }); toast.success("Fornecedor excluído"); setSel(null); reload(); }
    catch (e: any) { toast.error(e.message); }
  }
  async function removeService(s: any) {
    if (!(await confirm({ tone: "danger", title: `Excluir o serviço “${s.name}”?`, message: "Ele deixa de aparecer no perfil do fornecedor." }))) return;
    try { await adminApi(`/api/admin/services/${s.id}`, { method: "DELETE" }); toast.success("Serviço excluído"); reload(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (<>
    <PageHeader title="Fornecedores" description="Cadastre, aprove, destaque e organize quem aparece na vitrine."
      actions={<button className="btn pri" onClick={() => setForm({})}><Plus size={16} /> Novo fornecedor</button>} />
    {error && <p className="err" style={{ marginBottom: 16 }}>{error}</p>}

    <section className="card">
      <div className="tabs" role="tablist" aria-label="Filtrar por situação">
        {[["ALL", "Todos"], ...Object.entries(STATUS).map(([k, [l]]) => [k, l])].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={status === k} className={`tab ${status === k ? "on" : ""}`} onClick={() => setStatus(k)}>{l}<span className="count">{count(k)}</span></button>
        ))}
      </div>
      <div className="card-tools">
        <label className="search"><Search size={16} /><input placeholder="Buscar por nome ou cidade" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar fornecedor" /></label>
        <span className="mute num">{list.length} {list.length === 1 ? "fornecedor" : "fornecedores"}</span>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Fornecedor</th><th className="r">Serviços</th><th className="r">Fotos</th><th>Situação</th><th className="r">Ações</th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan={5} className="mute">Carregando…</td></tr>}
          {!loading && list.length === 0 && <tr><td colSpan={5} className="empty-cell"><EmptyState icon={Store} title="Nenhum fornecedor encontrado">Ajuste a busca ou o filtro de situação.</EmptyState></td></tr>}
          {list.map((p) => (
            <tr key={p.id}>
              <td><div className="cell">
                <Thumb p={p} size={40} />
                <div>
                  <div className="badges" style={{ alignItems: "center" }}><button className="link2" onClick={() => setSel(p.id)}>{p.name}</button>{p.featured && <span className="badge gold plain">Destaque</span>}</div>
                  <div className="meta">{catNames(p)}{p.city ? ` · ${p.city}` : ""}</div>
                </div>
              </div></td>
              <td className="r num">{p.services.length}</td><td className="r num">{p.images.length}</td><td><Badge status={p.status} /></td>
              <td><div className="actions">
                <ProviderActions p={p} onDone={reload} />
                <button className="icon" aria-label={`Editar ${p.name}`} title="Editar" onClick={() => setForm({ p })}><Pencil size={16} /></button>
                <button className="icon danger" aria-label={`Excluir ${p.name}`} title="Excluir" onClick={() => removeProvider(p)}><Trash2 size={16} /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </section>

    {cur && <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setSel(null)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={cur.name}>
        <div className="drawer-head">
          <Thumb p={cur} size={52} />
          <div className="grow">
            <h2>{cur.name}</h2>
            {cur.city && <div className="meta" style={{ display: "flex", alignItems: "center", gap: 4, margin: "2px 0 8px" }}><MapPin size={13} /> {cur.city}</div>}
            <div className="badges"><Badge status={cur.status} />{cur.featured && <span className="badge gold plain">Destaque</span>}</div>
          </div>
          <button className="icon" onClick={() => setSel(null)} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="drawer-body">
          <div className="sec"><h3>Sobre</h3><p style={{ margin: 0 }}>{cur.description || <span className="mute">Sem descrição</span>}</p></div>
          <div className="sec"><h3>Contato</h3>
            <dl className="kv"><dt>WhatsApp</dt><dd>{formatPhone(cur.whatsapp) || "—"}</dd><dt>Telefone</dt><dd>{formatPhone(cur.phone) || "—"}</dd></dl></div>
          <div className="sec"><h3>Categorias</h3>
            {cur.categories.length ? <div className="badges">{cur.categories.map((c: any) => <span key={c.category.id ?? c.category.slug} className="tag">{c.category.name}</span>)}</div> : <span className="mute">Sem categoria</span>}</div>
          <div className="sec">
            <div className="sec-head"><h3>Serviços ({cur.services.length})</h3><button className="btn sm" onClick={() => setSvc({ providerId: cur.id })}><Plus size={14} /> Adicionar</button></div>
            {cur.services.length === 0 && <div className="form-note">Nenhum serviço cadastrado.</div>}
            {cur.services.map((s: any) => <div key={s.id} className="svc-row">
              {s.imageUrl ? <img className="svc-thumb" src={s.imageUrl} alt="" /> : <span className="svc-thumb ph"><ImageIcon size={16} /></span>}
              <div className="grow"><b>{s.name}</b><div className="meta">{s.priceFrom ? `a partir de ${brl(s.priceFrom)}` : "sob consulta"}</div></div>
              <button className="icon" aria-label={`Editar ${s.name}`} onClick={() => setSvc({ providerId: cur.id, s })}><Pencil size={15} /></button>
              <button className="icon danger" aria-label={`Excluir ${s.name}`} onClick={() => removeService(s)}><Trash2 size={15} /></button>
            </div>)}
          </div>
          <div className="sec"><h3>Fotos ({cur.images.length})</h3>
            {cur.images.length ? <div className="thumbs">{cur.images.map((i: any) => <img key={i.id} src={i.url} alt="" />)}</div> : <span className="mute">Nenhuma foto enviada.</span>}</div>
        </div>

        <div className="drawer-foot">
          <ProviderActions p={cur} onDone={reload} />
          <button className="btn sm" onClick={() => setForm({ p: cur })}><Pencil size={14} /> Editar dados</button>
          <button className="btn sm danger sp" onClick={() => removeProvider(cur)}><Trash2 size={14} /> Excluir</button>
        </div>
      </aside>
    </div>}

    {form && <ProviderForm provider={form.p} categories={cats.data ?? []} onClose={() => setForm(null)} onSaved={reload} />}
    {svc && <ServiceForm providerId={svc.providerId} service={svc.s} onClose={() => setSvc(null)} onSaved={reload} />}
  </>);
}
