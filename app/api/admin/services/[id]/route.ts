import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { serviceSchema } from "@/lib/adminSchemas";
import { destroyImage, imageAllowed } from "@/lib/cloudinary";

export const PUT = route(["ADMIN"], async (req, ctx) => {
  const { id } = await ctx.params;
  const old = await prisma.service.findUnique({ where: { id }, include: { provider: { select: { userId: true } } } });
  if (!old) return json({ error: "Serviço não encontrado" }, 404);
  const data = serviceSchema.parse(await req.json());
  if (!imageAllowed(data, ["vitrine/admin", `vitrine/providers/${old.provider.userId}`])) return json({ error: "Imagem inválida" }, 400);
  const updated = await prisma.service.update({ where: { id }, data: { ...data, imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null } });
  if (old.imagePublicId && old.imagePublicId !== updated.imagePublicId) await destroyImage(old.imagePublicId);
  return json(updated);
});
export const DELETE = route(["ADMIN"], async (_r, ctx) => {
  const { id } = await ctx.params;
  const old = await prisma.service.findUnique({ where: { id } });
  if (!old) return json({ error: "Serviço não encontrado" }, 404);
  await prisma.service.delete({ where: { id } });
  await destroyImage(old.imagePublicId);
  return json({ ok: true });
});
