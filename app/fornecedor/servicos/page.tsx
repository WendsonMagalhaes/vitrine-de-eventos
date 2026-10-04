"use client";
import { useState } from "react";
import { ImageIcon, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { providerApi } from "@/lib/providerApi";
import { useProvider } from "@/lib/providerContext";
import { useConfirm } from "@/lib/confirm";
import { EmptyState, PageHeader, brl } from "@/lib/ui";
import ServiceModal from "./ServiceModal";

export default function Servicos() {
  const { me, reload } = useProvider();
  const confirm = useConfirm();
  const [form, setForm] = useState<{ s?: any } | null>(null);

  async function remove(s: any) {
    if (!(await confirm({ tone: "danger", title: `Excluir o serviço “${s.name}”?`, message: "Ele deixa de aparecer no seu perfil." }))) return;
    try { await providerApi(`/api/services/${s.id}`, { method: "DELETE" }); toast.success("Serviço excluído"); reload(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (<>
    <PageHeader title="Serviços" description="O que você oferece e a partir de quanto."
      actions={<button className="btn pri" onClick={() => setForm({})}><Plus size={16} /> Novo serviço</button>} />
    <section className="card">
      {me.services.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum serviço ainda" action={<button className="btn pri" onClick={() => setForm({})}><Plus size={16} /> Adicionar o primeiro serviço</button>}>
          Adicione o que você oferece para os clientes saberem como te contratar.
        </EmptyState>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Serviço</th><th>A partir de</th><th className="r">Itens inclusos</th><th className="r" style={{ width: 110 }}>Ações</th></tr></thead>
          <tbody>
            {me.services.map((s: any) => (
              <tr key={s.id}>
                <td><div className="cell">
                  {s.imageUrl ? <img className="svc-thumb" src={s.imageUrl} alt="" /> : <span className="svc-thumb ph"><ImageIcon size={18} /></span>}
                  <div><b>{s.name}</b>{s.description && <div className="clamp">{s.description}</div>}</div>
                </div></td>
                <td className="num" style={{ whiteSpace: "nowrap" }}>{s.priceFrom ? brl(s.priceFrom) : <span className="mute">Sob consulta</span>}</td>
                <td className="r num">{s.includes?.length ?? 0}</td>
                <td><div className="actions">
                  <button className="icon" aria-label={`Editar ${s.name}`} title="Editar" onClick={() => setForm({ s })}><Pencil size={16} /></button>
                  <button className="icon danger" aria-label={`Excluir ${s.name}`} title="Excluir" onClick={() => remove(s)}><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
    {form && <ServiceModal service={form.s} onClose={() => setForm(null)} onSaved={reload} />}
  </>);
}
