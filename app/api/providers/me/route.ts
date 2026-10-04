import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

const include = { categories: true, services: true, images: { orderBy: { sortOrder: "asc" } } } as const;
export const GET = route(["PROVIDER"], async (_r, _c, s) =>
  json(await prisma.provider.findUnique({ where: { userId: s.sub }, include })));

const digits = z.string().regex(/^\d{10,13}$/, "use só números, com DDD (10 a 13 dígitos)").nullable().optional();
const schema = z.object({
  name: z.string().trim().min(2, "mínimo de 2 letras").max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  phone: digits, whatsapp: digits,
  categoryIds: z.array(z.string()).max(5, "no máximo 5 categorias").default([]),
});
// O fornecedor só edita o próprio perfil: o id vem do token, nunca do corpo.
// Status e destaque são decididos pela administração e não passam por aqui.
export const PUT = route(["PROVIDER"], async (req, _c, s) => {
  const { categoryIds, ...data } = schema.parse(await req.json());
  const ids = [...new Set(categoryIds)];
  if (ids.length && (await prisma.category.count({ where: { id: { in: ids } } })) !== ids.length) return json({ error: "Categoria inválida" }, 400);
  if (!(await prisma.provider.findUnique({ where: { userId: s.sub }, select: { id: true } }))) return json({ error: "Perfil não encontrado" }, 404);
  const provider = await prisma.provider.update({
    where: { userId: s.sub },
    data: { ...data, categories: { deleteMany: {}, create: ids.map((categoryId) => ({ categoryId })) } },
    include,
  });
  return json(provider);
});
