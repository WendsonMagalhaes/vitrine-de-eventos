"use client";

// ===== Telefone =====
// Guardamos só os dígitos (DDD + número, até 11). Na tela aparece (83) 99999-9999 ou (83) 3333-4444.
export const onlyDigits = (s: string) => s.replace(/\D/g, "");
export function formatPhone(value?: string | null) {
  let d = onlyDigits(value ?? "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2); // tira o 55 se vier com código do país
  d = d.slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
export const phoneDigits = (masked: string) => onlyDigits(masked).slice(0, 11);
// Retorna uma mensagem de erro, ou "" se estiver ok (campo vazio é permitido).
export const phoneError = (digits: string, label = "Telefone") => (digits && digits.length < 10 ? `${label}: informe o DDD e o número` : "");

export function PhoneInput({ value, onChange, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & { value: string; onChange: (digits: string) => void }) {
  return <input {...rest} type="tel" inputMode="numeric" autoComplete="tel-national" value={formatPhone(value)} onChange={(e) => onChange(phoneDigits(e.target.value))} placeholder={rest.placeholder ?? "(83) 99999-9999"} />;
}

// ===== Dinheiro =====
// O valor vive em centavos (null = vazio). O usuário digita só números e a máscara monta "R$ 3.500,00".
export const formatBRL = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const centsFromDigits = (s: string) => { const d = onlyDigits(s).replace(/^0+/, "").slice(0, 9); return d ? Number(d) : null; };

export function MoneyInput({ value, onChange, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & { value: number | null; onChange: (cents: number | null) => void }) {
  return <input {...rest} type="text" inputMode="numeric" value={value == null ? "" : formatBRL(value)} onChange={(e) => onChange(centsFromDigits(e.target.value))} placeholder={rest.placeholder ?? "R$ 0,00"} />;
}
