"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Tags } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { useAdminData } from "@/lib/useAdminData";
import { useConfirm } from "@/lib/confirm";
import { EmptyState, PageHeader } from "@/lib/ui";

export default function Categorias() {
  const confirm = useConfirm();
  const { data, loading, reload } = useAdminData<any[]>("/api/admin/categories");
  const [name, setName] = useState(""); const [editId, setEditId] = useState<string | null>(null); const [editName, setEditName] = useState("");
  async function run(fn: () => Promise<any>, ok: string) {
    try { await fn(); toast.success(ok); reload(); } catch (e: any) { toast.error(e.message); }
  }
  return (<>
    <PageHeader title="Categorias" description="Os tipos de serviço usados para organizar e filtrar os fornecedores." />
    <div className="cols">
      <section className="card">
        <div className="card-head"><h2>Todas as categorias</h2><span className="mute num">{data?.length ?? 0} no total</span></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Nome</th><th className="r">Fornecedores</th><th className="r" style={{ width: 120 }}>Ações</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="mute">Carregando…</td></tr>}
            {!loading && !data?.length && <tr><td colSpan={3} className="empty-cell"><EmptyState icon={Tags} title="Nenhuma categoria ainda">Crie a primeira no formulário ao lado.</EmptyState></td></tr>}
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td>{editId === c.id ? <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus aria-label="Nome da categoria" style={{ maxWidth: 320 }} /> : <b>{c.name}</b>}</td>
                <td className="r num">{c._count.providers}</td>
                <td><div className="actions">
                  {editId === c.id ? <>
                    <button className="icon" aria-label="Salvar" title="Salvar" onClick={() => run(async () => { await adminApi(`/api/admin/categories/${c.id}`, { method: "PUT", body: { name: editName } }); setEditId(null); }, "Categoria atualizada")}><Check size={16} /></button>
                    <button className="icon" aria-label="Cancelar" title="Cancelar" onClick={() => setEditId(null)}><X size={16} /></button>
                  </> : <>
                    <button className="icon" aria-label={`Editar ${c.name}`} title="Editar" onClick={() => { setEditId(c.id); setEditName(c.name); }}><Pencil size={16} /></button>
                    <button className="icon danger" aria-label={`Excluir ${c.name}`} title="Excluir" onClick={async () => (await confirm({ tone: "danger", title: `Excluir a categoria “${c.name}”?`, message: "Categorias que ainda têm fornecedores não podem ser excluídas." })) && run(() => adminApi(`/api/admin/categories/${c.id}`, { method: "DELETE" }), "Categoria excluída")}><Trash2 size={16} /></button>
                  </>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <aside className="stack sticky">
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await adminApi("/api/admin/categories", { method: "POST", body: { name } }); setName(""); }, "Categoria criada"); }}>
          <div className="card-head"><h2>Nova categoria</h2></div>
          <div className="card-body stack" style={{ gap: 16 }}>
            <label className="field">Nome<input placeholder="Ex.: Barman" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></label>
            <button className="btn pri block"><Plus size={16} /> Adicionar categoria</button>
          </div>
        </form>
        <p className="mute" style={{ margin: 0 }}>Renomear não altera o identificador interno. Categorias com fornecedores não podem ser excluídas.</p>
      </aside>
    </div>
  </>);
}
