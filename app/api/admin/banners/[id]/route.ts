import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { bannerSchema } from "@/lib/bannerSchema";

const include = { provider: { select: { id: true, name: true } } } as const;

export const PUT = route(["ADMIN"], async (req, ctx) => {
  const { id } = await ctx.params;
  const b = bannerSchema.parse(await req.json());
  if (!(await prisma.banner.findUnique({ where: { id }, select: { id: true } }))) return json({ error: "Banner não encontrado" }, 404);
  if (b.providerId && !(await prisma.provider.findUnique({ where: { id: b.providerId }, select: { id: true } }))) return json({ error: "Fornecedor não encontrado" }, 404);
  return json(await prisma.banner.update({ where: { id }, data: b, include }));
});
export const DELETE = route(["ADMIN"], async (_r, ctx) => {
  const { id } = await ctx.params;
  if (!(await prisma.banner.findUnique({ where: { id }, select: { id: true } }))) return json({ error: "Banner não encontrado" }, 404);
  await prisma.banner.delete({ where: { id } });
  return json({ ok: true });
});
