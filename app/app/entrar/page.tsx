"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientApi } from "@/lib/clientApi";
import { useSession, type SessionUser } from "@/lib/clientSession";
import { PasswordInput } from "@/lib/ui";
import { Loading, TopBar } from "../ui";

function EntrarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSession();
  const [mode, setMode] = useState<"login" | "register">(params.get("modo") === "cadastro" ? "register" : "login");
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">(params.get("tipo") === "fornecedor" ? "PROVIDER" : "CLIENT");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const next = params.get("next");
  const safeNext = next && next.startsWith("/app") && !next.startsWith("//") ? next : "/app";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const body = mode === "login" ? { email, password } : { name, email, password, role };
      const r: { token: string; user: SessionUser } = await clientApi(`/api/auth/${mode}`, { method: "POST", body });
      signIn(r);
      // Cada perfil vai para a sua área: cliente fica na vitrine, fornecedor e administrador vão para os painéis.
      router.replace(r.user.role === "PROVIDER" ? "/fornecedor" : r.user.role === "ADMIN" ? "/admin" : safeNext);
    } catch (err: any) { setError(err.message); setBusy(false); }
  }

  const seg = (v: "CLIENT" | "PROVIDER", label: string, sub: string) => (
    <button type="button" role="radio" aria-checked={role === v} className={`v-seg ${role === v ? "on" : ""}`} onClick={() => setRole(v)}>
      <b>{label}</b><span>{sub}</span>
    </button>
  );
  return (
    <>
      <TopBar title={mode === "login" ? "Entrar" : "Criar conta"} />
      <form onSubmit={submit} className="v-form">
        {mode === "register" && (
          <>
            <div className="field-label">Eu sou</div>
            <div className="v-segs" role="radiogroup" aria-label="Tipo de conta">
              {seg("CLIENT", "Cliente", "Procuro fornecedores")}
              {seg("PROVIDER", "Fornecedor", "Quero divulgar meu trabalho")}
            </div>
            <label className="field">{role === "PROVIDER" ? "Nome do seu negócio" : "Nome"}<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" /></label>
          </>
        )}
        <label className="field">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoCapitalize="none" autoCorrect="off" autoComplete="email" inputMode="email" /></label>
        <label className="field">Senha
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          {mode === "register" && <small>Mínimo de 8 caracteres</small>}
        </label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn pri lg block" disabled={busy}>{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
        <button type="button" className="v-link center" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </form>
    </>
  );
}

export default function Entrar() {
  return <Suspense fallback={<Loading />}><EntrarInner /></Suspense>;
}
