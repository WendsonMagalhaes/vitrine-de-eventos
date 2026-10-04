"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { tokenKey } from "@/lib/adminApi";
import { PasswordInput } from "@/lib/ui";

const PERKS = ["Aprove e destaque fornecedores", "Organize categorias e banners da home do app", "Gerencie contas de clientes e fornecedores"];

export default function AdminLogin() {
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
      if (data.user.role === "PROVIDER") throw new Error("Esta conta é de fornecedor. Use a área do fornecedor.");
      if (data.user.role !== "ADMIN") throw new Error("Esta conta não tem acesso administrativo");
      localStorage.setItem(tokenKey, data.token);
      router.replace("/admin");
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <main className="auth">
      <section className="auth-art">
        <div className="side-brand"><span className="logo-mark"><Sparkles size={19} /></span><div><b>Vitrine Eventos</b><small>Administração</small></div></div>
        <div>
          <h2>Toda a vitrine em um só lugar.</h2>
          <p>Acompanhe os cadastros, aprove novos fornecedores e mantenha a home do aplicativo em dia.</p>
          <ul className="auth-list">{PERKS.map((p) => <li key={p}><span className="dot"><Check size={14} /></span>{p}</li>)}</ul>
        </div>
        <span />
      </section>
      <section className="auth-pane">
        <form onSubmit={submit} className="auth-form">
          <div className="auth-mobile-brand"><span className="logo-mark"><Sparkles size={19} /></span>Vitrine Eventos</div>
          <div><h1>Entrar</h1><p className="page-desc">Acesse o painel administrativo.</p></div>
          <label className="field">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" /></label>
          <label className="field">Senha<PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn pri" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
          <p className="mute" style={{ textAlign: "center", margin: 0 }}>É fornecedor? <Link href="/fornecedor/login" style={{ textDecoration: "underline" }}>Acesse a sua área</Link></p>
        </form>
      </section>
    </main>
  );
}
