"use client";
import { useRef, useState } from "react";
import { ImagePlus, Trash2, RefreshCw } from "lucide-react";
import { uploadToCloudinary } from "./imageUpload";

export type ServiceImg = { url: string; publicId: string } | null;

// Escolher, trocar e remover a foto de um serviço. "sign" devolve a assinatura do Cloudinary (rota do fornecedor ou do admin).
export default function ServiceImage({ value, onChange, sign }: { value: ServiceImg; onChange: (v: ServiceImg) => void; sign: () => Promise<any> }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try { onChange(await uploadToCloudinary(file, sign)); }
    catch (err: any) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <div>
      <div className="field-label">Foto do serviço <span className="mute">(opcional)</span></div>
      {value ? (
        <div className="svc-img">
          <img src={value.url} alt="Foto do serviço" />
          <div className="svc-img-actions">
            <button type="button" className="btn" onClick={() => input.current?.click()} disabled={busy}><RefreshCw size={14} /> {busy ? "Enviando…" : "Trocar"}</button>
            <button type="button" className="btn danger" onClick={() => onChange(null)} disabled={busy}><Trash2 size={14} /> Remover</button>
          </div>
        </div>
      ) : (
        <button type="button" className="svc-img-add" onClick={() => input.current?.click()} disabled={busy}>
          <ImagePlus size={24} />{busy ? "Enviando…" : "Adicionar foto"}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      {error && <p className="err" role="alert" style={{ margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
