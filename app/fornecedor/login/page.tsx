"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { providerTokenKey } from "@/lib/providerApi";
import { PasswordInput } from "@/lib/ui";

const PERKS = ["Edite suas informações e fotos quando quiser", "Cadastre seus serviços e a partir de quanto", "Veja quantos clientes favoritaram você"];

export default function FornecedorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no login");
      if (data.user.role === "ADMIN") throw new Error("Esta conta é administrativa. Use o painel administrativo.");
      if (data.user.role !== "PROVIDER") throw new Error("Contas de cliente usam o aplicativo, não este painel.");
      localStorage.setItem(providerTokenKey, data.token);
      router.replace("/fornecedor");
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <main className="auth">
      <section className="auth-art">
        <div className="side-brand"><span className="logo-mark"><Sparkles size={19} /></span><div><b>Vitrine Eventos</b><small>Painel do fornecedor</small></div></div>
        <div>
          <h2>Mostre o seu trabalho para quem está planejando o evento.</h2>
          <p>Gerencie o seu perfil pelo computador, com mais espaço para fotos, textos e serviços.</p>
          <ul className="auth-list">{PERKS.map((p) => <li key={p}><span className="dot"><Check size={14} /></span>{p}</li>)}</ul>
        </div>
        <span />
      </section>
      <section className="auth-pane">
        <form onSubmit={submit} className="auth-form">
          <div className="auth-mobile-brand"><span className="logo-mark"><Sparkles size={19} /></span>Vitrine Eventos</div>
          <div><h1>Entrar</h1><p className="page-desc">Use o e-mail e a senha da sua conta de fornecedor.</p></div>
          <label className="field">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" /></label>
          <label className="field">Senha<PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn pri" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}
