"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { providerApi } from "@/lib/providerApi";
import { useProvider } from "@/lib/providerContext";
import { Avatar, Field, PageHeader, PasswordInput } from "@/lib/ui";
import { Badge } from "@/lib/providerActions";

export default function Conta() {
  const { me, reload } = useProvider();
  const [savedEmail, setSavedEmail] = useState("");
  useEffect(() => { providerApi("/api/me").then((u) => setSavedEmail(u.email)).catch(() => {}); }, []);

  return (<>
    <PageHeader title="Conta" description="Dados do seu negócio e de acesso ao painel e ao aplicativo." />
    <div className="cols">
      <div className="stack">
        <AccountCard me={me} reload={reload} savedEmail={savedEmail} onEmail={setSavedEmail} />
        <PasswordCard />
      </div>

      <aside className="card acct-card sticky" aria-label="Resumo da conta">
        <div className="acct-hero">
          <Avatar name={me.name} large />
          <div className="acct-info">
            <b>{me.name}</b>
            <span className="acct-mail">{savedEmail || "—"}</span>
          </div>
        </div>
        <div className="acct-row"><span className="mute">Situação do perfil</span><Badge status={me.status} /></div>
      </aside>
    </div>
  </>);
}

// Nome do negócio e e-mail num formulário só: um botão salva o que mudou.
function AccountCard({ me, reload, savedEmail, onEmail }: { me: any; reload: () => Promise<void>; savedEmail: string; onEmail: (e: string) => void }) {
  const [name, setName] = useState(me.name ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setEmail(savedEmail); }, [savedEmail]);

  const nameChanged = name.trim().length >= 2 && name.trim() !== (me.name ?? "");
  const emailChanged = !!savedEmail && email.trim().toLowerCase() !== savedEmail.toLowerCase();
  const canSave = (nameChanged || emailChanged) && (!emailChanged || !!password);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let ok = true;
    if (nameChanged) {
      try {
        // Mesmo envio da tela de Informações: o resto do perfil segue como está.
        await providerApi("/api/providers/me", { method: "PUT", body: {
          name: name.trim(), city: me.city ?? null, whatsapp: me.whatsapp ?? null, phone: me.phone ?? null,
          description: me.description ?? null, categoryIds: me.categories.map((c: any) => c.categoryId),
        } });
        await reload(); toast.success("Nome do negócio salvo");
      } catch (err: any) { ok = false; toast.error(err.message); }
    }
    if (emailChanged && ok) {
      try {
        const r = await providerApi("/api/me/email", { method: "PATCH", body: { email: email.trim(), password } });
        onEmail(r.email); setPassword(""); toast.success("E-mail de acesso alterado");
      } catch (err: any) { toast.error(err.message); }
    }
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-head"><div><h2>Dados da conta</h2><p className="mute" style={{ margin: "2px 0 0" }}>O nome aparece para os clientes. O e-mail é o seu acesso.</p></div></div>
      <div className="card-body form-grid">
        <Field className="span2" label="Nome do seu negócio"><input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} autoComplete="organization" /></Field>
        <Field className="span2" label="E-mail de acesso"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={160} autoComplete="email" /></Field>
        {emailChanged && <Field className="span2" label="Senha atual" hint="Para confirmar a troca de e-mail"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></Field>}
      </div>
      <div className="card-foot"><button className="btn pri" disabled={busy || !canSave}>{busy ? "Salvando…" : "Salvar alterações"}</button></div>
    </form>
  );
}

function PasswordCard() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const mismatch = f.again.length > 0 && f.next !== f.again;
  const ready = !!f.current && f.next.length >= 8 && f.next === f.again;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.next !== f.again) return toast.error("A confirmação não é igual à nova senha");
    setBusy(true);
    try {
      await providerApi("/api/auth/password", { method: "POST", body: { current: f.current, next: f.next } });
      toast.success("Senha alterada"); setF({ current: "", next: "", again: "" });
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-head"><div><h2>Trocar senha</h2><p className="mute" style={{ margin: "2px 0 0" }}>Use no mínimo 8 caracteres.</p></div></div>
      <div className="card-body form-grid">
        <Field label="Senha atual"><PasswordInput value={f.current} onChange={(e) => set("current", e.target.value)} required autoComplete="current-password" /></Field>
        {/* gridColumn 1 empurra "Nova senha" para a linha de baixo, sem célula vazia (no celular a grade já é de uma coluna). */}
        <div style={{ gridColumn: 1 }}><Field label="Nova senha"><PasswordInput value={f.next} onChange={(e) => set("next", e.target.value)} required minLength={8} autoComplete="new-password" /></Field></div>
        <Field label="Repita a nova senha" hint={mismatch ? "As senhas não são iguais" : undefined}><PasswordInput value={f.again} onChange={(e) => set("again", e.target.value)} required minLength={8} autoComplete="new-password" aria-invalid={mismatch || undefined} /></Field>
      </div>
      <div className="card-foot"><button className="btn pri" disabled={busy || !ready}>{busy ? "Salvando…" : "Alterar senha"}</button></div>
    </form>
  );
}
