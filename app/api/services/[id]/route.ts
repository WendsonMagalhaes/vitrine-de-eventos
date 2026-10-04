import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { serviceSchema } from "@/lib/adminSchemas";
import { destroyImage, imageAllowed } from "@/lib/cloudinary";

const owned = (id: string, userId: string) => prisma.service.findFirst({ where: { id, provider: { userId } } });

export const PUT = route(["PROVIDER"], async (req, ctx, s) => {
  const { id } = await ctx.params;
  const old = await owned(id, s.sub);
  if (!old) return json({ error: "Serviço não encontrado" }, 404);
  const data = serviceSchema.parse(await req.json());
  if (!imageAllowed(data, [`vitrine/providers/${s.sub}`])) return json({ error: "Imagem inválida" }, 400);
  const updated = await prisma.service.update({ where: { id }, data: { ...data, imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null } });
  if (old.imagePublicId && old.imagePublicId !== updated.imagePublicId) await destroyImage(old.imagePublicId); // trocou ou removeu a foto
  return json(updated);
});
export const DELETE = route(["PROVIDER"], async (_r, ctx, s) => {
  const { id } = await ctx.params;
  const old = await owned(id, s.sub);
  if (!old) return json({ error: "Serviço não encontrado" }, 404);
  await prisma.service.delete({ where: { id } });
  await destroyImage(old.imagePublicId);
  return json({ ok: true });
});
