"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { adminApi, tokenKey } from "@/lib/adminApi";
import { useAdminData } from "@/lib/useAdminData";
import UserForm, { ROLE } from "./UserForm";
import { useConfirm } from "@/lib/confirm";
import { Avatar, EmptyState, PageHeader } from "@/lib/ui";

export default function Usuarios() {
  const confirm = useConfirm();
  const { data, loading, reload } = useAdminData<any[]>("/api/admin/users");
  const [q, setQ] = useState(""); const [role, setRole] = useState("ALL");
  const [form, setForm] = useState<{ u?: any } | null>(null);
  const [me, setMe] = useState<string | null>(null);
  // id do admin logado (campo "sub" do token), só para bloquear o botão de excluir a si mesmo; o servidor também valida.
  useEffect(() => {
    try { setMe(JSON.parse(atob(localStorage.getItem(tokenKey)!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub); } catch { setMe(null); }
  }, []);
  const list = useMemo(() => (data ?? []).filter((u) => (role === "ALL" || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [data, q, role]);
  const count = (k: string) => k === "ALL" ? data?.length ?? 0 : data?.filter((u) => u.role === k).length ?? 0;

  async function remove(u: any) {
    if (!(await confirm({ tone: "danger", title: `Excluir ${u.name}?`, message: u.role === "PROVIDER" ? "O perfil de fornecedor, os serviços e as fotos dele também serão apagados." : "A conta será removida e o acesso deixa de funcionar." }))) return;
    try { await adminApi(`/api/admin/users/${u.id}`, { method: "DELETE" }); toast.success("Usuário excluído"); reload(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (<>
    <PageHeader title="Usuários" description="Crie, edite e remova contas de clientes, fornecedores e administradores."
      actions={<button className="btn pri" onClick={() => setForm({})}><Plus size={16} /> Novo usuário</button>} />
    <section className="card">
      <div className="tabs" role="tablist" aria-label="Filtrar por tipo de conta">
        {[["ALL", "Todos"], ...Object.entries(ROLE).map(([k, l]) => [k, l + (k === "ADMIN" ? "es" : "s")])].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={role === k} className={`tab ${role === k ? "on" : ""}`} onClick={() => setRole(k)}>{l}<span className="count">{count(k)}</span></button>
        ))}
      </div>
      <div className="card-tools">
        <label className="search"><Search size={16} /><input placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuário" /></label>
        <span className="mute num">{list.length} {list.length === 1 ? "usuário" : "usuários"}</span>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Usuário</th><th>Tipo</th><th>Cadastro</th><th className="r" style={{ width: 120 }}>Ações</th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan={4} className="mute">Carregando…</td></tr>}
          {!loading && list.length === 0 && <tr><td colSpan={4} className="empty-cell"><EmptyState icon={Users} title="Nenhum usuário encontrado">Ajuste a busca ou o filtro de tipo.</EmptyState></td></tr>}
          {list.map((u) => <tr key={u.id}>
            <td><div className="cell"><Avatar name={u.name} />
              <div><div className="badges" style={{ alignItems: "center" }}><b>{u.name}</b>{u.id === me && <span className="badge gold plain">Você</span>}</div><div className="meta">{u.email}</div></div></div></td>
            <td><span className="badge soft plain">{ROLE[u.role]}</span></td>
            <td className="mute num">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
            <td><div className="actions">
              <button className="icon" aria-label={`Editar ${u.name}`} title="Editar" onClick={() => setForm({ u })}><Pencil size={16} /></button>
              <button className="icon danger" aria-label={`Excluir ${u.name}`} title={u.id === me ? "Você não pode excluir a própria conta" : "Excluir"} disabled={u.id === me} onClick={() => remove(u)}><Trash2 size={16} /></button>
            </div></td>
          </tr>)}
        </tbody>
      </table></div>
    </section>
    {form && <UserForm user={form.u} onClose={() => setForm(null)} onSaved={reload} />}
  </>);
}
