"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { PasswordInput } from "@/lib/ui";
import { anyStoredToken, clearAllSessions, destinationFor, storeSession, type StoredUser } from "@/lib/authStore";
import "./login.css";

const PERKS = ["Encontre buffet, fotografia, decoração e espaços", "Converse direto com os fornecedores", "Divulgue o seu negócio e gerencie o seu perfil"];

// Tela de login única do site (cliente, fornecedor e administrador). Depois de entrar, cada perfil vai para a sua área.
function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [mode, setMode] = useState<"login" | "register">(params.get("modo") === "cadastro" ? "register" : "login");
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">(params.get("tipo") === "fornecedor" ? "PROVIDER" : "CLIENT");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // Quem já está logado não precisa ver o formulário: segue direto para a sua área.
  useEffect(() => {
    const token = anyStoredToken();
    if (!token) { setChecking(false); return; }
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.ok) { const u: StoredUser = await r.json(); storeSession(token, u); router.replace(destinationFor(u.role, next)); return; }
        if (r.status === 401 || r.status === 403 || r.status === 404) clearAllSessions();
        setChecking(false);
      })
      .catch(() => setChecking(false)); // sem internet: mostra o formulário
  }, [router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const body = mode === "login" ? { email, password } : { name, email, password, role };
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível entrar");
      storeSession(data.token, data.user);
      router.replace(destinationFor(data.user.role, next));
    } catch (err: any) { setError(err.message); setBusy(false); }
  }

  if (checking) return <div className="auth-checking" role="status" aria-label="Carregando"><LoaderCircle className="spin" size={24} /></div>;
  const seg = (v: "CLIENT" | "PROVIDER", label: string, sub: string) => (
    <button type="button" role="radio" aria-checked={role === v} className="auth-seg" onClick={() => setRole(v)}><b>{label}</b><span>{sub}</span></button>
  );
  return (
    <main className="auth">
      <section className="auth-art">
        <div className="side-brand"><span className="logo-mark"><Sparkles size={19} /></span><div><b>Vitrine Eventos</b><small>Fornecedores para o seu evento</small></div></div>
        <div>
          <h2>Seu evento começa aqui.</h2>
          <p>Uma única conta para encontrar fornecedores, conversar com eles e, se for o seu caso, gerenciar o seu negócio.</p>
          <ul className="auth-list">{PERKS.map((p) => <li key={p}><span className="dot"><Check size={14} /></span>{p}</li>)}</ul>
        </div>
        <span />
      </section>
      <section className="auth-pane">
        <form onSubmit={submit} className="auth-form">
          <div className="auth-mobile-brand"><span className="logo-mark"><Sparkles size={19} /></span>Vitrine Eventos</div>
          <div>
            <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
            <p className="page-desc auth-sub">{mode === "login" ? "Use o e-mail e a senha da sua conta." : "Leva menos de um minuto."}</p>
          </div>
          {mode === "register" && (
            <>
              <div><div className="field-label">Eu sou</div>
                <div className="auth-segs" role="radiogroup" aria-label="Tipo de conta">
                  {seg("CLIENT", "Cliente", "Procuro fornecedores")}
                  {seg("PROVIDER", "Fornecedor", "Quero divulgar meu trabalho")}
                </div>
              </div>
              <label className="field">{role === "PROVIDER" ? "Nome do seu negócio" : "Nome"}<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" /></label>
            </>
          )}
          <label className="field">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" autoCapitalize="none" /></label>
          <label className="field">Senha
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode === "register" && <small>Mínimo de 8 caracteres</small>}
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn pri" disabled={busy}>{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
          <button type="button" className="auth-toggle" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? <>Não tem conta? <b>Cadastre-se</b></> : <>Já tem conta? <b>Entrar</b></>}
          </button>
          <p className="auth-guest"><Link href="/app">Continuar sem entrar</Link></p>
        </form>
      </section>
    </main>
  );
}

export default function LoginScreen() {
  return <Suspense fallback={null}><Login /></Suspense>;
}
