"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { useAdminData } from "@/lib/useAdminData";
import BannerForm, { BannerPreview } from "./BannerForm";
import { useConfirm } from "@/lib/confirm";
import { EmptyState, PageHeader } from "@/lib/ui";

export default function Banners() {
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAdminData<any[]>("/api/admin/banners");
  const provs = useAdminData<any[]>("/api/admin/providers");
  const [form, setForm] = useState<{ b?: any } | null>(null);
  const active = data?.filter((b) => b.active).length ?? 0;

  async function toggle(b: any) {
    try {
      await adminApi(`/api/admin/banners/${b.id}`, { method: "PUT", body: { title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, color: b.color, providerId: b.providerId, sortOrder: b.sortOrder, active: !b.active } });
      toast.success(b.active ? "Banner desativado" : "Banner ativado"); reload();
    } catch (e: any) { toast.error(e.message); }
  }
  async function remove(b: any) {
    if (!(await confirm({ tone: "danger", title: `Excluir o banner “${b.title}”?`, message: "Ele some da home do aplicativo. Se só quiser esconder, use Desativar." }))) return;
    try { await adminApi(`/api/admin/banners/${b.id}`, { method: "DELETE" }); toast.success("Banner excluído"); reload(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (<>
    <PageHeader title="Banners" description={data?.length ? `${active} de ${data.length} ativos. Os ativos aparecem na home do aplicativo, na ordem indicada.` : "Os banners ativos aparecem na home do aplicativo."}
      actions={<button className="btn pri" onClick={() => setForm({})}><Plus size={16} /> Novo banner</button>} />
    {error && <p className="err" style={{ marginBottom: 16 }}>{error}</p>}
    {loading ? <p className="mute">Carregando…</p> : !data?.length ? <section className="card"><EmptyState icon={ImageIcon} title="Nenhum banner ainda" action={<button className="btn pri" onClick={() => setForm({})}><Plus size={16} /> Criar o primeiro banner</button>}>Banners destacam campanhas e fornecedores na home do app.</EmptyState></section> : (
      <div className="banners">
        {data.map((b) => (
          <div key={b.id} className={`bn ${b.active ? "" : "off"}`}>
            <BannerPreview b={b} />
            <div className="bn-meta">
              <span className={`badge ${b.active ? "ok" : "soft"}`}>{b.active ? "Ativo" : "Inativo"}</span>
              <span className="mute grow trunc">Ordem {b.sortOrder}{b.provider ? ` · ${b.provider.name}` : ""}</span>
              <div className="actions">
                <button className="btn sm" onClick={() => toggle(b)}>{b.active ? "Desativar" : "Ativar"}</button>
                <button className="icon" aria-label={`Editar ${b.title}`} title="Editar" onClick={() => setForm({ b })}><Pencil size={16} /></button>
                <button className="icon danger" aria-label={`Excluir ${b.title}`} title="Excluir" onClick={() => remove(b)}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
    {form && <BannerForm banner={form.b} providers={provs.data ?? []} onClose={() => setForm(null)} onSaved={reload} />}
  </>);
}
