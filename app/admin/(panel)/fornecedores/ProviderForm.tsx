"use client";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { Field, Modal } from "@/lib/ui";
import { PhoneInput, phoneError } from "@/lib/mask";
import { STATUS } from "@/lib/providerActions";

// Cria (provider = undefined) ou edita um fornecedor.
export default function ProviderForm({ provider, categories, onClose, onSaved }: {
  provider?: any; categories: any[]; onClose: () => void; onSaved: () => void;
}) {
  const edit = !!provider;
  const [f, setF] = useState({
    name: provider?.name ?? "", city: provider?.city ?? "", phone: provider?.phone ?? "", whatsapp: provider?.whatsapp ?? "",
    description: provider?.description ?? "", email: "", password: "",
    status: provider?.status ?? "APPROVED", featured: provider?.featured ?? false,
    categoryIds: (provider?.categories ?? []).map((c: any) => c.categoryId ?? c.category.id) as string[],
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const toggleCat = (id: string) => set("categoryIds", f.categoryIds.includes(id) ? f.categoryIds.filter((x) => x !== id) : [...f.categoryIds, id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad = phoneError(f.whatsapp, "WhatsApp") || phoneError(f.phone, "Telefone");
    if (bad) return toast.error(bad);
    setBusy(true);
    const body: any = {
      name: f.name, city: f.city.trim() || null, phone: f.phone || null, whatsapp: f.whatsapp || null,
      description: f.description.trim() || null, categoryIds: f.categoryIds, status: f.status, featured: f.featured && f.status === "APPROVED",
      ...(edit ? {} : { email: f.email, password: f.password }),
    };
    try {
      await adminApi(edit ? `/api/admin/providers/${provider.id}` : "/api/admin/providers", { method: edit ? "PUT" : "POST", body });
      toast.success(edit ? "Fornecedor atualizado" : "Fornecedor criado"); onSaved(); onClose();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal title={edit ? "Editar fornecedor" : "Novo fornecedor"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Nome" className="span2"><input value={f.name} onChange={(e) => set("name", e.target.value)} required minLength={2} autoFocus placeholder="Ex.: Ateliê Flor de Sal" /></Field>
          {!edit && <>
            <Field label="E-mail de acesso"><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required placeholder="contato@empresa.com" /></Field>
            <Field label="Senha provisória" hint="Mínimo de 8 caracteres"><input type="text" value={f.password} onChange={(e) => set("password", e.target.value)} required minLength={8} autoComplete="new-password" /></Field>
          </>}
          <Field label="Cidade"><input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Campina Grande" /></Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="WhatsApp"><PhoneInput value={f.whatsapp} onChange={(v) => set("whatsapp", v)} /></Field>
          <Field label="Telefone"><PhoneInput value={f.phone} onChange={(v) => set("phone", v)} placeholder="(83) 3333-4444" /></Field>
          <Field label="Sobre" className="span2"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} placeholder="Conte o que o fornecedor faz e o que o diferencia." /></Field>
          <div className="span2">
            <div className="field-label">Categorias <span className="mute">({f.categoryIds.length}/5)</span></div>
            <div className="chips tight">
              {categories.map((c) => {
                const on = f.categoryIds.includes(c.id);
                return <button type="button" key={c.id} className={`chip ${on ? "on" : ""}`} aria-pressed={on} disabled={!on && f.categoryIds.length >= 5} onClick={() => toggleCat(c.id)}>{c.name}</button>;
              })}
            </div>
          </div>
          <label className="field switch span2">
            <input type="checkbox" checked={f.featured && f.status === "APPROVED"} disabled={f.status !== "APPROVED"} onChange={(e) => set("featured", e.target.checked)} />
            <span>Destaque na home<small>{f.status === "APPROVED" ? "Aparece primeiro na vitrine." : "Só fornecedores publicados podem ser destaque."}</small></span>
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn pri" disabled={busy}>{busy ? "Salvando…" : edit ? "Salvar alterações" : "Criar fornecedor"}</button>
        </div>
      </form>
    </Modal>
  );
}
