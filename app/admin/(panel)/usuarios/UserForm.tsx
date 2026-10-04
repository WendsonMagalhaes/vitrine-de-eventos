"use client";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { Field, Modal } from "@/lib/ui";

export const ROLE: Record<string, string> = { CLIENT: "Cliente", PROVIDER: "Fornecedor", ADMIN: "Administrador" };

export default function UserForm({ user, onClose, onSaved }: { user?: any; onClose: () => void; onSaved: () => void }) {
  const edit = !!user;
  const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", role: user?.role ?? "CLIENT", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const body: any = { name: f.name, email: f.email, role: f.role, ...(f.password ? { password: f.password } : {}) };
    try {
      await adminApi(edit ? `/api/admin/users/${user.id}` : "/api/admin/users", { method: edit ? "PUT" : "POST", body });
      toast.success(edit ? "Usuário atualizado" : "Usuário criado"); onSaved(); onClose();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal title={edit ? "Editar usuário" : "Novo usuário"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body">
          <Field label="Nome"><input value={f.name} onChange={(e) => set("name", e.target.value)} required minLength={2} autoFocus /></Field>
          <Field label="E-mail"><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required /></Field>
          <Field label="Tipo de conta">
            <select value={f.role} onChange={(e) => set("role", e.target.value)}>
              {Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label={edit ? "Nova senha" : "Senha"} hint={edit ? "Deixe em branco para manter a senha atual" : "Mínimo de 8 caracteres"}>
            <input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} required={!edit} minLength={8} autoComplete="new-password" />
          </Field>
          {f.role === "ADMIN" && <p className="form-note">Administradores têm acesso total a este painel.</p>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn pri" disabled={busy}>{busy ? "Salvando…" : edit ? "Salvar alterações" : "Criar usuário"}</button>
        </div>
      </form>
    </Modal>
  );
}
