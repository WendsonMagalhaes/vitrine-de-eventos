"use client";
import { useState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { providerApi } from "@/lib/providerApi";
import { useConfirm } from "@/lib/confirm";

const MAX = 12;

// Reduz fotos grandes do celular antes de enviar (economiza dados e tempo).
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("x"))), "image/jpeg", 0.85));
  } catch { return file; }
}

async function uploadOne(file: File) {
  const blob = await shrink(file);
  if (blob.size > 10 * 1024 * 1024) throw new Error(`“${file.name}” é grande demais (máx. 10 MB)`);
  const sig = await providerApi("/api/uploads/sign", { method: "POST" });
  const fd = new FormData();
  fd.append("file", blob); fd.append("api_key", sig.apiKey); fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature); fd.append("folder", sig.folder);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.error?.message ?? "Falha ao enviar a imagem");
  await providerApi("/api/uploads", { method: "POST", body: { url: d.secure_url, publicId: d.public_id } });
}

export default function PhotosTab({ images, onChange }: { images: any[]; onChange: () => void }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files ?? []); e.target.value = "";
    const files = all.filter((f) => f.type.startsWith("image/"));
    if (files.length < all.length) toast.error("Só imagens são aceitas");
    const room = MAX - images.length;
    if (files.length > room) toast.info(`Limite de ${MAX} fotos: vou enviar só ${room}.`);
    const batch = files.slice(0, Math.max(room, 0));
    let sent = 0;
    for (const [i, file] of batch.entries()) {
      setBusy(`Enviando ${i + 1} de ${batch.length}…`);
      try { await uploadOne(file); sent++; } catch (err: any) { toast.error(err.message); }
    }
    setBusy(null);
    if (sent) { toast.success(sent === 1 ? "Foto adicionada" : `${sent} fotos adicionadas`); onChange(); }
  }

  async function makeCover(id: string) {
    try {
      await providerApi("/api/uploads", { method: "PUT", body: { ids: [id, ...images.filter((i) => i.id !== id).map((i) => i.id)] } });
      toast.success("Capa atualizada"); onChange();
    } catch (err: any) { toast.error(err.message); }
  }
  async function remove(id: string) {
    if (!(await confirm({ tone: "danger", title: "Excluir esta foto?", message: "Ela deixa de aparecer no seu perfil." }))) return;
    try { await providerApi(`/api/uploads/${id}`, { method: "DELETE" }); toast.success("Foto excluída"); onChange(); }
    catch (err: any) { toast.error(err.message); }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div><h2>Fotos do portfólio</h2><p className="mute" style={{ margin: 0 }}>A primeira foto é a capa do seu perfil.</p></div>
        <span className="counter num">{images.length} de {MAX}</span>
      </div>
      <div className="card-body">
        <div className="photos">
          {images.map((img, i) => (
            <div key={img.id} className="photo">
              <img src={img.url} alt={`Foto ${i + 1} do portfólio`} />
              {i === 0 && <span className="badge gold plain">Capa</span>}
              <div className="photo-actions">
                {i !== 0 && <button className="icon" aria-label="Definir como capa" title="Definir como capa" onClick={() => makeCover(img.id)}><Star size={16} /></button>}
                <button className="icon danger" aria-label="Excluir foto" title="Excluir" onClick={() => remove(img.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {images.length < MAX && (
            <label className={`photo-add ${busy ? "busy" : ""}`}>
              <ImagePlus size={24} />{busy ?? "Adicionar fotos"}
              <input type="file" accept="image/*" multiple disabled={!!busy} onChange={onPick} />
            </label>
          )}
        </div>
        {images.length === 0 && !busy && <p className="mute" style={{ margin: "14px 0 0" }}>Nenhuma foto ainda. Escolha as melhores fotos do seu trabalho.</p>}
      </div>
    </section>
  );
}
