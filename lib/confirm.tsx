"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, Trash2, HelpCircle } from "lucide-react";

type Options = {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warn" | "default"; // danger = exclusão; warn = ação reversível mas séria
};
type Ask = (o: Options) => Promise<boolean>;

const Ctx = createContext<Ask | null>(null);

// Substitui window.confirm: const ok = await confirm({ title, message, tone: "danger" })
export const useConfirm = () => {
  const ask = useContext(Ctx);
  if (!ask) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return ask;
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>((o) => new Promise<boolean>((resolve) => {
    resolver.current?.(false); // se já havia um aberto, cancela
    resolver.current = resolve; setOpts(o);
  }), []);
  const close = useCallback((v: boolean) => { resolver.current?.(v); resolver.current = null; setOpts(null); }, []);

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    document.addEventListener("keydown", onKey);
    confirmBtn.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [opts, close]);

  const tone = opts?.tone ?? "default";
  const Icon = tone === "danger" ? Trash2 : tone === "warn" ? AlertTriangle : HelpCircle;
  return (
    <Ctx.Provider value={ask}>
      {children}
      {opts && (
        <div className="modal-back confirm-back" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-msg">
            <span className={`confirm-icon ${tone}`}><Icon size={22} /></span>
            <h2 id="cf-title">{opts.title}</h2>
            {opts.message && <p id="cf-msg" className="confirm-msg">{opts.message}</p>}
            <div className="confirm-actions">
              <button type="button" className="btn" onClick={() => close(false)}>{opts.cancelLabel ?? "Cancelar"}</button>
              <button type="button" ref={confirmBtn} className={`btn ${tone === "danger" ? "danger-solid" : "pri"}`} onClick={() => close(true)}>
                {opts.confirmLabel ?? (tone === "danger" ? "Excluir" : "Confirmar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
