"use client";
import { toast } from "sonner";
import { adminApi } from "./adminApi";
import { useConfirm } from "./confirm";

export const STATUS: Record<string, [string, string]> = {
  DRAFT: ["Rascunho", "soft"], PENDING: ["Em análise", "warn"], APPROVED: ["Publicado", "ok"],
  REJECTED: ["Reprovado", "bad"], SUSPENDED: ["Suspenso", "bad"],
};
export const Badge = ({ status }: { status: string }) => <span className={`badge ${STATUS[status][1]}`}>{STATUS[status][0]}</span>;

export function ProviderActions({ p, onDone }: { p: any; onDone: () => void }) {
  const confirm = useConfirm();
  async function act(status: string, featured?: boolean, msg = "Atualizado") {
    try {
      await adminApi(`/api/admin/providers/${p.id}/status`, { method: "PATCH", body: { status, ...(featured === undefined ? {} : { featured }) } });
      toast.success(msg); onDone();
    } catch (e: any) { toast.error(e.message); }
  }
  return (
    <div className="actions">
      {["DRAFT", "PENDING", "REJECTED", "SUSPENDED"].includes(p.status) && <button className="btn sm ok" onClick={() => act("APPROVED", undefined, "Fornecedor aprovado")}>Aprovar</button>}
      {["DRAFT", "PENDING"].includes(p.status) && <button className="btn sm" onClick={() => act("REJECTED", undefined, "Fornecedor reprovado")}>Reprovar</button>}
      {p.status === "APPROVED" && <>
        <button className="btn sm" onClick={() => act("APPROVED", !p.featured, p.featured ? "Destaque removido" : "Fornecedor destacado")}>{p.featured ? "Remover destaque" : "Destacar"}</button>
        <button className="btn sm danger" onClick={async () => (await confirm({ tone: "warn", title: `Suspender ${p.name}?`, message: "O fornecedor deixa de aparecer no app até ser aprovado de novo.", confirmLabel: "Suspender" })) && act("SUSPENDED", undefined, "Fornecedor suspenso")}>Suspender</button>
      </>}
    </div>
  );
}
