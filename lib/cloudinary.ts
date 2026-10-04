import { v2 as cloudinary } from "cloudinary";

function configure() {
  const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = process.env;
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret });
  return true;
}

// Apagar do Cloudinary é um extra: se falhar, o banco já está certo.
export async function destroyImage(publicId?: string | null) {
  if (!publicId || !configure()) return;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
}

// Garante que a imagem enviada veio de uma pasta permitida (e que a url é dela).
export function imageAllowed(img: { imageUrl?: string | null; imagePublicId?: string | null }, folders: string[]) {
  if (!img.imageUrl && !img.imagePublicId) return true; // sem imagem
  if (!img.imageUrl || !img.imagePublicId) return false;
  return folders.some((f) => img.imagePublicId!.startsWith(`${f}/`)) && img.imageUrl.includes(img.imagePublicId);
}
