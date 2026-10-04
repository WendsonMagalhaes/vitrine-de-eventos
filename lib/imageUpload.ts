// Envio de uma imagem direto ao Cloudinary (a assinatura vem da API; o segredo fica no servidor).
// Reduz fotos grandes do celular antes de enviar.
export async function shrinkImage(file: File, max = 1600): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("x"))), "image/jpeg", 0.85));
  } catch { return file; }
}

export async function uploadToCloudinary(file: File, sign: () => Promise<any>): Promise<{ url: string; publicId: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem");
  const blob = await shrinkImage(file);
  if (blob.size > 10 * 1024 * 1024) throw new Error("Imagem grande demais (máx. 10 MB)");
  const sig = await sign();
  const fd = new FormData();
  fd.append("file", blob); fd.append("api_key", sig.apiKey); fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature); fd.append("folder", sig.folder);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.error?.message ?? "Falha ao enviar a imagem");
  return { url: d.secure_url, publicId: d.public_id };
}
