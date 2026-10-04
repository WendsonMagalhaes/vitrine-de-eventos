"use client";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { Field, Modal } from "@/lib/ui";

export const COLORS: [string, string][] = [["lilac", "Lilás"], ["mint", "Menta"], ["peach", "Pêssego"], ["sky", "Céu"]];

// Mesma aparência que o app vai mostrar: imagem (se houver) ou degradê pastel.
export function BannerPreview({ b }: { b: { title?: string; subtitle?: string | null; imageUrl?: string | null; color?: string } }) {
  const img = b.imageUrl?.startsWith("https://");
  return (
    <div className={`bn-prev ${img ? "img" : `bn-${b.color ?? "lilac"}`}`}
      style={img ? { backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.5),rgba(0,0,0,.05) 65%),url(${b.imageUrl})` } : undefined}>
      <b>{b.title || "Título do banner"}</b>{b.subtitle ? <small>{b.subtitle}</small> : null}
    </div>
  );
}

export default function BannerForm({ banner, providers, onClose, onSaved }: { banner?: any; providers: any[]; onClose: () => void; onSaved: () => void }) {
  const edit = !!banner;
  const [f, setF] = useState({
    title: banner?.title ?? "", subtitle: banner?.subtitle ?? "", imageUrl: banner?.imageUrl ?? "", color: banner?.color ?? "lilac",
    providerId: banner?.providerId ?? "", sortOrder: String(banner?.sortOrder ?? 0), active: banner?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const body = {
      title: f.title, subtitle: f.subtitle.trim() || null, imageUrl: f.imageUrl.trim() || null, color: f.color,
      providerId: f.providerId || null, sortOrder: Number(f.sortOrder) || 0, active: f.active,
    };
    try {
      await adminApi(edit ? `/api/admin/banners/${banner.id}` : "/api/admin/banners", { method: edit ? "PUT" : "POST", body });
      toast.success(edit ? "Banner atualizado" : "Banner criado"); onSaved(); onClose();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal title={edit ? "Editar banner" : "Novo banner"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body">
          <BannerPreview b={f} />
          <Field label="Título"><input value={f.title} onChange={(e) => set("title", e.target.value)} required minLength={2} maxLength={80} autoFocus placeholder="Ex.: Casamentos que contam histórias" /></Field>
          <Field label="Subtítulo (opcional)"><input value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={140} placeholder="Ex.: Decoração, foto e buffet em um só lugar" /></Field>
          <div>
            <div className="field-label">Cor de fundo</div>
            <div className="swatches">
              {COLORS.map(([k, l]) => <button type="button" key={k} className={`swatch bn-${k}`} aria-label={l} title={l} aria-pressed={f.color === k} onClick={() => set("color", k)} />)}
            </div>
          </div>
          <Field label="Link da imagem (opcional)" hint="Endereço https://… de uma imagem. Sem imagem, vale a cor de fundo."><input type="url" value={f.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://res.cloudinary.com/…" /></Field>
          <div className="form-grid">
            <Field label="Abre o perfil de" hint="Opcional">
              <select value={f.providerId} onChange={(e) => set("providerId", e.target.value)}>
                <option value="">Nenhum fornecedor</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== "APPROVED" ? " (não publicado)" : ""}</option>)}
              </select>
            </Field>
            <Field label="Ordem" hint="Menor aparece primeiro"><input type="number" min={0} max={999} value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
          </div>
          <label className="field switch">
            <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />
            <span>Banner ativo<small>Desativado, ele some do app sem ser excluído.</small></span>
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn pri" disabled={busy}>{busy ? "Salvando…" : edit ? "Salvar alterações" : "Criar banner"}</button>
        </div>
      </form>
    </Modal>
  );
}
