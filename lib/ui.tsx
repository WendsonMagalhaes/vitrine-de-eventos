"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button type="button" className="icon" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
// "3.500,50" ou "3500" -> centavos; vazio -> null; inválido -> NaN
export function reaisToCents(v: string) {
  const t = v.trim(); if (!t) return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}
export const centsToReais = (c?: number | null) => c == null ? "" : c % 100 ? (c / 100).toFixed(2).replace(".", ",") : String(c / 100);
export const brl = (c: number) => `R$ ${(c / 100).toLocaleString("pt-BR")}`;

// Campo de senha com botão de mostrar/ocultar (funciona com toque e teclado).
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className="pw">
      <input {...props} ref={ref} type={show ? "text" : "password"} />
      <button type="button" className="pw-btn" aria-label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show}
        onMouseDown={(e) => e.preventDefault()} // não tira o foco do campo (mantém o teclado aberto no celular)
        onClick={() => { setShow((s) => !s); ref.current?.focus(); }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}

// ---- Blocos de página usados nos dois painéis ----

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{description && <p className="page-desc">{description}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
export const Avatar = ({ name, large }: { name: string; large?: boolean }) => <span className={`avatar ${large ? "lg" : ""}`} aria-hidden="true">{initials(name)}</span>;

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <span className="tile"><Icon size={20} /></span>
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
