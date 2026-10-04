import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { bannerSchema } from "@/lib/bannerSchema";

const include = { provider: { select: { id: true, name: true } } } as const;

export const GET = route(["ADMIN"], async () =>
  json(await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include })));

export const POST = route(["ADMIN"], async (req) => {
  const b = bannerSchema.parse(await req.json());
  if (b.providerId && !(await prisma.provider.findUnique({ where: { id: b.providerId }, select: { id: true } }))) return json({ error: "Fornecedor não encontrado" }, 404);
  return json(await prisma.banner.create({ data: b, include }), 201);
});
